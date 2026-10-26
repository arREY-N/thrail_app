"""
FastAPI Microservice for Thrail App Recommendation System (THARESYS)

Provides endpoints to trigger batch recommendation runs across all users,
calculate individual user recommendations, and inspect monthly recommendations.
"""

import os
import time
import uuid
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional, Union
from fastapi import FastAPI, HTTPException, Request, Depends, status, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from tars import engine, compute_alpha, GD, ED, CS
from batch_runner import run_batch_recommendations
from profile_utils import (
    CANONICAL_FEATURES,
    extract_user_anchor_profiles,
    process_dual_anchor_profile_update
)
from firebase_client import (
    get_current_month_id,
    initialize_firebase,
    save_user_recommendations,
    save_user_profile
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("tharesys_api")

app = FastAPI(
    title="Thrail Recommendation Engine (THARESYS)",
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


def verify_admin_key(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    x_tharesys_key: Optional[str] = Header(None, alias="X-THARESYS-KEY")
) -> bool:
    """
    Validates request against THARESYS_API_KEY environment variable.
    If THARESYS_API_KEY is not configured (e.g. local dev), allows requests.
    """
    configured_key = os.environ.get("THARESYS_API_KEY", "").strip()
    if not configured_key:
        return True

    provided_key = (x_tharesys_key or x_api_key or "").strip()
    if not provided_key or provided_key != configured_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing THARESYS API key."
        )
    return True



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
        "service": "THARESYS Recommendation Engine",
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
async def admin_run_engine(
    payload: AdminRunEngineRequest,
    _auth: bool = Depends(verify_admin_key)
):
    """
    Superadmin endpoint to execute a full recommendation engine run.
    Evaluates all users against all trails and writes monthly recommendation
    documents into /users/{userId}/recommendations/{YYYY-MM}.
    """
    logger.info(f"Superadmin initiated THARESYS batch run: CBF={payload.cbf_engine}, CF={payload.cf_engine}")

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


class HikeFeedbackInput(BaseModel):
    trail_id: Optional[str] = None
    trail_features: Optional[Union[Dict[str, Any], List[float]]] = None
    score: float = Field(default=0.5, description="Recommendation distance R_tu in [0.0, 1.0]")
    is_match: bool = Field(default=True, description="True for match, False for mismatch")
    target_anchor: str = Field(default="easy", description="'easy' or 'difficult'")
    feature_weights: Optional[Union[Dict[str, float], List[float]]] = Field(
        default=None,
        description="Optional hike-specific factor weights selected by user for this hike"
    )


class UpdateUserProfileRequest(BaseModel):
    user_id: str
    current_easy_profile: Optional[Union[Dict[str, Any], List[float]]] = None
    current_diff_profile: Optional[Union[Dict[str, Any], List[float]]] = None
    hikes: List[HikeFeedbackInput]
    feature_weights: Optional[Dict[str, float]] = None
    commit_to_firestore: bool = Field(default=True, description="Save updated profile to /users/{userId}")


@app.post("/api/user/update-profile")
async def update_user_profile(
    payload: UpdateUserProfileRequest,
    _auth: bool = Depends(verify_admin_key)
):
    """
    Updates a user's dual anchor profiles (easy and difficult) based on completed hike feedback.
    Partitions hikes by their assigned recommendation category, applies error-driven
    adaptive updates (beta * (Trail - Profile)), enforces monotonicity, and optionally
    persists the updated profile back to Firestore.
    """
    logger.info(f"Updating profile for user {payload.user_id} with {len(payload.hikes)} hike feedback items")

    easy_input = payload.current_easy_profile
    diff_input = payload.current_diff_profile

    db = initialize_firebase()
    if (easy_input is None or diff_input is None) and db:
        try:
            user_doc_ref = db.collection("users").document(payload.user_id).get()
            if user_doc_ref.exists:
                u_data = user_doc_ref.to_dict() or {}
                _, _, raw_easy, raw_diff = extract_user_anchor_profiles(u_data)
                if easy_input is None:
                    easy_input = raw_easy
                if diff_input is None:
                    diff_input = raw_diff
        except Exception as e:
            logger.warning(f"Could not load user {payload.user_id} from Firestore for fallback profile: {e}")

    if easy_input is None or diff_input is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current easy and difficult profiles must be provided if user does not exist in Firestore"
        )

    hike_dicts = [h.dict() for h in payload.hikes]
    if db:
        for h in hike_dicts:
            if not h.get("trail_features") and h.get("trail_id"):
                try:
                    tdoc = db.collection("trails").document(str(h["trail_id"])).get()
                    if tdoc.exists:
                        tdata = tdoc.to_dict() or {}
                        prof = tdata.get("profile") or {}
                        h["trail_features"] = prof.get("features", tdata.get("features", {}))
                except Exception as e:
                    logger.warning(f"Could not fetch trail {h['trail_id']} features from Firestore: {e}")

    try:
        result = process_dual_anchor_profile_update(
            current_easy_profile=easy_input,
            current_diff_profile=diff_input,
            hike_records=hike_dicts,
            weights_map=payload.feature_weights
        )

        formatted_profiles = {
            "easy": {
                "metadata": {"type": "user", "id": payload.user_id, "profile": "easy"},
                "features": result["updated_easy_features"]
            },
            "difficult": {
                "metadata": {"type": "user", "id": payload.user_id, "profile": "difficult"},
                "features": result["updated_diff_features"]
            }
        }

        committed = False
        if payload.commit_to_firestore and db:
            committed = save_user_profile(payload.user_id, formatted_profiles, db=db)

        return {
            "status": "success",
            "user_id": payload.user_id,
            "easy_hikes_count": result["easy_hikes_count"],
            "difficult_hikes_count": result["difficult_hikes_count"],
            "profile": formatted_profiles,
            "easy_vector": result["updated_easy_vector"],
            "difficult_vector": result["updated_diff_vector"],
            "committed_to_firestore": committed,
            "updated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed updating profile for user {payload.user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile update calculation failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    reload = os.environ.get("ENV", "development").lower() != "production"
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=reload)

