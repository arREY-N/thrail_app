"""
Aberrant & Normal Cohort Multi-Cycle Simulation Harness.

Executes multi-cycle batch recommendation rounds across 48 cohorts (24 normal + 24 aberrant) and 8 trails:
  - Normal cohorts: E1..E4 x N/M x P1..P3 (concordant: stated == actual)
  - Aberrant cohorts: 12 mismatch pairs x N/M (discordant: stated != actual)
  - Evaluates both Adaptive Arm (updates enabled) and Control Arm (static baseline).
  - Evaluates distance convergence toward true latent Ground Truth.
  - Monitors safety barriers (Easy slot exertion ceiling <= 0.15 for vulnerable/medical hikers).

Usage:
  engine/venv/Scripts/python.exe scripts/simulation/aberrant_simulation/scripts/run_aberrant_simulation.py [--cycles 10] [--cbf GD] [--cf GD]
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

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
ENGINE_DIR = os.path.join(ROOT, "engine")
sys.path.insert(0, ENGINE_DIR)

# Mock firebase initialization to guarantee 100% in-memory execution
import firebase_client
firebase_client.initialize_firebase = lambda: None

from batch_runner import run_batch_recommendations
from formula import gower_distance, euclidean_distance, cosine_distance
from profile_utils import flatten_profile_features

MODULE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INPUTS_DIR = os.path.join(MODULE_DIR, "inputs")
OUTPUT_DIR = os.path.join(MODULE_DIR, "output")

TRAILS_PATH = os.path.join(INPUTS_DIR, "trails.json")
USERS_PATH = os.path.join(OUTPUT_DIR, "users.json")
USERS_SPEC_PATH = os.path.join(OUTPUT_DIR, "users_spec.json")

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
    Excess physical strain triggers a mismatch rating ("Difficult" / complaints).
    Underwhelming physical strain triggers an underwhelming mismatch.
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
        # Check if physical demands exceed hiker's comfortable baseline
        excesses = []
        for k in ["length", "gain", "slope", "elevation"]:
            diff = trail_feats[k] - easy_gt_feats[k]
            if diff > 0.15:
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

    else:  # target_anchor == "difficult"
        phys_dist_easy = float(np.mean([abs(trail_feats[k] - easy_gt_feats[k]) for k in ["length", "gain", "slope", "elevation"]]))
        phys_dist_diff = float(np.mean([abs(trail_feats[k] - diff_gt_feats[k]) for k in ["length", "gain", "slope", "elevation"]]))

        # Check if trail physically overpowers even their difficult limit (e.g. novice claiming expert)
        mean_diff = float(np.mean([trail_feats[k] - diff_gt_feats[k] for k in ["length", "gain", "slope", "elevation"]]))
        count_over = sum(1 for k in ["gain", "slope", "elevation", "length"] if trail_feats[k] - diff_gt_feats[k] > 0.15)

        if mean_diff > 0.08 or count_over >= 2:
            # Severe overexertion mismatch: trail far exceeded even aspirational GT limit!
            perceived_difficulty = "Exhausting"
            severe_overpowers = [(k, trail_feats[k] - diff_gt_feats[k]) for k in ["length", "gain", "slope", "elevation"] if trail_feats[k] - diff_gt_feats[k] > 0.0]
            severe_overpowers.sort(key=lambda x: x[1], reverse=True)
            primary_key = severe_overpowers[0][0] if severe_overpowers else "slope"
            for k, _ in severe_overpowers:
                selected_phrases.append(phrase_map[k])
        elif phys_dist_easy + 0.12 < phys_dist_diff or mean_diff < -0.20:
            # Underwhelming mismatch: trail lacked desired challenge
            perceived_difficulty = "Easy"
            diffs = [(k, diff_gt_feats[k] - trail_feats[k]) for k in ["length", "gain", "slope", "elevation"]]
            diffs.sort(key=lambda x: x[1], reverse=True)
            primary_key = diffs[0][0]
            selected_phrases.append(phrase_map[primary_key])
        else:
            # Appropriate challenge (Match)
            perceived_difficulty = "Difficult"
            chal = [(k, trail_feats[k]) for k in ["length", "gain", "slope", "elevation"]]
            chal.sort(key=lambda x: x[1], reverse=True)
            primary_key = chal[0][0]
            for k, _ in chal[:2]:
                selected_phrases.append(phrase_map[k])

    created_at = f"{active_month}-15T10:00:00Z"
    tname = trail_doc.get("general", {}).get("name") or trail_doc.get("name", "Trail")

    # When perceivedDifficulty is "Exhausting", the engine's match parser treats it as a mismatch
    # (perceivedDifficulty != target_anchor)
    is_match = (perceived_difficulty == target_anchor.capitalize())

    return {
        "id": f"rev_{trail_doc['id']}_{active_month}",
        "trail": {"id": trail_doc["id"], "name": tname},
        "trailId": trail_doc["id"],
        "trailName": tname,
        "perceivedDifficulty": perceived_difficulty,
        "raw_experience": perceived_difficulty,
        "is_match": is_match,
        "experience": perceived_difficulty,
        "createdAt": created_at,
        "primaryFactorKey": primary_key,
        "factors": [
            {
                "id": f"f_{primary_key}",
                "key": primary_key,
                "label": phrase_map[primary_key],
                "selectedPhrases": selected_phrases
            }
        ]
    }


def execute_simulation(
    cycles: int = 10,
    cbf_engine: str = "GD",
    cf_engine: str = "GD",
    trails_path: str = None,
    output_dir: str = None
) -> Dict[str, Any]:
    active_trails_path = trails_path or TRAILS_PATH
    active_output_dir = output_dir or OUTPUT_DIR
    os.makedirs(active_output_dir, exist_ok=True)
    with open(active_trails_path, "r", encoding="utf-8") as f:
        trails_raw = json.load(f)
        trails = trails_raw.get("trails", trails_raw) if isinstance(trails_raw, dict) else trails_raw

    with open(USERS_PATH, "r", encoding="utf-8") as f:
        users_master = json.load(f)

    with open(USERS_SPEC_PATH, "r", encoding="utf-8") as f:
        users_spec = json.load(f)

    user_spec_map = {u["id"]: u for u in users_spec}
    trail_by_id = {str(t["id"]): t for t in trails}

    # Pre-extract covered vectors for trails
    trail_covered_vectors: Dict[str, np.ndarray] = {}
    for t in trails:
        tid = str(t["id"])
        vec_32 = flatten_profile_features(t.get("profile", t))
        trail_covered_vectors[tid] = extract_covered_vector_from_32d(vec_32)

    base_year = 2026
    base_month = 3
    months = []
    for m in range(cycles + 1):
        cur_m = base_month + m
        cur_y = base_year + (cur_m - 1) // 12
        cur_m_norm = ((cur_m - 1) % 12) + 1
        months.append(f"{cur_y:04d}-{cur_m_norm:02d}")

    print(f"============================================================")
    print(f"  THARESYS Aberrant & Normal Cohort Multi-Cycle Simulation  ")
    print(f"============================================================")
    print(f"Cohorts: {len(users_master)} (24 Normal, 24 Aberrant)")
    print(f"Trails:  {len(trails)}")
    print(f"Cycles:  {cycles} monthly hikes ({len(months)} batches)")
    print(f"Engines: CBF={cbf_engine}, CF={cf_engine}")
    print(f"Timeline: {', '.join(months)}")

    arms = ["adaptive", "control"]
    arm_results = {}

    for arm in arms:
        is_adaptive = (arm == "adaptive")
        print(f"\n---> Starting Arm: {arm.upper()} (profile updates={'ENABLED' if is_adaptive else 'DISABLED'})...")

        arm_users = copy.deepcopy(users_master)

        user_hikes_map: Dict[str, Set[str]] = {}
        user_hike_history: Dict[str, List[str]] = {}

        # Resolve ticked trail IDs from ticked names in spec
        for u in arm_users:
            uid = u["id"]
            spec = user_spec_map.get(uid, {})
            ticked_names = spec.get("ticked_names", [])
            ticked_ids = []
            for tname in ticked_names:
                for t in trails:
                    t_gen_name = t.get("general", {}).get("name") or t.get("name", "")
                    if tname.lower() in t_gen_name.lower():
                        ticked_ids.append(str(t["id"]))
            user_hikes_map[uid] = set(ticked_ids)
            user_hike_history[uid] = list(ticked_ids)

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

                # Pick trail for hike if not final batch
                picked_hike_info = None
                simulated_review_info = None

                if cycle_idx < cycles:
                    picked_item = None
                    target_slot = "easy"

                    unhiked_easy = [r for r in easy_recs if str(r.get("id")) not in user_hikes_map[uid]]
                    unhiked_diff = [r for r in diff_recs if str(r.get("id")) not in user_hikes_map[uid]]

                    # Cadence Policy: Stratified Succession (E1/E2: 2 Easy, 1 Difficult; E3/E4: 2 Difficult, 1 Easy)
                    stated_tier = u.get("stated_tier", 1)
                    is_cadence_turn = ((cycle_idx + 1) % 3 == 0)

                    if stated_tier in (1, 2):
                        target_slot = "difficult" if is_cadence_turn else "easy"
                    else:  # stated tier 3, 4
                        target_slot = "easy" if is_cadence_turn else "difficult"

                    def pick_least_recent(pool):
                        if not pool:
                            return None
                        history = user_hike_history.get(uid, [])
                        def last_hike_index(item):
                            tid = str(item.get("id"))
                            try:
                                return len(history) - 1 - history[::-1].index(tid)
                            except ValueError:
                                return -1
                        return min(pool, key=last_hike_index)

                    if target_slot == "easy":
                        if unhiked_easy:
                            picked_item = unhiked_easy[0]
                        elif unhiked_diff:
                            picked_item = unhiked_diff[0]
                        else:
                            picked_item = pick_least_recent(easy_recs if easy_recs else diff_recs)
                    else:  # difficult
                        if unhiked_diff:
                            picked_item = unhiked_diff[0]
                        elif unhiked_easy:
                            picked_item = unhiked_easy[0]
                        else:
                            picked_item = pick_least_recent(diff_recs if diff_recs else easy_recs)

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

                        is_rehike = (user_hike_history[uid].count(picked_tid) > 1)
                        tname = trail_obj.get("general", {}).get("name") or trail_obj.get("name", "Trail")
                        picked_hike_info = {
                            "cycle": cycle_idx + 1,
                            "month": active_month,
                            "trailId": picked_tid,
                            "trailName": tname,
                            "targetAnchor": target_slot,
                            "score": picked_item.get("score"),
                            "isRehike": is_rehike
                        }
                        difficulty_factors = []
                        if rev.get("factors") and isinstance(rev["factors"], list) and len(rev["factors"]) > 0:
                            difficulty_factors = rev["factors"][0].get("selectedPhrases", [])

                        simulated_review_info = {
                            "perceivedDifficulty": rev["perceivedDifficulty"],
                            "rawExperience": rev["raw_experience"],
                            "isMatch": rev["is_match"],
                            "primaryFactorKey": rev["primaryFactorKey"],
                            "difficultyFactors": difficulty_factors
                        }

                # Record cycle snapshot
                user_cycle_telemetry[uid].append({
                    "cycle": cycle_idx,
                    "month": active_month,
                    "profile": {
                        "easy": copy.deepcopy(u_prof.get("easy", {})),
                        "difficult": copy.deepcopy(u_prof.get("difficult", {}))
                    },
                    "distances": {
                        "easy": easy_dist,
                        "difficult": diff_dist,
                        "mean_gd": round((easy_dist["gd"] + diff_dist["gd"]) / 2.0, 4),
                        "mean_ed": round((easy_dist["ed"] + diff_dist["ed"]) / 2.0, 4),
                        "mean_cs": round((easy_dist["cs"] + diff_dist["cs"]) / 2.0, 4),
                        "easy_gd": easy_dist["gd"],
                        "diff_gd": diff_dist["gd"],
                    },
                    "rec_alignment_rate": round(alignment_rate, 4),
                    "alignment_checks": rec_alignment_checks,
                    "recommendations": {
                        "easy": [{"id": r.get("id"), "trailName": r.get("trailName") or r.get("name"), "score": r.get("score")} for r in easy_recs],
                        "difficult": [{"id": r.get("id"), "trailName": r.get("trailName") or r.get("name"), "score": r.get("score")} for r in diff_recs],
                    },
                    "hiked": picked_hike_info,
                    "review": simulated_review_info
                })

            # Update arm users and state for next cycle
            if is_adaptive:
                user_reviews_map = cycle_reviews_this_month
                prev_recommendations_map = recomms
                for u in arm_users:
                    uid = u["id"]
                    if uid in recomms and "profile" in recomms[uid]:
                        u["profile"] = recomms[uid]["profile"]

            # Progress log
            normal_gd = np.mean([user_cycle_telemetry[u["id"]][-1]["distances"]["mean_gd"] for u in arm_users if u["cohort_group"] == "normal"])
            aberrant_gd = np.mean([user_cycle_telemetry[u["id"]][-1]["distances"]["mean_gd"] for u in arm_users if u["cohort_group"] == "aberrant"])
            print(f"  Cycle {cycle_idx} ({active_month}): Normal Mean GD = {normal_gd:.4f} | Aberrant Mean GD = {aberrant_gd:.4f}")

        arm_results[arm] = {
            "users": arm_users,
            "user_telemetry": user_cycle_telemetry
        }

    # Prepare summary data
    print("\n---> Compiling convergence summary...")
    convergence_rows = []
    comparison_rows = []

    for u in users_master:
        uid = u["id"]
        c_grp = u["cohort_group"]
        s_tier = u["stated_tier"]
        a_tier = u["actual_tier"]
        m_type = u["mismatch_type"]
        gap = u["mismatch_gap"]
        med = u["medical"]

        adap_snaps = arm_results["adaptive"]["user_telemetry"][uid]
        ctrl_snaps = arm_results["control"]["user_telemetry"][uid]

        start_gd = adap_snaps[0]["distances"]["mean_gd"]
        end_adap_gd = adap_snaps[-1]["distances"]["mean_gd"]
        end_ctrl_gd = ctrl_snaps[-1]["distances"]["mean_gd"]

        adap_delta = round(start_gd - end_adap_gd, 4)
        adap_pct = round((adap_delta / start_gd) * 100.0, 2) if start_gd > 0 else 0.0

        # Count mismatches / strain events
        strain_count = sum(1 for s in adap_snaps if s.get("review") and not s["review"]["isMatch"])

        convergence_rows.append({
            "user_id": uid,
            "cohort_group": c_grp,
            "stated_tier": s_tier,
            "actual_tier": a_tier,
            "mismatch_type": m_type,
            "mismatch_gap": gap,
            "medical": med,
            "start_mean_gd": start_gd,
            "final_adaptive_gd": end_adap_gd,
            "final_control_gd": end_ctrl_gd,
            "adaptive_delta_gd": adap_delta,
            "adaptive_reduction_pct": adap_pct,
            "mismatch_strain_events": strain_count
        })

    # Sort summary rows
    convergence_rows.sort(key=lambda r: (r["cohort_group"] != "normal", r["mismatch_type"], -abs(r["mismatch_gap"]), r["user_id"]))

    csv_path = os.path.join(active_output_dir, "convergence_summary.csv")
    fieldnames = list(convergence_rows[0].keys())
    with open(csv_path, "w", encoding="utf-8", newline="\n") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(convergence_rows)

    # Save harness results JSON
    harness_output = {
        "metadata": {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "cycles": cycles,
            "cbf_engine": cbf_engine,
            "cf_engine": cf_engine,
            "total_cohorts": len(users_master),
            "normal_cohorts": 24,
            "aberrant_cohorts": 24,
            "trails_count": len(trails),
            "months": months
        },
        "arms": arm_results
    }

    harness_json_path = os.path.join(active_output_dir, "harness_results.json")
    with open(harness_json_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(harness_output, f, indent=2, sort_keys=True, ensure_ascii=False)

    # Save simulatedUsers.json (Adaptive arm final state enriched with cycleHistory and convergence)
    sim_users_bundle = []
    start_dist_map = {}
    if os.path.exists(csv_path):
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                start_dist_map[row["user_id"]] = row

    for u in arm_results["adaptive"]["users"]:
        uid = u["id"]
        user_entry = copy.deepcopy(u)
        user_entry["cycleHistory"] = arm_results["adaptive"]["user_telemetry"][uid]
        start_gd = user_entry["cycleHistory"][0]["distances"]["mean_gd"]
        end_gd = user_entry["cycleHistory"][-1]["distances"]["mean_gd"]
        ctrl_end_gd = arm_results["control"]["user_telemetry"][uid][-1]["distances"]["mean_gd"]
        user_entry["convergence"] = {
            "start_gd": start_gd,
            "end_gd": end_gd,
            "ctrl_end_gd": ctrl_end_gd,
            "delta_gd": round(end_gd - start_gd, 4),
            "has_converged": end_gd < start_gd
        }
        if uid in start_dist_map:
            user_entry["startDistances"] = start_dist_map[uid]
        sim_users_bundle.append(user_entry)

    sim_users_path = os.path.join(active_output_dir, "simulatedUsers.json")
    with open(sim_users_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(sim_users_bundle, f, indent=2, sort_keys=True, ensure_ascii=False)

    print(f"\n============================================================")
    print(f"  Simulation Completed Successfully!                         ")
    print(f"============================================================")
    print(f"Saved results to:")
    print(f"  - {harness_json_path}")
    print(f"  - {sim_users_path}")
    print(f"  - {csv_path}")

    return harness_output


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="THARESYS Aberrant Simulation Harness")
    parser.add_argument("--cycles", type=int, default=10, help="Number of monthly cycles (default: 10)")
    parser.add_argument("--cbf", type=str, default="GD", help="CBF Engine (default: GD)")
    parser.add_argument("--cf", type=str, default="GD", help="CF Engine (default: GD)")
    parser.add_argument("--trails", type=str, default=None, help="Path to custom trail catalog JSON")
    parser.add_argument("--output-dir", type=str, default=None, help="Custom output directory")
    args = parser.parse_args()

    execute_simulation(
        cycles=args.cycles,
        cbf_engine=args.cbf,
        cf_engine=args.cf,
        trails_path=args.trails,
        output_dir=args.output_dir
    )

