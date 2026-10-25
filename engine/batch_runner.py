"""
THARESYS Batch Recommendation Runner

Runs the recommendation engine across all candidate trails for all registered users,
evaluating both Easy and Difficult anchor profiles, checking hike completion history,
and saving monthly recommendation documents to Firestore.

Architecture & Partitioning Logic:
    1. Dual-Anchor Evaluation:
       Each candidate trail is scored against the user's Easy Profile (comfortable baseline capability)
       and Difficult Profile (aspirational challenge limit).
    2. Disjoint Partitioning (Zero Overlap):
       Trails are assigned exclusively to whichever profile has the lower distance score (closer match).
       A trail never appears in both 'easy' and 'difficult' recommendation lists for the same user.
    3. Safety-First Empty List Policy:
       If all available trails exceed the user's comfortable capability (score_diff < score_easy for all),
       the 'easy' list remains empty as-is. Difficult trails are never falsely forced into the easy category,
       preventing hazardous mismatches for beginner or recovering hikers.
    4. AI Reasoning & Trail of the Month:
       Google Gemini AI synthesizes personalized coaching narrative for the top recommendation,
       prioritizing Easy trails when present, and falling back safely to Difficult trails if no easy trails exist.
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Union, Callable
import numpy as np

from tars import engine, engine_details, compute_alpha, GD, ED, CS
from profile_utils import (
    flatten_profile_features,
    extract_user_anchor_profiles,
    build_feature_weight_vector,
    process_dual_anchor_profile_update,
    resolve_review_factor_weights,
)
from firebase_client import (
    initialize_firebase,
    fetch_trails,
    fetch_users,
    fetch_completed_trail_ids,
    save_user_recommendations,
    save_user_profile,
    fetch_user_reviews,
    fetch_user_monthly_recommendation,
    get_current_month_id,
    get_previous_month_id,
)
from gemini_reasoning import generate_gemini_reasoning

logger = logging.getLogger("tharesys_engine")


def run_batch_recommendations(
    cbf_engine: Union[str, Callable] = "GD",
    cf_engine: Union[str, Callable] = "GD",
    month_id: Optional[str] = None,
    candidate_trails: Optional[List[Dict[str, Any]]] = None,
    users: Optional[List[Dict[str, Any]]] = None,
    user_hikes_map: Optional[Dict[str, set]] = None,
    user_reviews_map: Optional[Dict[str, List[Dict[str, Any]]]] = None,
    prev_recommendations_map: Optional[Dict[str, Dict[str, Any]]] = None,
    commit_to_firestore: bool = True,
    feature_weights: Optional[Dict[str, float]] = None,
    generate_ai_reasoning: bool = True,
    update_profiles_from_reviews: bool = True
) -> Dict[str, Any]:
    """
    Executes a full recommendation batch run.

    Disjoint Partitioning Strategy:
        - For every candidate trail, computes R_tu distance for both Easy and Difficult anchor vectors.
        - Compares scores: if easy_score <= diff_score -> assigned strictly to 'easy'; else -> 'difficult'.
        - Guarantees zero duplicates between 'easy' and 'difficult' arrays.
        - If no trails match the user's easy capability, 'easy' is preserved as empty [] (no category forcing).

    Parameters:
        cbf_engine: Formula for CBF ('GD', 'ED', 'CS')
        cf_engine:  Formula for CF ('GD', 'ED', 'CS')
        month_id:   Calendar month string in YYYY-MM format (defaults to current month)
        candidate_trails: Optional pre-loaded list of trail documents
        users:            Optional pre-loaded list of user documents
        user_hikes_map:   Optional mapping of userId -> set of completed trail IDs (for tests/overrides)
        commit_to_firestore: Whether to save monthly documents directly to Firestore
        feature_weights:  Optional custom importance weights dictionary for the 32 canonical features
        generate_ai_reasoning: Whether to synthesize Gemini reasoning for top #1 recommendation

    Returns:
        Dict[str, Any]: Execution report including user counts, alpha, and sample recommendations
    """
    active_month = month_id or get_current_month_id()
    logger.info(f"Starting THARESYS batch run for month '{active_month}' using CBF={cbf_engine}, CF={cf_engine}")

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

    # Filter users strictly to those with a saved 'profile' object (excludes accounts without a profile property)
    user_list = []
    for u in (raw_user_list or []):
        uid = str(u.get("id") or "")
        prof = u.get("profile")
        if not prof or not isinstance(prof, dict):
            logger.info(f"Skipping user {uid}: no profile property found.")
            continue
        has_easy = bool(prof.get("easy") and isinstance(prof.get("easy"), dict) and prof.get("easy", {}).get("features"))
        has_diff = bool(prof.get("difficult") and isinstance(prof.get("difficult"), dict) and prof.get("difficult", {}).get("features"))
        if has_easy or has_diff:
            user_list.append(u)
        else:
            logger.info(f"Skipping user {uid}: profile property exists but has no easy or difficult features.")

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
    trail_by_id = {str(t.get("id") or ""): t for t in trail_list}
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
    # 3. Compute dynamic alpha and prepare peer vectors for CF
    user_count = len(user_list)
    alpha = compute_alpha(user_count)

    # Resolve 32-element feature weight vector
    weight_vector = build_feature_weight_vector(feature_weights)

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

        # 4a. Batch Profile Update: Collect and process user's past hike reviews from previous cycle
        if update_profiles_from_reviews and (db or user_reviews_map is not None):
            prev_month = get_previous_month_id(active_month)
            if prev_recommendations_map is not None:
                prev_reco = prev_recommendations_map.get(uid)
            elif db:
                prev_reco = fetch_user_monthly_recommendation(uid, prev_month, db=db)
            else:
                prev_reco = None

            if not prev_reco:
                logger.info(f"User {uid} has no previous recommendation list from {prev_month}; proceeding with baseline profile anchors.")

            if user_reviews_map is not None:
                user_reviews = user_reviews_map.get(uid, [])
            elif db:
                user_reviews = fetch_user_reviews(uid, db=db)
            else:
                user_reviews = []

            hike_feedbacks = []
            for r in user_reviews:
                tid = str(r.get("trail", {}).get("id") or r.get("trailId") or "")
                if not tid or tid in ("diy", "diy_session"):
                    continue

                r_dt = r.get("createdAt") or r.get("hikeDate")
                r_month = None
                if hasattr(r_dt, "strftime"):
                    r_month = r_dt.strftime("%Y-%m")
                elif isinstance(r_dt, str) and len(r_dt) >= 7:
                    r_month = r_dt[:7]
                elif isinstance(r_dt, (int, float)):
                    ts = r_dt / 1000.0 if r_dt > 1e11 else float(r_dt)
                    r_month = datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m")

                # Ensure review belongs to the previous month
                if r_month and r_month != prev_month:
                    continue

                matched_trail = trail_by_id.get(tid, {})
                trail_feats = matched_trail.get("profile", {}).get("features", matched_trail.get("features", {}))

                predicted_cat = None
                rtu_score = None
                if prev_reco:
                    in_diff = next((it for it in prev_reco.get("difficult", []) if str(it.get("id")) == tid), None)
                    in_easy = next((it for it in prev_reco.get("easy", []) if str(it.get("id")) == tid), None)
                    if in_diff:
                        predicted_cat = "difficult"
                        rtu_score = float(in_diff.get("score") or in_diff.get("cbfScore") or 0.35)
                    elif in_easy:
                        predicted_cat = "easy"
                        rtu_score = float(in_easy.get("score") or in_easy.get("cbfScore") or 0.35)

                # Fallback to computing Euclidean distance against current anchors if unrecommended or no prev_reco
                if predicted_cat is None:
                    tvec = matched_trail.get("vector") if "vector" in matched_trail else flatten_profile_features(trail_feats)
                    d_easy = float(np.linalg.norm(tvec - easy_vec))
                    d_diff = float(np.linalg.norm(tvec - diff_vec))
                    if d_diff < d_easy:
                        predicted_cat = "difficult"
                        rtu_score = round(min(1.0, d_diff / np.sqrt(32)), 4)
                    else:
                        predicted_cat = "easy"
                        rtu_score = round(min(1.0, d_easy / np.sqrt(32)), 4)

                raw_choice = r.get("perceivedDifficulty")
                if isinstance(raw_choice, (int, float)):
                    # 1: Easy, 2: Just Right, 3: Moderate, 4: Difficult/Hard, 5: Extreme
                    is_user_easy = (raw_choice <= 2)
                else:
                    choice_str = str(raw_choice or "easy").strip().lower()
                    is_user_easy = choice_str in ("easy", "just right", "1", "2")

                is_match = is_user_easy if (predicted_cat == "easy") else (not is_user_easy)

                hike_factors = r.get("difficultyFactors") or []
                hike_weights = resolve_review_factor_weights(hike_factors, trail_features=trail_feats)

                hike_feedbacks.append({
                    "trail_id": tid,
                    "trail_features": trail_feats,
                    "score": rtu_score,
                    "is_match": is_match,
                    "target_anchor": predicted_cat,
                    "feature_weights": hike_weights
                })

            if hike_feedbacks:
                logger.info(f"Applying batched monthly profile update for user {uid} using {len(hike_feedbacks)} reviews")
                update_res = process_dual_anchor_profile_update(
                    current_easy_profile=raw_easy,
                    current_diff_profile=raw_diff,
                    hike_records=hike_feedbacks,
                    weights_map=feature_weights
                )
                if commit_to_firestore and db:
                    formatted_profiles = {
                        "easy": {"metadata": {"type": "user", "id": uid, "profile": "easy"}, "features": update_res["updated_easy_features"]},
                        "difficult": {"metadata": {"type": "user", "id": uid, "profile": "difficult"}, "features": update_res["updated_diff_features"]}
                    }
                    save_user_profile(uid, formatted_profiles, db=db)

                # Use the updated anchor profiles to calculate the new recommendations
                easy_vec = np.array(update_res["updated_easy_vector"], dtype=np.float32)
                diff_vec = np.array(update_res["updated_diff_vector"], dtype=np.float32)
                raw_easy = {"features": update_res["updated_easy_features"]}
                raw_diff = {"features": update_res["updated_diff_features"]}

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
                peer_profiles=other_peers if other_peers else None,
                weights=weight_vector
            )

            # Calculate Difficult Score & breakdown
            res_diff = engine_details(
                cbf_engine=cbf_engine,
                cf_engine=cf_engine,
                array_1=diff_vec,
                array_2=tvec,
                a=alpha,
                peer_profiles=other_peers if other_peers else None,
                weights=weight_vector
            )

            easy_score = round(float(res_easy["score"]), 4)
            diff_score = round(float(res_diff["score"]), 4)

            # Disjoint partitioning: assign trail exclusively to whichever profile it is closer to (lower distance)
            # If scores tie, assign to easy as a safe default.
            # If no trails are easy for a user, easy_items remains empty as-is (safety first).
            if easy_score <= diff_score:
                easy_items.append({
                    "id": tid,
                    "trailName": tname,
                    "category": "easy",
                    "haveHiked": have_hiked,
                    "score": easy_score,
                    "easyScore": easy_score,
                    "diffScore": diff_score,
                    "cbfScore": round(float(res_easy["cbf"]), 4),
                    "cfScore": round(float(res_easy["cf"]), 4),
                })
            else:
                diff_items.append({
                    "id": tid,
                    "trailName": tname,
                    "category": "difficult",
                    "haveHiked": have_hiked,
                    "score": diff_score,
                    "easyScore": easy_score,
                    "diffScore": diff_score,
                    "cbfScore": round(float(res_diff["cbf"]), 4),
                    "cfScore": round(float(res_diff["cf"]), 4),
                })

        # Sort each list ascending by score (0.0 = closest match / highest recommendation)
        easy_items.sort(key=lambda x: x["score"])
        diff_items.sort(key=lambda x: x["score"])

        # Generate Gemini AI reasoning for the top #1 recommendation
        # If easy trails exist -> Trail of the Month (top easy)
        # If no easy trails exist -> Challenge of the Month (nearest difficult trail to the easy profile)
        ai_reasonings = {}
        if generate_ai_reasoning and (easy_items or diff_items):
            if easy_items:
                top_item = easy_items[0]
                top_profile = raw_easy
                is_challenge = False
            else:
                # Select the nearest difficult trail to the easy profile (lowest easyScore)
                top_item = min(diff_items, key=lambda x: x.get("easyScore", x["score"]))
                top_item["isChallengeOfMonth"] = True
                top_profile = raw_easy  # Use easy profile baseline so reasoning compares distance to baseline
                is_challenge = True

            top_trail_doc = trail_by_id.get(top_item["id"])
            try:
                reasoning = generate_gemini_reasoning(
                    trail=top_trail_doc,
                    reco_item=top_item,
                    user=user,
                    user_profile=top_profile,
                    month_label=active_month,
                    is_challenge=is_challenge
                )
                ai_reasonings[top_item["id"]] = reasoning
            except Exception as e:
                logger.warning(f"Failed to generate Gemini reasoning for user {uid}: {e}")

        # Construct monthly recommendation document matching required schema
        doc_data = {
            "id": active_month,
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "updatedAt": datetime.now(timezone.utc).isoformat(),
            "engineConfig": {
                "cbf": str(cbf_engine),
                "cf": str(cf_engine),
                "alpha": round(alpha, 4),
                "userCount": user_count,
                "featureWeights": feature_weights if feature_weights else "default"
            },
            "profile": {
                "easy": raw_easy,
                "difficult": raw_diff
            },
            "easy": easy_items,
            "difficult": diff_items,
            "aiReasonings": ai_reasonings
        }

        # Commit to Firestore if enabled
        if commit_to_firestore and db:
            save_user_recommendations(uid, active_month, doc_data, db)

        processed_count += 1

        if len(sample_outputs) < 2:
            sample_outputs.append({
                "userId": uid,
                "easy_count": len(easy_items),
                "difficult_count": len(diff_items),
                "top_easy": easy_items[:3],
                "top_difficult": diff_items[:2]
            })

    logger.info(f"THARESYS batch run completed: {processed_count} users processed across {len(prepared_trails)} trails.")

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
