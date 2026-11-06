"""
Step 1: In-Memory Recommendation Simulation Test Harness.

Executes multi-cycle batch recommendation rounds across the 24 simulated users and 8 trails:
  - Fully in-memory: no Firestore reads or writes (commit_to_firestore=False, mocked initialize_firebase).
  - Ticked survey trails are pre-seeded in user_hikes_map (Decision D5).
  - Evaluates both Adaptive Arm (profile updates from reviews) and Control Arm (static profiles).
  - Evaluates recommendation matching against user Ground Truth anchors (slot alignment and proximity).
  - Computes convergence trajectory across T cycles (GD, ED, CS distance reduction).
  - Emits full cycle-by-cycle updated profiles to simulatedUsers.json and simulationHarnessResults.json.

Usage:
  engine/venv/Scripts/python.exe scripts/simulation/run_simulation_harness.py [--cycles 3] [--cbf GD] [--cf GD]
"""

import os
import sys
import json
import csv
import copy
import argparse
from datetime import datetime, timezone
from typing import Dict, Any, List, Set, Tuple
import numpy as np

# Ensure engine path is available
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ENGINE_DIR = os.path.join(ROOT, "engine")
sys.path.insert(0, ENGINE_DIR)

# Mock firebase initialization to guarantee 100% in-memory execution
import firebase_client
firebase_client.initialize_firebase = lambda: None

from batch_runner import run_batch_recommendations
from formula import gower_distance, euclidean_distance, cosine_distance
from profile_utils import flatten_profile_features, resolve_review_factor_weights

HERE = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(HERE, "output")
TRAILS_PATH = os.path.join(OUTPUT_DIR, "trails.json")
USERS_PATH = os.path.join(OUTPUT_DIR, "users.json")
USERS_SPEC_PATH = os.path.join(OUTPUT_DIR, "users_spec.json")
APP_DATA_SIMULATED_USERS = os.path.join(ROOT, "src", "recommendation", "data", "simulatedUsers.json")
APP_DATA_HARNESS_RESULTS = os.path.join(ROOT, "src", "recommendation", "data", "simulationHarnessResults.json")

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
    """Builds a 10-element vector from a ground truth or app feature dict."""
    vals = []
    for f in COVERED_FEATURES:
        k = f["key"]
        v = feat_dict.get(k)
        if v is None and "terrain" in feat_dict and isinstance(feat_dict["terrain"], dict):
            v = feat_dict["terrain"].get(k, 0.0)
        vals.append(float(v if v is not None else 0.0))
    return np.array(vals, dtype=np.float32)


def extract_covered_vector_from_32d(vec_32: np.ndarray) -> np.ndarray:
    """Extracts the 10 covered features from a canonical 32-element vector."""
    return np.array([float(vec_32[f["index"]]) for f in COVERED_FEATURES], dtype=np.float32)


def compute_vector_distances(vec_a: np.ndarray, vec_b: np.ndarray) -> Dict[str, float]:
    """Computes GD, ED, and CS distances between two 10-element vectors."""
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
    primary_key = "slope"
    
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
            primary_key = excesses[0][0]
            for k, _ in excesses:
                selected_phrases.append(phrase_map[k])
        else:
            # Match: comfortable easy hike
            perceived_difficulty = "Easy"
            diffs = [(k, abs(trail_feats[k] - easy_gt_feats[k])) for k in ["length", "gain", "slope", "elevation"]]
            diffs.sort(key=lambda x: x[1])
            primary_key = diffs[0][0]
            selected_phrases.append(phrase_map[primary_key])
            
    else: # target_anchor == "difficult"
        phys_dist_easy = float(np.mean([abs(trail_feats[k] - easy_gt_feats[k]) for k in ["length", "gain", "slope", "elevation"]]))
        phys_dist_diff = float(np.mean([abs(trail_feats[k] - diff_gt_feats[k]) for k in ["length", "gain", "slope", "elevation"]]))
        
        # If trail is much closer to easy than difficult, it lacked the desired challenge
        if phys_dist_easy + 0.15 < phys_dist_diff:
            perceived_difficulty = "Easy" # Underwhelming mismatch
            diffs = [(k, diff_gt_feats[k] - trail_feats[k]) for k in ["length", "gain", "slope", "elevation"]]
            diffs.sort(key=lambda x: x[1], reverse=True)
            primary_key = diffs[0][0]
            selected_phrases.append(phrase_map[primary_key])
        else:
            perceived_difficulty = "Difficult" # Appropriate challenge (Match)
            chal = [(k, trail_feats[k]) for k in ["length", "gain", "slope", "elevation"]]
            chal.sort(key=lambda x: x[1], reverse=True)
            primary_key = chal[0][0]
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
        "primaryFactorKey": primary_key,
        "targetAnchor": target_anchor,
        "createdAt": created_at
    }


def run_harness(cycles: int = 5, cbf_engine: str = "GD", cf_engine: str = "GD") -> Dict[str, Any]:
    print("=" * 80)
    print(f"THARESYS IN-MEMORY SIMULATION HARNESS: {cycles} CYCLES (CBF={cbf_engine}, CF={cf_engine})")
    print("=" * 80)
    
    with open(TRAILS_PATH, "r", encoding="utf-8") as f:
        trails = json.load(f)
    with open(USERS_PATH, "r", encoding="utf-8") as f:
        users_master = json.load(f)
    with open(USERS_SPEC_PATH, "r", encoding="utf-8") as f:
        users_spec = json.load(f)
        
    user_spec_map = {u["id"]: u for u in users_spec}
    trail_by_id = {t["id"]: t for t in trails}
    
    trail_covered_vectors = {}
    for t in trails:
        t_vec32 = flatten_profile_features(t.get("profile", t))
        trail_covered_vectors[t["id"]] = extract_covered_vector_from_32d(t_vec32)
        
    base_year = 2026
    base_month = 10
    months = []
    for m in range(cycles + 1):
        cur_m = base_month + m
        cur_y = base_year + (cur_m - 1) // 12
        cur_m_norm = ((cur_m - 1) % 12) + 1
        months.append(f"{cur_y:04d}-{cur_m_norm:02d}")
        
    print(f"Simulation timeline ({len(months)} batches): {', '.join(months)}")
    
    arms = ["adaptive", "control"]
    arm_results = {}
    
    for arm in arms:
        is_adaptive = (arm == "adaptive")
        print(f"\n---> Starting Arm: {arm.upper()} (profile updates={'ENABLED' if is_adaptive else 'DISABLED'})...")
        
        arm_users = copy.deepcopy(users_master)
        
        user_hikes_map: Dict[str, Set[str]] = {}
        user_hike_history: Dict[str, List[str]] = {}
        for u in arm_users:
            uid = u["id"]
            spec = user_spec_map.get(uid, {})
            ticked_ids = spec.get("expected_trail_ids", [])
            user_hikes_map[uid] = set(str(tid) for tid in ticked_ids)
            user_hike_history[uid] = list(str(tid) for tid in ticked_ids)
            
        user_reviews_map: Dict[str, List[Dict[str, Any]]] = {u["id"]: [] for u in arm_users}
        prev_recommendations_map: Dict[str, Dict[str, Any]] = {}
        user_cycle_telemetry: Dict[str, List[Dict[str, Any]]] = {u["id"]: [] for u in arm_users}
        
        for cycle_idx, active_month in enumerate(months):
            batch_res = run_batch_recommendations(
                cbf_engine=cbf_engine,
                cf_engine=cf_engine,
                month_id=active_month,
                candidate_trails=trails,
                users=arm_users,
                user_hikes_map=user_hikes_map,
                user_reviews_map=user_reviews_map if is_adaptive else None,
                prev_recommendations_map=prev_recommendations_map if is_adaptive else None,
                commit_to_firestore=False,
                generate_ai_reasoning=False,
                update_profiles_from_reviews=is_adaptive
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
                
                easy_recs = u_doc.get("easy", [])
                diff_recs = u_doc.get("difficult", [])
                
                rec_alignment_checks = []
                for item in easy_recs:
                    tid = str(item.get("id"))
                    if tid in trail_covered_vectors:
                        t_vec = trail_covered_vectors[tid]
                        de = float(np.linalg.norm(t_vec - gt_easy_vec))
                        dd = float(np.linalg.norm(t_vec - gt_diff_vec))
                        rec_alignment_checks.append({
                            "trailId": tid,
                            "trailName": item.get("trailName") or item.get("name"),
                            "recommendedSlot": "easy",
                            "score": item.get("score"),
                            "dist_gt_easy": round(de, 4),
                            "dist_gt_diff": round(dd, 4),
                            "is_gt_aligned": (de <= dd)
                        })
                for item in diff_recs:
                    tid = str(item.get("id"))
                    if tid in trail_covered_vectors:
                        t_vec = trail_covered_vectors[tid]
                        de = float(np.linalg.norm(t_vec - gt_easy_vec))
                        dd = float(np.linalg.norm(t_vec - gt_diff_vec))
                        rec_alignment_checks.append({
                            "trailId": tid,
                            "trailName": item.get("trailName") or item.get("name"),
                            "recommendedSlot": "difficult",
                            "score": item.get("score"),
                            "dist_gt_easy": round(de, 4),
                            "dist_gt_diff": round(dd, 4),
                            "is_gt_aligned": (dd <= de)
                        })
                        
                aligned_count = sum(1 for r in rec_alignment_checks if r["is_gt_aligned"])
                alignment_rate = (aligned_count / len(rec_alignment_checks)) if rec_alignment_checks else 1.0
                
                # Pick trail for hike if not final cycle
                picked_hike_info = None
                simulated_review_info = None
                
                if cycle_idx < cycles:
                    picked_item = None
                    target_slot = "easy"
                    
                    unhiked_easy = [r for r in easy_recs if str(r.get("id")) not in user_hikes_map[uid]]
                    unhiked_diff = [r for r in diff_recs if str(r.get("id")) not in user_hikes_map[uid]]
                    
                    exp = u.get("experience", "E1")
                    has_unhiked = bool(unhiked_easy or unhiked_diff)
                    
                    if has_unhiked:
                        # Prioritize unhiked trails according to user experience tier
                        if exp in ("E1", "E2"):
                            if unhiked_easy:
                                picked_item = unhiked_easy[0]
                                target_slot = "easy"
                            else:
                                picked_item = unhiked_diff[0]
                                target_slot = "difficult"
                        else:  # E3, E4
                            if cycle_idx == 0:
                                if unhiked_easy:
                                    picked_item = unhiked_easy[0]
                                    target_slot = "easy"
                                else:
                                    picked_item = unhiked_diff[0]
                                    target_slot = "difficult"
                            else:
                                if unhiked_diff:
                                    picked_item = unhiked_diff[0]
                                    target_slot = "difficult"
                                else:
                                    picked_item = unhiked_easy[0]
                                    target_slot = "easy"
                    else:
                        # IF AND ONLY IF NO MORE TRAILS AVAILABLE, ALLOW A REHIKE
                        if exp in ("E1", "E2"):
                            pool = easy_recs if easy_recs else diff_recs
                            target_slot = "easy" if easy_recs else "difficult"
                        else:
                            pool = diff_recs if diff_recs else easy_recs
                            target_slot = "difficult" if diff_recs else "easy"
                            
                        if pool:
                            history = user_hike_history.get(uid, [])
                            def last_hike_index(item):
                                tid = str(item.get("id"))
                                try:
                                    return len(history) - 1 - history[::-1].index(tid)
                                except ValueError:
                                    return -1
                            picked_item = min(pool, key=last_hike_index)
                            
                    if picked_item:
                        picked_tid = str(picked_item.get("id"))
                        user_hikes_map[uid].add(picked_tid)
                        user_hike_history[uid].append(picked_tid)
                        
                        trail_obj = trail_by_id[picked_tid]
                        t_covered = trail_covered_vectors[picked_tid]
                        
                        rev = determine_simulated_review(
                            trail_doc=trail_obj,
                            target_anchor=target_slot,
                            gt_easy_vec=gt_easy_vec,
                            gt_diff_vec=gt_diff_vec,
                            trail_covered_vec=t_covered,
                            active_month=active_month
                        )
                        cycle_reviews_this_month[uid].append(rev)
                        
                        picked_hike_info = {
                            "trailId": picked_tid,
                            "trailName": trail_obj.get("general", {}).get("name", "Trail"),
                            "targetAnchor": target_slot,
                            "score": picked_item.get("score"),
                            "isRehike": not has_unhiked
                        }
                        simulated_review_info = {
                            "perceivedDifficulty": rev["perceivedDifficulty"],
                            "difficultyFactors": rev["difficultyFactors"],
                            "primaryFactorKey": rev["primaryFactorKey"]
                        }

                # Save snapshot of this cycle's telemetry including the full profile features
                user_cycle_telemetry[uid].append({
                    "cycle": cycle_idx,
                    "month": active_month,
                    "profile": copy.deepcopy(u_prof),
                    "distances": {
                        "easy": easy_dist,
                        "difficult": diff_dist,
                        "mean_gd": round((easy_dist["gd"] + diff_dist["gd"]) / 2.0, 4),
                        "mean_ed": round((easy_dist["ed"] + diff_dist["ed"]) / 2.0, 4),
                        "mean_cs": round((easy_dist["cs"] + diff_dist["cs"]) / 2.0, 4),
                    },
                    "rec_alignment_rate": round(alignment_rate, 4),
                    "recommendations": {
                        "easy": [{"id": it.get("id"), "trailName": it.get("trailName") or it.get("name"), "score": it.get("score")} for it in easy_recs[:3]],
                        "difficult": [{"id": it.get("id"), "trailName": it.get("trailName") or it.get("name"), "score": it.get("score")} for it in diff_recs[:2]]
                    },
                    "alignment_checks": rec_alignment_checks,
                    "hiked": picked_hike_info,
                    "review": simulated_review_info
                })
                
                # Update in-memory user profile for next iteration if adaptive
                if is_adaptive and u_doc.get("profile"):
                    u["profile"] = u_doc["profile"]
                    
            prev_recommendations_map = recomms
            for uid, rev_list in cycle_reviews_this_month.items():
                user_reviews_map[uid].extend(rev_list)
                
        arm_results[arm] = {
            "user_telemetry": user_cycle_telemetry,
            "months": months
        }
        
    print("\n" + "=" * 80)
    print("CONVERGENCE SUMMARY: ADAPTIVE ARM vs CONTROL ARM (GOWER DISTANCE TO GROUND TRUTH)")
    print("=" * 80)
    print(f"{'User ID':<10} | {'Exp':<4} | {'Med':<4} | {'Start GD':<10} | {'Ctrl End GD':<12} | {'Adapt End GD':<12} | {'Adapt Delta':<12} | {'Result':<10}")
    print("-" * 80)
    
    adapt_tele = arm_results["adaptive"]["user_telemetry"]
    ctrl_tele = arm_results["control"]["user_telemetry"]
    
    csv_rows = []
    improved_count = 0
    total_users = len(arm_users)
    
    user_convergence_map = {}
    for u in arm_users:
        uid = u["id"]
        exp = u["experience"]
        med = u["medical"]
        
        start_gd = adapt_tele[uid][0]["distances"]["mean_gd"]
        adapt_end_gd = adapt_tele[uid][-1]["distances"]["mean_gd"]
        ctrl_end_gd = ctrl_tele[uid][-1]["distances"]["mean_gd"]
        
        delta_gd = round(adapt_end_gd - start_gd, 4)
        has_converged = (delta_gd < 0)
        if has_converged:
            improved_count += 1
            
        res_str = "CONVERGED" if has_converged else "STABLE"
        print(f"{uid:<10} | {exp:<4} | {med:<4} | {start_gd:<10.4f} | {ctrl_end_gd:<12.4f} | {adapt_end_gd:<12.4f} | {delta_gd:<+12.4f} | {res_str:<10}")
        
        user_convergence_map[uid] = {
            "start_gd": start_gd,
            "end_gd": adapt_end_gd,
            "ctrl_end_gd": ctrl_end_gd,
            "delta_gd": delta_gd,
            "has_converged": has_converged
        }
        
        for c_idx in range(len(months)):
            csv_rows.append({
                "user_id": uid,
                "experience": exp,
                "medical": med,
                "cycle": c_idx,
                "month": months[c_idx],
                "adaptive_mean_gd": adapt_tele[uid][c_idx]["distances"]["mean_gd"],
                "adaptive_mean_ed": adapt_tele[uid][c_idx]["distances"]["mean_ed"],
                "adaptive_mean_cs": adapt_tele[uid][c_idx]["distances"]["mean_cs"],
                "adaptive_rec_alignment": adapt_tele[uid][c_idx]["rec_alignment_rate"],
                "control_mean_gd": ctrl_tele[uid][c_idx]["distances"]["mean_gd"],
                "control_mean_ed": ctrl_tele[uid][c_idx]["distances"]["mean_ed"],
                "control_mean_cs": ctrl_tele[uid][c_idx]["distances"]["mean_cs"],
            })
            
    print("-" * 80)
    print(f"Overall Adaptive Convergence Rate: {improved_count}/{total_users} users ({improved_count/total_users*100:.1f}%)")
    
    csv_out_path = os.path.join(OUTPUT_DIR, "convergence_summary.csv")
    with open(csv_out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(csv_rows[0].keys()))
        writer.writeheader()
        writer.writerows(csv_rows)
        
    full_harness_data = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "config": {"cycles": cycles, "cbf_engine": cbf_engine, "cf_engine": cf_engine},
        "months": months,
        "convergence_rate": round(improved_count / total_users, 4),
        "arms": arm_results
    }
    
    json_out_path = os.path.join(OUTPUT_DIR, "harness_results.json")
    with open(json_out_path, "w", encoding="utf-8") as f:
        json.dump(full_harness_data, f, indent=2)

    sim_num = 1 if cycles == 3 else 2 if cycles == 5 else 3 if cycles == 7 else 4 if cycles == 10 else cycles
    archive_path = os.path.join(OUTPUT_DIR, f"harness_results_simulation{sim_num}.json")
    with open(archive_path, "w", encoding="utf-8") as f:
        json.dump(full_harness_data, f, indent=2)
        
    # Also write to app data location src/recommendation/data/simulationHarnessResults.json
    with open(APP_DATA_HARNESS_RESULTS, "w", encoding="utf-8") as f:
        json.dump(full_harness_data, f, indent=2)
        
    # Merge cycleHistory and convergence into simulatedUsers.json for UI access
    if os.path.exists(APP_DATA_SIMULATED_USERS):
        with open(APP_DATA_SIMULATED_USERS, "r", encoding="utf-8") as f:
            sim_users_bundle = json.load(f)
            
        for user_entry in sim_users_bundle:
            u_id = user_entry.get("id")
            if u_id in adapt_tele:
                user_entry["cycleHistory"] = adapt_tele[u_id]
                user_entry["convergence"] = user_convergence_map.get(u_id, {})
                
        with open(APP_DATA_SIMULATED_USERS, "w", encoding="utf-8") as f:
            json.dump(sim_users_bundle, f, indent=2)
        print(f"Merged cycleHistory into app dataset: {APP_DATA_SIMULATED_USERS}")

    print(f"\nWrote full harness telemetry to: {json_out_path}")
    print(f"Wrote tabular convergence trajectory to: {csv_out_path}")
    return arm_results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="THARESYS In-Memory Simulation Harness")
    parser.add_argument("--cycles", type=int, default=10, help="Number of hiking cycles")
    parser.add_argument("--cbf", type=str, default="GD", help="CBF Engine Formula (GD, ED)")
    parser.add_argument("--cf", type=str, default="GD", help="CF Engine Formula (GD, ED, CS)")
    args = parser.parse_args()
    
    run_harness(cycles=args.cycles, cbf_engine=args.cbf, cf_engine=args.cf)
