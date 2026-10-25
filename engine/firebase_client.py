"""
Firebase Admin Client for THARESYS Recommendation Engine

Initializes Firestore connection and provides data fetching and batch write methods.
"""

import os
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
import firebase_admin
from firebase_admin import credentials, firestore

logger = logging.getLogger("tharesys_engine")

_DB_CLIENT = None


def get_current_month_id() -> str:
    """Returns current month in YYYY-MM format (e.g. '2026-10')."""
    return datetime.utcnow().strftime("%Y-%m")


def initialize_firebase(project_id: str = "thrail") -> Optional[Any]:
    """
    Initializes Firebase Admin SDK if not already initialized.
    Checks:
    1. Local serviceAccountKey.json
    2. GOOGLE_APPLICATION_CREDENTIALS environment variable
    3. Default credentials / project ID
    """
    global _DB_CLIENT
    if _DB_CLIENT is not None:
        return _DB_CLIENT

    if not firebase_admin._apps:
        # Check for local service account key in engine or project root
        key_locations = [
            os.path.join(os.path.dirname(__file__), "serviceAccountKey.json"),
            os.path.join(os.path.dirname(__file__), "..", "serviceAccountKey.json"),
            os.environ.get("SERVICE_ACCOUNT_KEY_PATH", "")
        ]

        cred = None
        for path in key_locations:
            if path and os.path.exists(path):
                logger.info(f"Loading service account key from {path}")
                cred = credentials.Certificate(path)
                break

        try:
            if cred:
                firebase_admin.initialize_app(cred, {"projectId": project_id})
            else:
                logger.info(f"Initializing Firebase Admin with default credentials for project '{project_id}'")
                firebase_admin.initialize_app(options={"projectId": project_id})
        except Exception as e:
            logger.warning(f"Could not initialize Firebase Admin SDK directly: {e}")
            return None

    try:
        _DB_CLIENT = firestore.client()
        logger.info("Firestore client successfully connected.")
        return _DB_CLIENT
    except Exception as e:
        logger.warning(f"Failed to obtain Firestore client: {e}")
        return None


def fetch_trails(db=None) -> List[Dict[str, Any]]:
    """
    Fetches all trail documents from /trails.
    Only includes trails that have general information and profile features.
    """
    client = db or _DB_CLIENT or initialize_firebase()
    if not client:
        return []

    trails = []
    docs = client.collection("trails").stream()
    for d in docs:
        data = d.to_dict()
        data["id"] = d.id
        trails.append(data)
    return trails


def fetch_users(db=None, require_profile: bool = True) -> List[Dict[str, Any]]:
    """
    Fetches user documents from /users.
    If require_profile is True, strictly filters to documents having a valid 'profile' object
    (containing 'easy' or 'difficult' profile features), excluding dummy/unprofiled accounts.
    """
    client = db or _DB_CLIENT or initialize_firebase()
    if not client:
        return []

    users = []
    docs = client.collection("users").stream()
    for d in docs:
        data = d.to_dict()
        data["id"] = d.id

        if require_profile:
            prof = data.get("profile")
            if not prof or not isinstance(prof, dict):
                continue
            # Must contain easy or difficult anchor profiles with features
            has_easy = bool(prof.get("easy") and isinstance(prof.get("easy"), dict) and prof.get("easy", {}).get("features"))
            has_diff = bool(prof.get("difficult") and isinstance(prof.get("difficult"), dict) and prof.get("difficult", {}).get("features"))
            if not (has_easy or has_diff):
                continue

        users.append(data)

    logger.info(f"Fetched {len(users)} users from /users (require_profile={require_profile}).")
    return users


def fetch_completed_trail_ids(user_id: str, db=None) -> set:
    """
    Fetches the set of trail IDs that the user has completed.
    Queries the user's subcollection: /users/{user_id}/hikes.
    Extracts trail ID from hike.trail.id where hike.status == 'completed'.
    """
    client = db or _DB_CLIENT or initialize_firebase()
    if not client:
        return set()

    hiked_ids = set()
    try:
        # Check standard path: /users/{user_id}/hikes
        user_hikes_ref = client.collection("users").document(user_id).collection("hikes")
        hike_docs = list(user_hikes_ref.stream())

        # Fallback to singular collection path if empty (/user/{user_id}/hikes)
        if not hike_docs:
            user_hikes_ref_alt = client.collection("user").document(user_id).collection("hikes")
            hike_docs = list(user_hikes_ref_alt.stream())

        for d in hike_docs:
            hike_data = d.to_dict()
            status = hike_data.get("status")
            end_time = hike_data.get("endTime")

            # Check if hike was completed
            is_completed = (status == "completed") or (status is None and end_time is not None)
            if not is_completed:
                continue

            trail_obj = hike_data.get("trail", {})
            trail_id = None
            if isinstance(trail_obj, dict):
                trail_id = trail_obj.get("id")
            elif isinstance(trail_obj, str):
                trail_id = trail_obj

            if not trail_id:
                trail_id = hike_data.get("trailId")

            if trail_id:
                hiked_ids.add(str(trail_id))

    except Exception as e:
        logger.warning(f"Failed querying hikes for user {user_id}: {e}")

    return hiked_ids


def save_user_recommendations(user_id: str, month_id: str, doc_data: Dict[str, Any], db=None) -> bool:
    """
    Writes monthly recommendations document to /users/{user_id}/recommendations/{month_id}.
    """
    client = db or _DB_CLIENT or initialize_firebase()
    if not client:
        logger.error("Cannot save recommendations: Firestore client is unavailable.")
        return False

    try:
        ref = client.collection("users").document(user_id).collection("recommendations").document(month_id)
        doc_data["updatedAt"] = firestore.SERVER_TIMESTAMP
        ref.set(doc_data, merge=True)
        return True
    except Exception as e:
        logger.error(f"Failed writing recommendations for user {user_id}: {e}")
        return False


def save_user_profile(user_id: str, profile_data: Dict[str, Any], db=None) -> bool:
    """
    Saves updated easy and difficult user profiles to /users/{user_id}.
    """
    client = db or _DB_CLIENT or initialize_firebase()
    if not client:
        logger.error("Cannot save profile: Firestore client is unavailable.")
        return False

    try:
        ref = client.collection("users").document(user_id)
        ref.set({"profile": profile_data, "updatedAt": firestore.SERVER_TIMESTAMP}, merge=True)
        return True
    except Exception as e:
        logger.error(f"Failed writing profile for user {user_id}: {e}")
        return False


def fetch_user_reviews(user_id: str, db=None) -> List[Dict[str, Any]]:
    """
    Fetches all reviews authored by a user from the root /reviews collection.
    """
    client = db or _DB_CLIENT or initialize_firebase()
    if not client:
        return []

    reviews = []
    try:
        docs = client.collection("reviews").where("user.id", "==", user_id).stream()
        for d in docs:
            data = d.to_dict()
            data["id"] = d.id
            reviews.append(data)
    except Exception as e:
        logger.warning(f"Failed querying reviews for user {user_id}: {e}")
    return reviews


def get_previous_month_id(month_id: Optional[str] = None) -> str:
    """
    Returns previous month ID in YYYY-MM format given a month ID (or current month).
    """
    if not month_id:
        month_id = get_current_month_id()
    try:
        parts = month_id.split("-")
        year = int(parts[0])
        month = int(parts[1])
        if month == 1:
            return f"{year - 1:04d}-12"
        else:
            return f"{year:04d}-{month - 1:02d}"
    except Exception:
        return month_id


def fetch_user_monthly_recommendation(user_id: str, month_id: str, db=None) -> Optional[Dict[str, Any]]:
    """
    Fetches user's recommendation record for a specific month from /users/{user_id}/recommendations/{month_id}.
    """
    client = db or _DB_CLIENT or initialize_firebase()
    if not client:
        return None
    try:
        doc = client.collection("users").document(user_id).collection("recommendations").document(month_id).get()
        if doc.exists:
            return doc.to_dict()
    except Exception as e:
        logger.warning(f"Could not fetch recommendation for user {user_id} month {month_id}: {e}")
    return None


