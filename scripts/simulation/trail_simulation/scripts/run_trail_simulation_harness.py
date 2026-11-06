"""
THARESYS Trail Simulation Harness (`run_trail_simulation_harness.py`).

Runs the multi-cycle recommendation simulation for the Trail Simulation module:
  - Idealistic 40-trail scaling run (Seed 42 / Seed 7)
  - Realistic 8-trail run under 40-trail re-normalized coordinate space
  - Evaluates Adaptive Arm vs Control Arm across cohorts
  - Tracks convergence against Ground Truth anchors
  - Outputs harness_results.json, simulatedUsers.json, and convergence_summary.csv
"""

import argparse
import copy
import csv
import json
import os
import sys
from datetime import datetime, timezone
from typing import Any, Dict, List, Set, Tuple
import numpy as np

MODULE_DIR = os.path.dirname(os.path.abspath(__file__))
SIM_MODULE_DIR = os.path.abspath(os.path.join(MODULE_DIR, ".."))
SIM_DIR = os.path.abspath(os.path.join(SIM_MODULE_DIR, ".."))
ROOT = os.path.abspath(os.path.join(SIM_DIR, "..", ".."))
ENGINE_DIR = os.path.join(ROOT, "engine")

if ENGINE_DIR not in sys.path:
    sys.path.insert(0, ENGINE_DIR)

import firebase_client
firebase_client.initialize_firebase = lambda: None

from batch_runner import run_batch_recommendations
from formula import gower_distance, euclidean_distance, cosine_distance
from profile_utils import flatten_profile_features, resolve_review_factor_weights

INPUTS_DIR = os.path.join(SIM_MODULE_DIR, "inputs")
COVERED_FEATURES = [
    {"key": "classification", "index": 0},
    {"key": "length", "index": 1},
    {"key": "elevation", "index": 2},
    {"key": "gain", "index": 3},
    {"key": "slope", "index": 4},
    {"key": "easy", "index": 5},
    {"key": "muddy", "index": 11},
    {"key": "rocky", "index": 12},
    {"key": "grassland", "index": 13},
    {"key": "ridges", "index": 14},
]
PHYSICAL_KEYS = ["length", "elevation", "gain", "slope", "easy"]
TERRAIN_KEYS = ["muddy", "rocky", "grassland", "ridges"]


def extract_covered_vector_from_dict(feat_dict: Dict[str, Any]) -> np.ndarray:
    vals = []
    for f in COVERED_FEATURES:
        k = f["key"]
        v = feat_dict.get(k)
        if v is None and "terrain" in feat_dict and isinstance(feat_dict["terrain"], dict):
            v = feat_dict["terrain"].get(k, 0.0)
        vals.append(float(v if v is not None else 0.0))
    return np.array(vals, dtype=np.float32)


def extract_covered_vector_from_32d(vec_32: np.ndarray) -> np.ndarray:
    return np.array([float(vec_32[f["index"]]) for f in COVERED_FEATURES], dtype=np.float32)


def compute_vector_distances(vec_a: np.ndarray, vec_b: np.ndarray) -> Dict[str, float]:
    gd = float(gower_distance(vec_a, vec_b))
    ed = float(euclidean_distance(vec_a, vec_b))
    cs = float(cosine_distance(vec_a, vec_b))
    return {"gd": round(gd, 4), "ed": round(ed, 4), "cs": round(cs, 4)}


def determine_simulated_review(
    trail_doc: Dict[str, Any],
    target_anchor: str,
    gt_easy_vec: np.ndarray,
    gt_diff_vec: np.ndarray,
    trail_covered_vec: np.ndarray,
    active_month: str
) -> Dict[str, Any]:
    """
    Simulates hiker review based on their latent physical Ground Truth envelope.
    - If recommended Easy, and trail physical demands exceed GT Easy limit -> Difficult (Mismatch).
    - If recommended Difficult, and trail is appropriate challenge -> Difficult (Match).
    - Active review factors reflect the primary physical features that determined the experience.
    """
    trail_feats = {f["key"]: float(trail_covered_vec[i]) for i, f in enumerate(COVERED_FEATURES)}
    easy_gt_feats = {f["key"]: float(gt_easy_vec[i]) for i, f in enumerate(COVERED_FEATURES)}
    diff_gt_feats = {f["key"]: float(gt_diff_vec[i]) for i, f in enumerate(COVERED_FEATURES)}
    
    selected_phrases = []
    
    phrase_map = {
        "slope": "The trail was too steep",
        "length": "The distance was quite long",
        "elevation": "High altitude breathing effort",
        "gain": "Demanding uphill climb",
        "rocky": "Rocky terrain required caution",
        "muddy": "Muddy trail conditions",
        "grassland": "Exposed grassland paths",
        "ridges": "Challenging ridge crossings"
    }

    if target_anchor == "easy":
        # Check if any physical metric noticeably exceeded the hiker's comfortable baseline
        excesses = []
        for k in ["length", "gain", "slope", "elevation"]:
            diff = trail_feats[k] - easy_gt_feats[k]
            if diff > 0.06:
                excesses.append((k, diff))
        
        if excesses:
            # Mismatch: trail was too demanding for an easy hike
            perceived_difficulty = "Difficult"
            excesses.sort(key=lambda x: x[1], reverse=True)
            for k, _ in excesses:
                selected_phrases.append(phrase_map[k])
        else:
            # Match: comfortable easy hike
            perceived_difficulty = "Easy"
            selected_phrases.append("Comfortable pace and manageable incline")
            
    else: # target_anchor == "difficult"
        phys_dist_easy = float(np.mean([abs(trail_feats[k] - easy_gt_feats[k]) for k in ["length", "gain", "slope", "elevation"]]))
        phys_dist_diff = float(np.mean([abs(trail_feats[k] - diff_gt_feats[k]) for k in ["length", "gain", "slope", "elevation"]]))
        
        # If trail is much closer to easy than difficult, it lacked the desired challenge
        if phys_dist_easy + 0.15 < phys_dist_diff:
            perceived_difficulty = "Easy" # Underwhelming mismatch
            diffs = [(k, diff_gt_feats[k] - trail_feats[k]) for k in ["length", "gain", "slope", "elevation"]]
            diffs.sort(key=lambda x: x[1], reverse=True)
            selected_phrases.append(phrase_map[diffs[0][0]])
        else:
            perceived_difficulty = "Difficult" # Appropriate challenge (Match)
            chal = [(k, trail_feats[k]) for k in ["length", "gain", "slope", "elevation"]]
            chal.sort(key=lambda x: x[1], reverse=True)
            for k, _ in chal[:2]:
                selected_phrases.append(phrase_map[k])

    created_at = f"{active_month}-15T10:00:00Z"
    
    return {
        "id": f"rev_{trail_doc['id']}_{active_month}",
        "trail": {"id": trail_doc["id"], "name": trail_doc.get("general", {}).get("name", "Trail")},
        "trailId": trail_doc["id"],
        "trailName": trail_doc.get("general", {}).get("name", "Trail"),
        "perceivedDifficulty": perceived_difficulty,
        "difficultyFactors": selected_phrases,
        "feedback": selected_phrases,
        "activeMonth": active_month,
        "createdAt": created_at,
    }


def run_simulation(
    candidate_trails: List[Dict[str, Any]],
    users_master: List[Dict[str, Any]],
    users_spec: List[Dict[str, Any]],
    cycles: int = 10,
    cbf_engine: str = "GD",
    cf_engine: str = "GD",
) -> Tuple[Dict[str, Any], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Executes the simulation run across all cohorts for T cycles."""
    user_spec_map = {u["id"]: u for u in users_spec}
    trail_by_id = {t["id"]: t for t in candidate_trails}
    trail_covered_vectors = {
        t["id"]: extract_covered_vector_from_32d(flatten_profile_features(t.get("profile", t)))
        for t in candidate_trails
    }

    # Generate active months: 2026-10 to 2026-10 + cycles
    months: List[str] = []
    base_year, base_month = 2026, 10
    for m in range(cycles + 1):
        cur_m = base_month + m
        cur_y = base_year + (cur_m - 1) // 12
        cur_m_norm = ((cur_m - 1) % 12) + 1
        months.append(f"{cur_y:04d}-{cur_m_norm:02d}")

    # Track both arms
    arms_data: Dict[str, Any] = {}
    csv_rows: List[Dict[str, Any]] = []

    for arm_name, is_adaptive in [("adaptive", True), ("control", False)]:
        arm_users = copy.deepcopy(users_master)
        user_hikes_map = {
            u["id"]: set(str(tid) for tid in user_spec_map.get(u["id"], {}).get("expected_trail_ids", []))
            for u in arm_users
        }
        user_hike_history = {
            u["id"]: list(str(tid) for tid in user_spec_map.get(u["id"], {}).get("expected_trail_ids", []))
            for u in arm_users
        }
        user_reviews_map: Dict[str, List[Dict[str, Any]]] = {u["id"]: [] for u in arm_users}
        prev_recommendations_map: Dict[str, Dict[str, Any]] = {}
        user_cycle_telemetry: Dict[str, List[Dict[str, Any]]] = {u["id"]: [] for u in arm_users}

        for cycle_idx, active_month in enumerate(months):
            batch_res = run_batch_recommendations(
                cbf_engine=cbf_engine,
                cf_engine=cf_engine,
                month_id=active_month,
                candidate_trails=candidate_trails,
                users=arm_users,
                user_hikes_map=user_hikes_map,
                user_reviews_map=user_reviews_map,
                prev_recommendations_map=prev_recommendations_map,
                commit_to_firestore=False,
                generate_ai_reasoning=False,
                update_profiles_from_reviews=is_adaptive,
            )
            recomms = batch_res.get("recommendations", {})
            cycle_reviews_this_month: Dict[str, List[Dict[str, Any]]] = {u["id"]: [] for u in arm_users}

            for u in arm_users:
                uid = u["id"]
                u_doc = recomms.get(uid, {})
                u_prof = u_doc.get("profile", u.get("profile", {}))

                app_easy_vec = extract_covered_vector_from_dict(u_prof.get("easy", {}).get("features", {}))
                app_diff_vec = extract_covered_vector_from_dict(u_prof.get("difficult", {}).get("features", {}))
                gt_easy_vec = extract_covered_vector_from_dict(u["groundTruth"]["easy"])
                gt_diff_vec = extract_covered_vector_from_dict(u["groundTruth"]["difficult"])

                easy_dist = compute_vector_distances(app_easy_vec, gt_easy_vec)
                diff_dist = compute_vector_distances(app_diff_vec, gt_diff_vec)
                mean_dist = {
                    "mean_gd": round((easy_dist["gd"] + diff_dist["gd"]) / 2.0, 4),
                    "mean_ed": round((easy_dist["ed"] + diff_dist["ed"]) / 2.0, 4),
                    "mean_cs": round((easy_dist["cs"] + diff_dist["cs"]) / 2.0, 4),
                }

                easy_recs = u_doc.get("easy", [])
                diff_recs = u_doc.get("difficult", [])

                # Pick trail to hike
                picked_item = None
                target_slot = "easy"
                if cycle_idx < cycles:
                    unhiked_easy = [r for r in easy_recs if str(r.get("id")) not in user_hikes_map[uid]]
                    unhiked_diff = [r for r in diff_recs if str(r.get("id")) not in user_hikes_map[uid]]
                    exp = u.get("experience", "E1")

                    def pick_least_recent(pool):
                        history = user_hike_history.get(uid, [])
                        def last_hike_index(item):
                            tid = str(item.get("id"))
                            try:
                                return len(history) - 1 - history[::-1].index(tid)
                            except ValueError:
                                return -1
                        return min(pool, key=last_hike_index) if pool else None

                    if exp == "E1":
                        # Beginners / Medical: Pure easy baseline hikes (protecting vulnerable beginners)
                        target_slot = "easy"
                        if unhiked_easy:
                            picked_item = unhiked_easy[0]
                        else:
                            picked_item = pick_least_recent(easy_recs if easy_recs else diff_recs)
                    elif exp == "E2":
                        # Intermediate: Primarily easy, with challenge hike every after 2 hikes (Cycles 2, 5, 8...)
                        wants_challenge = ((cycle_idx + 1) % 3 == 0)
                        if wants_challenge:
                            target_slot = "difficult"
                            picked_item = unhiked_diff[0] if unhiked_diff else pick_least_recent(diff_recs if diff_recs else easy_recs)
                        else:
                            target_slot = "easy"
                            picked_item = unhiked_easy[0] if unhiked_easy else pick_least_recent(easy_recs if easy_recs else diff_recs)
                    else:
                        # Advanced / Expert (E3, E4): Primarily difficult hikes, with recovery hike every after 2 hikes (Cycles 2, 5, 8...)
                        wants_recovery = ((cycle_idx + 1) % 3 == 0)
                        if wants_recovery:
                            target_slot = "easy"
                            picked_item = unhiked_easy[0] if unhiked_easy else pick_least_recent(easy_recs if easy_recs else diff_recs)
                        else:
                            target_slot = "difficult"
                            picked_item = unhiked_diff[0] if unhiked_diff else pick_least_recent(diff_recs if diff_recs else easy_recs)

                    if picked_item:
                        picked_tid = str(picked_item.get("id"))
                        user_hikes_map[uid].add(picked_tid)
                        user_hike_history[uid].append(picked_tid)

                        rev = determine_simulated_review(
                            trail_doc=trail_by_id[picked_tid],
                            target_anchor=target_slot,
                            gt_easy_vec=gt_easy_vec,
                            gt_diff_vec=gt_diff_vec,
                            trail_covered_vec=trail_covered_vectors[picked_tid],
                            active_month=active_month,
                        )
                        is_match = (
                            rev["perceivedDifficulty"].lower() == "easy"
                            if target_slot == "easy"
                            else rev["perceivedDifficulty"].lower() == "difficult"
                        )
                        rev["isMatch"] = is_match
                        rev["targetSlot"] = target_slot
                        cycle_reviews_this_month[uid].append(rev)

                # Compute alignment rate
                total_recs = len(easy_recs) + len(diff_recs)
                aligned_count = 0
                for r in easy_recs:
                    t_vec = trail_covered_vectors.get(str(r.get("id")))
                    if t_vec is not None and max(t_vec[i] - gt_easy_vec[i] for i in [1, 2, 3, 4, 5]) <= 0.08:
                        aligned_count += 1
                for r in diff_recs:
                    t_vec = trail_covered_vectors.get(str(r.get("id")))
                    if t_vec is not None and max(t_vec[i] - gt_diff_vec[i] for i in [1, 2, 3, 4, 5]) <= 0.12:
                        aligned_count += 1
                alignment_rate = round(aligned_count / max(1, total_recs), 4)

                picked_hike_info = None
                if picked_item and cycle_reviews_this_month[uid]:
                    p_id = str(picked_item.get("id"))
                    p_name = picked_item.get("trailName") or trail_by_id.get(p_id, {}).get("general", {}).get("name") or p_id
                    hike_rev = cycle_reviews_this_month[uid][0]
                    picked_hike_info = {
                        "id": p_id,
                        "trailName": p_name,
                        "score": picked_item.get("score"),
                        "targetSlot": hike_rev.get("targetSlot", target_slot),
                        "isMatch": hike_rev.get("isMatch", True),
                    }

                user_cycle_telemetry[uid].append({
                    "cycle": cycle_idx,
                    "month": active_month,
                    "profile": copy.deepcopy(u_prof),
                    "profile_snapshot": copy.deepcopy(u_prof),
                    "distances": {
                        "easy": easy_dist,
                        "difficult": diff_dist,
                        "diff": diff_dist,
                        **mean_dist,
                    },
                    "rec_alignment_rate": alignment_rate,
                    "recommendations": {
                        "easy": [{"id": it.get("id"), "trailName": it.get("trailName") or it.get("name"), "score": it.get("score")} for it in easy_recs[:3]],
                        "difficult": [{"id": it.get("id"), "trailName": it.get("trailName") or it.get("name"), "score": it.get("score")} for it in diff_recs[:2]],
                    },
                    "hiked": picked_hike_info,
                    "hike": picked_hike_info.get("id") if picked_hike_info else None,
                    "review": cycle_reviews_this_month[uid][0] if cycle_reviews_this_month[uid] else None,
                })

                if is_adaptive and u_doc.get("profile"):
                    u["profile"] = u_doc["profile"]

            prev_recommendations_map = recomms
            for uid, rev_list in cycle_reviews_this_month.items():
                user_reviews_map[uid].extend(rev_list)

        arms_data[arm_name] = {
            "users": arm_users,
            "user_telemetry": user_cycle_telemetry,
        }

    # Build simulatedUsers bundle for Adaptive Arm
    adapt_tele = arms_data["adaptive"]["user_telemetry"]
    ctrl_tele = arms_data["control"]["user_telemetry"]
    final_users_bundle: List[Dict[str, Any]] = []

    converged_count = 0
    total_delta_gd = 0.0

    for u in users_master:
        uid = u["id"]
        exp = u["experience"]
        med = u["medical"]

        u_adapt = adapt_tele[uid]
        u_ctrl = ctrl_tele[uid]

        start_gd = u_adapt[0]["distances"]["mean_gd"]
        adapt_end_gd = u_adapt[-1]["distances"]["mean_gd"]
        ctrl_end_gd = u_ctrl[-1]["distances"]["mean_gd"]
        delta_gd = round(adapt_end_gd - start_gd, 4)
        has_converged = delta_gd < 0

        if has_converged:
            converged_count += 1
        total_delta_gd += delta_gd

        u_entry = copy.deepcopy(u)
        u_entry["cycleHistory"] = copy.deepcopy(u_adapt)
        u_entry["convergence"] = {
            "start_gd": start_gd,
            "end_gd": adapt_end_gd,
            "ctrl_end_gd": ctrl_end_gd,
            "delta_gd": delta_gd,
            "has_converged": has_converged,
        }
        # Update current profile to end state
        u_entry["profile"] = copy.deepcopy(u_adapt[-1]["profile_snapshot"])
        final_users_bundle.append(u_entry)

        for c_idx in range(len(months)):
            csv_rows.append({
                "user_id": uid,
                "experience": exp,
                "medical": med,
                "cycle": c_idx,
                "month": months[c_idx],
                "adaptive_mean_gd": u_adapt[c_idx]["distances"]["mean_gd"],
                "adaptive_mean_ed": u_adapt[c_idx]["distances"]["mean_ed"],
                "adaptive_mean_cs": u_adapt[c_idx]["distances"]["mean_cs"],
                "adaptive_rec_alignment": u_adapt[c_idx]["rec_alignment_rate"],
                "control_mean_gd": u_ctrl[c_idx]["distances"]["mean_gd"],
                "control_mean_ed": u_ctrl[c_idx]["distances"]["mean_ed"],
                "control_mean_cs": u_ctrl[c_idx]["distances"]["mean_cs"],
            })

    convergence_rate = round(converged_count / len(users_master), 4)
    mean_delta_gd = round(total_delta_gd / len(users_master), 4)

    harness_results = {
        "simulation_type": "trail_simulation",
        "trail_count": len(candidate_trails),
        "cycles": cycles,
        "months": months,
        "cbf_engine": cbf_engine,
        "cf_engine": cf_engine,
        "executed_at": datetime.now(timezone.utc).isoformat(),
        "total_users": len(users_master),
        "convergence_rate": convergence_rate,
        "mean_delta_gd": mean_delta_gd,
        "arms": {
            "adaptive": {"user_telemetry": adapt_tele},
            "control": {"user_telemetry": ctrl_tele},
        },
    }

    return harness_results, final_users_bundle, csv_rows


def main() -> None:
    parser = argparse.ArgumentParser(description="THARESYS Trail Simulation Harness")
    parser.add_argument("--catalog", default="catalog_seed42.json", help="Catalog filename in inputs/")
    parser.add_argument("--cycles", type=int, default=12, help="Number of monthly cycles (default 12 / 1 Full Year)")
    parser.add_argument("--out", default=None, help="Output directory")

    args = parser.parse_args()

    trails_path = os.path.join(INPUTS_DIR, args.catalog)
    with open(trails_path, "r", encoding="utf-8") as f:
        t_data = json.load(f)
    candidate_trails = t_data.get("trails", t_data)

    with open(os.path.join(INPUTS_DIR, "users_40trails.json"), "r", encoding="utf-8") as f:
        users_master = json.load(f)
    with open(os.path.join(INPUTS_DIR, "users_spec.json"), "r", encoding="utf-8") as f:
        users_spec = json.load(f)

    harness_res, users_bundle, csv_rows = run_simulation(
        candidate_trails=candidate_trails,
        users_master=users_master,
        users_spec=users_spec,
        cycles=args.cycles,
    )

    print(f"Simulation completed: trails={len(candidate_trails)}, cycles={args.cycles}")
    print(f"Convergence Rate: {harness_res['convergence_rate'] * 100:.2f}%")
    print(f"Mean Delta GD: {harness_res['mean_delta_gd']}")

    if args.out:
        os.makedirs(args.out, exist_ok=True)
        with open(os.path.join(args.out, "harness_results.json"), "w", encoding="utf-8", newline="\n") as f:
            json.dump(harness_res, f, indent=2)
        with open(os.path.join(args.out, "simulatedUsers.json"), "w", encoding="utf-8", newline="\n") as f:
            json.dump(users_bundle, f, indent=2)
        with open(os.path.join(args.out, "convergence_summary.csv"), "w", encoding="utf-8", newline="\n") as f:
            writer = csv.DictWriter(f, fieldnames=list(csv_rows[0].keys()))
            writer.writeheader()
            writer.writerows(csv_rows)
        print(f"Artifacts saved to {args.out}")


if __name__ == "__main__":
    main()

