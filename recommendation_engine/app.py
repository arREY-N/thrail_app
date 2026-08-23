"""
@file app.py
@description FastAPI microservice endpoint interface for Thrail App Recommendation System (TARS).
             Exposes POST /api/recommend, POST /api/profile/update, and POST /api/gower/similarity.
"""

import os
import uuid
import time
import logging
from typing import List, Dict, Optional, Any
from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.responses import JSONResponse
from fastapi.security import APIKeyHeader
from pydantic import BaseModel, Field

# Import the TARS recommender engine and Gower similarity tools
from recommender import HybridRecommender, recalibrate_user_profile, BASE_PROFILES
from gower_engine import compute_gower_similarity_single, DEFAULT_FEATURE_CONFIG

# 1. Configured Structured Logging with Request IDs
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
    experience: str = Field(..., description="User experience level: 'Beginner', 'Regular', 'Experienced'")
    hike_length: List[str] = Field(default=[], description="Preferred hike durations")
    hiked: bool = Field(default=False, description="Whether the user has hiked before")
    location: List[str] = Field(default=[], description="List of mountains hiked previously")
    province: List[str] = Field(default=["Rizal"], description="Target provinces in CALABARZON")

class GPSSummarySchema(BaseModel):
    distance: Optional[float] = Field(None, description="Walked distance in meters")
    duration: Optional[float] = Field(None, description="Walked duration in seconds")
    elevation: Optional[float] = Field(None, description="Elevation gain in meters")

class ProfileUpdateRequest(BaseModel):
    user_id: str = Field(..., description="Unique user identifier")
    experience: str = Field(default="Beginner", description="Base experience level")
    gps_summary: Optional[GPSSummarySchema] = Field(None, description="Recent hike GPS log summary")
    perceived_difficulty: Optional[str] = Field(None, description="Post-hike survey rating (Easy, Moderate, Hard, Extreme)")

class GowerSimilarityRequest(BaseModel):
    entity_a: Dict[str, Any] = Field(..., description="Attributes for Entity A")
    entity_b: Dict[str, Any] = Field(..., description="Attributes for Entity B")

class RecommendRequest(BaseModel):
    user_id: str = Field(..., description="Unique user identifier")
    preferences: PreferenceSchema = Field(..., description="User onboarding preference responses")
    history: List[Dict[str, Any]] = Field(default=[], description="User's past hike surveys/reviews")
    gps_summary: Optional[GPSSummarySchema] = Field(None, description="Recent hike GPS metrics")
    completed_hikes: int = Field(default=0, ge=0, description="Total completed hikes logged by user")
    last_perceived_difficulty: Optional[str] = Field(None, description="Perceived difficulty rating from last hike")
    is_active_monthly: bool = Field(default=True, description="Whether user was active in last 30 days")
    is_social_only: bool = Field(default=False, description="Whether user only has social interactions")
    medical_profile: Optional[Dict[str, Any]] = Field(None, description="Medical condition flags")
    alpha: Optional[float] = Field(None, ge=0.0, le=1.0, description="Optional alpha override")
    top_k: int = Field(default=5, ge=1, description="Number of trails to recommend")

class TrailRecommendation(BaseModel):
    trail_id: str
    trail_name: str
    match_score: float
    cbf_score: Optional[float] = None
    cf_score: Optional[float] = None
    reason: str

class RecommendResponse(BaseModel):
    user_id: str
    recommendations: List[TrailRecommendation]
    alpha_used: float
    completed_hikes: int
    warning: Optional[str] = None

app = FastAPI(
    title="Thrail Recommendation Microservice (TARS)",
    description="Refactored microservice implementing Gower Distance, Dynamic Alpha Tuning, Collaborative Filtering, and Symmetric Matrix Optimizations.",
    version="1.0.0"
)

# Initialize paths and recommender engine
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
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

# Request Tracking Middleware
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

def get_fallback_recommendations(payload: RecommendRequest) -> List[Dict[str, Any]]:
    logger.info("Executing fail-safe fallback recommendation engine")
    preferred_provinces = [p.lower() for p in payload.preferences.province]
    candidates = [
        {"trail_id": "trail_001", "trail_name": "Mt. Daraitan", "province": "rizal", "match_score": 0.85, "reason": "Province match (Rizal) - Fallback."},
        {"trail_id": "trail_002", "trail_name": "Mt. Batulao", "province": "batangas", "match_score": 0.80, "reason": "Province match (Batangas) - Fallback."},
        {"trail_id": "trail_005", "trail_name": "Mt. Pico de Loro", "province": "cavite", "match_score": 0.75, "reason": "Province match (Cavite) - Fallback."},
        {"trail_id": "trail_004", "trail_name": "Mt. Makiling", "province": "laguna", "match_score": 0.70, "reason": "Province match (Laguna) - Fallback."}
    ]
    matched = [c for c in candidates if c["province"] in preferred_provinces]
    if not matched:
        matched = candidates
    return matched[:payload.top_k]

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    req_id = request_id_var.get()
    logger.error(f"Global exception handler caught error: {str(exc)}", exc_info=True)
    if request.url.path == "/api/recommend":
        try:
            body_bytes = await request.body()
            import json
            body_dict = json.loads(body_bytes.decode("utf-8"))
            payload = RecommendRequest(**body_dict)
            fallback_recs = get_fallback_recommendations(payload)
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={
                    "user_id": payload.user_id,
                    "recommendations": fallback_recs,
                    "alpha_used": payload.alpha if payload.alpha is not None else 1.0,
                    "completed_hikes": payload.completed_hikes,
                    "warning": "Primary recommendation service encountered an issue. Returned fallback recommendations."
                },
                headers={"X-Request-ID": req_id}
            )
        except Exception as fallback_exc:
            logger.critical(f"Fallback engine failed: {str(fallback_exc)}", exc_info=True)
            
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal recommendation system error occurred.", "request_id": req_id}
    )

@app.get("/")
def health_check():
    return {"status": "healthy", "service": "recommendation_engine", "version": "1.0.0"}

@app.post("/api/recommend", response_model=RecommendResponse, dependencies=[Depends(verify_api_key)])
async def recommend(payload: RecommendRequest):
    """
    @function recommend
    @description Primary POST recommendation route using TARS Gower Distance and Hybrid Fusion.
    """
    logger.info(f"Processing recommendations for user {payload.user_id} with completed_hikes={payload.completed_hikes}")
    
    if not recommender:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Engine not initialized")
        
    try:
        pref_dict = payload.preferences.model_dump()
    except AttributeError:
        pref_dict = payload.preferences.dict()

    gps_dict = payload.gps_summary.dict() if payload.gps_summary else None

    # Determine hike count from explicit field or history length
    hike_count = payload.completed_hikes
    if hike_count == 0 and payload.history:
        hike_count = len(payload.history)

    result = recommender.get_hybrid_recommendations(
        user_id=payload.user_id,
        preferences=pref_dict,
        top_k=payload.top_k,
        completed_hikes=hike_count,
        gps_summary=gps_dict,
        last_perceived_difficulty=payload.last_perceived_difficulty,
        is_active_monthly=payload.is_active_monthly,
        is_social_only=payload.is_social_only,
        medical_profile=payload.medical_profile,
        user_alpha_override=payload.alpha
    )

    recommendations = [TrailRecommendation(**rec) for rec in result["recommendations"]]

    return RecommendResponse(
        user_id=payload.user_id,
        recommendations=recommendations,
        alpha_used=result["alpha_used"],
        completed_hikes=result["completed_hikes"]
    )

@app.post("/api/profile/update", dependencies=[Depends(verify_api_key)])
async def update_profile(payload: ProfileUpdateRequest):
    """
    @function update_profile
    @description Module 2.3 Incremental Profile Update endpoint.
    """
    exp_key = payload.experience.lower()
    base_prof = BASE_PROFILES.get(exp_key, BASE_PROFILES["beginner"]).copy()
    gps_dict = payload.gps_summary.dict() if payload.gps_summary else None
    
    recalibrated = recalibrate_user_profile(
        current_profile=base_prof,
        gps_summary=gps_dict,
        perceived_difficulty=payload.perceived_difficulty
    )
    return {
        "user_id": payload.user_id,
        "base_experience": payload.experience,
        "recalibrated_profile": recalibrated
    }

@app.post("/api/gower/similarity", dependencies=[Depends(verify_api_key)])
async def calculate_gower_similarity(payload: GowerSimilarityRequest):
    """
    @function calculate_gower_similarity
    @description Module 1 Utility Endpoint: Calculates Gower similarity between two entity dictionaries.
    """
    score = compute_gower_similarity_single(
        dict_a=payload.entity_a,
        dict_b=payload.entity_b,
        feature_config=DEFAULT_FEATURE_CONFIG
    )
    return {
        "similarity_score": round(float(score), 6),
        "distance": round(1.0 - float(score), 6)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
