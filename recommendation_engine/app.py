import os
import uuid
import time
import logging
from typing import List, Dict, Optional, Any
from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.responses import JSONResponse
from fastapi.security import APIKeyHeader
from pydantic import BaseModel, Field

# Import the core recommender engine
from recommender import HybridRecommender

# 1. Configured Structured Logging with Request IDs
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [ReqID: %(request_id)s] %(name)s - %(message)s"
)
logger = logging.getLogger("recommendation_engine")

# Context var to inject request IDs into logging contexts asynchronously
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
    """
    @class PreferenceSchema
    @description Represents user preference metrics collected from onboarding forms.
    @property {str} experience - User hiking experience level ('Beginner', 'Regular', 'Experienced').
    @property {List[str]} hike_length - Preferred hike durations.
    @property {bool} hiked - True if the user has hiked before, False otherwise.
    @property {List[str]} location - Specific list of prior completed mountains.
    @property {List[str]} province - Target provinces in CALABARZON.
    """
    experience: str = Field(..., description="User experience level: 'Beginner', 'Regular', 'Experienced'")
    hike_length: List[str] = Field(..., description="Preferred hike durations")
    hiked: bool = Field(..., description="Whether the user has hiked before")
    location: List[str] = Field(..., description="List of mountains hiked previously")
    province: List[str] = Field(..., description="Target provinces in CALABARZON")

class GPSSummarySchema(BaseModel):
    """
    @class GPSSummarySchema
    @description Summary telemetry calculated from GPS log tracks.
    @property {Optional[float]} distance - Hiked distance in meters.
    @property {Optional[float]} duration - Hiked time in seconds.
    @property {Optional[float]} elevation - Total elevation gain in meters.
    """
    distance: Optional[float] = Field(None, description="Walked distance in meters")
    duration: Optional[float] = Field(None, description="Walked duration in seconds")
    elevation: Optional[float] = Field(None, description="Elevation gain in meters")

class RecommendRequest(BaseModel):
    """
    @class RecommendRequest
    @description Incoming payload payload for the recommendation endpoint.
    @property {str} user_id - The target user's unique Firestore identifier.
    @property {PreferenceSchema} preferences - User's current onboarding preference settings.
    @property {List[Dict[str, Any]]} history - User's historical review data.
    @property {Optional[GPSSummarySchema]} gps_summary - Historical GPS tracker averages.
    @property {float} alpha - Dynamic scaling coefficient.
    @property {int} top_k - Number of trails to return.
    """
    user_id: str = Field(..., description="Unique user identifier")
    preferences: PreferenceSchema = Field(..., description="User onboarding preference responses")
    history: List[Dict[str, Any]] = Field(default=[], description="User's past hike surveys/reviews")
    gps_summary: Optional[GPSSummarySchema] = Field(None, description="Recent hike GPS metrics")
    alpha: float = Field(default=0.5, ge=0.0, le=1.0, description="Dynamic weight coefficient (alpha) to blend Content-Based (alpha) vs Collaborative Filtering (1-alpha)")
    top_k: int = Field(default=5, ge=1, description="Number of trails to recommend")

class TrailRecommendation(BaseModel):
    """
    @class TrailRecommendation
    @description Individual output recommendation representing a matched trail.
    @property {str} trail_id - Trail document identifier.
    @property {str} trail_name - Name of the mountain.
    @property {float} match_score - Calculated match score (0.0 to 1.0).
    @property {str} reason - Descriptive string explaining the match.
    """
    trail_id: str
    trail_name: str
    match_score: float
    reason: str

class RecommendResponse(BaseModel):
    """
    @class RecommendResponse
    @description Output envelope containing user recommendations.
    @property {str} user_id - The requesting user ID.
    @property {List[TrailRecommendation]} recommendations - Sorted list of recommended trails.
    @property {Optional[str]} warning - Fallback warnings if errors were caught.
    """
    user_id: str
    recommendations: List[TrailRecommendation]
    warning: Optional[str] = None

app = FastAPI(
    title="Thrail Recommendation Microservice",
    description="Skeletal microservice for hybrid trail recommendation with robust security, error fallbacks, and request tracking.",
    version="0.2.0"
)

# Initialize paths and recommender engine
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TRAILS_CSV = os.path.join(BASE_DIR, "data", "trails_mock.csv")
RATINGS_CSV = os.path.join(BASE_DIR, "data", "user_ratings_mock.csv")

try:
    recommender = HybridRecommender(TRAILS_CSV, RATINGS_CSV)
except Exception as e:
    logger.critical(f"Failed to initialize HybridRecommender database indexes: {str(e)}", exc_info=True)
    recommender = None

# 2. Security: Simple API Key Header validation (Placeholder)
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

# In production, load this from secure environment variables
EXPECTED_API_KEY = "thrail-rec-engine-secret-key-placeholder"

async def verify_api_key(api_key: Optional[str] = Depends(api_key_header)):
    """
    @function verify_api_key
    @description Security dependency that checks for a valid X-API-Key header.
    @param {Optional[str]} api_key - Secret key extracted from headers.
    @returns {str} The verified API Key.
    @throws {HTTPException} 401 if key is missing, 403 if invalid.
    """
    if not api_key:
        logger.warning("Request missing X-API-Key header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API Key"
        )
    if api_key != EXPECTED_API_KEY:
        logger.warning("Request provided invalid X-API-Key header")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API Key"
        )
    return api_key

# 3. Request Tracking Middleware
@app.middleware("http")
async def add_request_tracking(request: Request, call_next):
    """
    @function add_request_tracking
    @description Middleware intercepting requests to stamp unique request IDs onto log scopes.
    @param {Request} request - FastAPI request context.
    @param {Callable} call_next - Async endpoint resolver callback.
    @returns {Response} Stamped HTTP response.
    """
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

# 4. Fallback Recommendation Engine (Security/Fail-Safe)
def get_fallback_recommendations(payload: RecommendRequest) -> List[Dict[str, Any]]:
    """
    @function get_fallback_recommendations
    @description Fail-safe backup recommender that utilizes basic onboarding filtering.
    @param {RecommendRequest} payload - Request payload containing user preferences.
    @returns {List[Dict[str, Any]]} Fallback recommendation list.
    """
    logger.info("Executing fail-safe fallback recommendation engine")
    
    # Check province preferences to filter fallback mountains
    preferred_provinces = [p.lower() for p in payload.preferences.province]
    
    candidates = [
        {"trail_id": "trail_001", "trail_name": "Mt. Daraitan", "province": "rizal", "match_score": 0.85, "reason": "Province recommendation (Rizal) - Fallback mode."},
        {"trail_id": "trail_002", "trail_name": "Mt. Batulao", "province": "batangas", "match_score": 0.80, "reason": "Province recommendation (Batangas) - Fallback mode."},
        {"trail_id": "trail_005", "trail_name": "Mt. Pico de Loro", "province": "cavite", "match_score": 0.75, "reason": "Province recommendation (Cavite) - Fallback mode."},
        {"trail_id": "trail_004", "trail_name": "Mt. Makiling", "province": "laguna", "match_score": 0.70, "reason": "Province recommendation (Laguna) - Fallback mode."}
    ]
    
    matched = [c for c in candidates if c["province"] in preferred_provinces]
    if not matched:
        matched = candidates
        
    return matched[:payload.top_k]

# 5. Global Exception Handler (Fail-Safe Wrapper)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    @function global_exception_handler
    @description Intercepts unhandled app crashes and routes POST recommendations to the fallback engine.
    @param {Request} request - Faulted request context.
    @param {Exception} exc - Exception instance.
    @returns {JSONResponse} Resilient client response.
    """
    req_id = request_id_var.get()
    logger.error(f"Global exception handler caught unhandled error: {str(exc)}", exc_info=True)
    
    # For POST recommendations, gracefully return fallback results instead of a 500 error
    if request.url.path == "/api/recommend":
        try:
            body_bytes = await request.body()
            import json
            body_dict = json.loads(body_bytes.decode("utf-8"))
            payload = RecommendRequest(**body_dict)
            fallback_recs = get_fallback_recommendations(payload)
            
            logger.info("Successfully returned fallback recommendations due to internal algorithm error")
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={
                    "user_id": payload.user_id,
                    "recommendations": fallback_recs,
                    "warning": "Primary recommendation service encountered an issue. Returned fallback recommendations."
                },
                headers={"X-Request-ID": req_id}
            )
        except Exception as fallback_exc:
            logger.critical(f"Fail-safe fallback recommendation engine failed: {str(fallback_exc)}", exc_info=True)
            
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal recommendation system error occurred. Please contact system support.", "request_id": req_id}
    )

@app.get("/")
def health_check():
    """
    @function health_check
    @description Simple liveness status probe.
    @returns {Dict[str, str]} Status payload.
    """
    return {"status": "healthy", "service": "recommendation_engine"}

@app.post("/api/recommend", response_model=RecommendResponse, dependencies=[Depends(verify_api_key)])
async def recommend(payload: RecommendRequest):
    """
    @function recommend
    @description Main entry point for recommendations. Computes dynamic hybrid vector matching.
    @param {RecommendRequest} payload - User context, history and alpha blend weights.
    @returns {RecommendResponse} Sorted list of matched trails.
    """
    logger.info(f"Processing primary recommendations for user {payload.user_id} with alpha={payload.alpha}")
    
    if not recommender:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Recommendation engine was not properly initialized."
        )
        
    # Extract dict representation of preferences using standard Pydantic method
    try:
        # Pydantic v2 uses model_dump, fallback to dict for compatibility
        pref_dict = payload.preferences.model_dump()
    except AttributeError:
        pref_dict = payload.preferences.dict()
        
    results = recommender.get_hybrid_recommendations(
        user_id=payload.user_id,
        preferences=pref_dict,
        top_k=payload.top_k,
        base_alpha=payload.alpha
    )
    
    recommendations = [
        TrailRecommendation(**t) for t in results
    ]
    
    return RecommendResponse(
        user_id=payload.user_id,
        recommendations=recommendations
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)


