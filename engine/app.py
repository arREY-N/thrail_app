"""
FastAPI Microservice for Thrail App Recommendation System (TARS)

Provides endpoints to trigger batch recommendation runs across all users,
calculate individual user recommendations, and inspect monthly recommendations.
"""

import os
import time
import uuid
import logging
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from tars import engine, compute_alpha, GD, ED, CS
from batch_runner import run_batch_recommendations
from profile_utils import CANONICAL_FEATURES
from firebase_client import get_current_month_id, initialize_firebase, save_user_recommendations

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("tars_api")

app = FastAPI(
    title="Thrail Recommendation Engine (TARS)",
    description="FastAPI service powering personalized hiking trail recommendations for Thrail.",
    version="2.0.0"
)

# Enable CORS for React Native (Expo) and Web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AdminRunEngineRequest(BaseModel):
    cbf_engine: str = Field(default="GD", description="Formula for CBF: 'GD', 'ED', 'CS'")
    cf_engine: str = Field(default="GD", description="Formula for CF: 'GD', 'ED', 'CS'")
    month_id: Optional[str] = Field(default=None, description="Month code in YYYY-MM format")
    candidate_trails: Optional[List[Dict[str, Any]]] = Field(default=None, description="Optional trail list override")
    users: Optional[List[Dict[str, Any]]] = Field(default=None, description="Optional user list override")
    commit_to_firestore: bool = Field(default=True, description="Save results directly into Firestore")
    feature_weights: Optional[Dict[str, float]] = Field(default=None, description="Custom feature weights map")
    generate_ai_reasoning: bool = Field(default=True, description="Pre-generate Gemini AI reasoning for top 1 recommendations")


class SingleRecommendRequest(BaseModel):
    user_id: str
    user_profile: Dict[str, Any]
    candidate_trails: List[Dict[str, Any]]
    cbf_engine: str = "GD"
    cf_engine: str = "GD"
    active_user_count: int = 10
    feature_weights: Optional[Dict[str, float]] = None


@app.get("/")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "TARS Recommendation Engine",
        "version": "2.0.0"
    }


@app.get("/api/admin/features")
def get_canonical_features():
    """
    Returns the canonical 32-feature registry along with their default weights,
    categories, and labels for Superadmin customization.
    """
    return {
        "total_features": len(CANONICAL_FEATURES),
        "features": CANONICAL_FEATURES
    }


@app.post("/api/admin/run-engine")
async def admin_run_engine(payload: AdminRunEngineRequest):
    """
    Superadmin endpoint to execute a full recommendation engine run.
    Evaluates all users against all trails and writes monthly recommendation
    documents into /users/{userId}/recommendations/{YYYY-MM}.
    """
    logger.info(f"Superadmin initiated TARS batch run: CBF={payload.cbf_engine}, CF={payload.cf_engine}")

    try:
        report = run_batch_recommendations(
            cbf_engine=payload.cbf_engine,
            cf_engine=payload.cf_engine,
            month_id=payload.month_id,
            candidate_trails=payload.candidate_trails,
            users=payload.users,
            commit_to_firestore=payload.commit_to_firestore,
            feature_weights=payload.feature_weights,
            generate_ai_reasoning=payload.generate_ai_reasoning
        )
        return report
    except Exception as e:
        logger.error(f"Error during batch recommendation run: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch execution failed: {str(e)}"
        )


@app.get("/api/users/{user_id}/recommendations/{month_id}")
async def get_user_monthly_recommendations(user_id: str, month_id: str):
    """
    Fetches the generated monthly recommendation document for a specific user.
    """
    db = initialize_firebase()
    if not db:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firestore client is unavailable"
        )

    try:
        doc_ref = db.collection("users").document(user_id).collection("recommendations").document(month_id)
        snapshot = doc_ref.get()
        if not snapshot.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No recommendations found for user {user_id} in month {month_id}"
            )
        return snapshot.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed fetching recommendations for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
