"""
TARS Batch Recommendation Runner

Runs the recommendation engine across all candidate trails for all registered users,
evaluating both Easy and Difficult anchor profiles, checking hike completion history,
and saving monthly recommendation documents to Firestore.
"""

import logging
from datetime import datetime
from typing import Dict, Any, List, Optional, Union, Callable

from tars import engine, engine_details, compute_alpha, GD, ED, CS
from profile_utils import flatten_profile_features, extract_user_anchor_profiles
from firebase_client import (
    initialize_firebase,
    fetch_trails,
    fetch_users,
    fetch_completed_trail_ids,
    save_user_recommendations,
    get_current_month_id
)

logger = logging.getLogger("tars_engine")


def run_batch_recommendations(
    cbf_engine: Union[str, Callable] = "GD",
    cf_engine: Union[str, Callable] = "GD",
    month_id: Optional[str] = None,
    candidate_trails: Optional[List[Dict[str, Any]]] = None,
    users: Optional[List[Dict[str, Any]]] = None,
    user_hikes_map: Optional[Dict[str, set]] = None,
    commit_to_firestore: bool = True
) -> Dict[str, Any]:
    """
    Executes a full recommendation batch run.

    Parameters:
        cbf_engine: Formula for CBF ('GD', 'ED', 'CS')
        cf_engine:  Formula for CF ('GD', 'ED', 'CS')
        month_id:   Calendar month string in YYYY-MM format (defaults to current month)
        candidate_trails: Optional pre-loaded list of trail documents
        users:            Optional pre-loaded list of user documents
        user_hikes_map:   Optional mapping of userId -> set of completed trail IDs (for tests/overrides)
        commit_to_firestore: Whether to save monthly documents directly to Firestore

    Returns:
        Dict[str, Any]: Execution report including counts and sample recommendations
    """
    active_month = month_id or get_current_month_id()
    logger.info(f"Starting TARS batch run for month '{active_month}' using CBF={cbf_engine}, CF={cf_engine}")

    # 1. Fetch trails and users if not passed in directly
    db = initialize_firebase()

    trail_list = candidate_trails if candidate_trails is not None else fetch_trails(db)
    raw_user_list = users if users is not None else fetch_users(db, require_profile=True)

    if not trail_list:
        logger.warning("No trails available for recommendation batch run.")
        return {
            "status": "warning",
            "message": "No trails found in database.",
            "month": active_month,
            "processed_users": 0
        }

    # Filter users strictly to those with a saved 'profile' object (excludes dummy accounts)
    user_list = []
    for u in (raw_user_list or []):
        prof = u.get("profile")
        if not prof or not isinstance(prof, dict):
            continue
        has_easy = bool(prof.get("easy") and isinstance(prof.get("easy"), dict) and prof.get("easy", {}).get("features"))
        has_diff = bool(prof.get("difficult") and isinstance(prof.get("difficult"), dict) and prof.get("difficult", {}).get("features"))
        if has_easy or has_diff:
            user_list.append(u)

    if not user_list:
        logger.warning("No profiled users available for recommendation batch run.")
        return {
            "status": "warning",
            "message": "No users with saved profile found in database.",
            "month": active_month,
            "processed_users": 0
        }

    # 2. Extract and pre-flatten all candidate trail vectors
    # According to ITrailBase: general.name is the trail's name
    prepared_trails = []
    for t in trail_list:
        tid = str(t.get("id") or "")
        general = t.get("general") or {}
        if isinstance(general, dict):
            tname = general.get("name")
        else:
            tname = None
        if not tname:
            tname = t.get("name") or "Unknown Trail"

        prof = t.get("profile", t)
        tvec = flatten_profile_features(prof)
        prepared_trails.append({
            "id": tid,
            "name": tname,
            "vector": tvec
        })

    # 3. Compute dynamic alpha and prepare peer vectors for CF
    user_count = len(user_list)
    alpha = compute_alpha(user_count)

    peer_vectors = []
    for u in user_list:
        u_easy_vec, _, _, _ = extract_user_anchor_profiles(u)
        peer_vectors.append(u_easy_vec)

    # 4. Generate recommendations for each user
    processed_count = 0
    sample_outputs = []

    for user in user_list:
        uid = str(user.get("id") or "")
        if not uid:
            continue

        # Extract user anchors (already verified to have profile)
        easy_vec, diff_vec, raw_easy, raw_diff = extract_user_anchor_profiles(user)

        # Check hiked history from user subcollection /users/{uid}/hikes (or test override)
        hiked_ids = set()
        if user_hikes_map and uid in user_hikes_map:
            hiked_ids = set(str(h) for h in user_hikes_map[uid])
        elif db:
            hiked_ids = fetch_completed_trail_ids(uid, db)

        easy_items = []
        diff_items = []

        other_peers = [p for i, p in enumerate(peer_vectors) if (user_list[i].get("id") or "") != uid]

        # Score every candidate trail for both easy and difficult categories
        for trail in prepared_trails:
            tid = trail["id"]
            tname = trail["name"]
            tvec = trail["vector"]
            have_hiked = tid in hiked_ids

            # Calculate Easy Score & breakdown
            res_easy = engine_details(
                cbf_engine=cbf_engine,
                cf_engine=cf_engine,
                array_1=easy_vec,
                array_2=tvec,
                a=alpha,
                peer_profiles=other_peers if other_peers else None
            )

            # Calculate Difficult Score & breakdown
            res_diff = engine_details(
                cbf_engine=cbf_engine,
                cf_engine=cf_engine,
                array_1=diff_vec,
                array_2=tvec,
                a=alpha,
                peer_profiles=other_peers if other_peers else None
            )

            easy_items.append({
                "id": tid,
                "trailName": tname,
                "category": "easy",
                "haveHiked": have_hiked,
                "score": round(float(res_easy["score"]), 4),
                "cbfScore": round(float(res_easy["cbf"]), 4),
                "cfScore": round(float(res_easy["cf"]), 4),
            })

            diff_items.append({
                "id": tid,
                "trailName": tname,
                "category": "difficult",
                "haveHiked": have_hiked,
                "score": round(float(res_diff["score"]), 4),
                "cbfScore": round(float(res_diff["cbf"]), 4),
                "cfScore": round(float(res_diff["cf"]), 4),
            })

        # Sort each list ascending by score (0.0 = closest match / highest recommendation)
        easy_items.sort(key=lambda x: x["score"])
        diff_items.sort(key=lambda x: x["score"])

        # Construct monthly recommendation document matching required schema
        doc_data = {
            "id": active_month,
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat(),
            "engineConfig": {
                "cbf": str(cbf_engine),
                "cf": str(cf_engine),
                "alpha": round(alpha, 4),
                "userCount": user_count
            },
            "profile": {
                "easy": raw_easy,
                "difficult": raw_diff
            },
            "easy": easy_items,
            "difficult": diff_items
        }

        # Commit to Firestore if enabled
        if commit_to_firestore and db:
            save_user_recommendations(uid, active_month, doc_data, db)

        processed_count += 1

        if len(sample_outputs) < 2:
            sample_outputs.append({
                "userId": uid,
                "top_easy": easy_items[:3],
                "top_difficult": diff_items[:2]
            })

    logger.info(f"TARS batch run completed: {processed_count} users processed across {len(prepared_trails)} trails.")

    return {
        "status": "success",
        "month": active_month,
        "total_users_processed": processed_count,
        "total_trails_scored": len(prepared_trails),
        "alpha": round(alpha, 4),
        "samples": sample_outputs
    }


if __name__ == "__main__":
    # Self-test using mock data strictly conforming to ITrailDB and IUserDB models
    mock_trails = [
        {
            "id": "t1",
            "general": {"name": "Mt. Daraitan", "active": True},
            "profile": {
                "metadata": {"type": "trail", "id": "t1"},
                "features": {
                    "classification": 0.0,
                    "length": 0.3,
                    "elevation": 0.4,
                    "gain": 0.3,
                    "slope": 0.3,
                    "easy": 0.3,
                    "province": {"rizal": 1.0, "cavite": 0.0, "laguna": 0.0, "batangas": 0.0, "quezon": 0.0},
                    "terrain": {"muddy": 0.3, "rocky": 0.3, "grassland": 0.2, "ridges": 0.2},
                    "circularity": {"out_and_back": 1.0, "traverse": 0.0, "circular": 0.0},
                    "waterforms": {"fall": 0.5, "river": 0.5, "lake": 0.0},
                    "tourism": {"shelter": 0.5, "resting": 0.5, "information_board": 0.5, "clean_water": 0.5, "river": 0.5, "lake": 0.0, "waterfall": 0.5, "monument": 0.0, "community": 0.2, "viewpoint": 0.5, "network_connection": 0.3}
                }
            }
        },
        {
            "id": "t2",
            "general": {"name": "Mt. Makiling", "active": True},
            "profile": {
                "metadata": {"type": "trail", "id": "t2"},
                "features": {
                    "classification": 1.0,
                    "length": 0.8,
                    "elevation": 0.9,
                    "gain": 0.8,
                    "slope": 0.7,
                    "easy": 0.8,
                    "province": {"laguna": 1.0, "cavite": 0.0, "batangas": 0.0, "rizal": 0.0, "quezon": 0.0},
                    "terrain": {"muddy": 0.8, "rocky": 0.4, "grassland": 0.1, "ridges": 0.5},
                    "circularity": {"out_and_back": 1.0, "traverse": 0.0, "circular": 0.0},
                    "waterforms": {"fall": 0.0, "river": 0.0, "lake": 0.0},
                    "tourism": {"shelter": 0.2, "resting": 0.2, "information_board": 0.4, "clean_water": 0.0, "river": 0.0, "lake": 0.0, "waterfall": 0.0, "monument": 0.0, "community": 0.0, "viewpoint": 0.2, "network_connection": 0.2}
                }
            }
        },
        {
            "id": "t3",
            "general": {"name": "Mt. Tagapo", "active": True},
            "profile": {
                "metadata": {"type": "trail", "id": "t3"},
                "features": {
                    "classification": 0.0,
                    "length": 0.2,
                    "elevation": 0.2,
                    "gain": 0.2,
                    "slope": 0.2,
                    "easy": 0.2,
                    "province": {"rizal": 1.0, "cavite": 0.0, "laguna": 0.0, "batangas": 0.0, "quezon": 0.0},
                    "terrain": {"muddy": 0.1, "rocky": 0.1, "grassland": 0.7, "ridges": 0.2},
                    "circularity": {"out_and_back": 1.0, "traverse": 0.0, "circular": 0.0},
                    "waterforms": {"fall": 0.0, "river": 0.0, "lake": 0.0},
                    "tourism": {"shelter": 0.0, "resting": 0.0, "information_board": 0.1, "clean_water": 0.0, "river": 0.0, "lake": 0.0, "waterfall": 0.0, "monument": 0.0, "community": 0.0, "viewpoint": 0.8, "network_connection": 0.5}
                }
            }
        }
    ]

    # Mock users matching IUserBase with saved UserProfiles
    mock_users = [
        {
            "id": "u1",
            "username": "hikergirl",
            "firstname": "Maria",
            "lastname": "Santos",
            "email": "maria@example.com",
            "role": "user",
            "medicalProfile": {"hasCondition": False, "details": []},
            "preferences": {"experience": "intermediate", "hike_length": [], "hiked": True, "location": [], "province": []},
            "profile": {
                "easy": {
                    "metadata": {"type": "user", "id": "u1", "profile": "easy"},
                    "features": {
                        "classification": 0.0, "length": 0.25, "elevation": 0.25, "gain": 0.25, "slope": 0.25, "easy": 0.25,
                        "province": {"rizal": 1.0, "cavite": 0.0, "laguna": 0.0, "batangas": 0.0, "quezon": 0.0},
                        "terrain": {"muddy": 0.2, "rocky": 0.2, "grassland": 0.2, "ridges": 0.2},
                        "circularity": {"out_and_back": 1.0, "traverse": 0.0, "circular": 0.0},
                        "waterforms": {"fall": 0.0, "river": 0.0, "lake": 0.0},
                        "tourism": {"shelter": 0.2, "resting": 0.2, "information_board": 0.2, "clean_water": 0.2, "river": 0.0, "lake": 0.0, "waterfall": 0.0, "monument": 0.0, "community": 0.0, "viewpoint": 0.2, "network_connection": 0.2}
                    }
                },
                "difficult": {
                    "metadata": {"type": "user", "id": "u1", "profile": "difficult"},
                    "features": {
                        "classification": 1.0, "length": 0.75, "elevation": 0.75, "gain": 0.75, "slope": 0.75, "easy": 0.75,
                        "province": {"rizal": 1.0, "cavite": 0.0, "laguna": 0.0, "batangas": 0.0, "quezon": 0.0},
                        "terrain": {"muddy": 0.6, "rocky": 0.6, "grassland": 0.4, "ridges": 0.5},
                        "circularity": {"out_and_back": 0.5, "traverse": 0.5, "circular": 0.0},
                        "waterforms": {"fall": 0.5, "river": 0.5, "lake": 0.0},
                        "tourism": {"shelter": 0.4, "resting": 0.4, "information_board": 0.4, "clean_water": 0.4, "river": 0.2, "lake": 0.0, "waterfall": 0.2, "monument": 0.0, "community": 0.2, "viewpoint": 0.5, "network_connection": 0.3}
                    }
                }
            }
        },
        {
            "id": "u2",
            "username": "newbie_hiker",
            "firstname": "Juan",
            "lastname": "Dela Cruz",
            "email": "juan@example.com",
            "role": "user",
            "medicalProfile": {"hasCondition": True, "details": ["asthma"]},
            "preferences": {"experience": "beginner", "hike_length": [], "hiked": False, "location": [], "province": []},
            "profile": {
                "easy": {
                    "metadata": {"type": "user", "id": "u2", "profile": "easy"},
                    "features": {
                        "classification": 0.0, "length": 0.15, "elevation": 0.15, "gain": 0.15, "slope": 0.15, "easy": 0.15,
                        "province": {"rizal": 0.5, "cavite": 0.5, "laguna": 0.0, "batangas": 0.0, "quezon": 0.0},
                        "terrain": {"muddy": 0.1, "rocky": 0.1, "grassland": 0.3, "ridges": 0.1},
                        "circularity": {"out_and_back": 1.0, "traverse": 0.0, "circular": 0.0},
                        "waterforms": {"fall": 0.0, "river": 0.0, "lake": 0.0},
                        "tourism": {"shelter": 0.5, "resting": 0.5, "information_board": 0.5, "clean_water": 0.5, "river": 0.0, "lake": 0.0, "waterfall": 0.0, "monument": 0.0, "community": 0.5, "viewpoint": 0.5, "network_connection": 0.5}
                    }
                },
                "difficult": {
                    "metadata": {"type": "user", "id": "u2", "profile": "difficult"},
                    "features": {
                        "classification": 0.0, "length": 0.35, "elevation": 0.35, "gain": 0.35, "slope": 0.35, "easy": 0.35,
                        "province": {"rizal": 0.5, "cavite": 0.5, "laguna": 0.0, "batangas": 0.0, "quezon": 0.0},
                        "terrain": {"muddy": 0.2, "rocky": 0.2, "grassland": 0.4, "ridges": 0.2},
                        "circularity": {"out_and_back": 1.0, "traverse": 0.0, "circular": 0.0},
                        "waterforms": {"fall": 0.0, "river": 0.0, "lake": 0.0},
                        "tourism": {"shelter": 0.5, "resting": 0.5, "information_board": 0.5, "clean_water": 0.5, "river": 0.0, "lake": 0.0, "waterfall": 0.0, "monument": 0.0, "community": 0.5, "viewpoint": 0.5, "network_connection": 0.5}
                    }
                }
            }
        },
        {
            # Dummy user with no profile (should be skipped!)
            "id": "u_dummy",
            "username": "dummy_test",
            "firstname": "Dummy",
            "lastname": "Account",
            "email": "dummy@example.com",
            "role": "user",
            "medicalProfile": {"hasCondition": False, "details": []},
            "preferences": {"experience": "beginner", "hike_length": [], "hiked": False, "location": [], "province": []}
            # Notice: no 'profile' object
        }
    ]

    # Test hike mapping simulating subcollection /users/{uid}/hikes
    # User u1 has completed trail 't3' (Mt. Tagapo)
    mock_hikes_map = {
        "u1": {"t3"},
        "u2": set()
    }

    report = run_batch_recommendations(
        cbf_engine="GD",
        cf_engine="GD",
        month_id="2026-10",
        candidate_trails=mock_trails,
        users=mock_users,
        user_hikes_map=mock_hikes_map,
        commit_to_firestore=False
    )
    print("Batch Run Report:")
    import json
    print(json.dumps(report, indent=2))
