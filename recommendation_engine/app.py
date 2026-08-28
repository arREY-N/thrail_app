"""
@file app.py
@description FastAPI microservice interface for Thrail App Recommendation System (TARS).
             Exposes POST /api/recommend, POST /api/profile/update, and GET /api/configs.
"""

import os
import sys
import uuid
import time
import logging
from typing import List, Dict, Optional, Any
from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.responses import JSONResponse
from fastapi.security import APIKeyHeader
from pydantic import BaseModel, Field
import numpy as np

# Add recommendation_engine directory to sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from core.recommender import HybridRecommender, calculate_alpha_tuner
from core.profile_manager import TwoAnchorProfileManager, build_18_feature_vector
from core.distance_strategies import EngineRegistry

# Configure Structured Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [ReqID: %(request_id)s] %(name)s - %(message)s"
)
logger = logging.getLogger("recommendation_engine")

import contextvars
request_id_var = contextvars.ContextVar("request_id", default="SYSTEM")

class RequestIDFilter(logging.Filter):
    def filter(self, record):
        record.request_id = request_id_var.get()
        return True

for handler in logging.root.handlers:
    handler.addFilter(RequestIDFilter())
logger.addFilter(RequestIDFilter())

# Schema Declarations
class PreferenceSchema(BaseModel):
    experience: str = Field(default="Beginner", description="User experience level ('Beginner', 'Regular', 'Experienced')")
    hike_length: List[str] = Field(default=[], description="Preferred hike durations")
    hiked: bool = Field(default=False, description="Whether the user has hiked before")
    location: List[str] = Field(default=[], description="List of mountains hiked previously")
    province: List[str] = Field(default=["Rizal"], description="Target provinces in CALABARZON")
    tourism_1: bool = Field(default=False)
    tourism_2: bool = Field(default=False)
    tourism_3: bool = Field(default=False)
    tourism_4: bool = Field(default=False)
    tourism_5: bool = Field(default=False)

class RecommendRequest(BaseModel):
    user_id: str = Field(..., description="Unique user identifier")
    preferences: PreferenceSchema = Field(..., description="User onboarding preference responses")
    active_user_count: int = Field(default=10, ge=1, description="Current number of active users u in system")
    config_name: str = Field(default="HYBRID_GOWER", description="One of the 23 TARS benchmark configurations")
    top_k: int = Field(default=5, ge=1, description="Number of recommendations to return")

class ProfileUpdateRequest(BaseModel):
    user_id: str = Field(..., description="Unique user identifier")
    p_old_easy: List[float] = Field(..., description="18-feature vector for old Easy profile P_e")
    p_old_difficult: List[float] = Field(..., description="18-feature vector for old Difficult profile P_d")
    hiked_trails: List[Dict[str, Any]] = Field(..., description="List of hiked trail dictionaries")
    r_tu_scores: List[float] = Field(..., description="List of calculated R_tu recommendation scores")
    actual_difficulties: List[str] = Field(..., description="User actual difficulty feedback ('easy' or 'difficult') for each trail")

class TrailRecommendationItem(BaseModel):
    trail_id: str
    trail_name: str
    province: str
    r_tu: float
    cb_score: float
    cf_score: float
    reason: str

class RecommendResponse(BaseModel):
    user_id: str
    config_used: str
    alpha_tuner: float
    active_users: int
    easy_anchor_recommendations: List[TrailRecommendationItem]
    difficult_anchor_recommendations: List[TrailRecommendationItem]
    warning: Optional[str] = None

app = FastAPI(
    title="Thrail App Recommendation System (TARS)",
    description="Official TARS microservice supporting Strategy Pattern distance engines (23 benchmark configs), Two-Anchor Profiles (P_e, P_d), and BCF profile updates.",
    version="2.0.0"
)

# Initialize paths and recommender engine
TRAILS_CSV = os.path.join(BASE_DIR, "data", "trails_mock.csv")
RATINGS_CSV = os.path.join(BASE_DIR, "data", "user_ratings_mock.csv")

try:
    recommender = HybridRecommender(TRAILS_CSV, RATINGS_CSV)
except Exception as e:
    logger.critical(f"Failed to initialize TARS Recommender engine: {str(e)}", exc_info=True)
    recommender = None

# Security
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)
EXPECTED_API_KEY = "thrail-rec-engine-secret-key-placeholder"

async def verify_api_key(api_key: Optional[str] = Depends(api_key_header)):
    if not api_key:
        logger.warning("Request missing X-API-Key header")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing API Key")
    if api_key != EXPECTED_API_KEY:
        logger.warning("Request provided invalid X-API-Key header")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid API Key")
    return api_key

@app.middleware("http")
async def add_request_tracking(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    token = request_id_var.set(req_id)
    start_time = time.time()
    logger.info(f"Incoming request: {request.method} {request.url.path}")
    
    try:
        response = await call_next(request)
        duration = time.time() - start_time
        logger.info(f"Completed request: {request.method} {request.url.path} - Status: {response.status_code} - Duration: {duration:.4f}s")
        response.headers["X-Request-ID"] = req_id
        return response
    except Exception as exc:
        duration = time.time() - start_time
        logger.error(f"Request failed: {request.method} {request.url.path} - Duration: {duration:.4f}s - Error: {str(exc)}", exc_info=True)
        raise exc
    finally:
        request_id_var.reset(token)

@app.get("/")
def health_check():
    return {"status": "healthy", "service": "recommendation_engine", "version": "2.0.0"}

@app.get("/api/configs")
def get_benchmark_configs():
    """Returns list of all 23 benchmark configurations."""
    return {"total_configs": len(EngineRegistry.BENCHMARK_CONFIGS), "configs": EngineRegistry.BENCHMARK_CONFIGS}

@app.post("/api/recommend", response_model=RecommendResponse, dependencies=[Depends(verify_api_key)])
async def recommend(payload: RecommendRequest):
    logger.info(f"Processing TARS recommendations for user {payload.user_id} using config '{payload.config_name}'")
    
    if not recommender:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Engine not initialized")
        
    try:
        pref_dict = payload.preferences.model_dump()
    except AttributeError:
        pref_dict = payload.preferences.dict()

    result = recommender.get_hybrid_recommendations(
        user_id=payload.user_id,
        preferences=pref_dict,
        top_k=payload.top_k,
        active_user_count=payload.active_user_count,
        config_override=payload.config_name
    )

    easy_items = [TrailRecommendationItem(**rec) for rec in result["easy_anchor_recommendations"]]
    diff_items = [TrailRecommendationItem(**rec) for rec in result["difficult_anchor_recommendations"]]

    return RecommendResponse(
        user_id=payload.user_id,
        config_used=result["config_used"],
        alpha_tuner=result["alpha_tuner"],
        active_users=result["active_users"],
        easy_anchor_recommendations=easy_items,
        difficult_anchor_recommendations=diff_items
    )

@app.post("/api/profile/update", dependencies=[Depends(verify_api_key)])
async def update_profile(payload: ProfileUpdateRequest):
    p_easy_old = np.array(payload.p_old_easy, dtype=np.float32)
    p_diff_old = np.array(payload.p_old_difficult, dtype=np.float32)

    hiked_vecs = [build_18_feature_vector(t) for t in payload.hiked_trails]

    p_easy_new = TwoAnchorProfileManager.update_profile(
        p_old=p_easy_old,
        hiked_trails_vectors=hiked_vecs,
        r_tu_scores=payload.r_tu_scores,
        actual_difficulties=payload.actual_difficulties,
        anchor_type="easy"
    )

    p_diff_new = TwoAnchorProfileManager.update_profile(
        p_old=p_diff_old,
        hiked_trails_vectors=hiked_vecs,
        r_tu_scores=payload.r_tu_scores,
        actual_difficulties=payload.actual_difficulties,
        anchor_type="difficult"
    )

    return {
        "user_id": payload.user_id,
        "updated_easy_profile_pe": p_easy_new.tolist(),
        "updated_difficult_profile_pd": p_diff_new.tolist()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
