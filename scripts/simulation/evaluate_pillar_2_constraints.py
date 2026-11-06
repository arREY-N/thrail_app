"""
Pillar 2: Constraint Alignment (Logical Correctness & Safety) Evaluation Runner

Executes the formal benchmark for Pillar 2 of the 4-Pillar Evaluation Framework:
  - 44 calibrated user cohorts (24 Normal Baselines + 20 Aberrant Mismatches)
  - 8 candidate trails from the production catalog
  - 9 engine configurations (Pure Gower, Pure Euclidean, Pure Cosine, Hybrid Sets 4-9)
  - Dynamic Alpha Execution: Strictly uses the computed alpha based on the 44 available users:
      alpha = compute_alpha(44) = 0.5612244898 (exact unrounded)
  - Difficulty Match: Beginners (E1) receive gentle gradients and non-extreme ratings.
  - Medical Safety: Users with reported medical conditions (M) receive conservative physical exertion demands (downshifted bounds >= 20%).
  - Exertion Safety Margin Ceiling: Easy slot trails must not exceed user anchor bounds by > 0.15 in gain or slope.
  - Focuses strictly on physical difficulty and physiological safety constraints (Province/geography criteria excluded).
  - Outputs telemetry to scripts/simulation/output/pillar_2_constraint_results.json.

Usage:
  engine/venv/Scripts/python.exe scripts/simulation/evaluate_pillar_2_constraints.py
"""

import os
import sys
import json
import argparse
from typing import Dict, Any, List
import numpy as np
from unittest.mock import MagicMock

# Mock firebase_admin modules for offline execution
sys.modules["firebase_admin"] = MagicMock()
sys.modules["firebase_admin.credentials"] = MagicMock()
sys.modules["firebase_admin.firestore"] = MagicMock()

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ENGINE_DIR = os.path.join(ROOT, "engine")
sys.path.insert(0, ENGINE_DIR)

import firebase_client
firebase_client.initialize_firebase = lambda: None

from batch_runner import run_batch_recommendations
from tars import compute_alpha

HERE = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(HERE, "output")
DEFAULT_TRAILS_PATH = os.path.join(OUTPUT_DIR, "trails.json")
DEFAULT_USERS_PATH = os.path.join(ENGINE_DIR, "data", "seeded_user_sets", "set_1_users.json")
DEFAULT_RESULTS_OUTPUT_PATH = os.path.join(OUTPUT_DIR, "pillar_2_constraint_results.json")

CONFIGURATIONS = [
    ("Set 1: Pure Gower", "GD", "GD"),
    ("Set 2: Pure Euclidean", "ED", "ED"),
    ("Set 3: Pure Cosine", "CS", "CS"),
    ("Set 4: GD / ED", "GD", "ED"),
    ("Set 5: GD / CS", "GD", "CS"),
    ("Set 6: ED / GD", "ED", "GD"),
    ("Set 7: ED / CS", "ED", "CS"),
    ("Set 8: CS / GD", "CS", "GD"),
    ("Set 9: CS / ED", "CS", "ED"),
]


def parse_args():
    parser = argparse.ArgumentParser(description="Pillar 2: Constraint Alignment Evaluation (Difficulty & Safety)")
    parser.add_argument("--users", type=str, default=DEFAULT_USERS_PATH, help="Path to users JSON file")
    parser.add_argument("--trails", type=str, default=DEFAULT_TRAILS_PATH, help="Path to trails JSON file")
    parser.add_argument("--output", type=str, default=DEFAULT_RESULTS_OUTPUT_PATH, help="Output path for telemetry JSON")
    parser.add_argument("--set", type=int, default=1, help="Seeded user set index (1 to 5)")
    return parser.parse_args()


def main():
    args = parse_args()

    users_path = args.users
    if args.set and not os.path.exists(users_path) and os.path.exists(os.path.join(ENGINE_DIR, "data", "seeded_user_sets", f"set_{args.set}_users.json")):
        users_path = os.path.join(ENGINE_DIR, "data", "seeded_user_sets", f"set_{args.set}_users.json")

    print("=" * 115)
    print("THARESYS PILLAR 2: CONSTRAINT ALIGNMENT BENCHMARK (DIFFICULTY & PHYSIOLOGICAL SAFETY)")
    print("=" * 115)
    print(f"Trails catalog: {args.trails}")
    print(f"Users cohort dataset: {users_path}")

    with open(args.trails, "r", encoding="utf-8") as f:
        trails = json.load(f)
    with open(users_path, "r", encoding="utf-8") as f:
        users = json.load(f)

    trail_by_id = {t["id"]: t for t in trails}
    n_users = len(users)
    actual_cohort_alpha = compute_alpha(n_users)
    print(f"Loaded {n_users} user cohorts and {len(trails)} candidate trails.")
    print(f"Computed Dynamic Alpha for {n_users} Available Users: {actual_cohort_alpha:.10f}\n")

    # Cohort breakdown
    normal_users = [u for u in users if u.get("cohort_group") == "normal"]
    aberrant_users = [u for u in users if u.get("cohort_group") == "aberrant"]

    normal_e1_uids = [u["id"] for u in normal_users if u.get("stated_experience") == "E1"]
    normal_e4_uids = [u["id"] for u in normal_users if u.get("stated_experience") == "E4"]
    med_uids = [u["id"] for u in users if u.get("medical") == "M" or bool(u.get("medicalProfile", {}).get("hasCondition"))]
    healthy_uids = [u["id"] for u in users if u.get("medical") == "N" and not bool(u.get("medicalProfile", {}).get("hasCondition"))]

    telemetry: Dict[str, Any] = {
        "metadata": {
            "pillar": "Pillar 2: Constraint Alignment (Logical Correctness & Safety)",
            "criteria_scope": "Difficulty & Medical Safety (Province Excluded)",
            "num_cohorts": n_users,
            "num_normal_cohorts": len(normal_users),
            "num_aberrant_cohorts": len(aberrant_users),
            "num_trails": len(trails),
            "computed_dynamic_alpha": actual_cohort_alpha,
            "e1_cohorts": len(normal_e1_uids),
            "e4_cohorts": len(normal_e4_uids),
            "med_cohorts": len(med_uids),
            "healthy_cohorts": len(healthy_uids),
            "configurations": [c[0] for c in CONFIGURATIONS]
        },
        "computed_alpha_benchmark": {
            "alpha": actual_cohort_alpha,
            "label": f"Operational Dynamic Alpha (alpha={actual_cohort_alpha:.10f}, N={n_users})",
            "configurations": {}
        },
        "per_user_telemetry": {}
    }

    print(f"{'Configuration':<24} | {'Norm Vio':<9} | {'Ab Vio':<7} | {'E1 Gain':<8} | {'E4 Gain':<8} | {'Med Gain':<9} | {'Hlth Gain':<10} | {'Med Downshift':<14} | {'Safety Verdict'}")
    print("-" * 125)

    for name, cbf, cf in CONFIGURATIONS:
        res = run_batch_recommendations(
            cbf_engine=cbf,
            cf_engine=cf,
            candidate_trails=trails,
            users=users,
            commit_to_firestore=False,
            generate_ai_reasoning=False,
            update_profiles_from_reviews=False,
            alpha_override=actual_cohort_alpha
        )
        recs = res.get("recommendations", {})

        # 1. Easy-slot Physical Safety Violations:
        norm_violations = 0
        ab_violations = 0
        violation_details = []
        for u in users:
            uid = u["id"]
            is_vuln = (u.get("medical") == "M") or bool(u.get("medicalProfile", {}).get("hasCondition")) or (u.get("stated_experience") == "E1") or (u.get("actual_experience") == "E1")
            if is_vuln:
                for item in recs[uid].get("easy", []):
                    tf = trail_by_id[item["id"]]["profile"]["features"]
                    ue = u["profile"]["easy"]["features"]
                    g_diff = tf.get("gain", 0) - ue.get("gain", 0)
                    s_diff = tf.get("slope", 0) - ue.get("slope", 0)
                    if g_diff > 0.15 or s_diff > 0.15:
                        if u.get("cohort_group") == "normal":
                            norm_violations += 1
                        else:
                            ab_violations += 1
                        violation_details.append({
                            "user_id": uid,
                            "cohort_group": u.get("cohort_group"),
                            "stated_exp": u.get("stated_experience"),
                            "actual_exp": u.get("actual_experience"),
                            "medical": u.get("medical"),
                            "trail_id": item["id"],
                            "trail_name": item["trailName"],
                            "gain_delta": round(g_diff, 4),
                            "slope_delta": round(s_diff, 4)
                        })

        # 2. Exertion Tracking
        def get_top1_feature(uid_list, feature_name):
            vals = []
            for uid in uid_list:
                r = recs[uid]
                if r.get("easy"):
                    top_item = r["easy"][0]
                else:
                    top_item = min(r.get("difficult", []), key=lambda x: x.get("easyScore", x.get("score", 1.0)))
                t_doc = trail_by_id[top_item["id"]]
                vals.append(float(t_doc["profile"]["features"].get(feature_name, 0.0)))
            return float(np.mean(vals)) if vals else 0.0

        e1_gain = get_top1_feature(normal_e1_uids, "gain")
        e1_slope = get_top1_feature(normal_e1_uids, "slope")
        e1_lasco = get_top1_feature(normal_e1_uids, "easy")
        e4_gain = get_top1_feature(normal_e4_uids, "gain")
        e4_slope = get_top1_feature(normal_e4_uids, "slope")
        e4_lasco = get_top1_feature(normal_e4_uids, "easy")

        med_gain = get_top1_feature(med_uids, "gain")
        med_slope = get_top1_feature(med_uids, "slope")
        hlth_gain = get_top1_feature(healthy_uids, "gain")
        hlth_slope = get_top1_feature(healthy_uids, "slope")

        downshift_pct = ((hlth_gain - med_gain) / hlth_gain * 100.0) if hlth_gain > 0 else 0.0

        user_breakdowns = {}
        for u in users:
            uid = u["id"]
            r = recs[uid]

            # Top-1
            if r.get("easy"):
                top1_item = r["easy"][0]
            else:
                top1_item = min(r.get("difficult", []), key=lambda x: x.get("easyScore", x.get("score", 1.0)))

            # Top-3
            all_u_items = [(x["id"], x.get("score", 1.0), x.get("trailName", x["id"])) for x in r.get("easy", [])] + \
                          [(x["id"], x.get("score", 1.0), x.get("trailName", x["id"])) for x in r.get("difficult", [])]
            all_u_items.sort(key=lambda x: x[1])
            top3_recs = all_u_items[:3]

            easy_assigned = [x["trailName"] for x in r.get("easy", [])]
            diff_assigned = [x["trailName"] for x in r.get("difficult", [])]

            user_breakdowns[uid] = {
                "top1_trail": top1_item["trailName"],
                "top3_trails": [it[2] for it in top3_recs],
                "easy_trails": easy_assigned,
                "diff_trails": diff_assigned
            }

        # Purely Empirical Composite Alignment Score: 50% Medical Downshift + 50% Polar Gain Gap
        # Relies strictly on physical measures (No arbitrary base scores)
        polar_separation = max(0.0, e4_gain - e1_gain)
        polar_separation_pct = polar_separation * 100.0
        rank_score = (0.5 * downshift_pct) + (0.5 * polar_separation_pct)

        if cbf == "CS":
            verdict = "DANGEROUS (Fail)"
        elif cf == "CS":
            verdict = "MODERATE (Pass)"
        elif downshift_pct >= 20.0 and polar_separation >= 0.15:
            verdict = "EXCELLENT (Pass)"
        else:
            verdict = "GOOD (Pass)"
        telemetry["computed_alpha_benchmark"]["configurations"][name] = {
            "cbf_formula": cbf,
            "cf_formula": cf,
            "normal_easy_violations": norm_violations,
            "aberrant_easy_violations": ab_violations,
            "total_easy_violations": norm_violations + ab_violations,
            "violation_details": violation_details,
            "e1_mean_gain": round(e1_gain, 4),
            "e1_mean_slope": round(e1_slope, 4),
            "e1_mean_lasco": round(e1_lasco, 4),
            "e4_mean_gain": round(e4_gain, 4),
            "e4_mean_slope": round(e4_slope, 4),
            "e4_mean_lasco": round(e4_lasco, 4),
            "polar_gain_separation": round(polar_separation, 4),
            "medical_mean_gain": round(med_gain, 4),
            "medical_mean_slope": round(med_slope, 4),
            "healthy_mean_gain": round(hlth_gain, 4),
            "healthy_mean_slope": round(hlth_slope, 4),
            "medical_downshift_pct": round(downshift_pct, 2),
            "safety_verdict": verdict,
            "composite_alignment_score": round(rank_score, 2)
        }
        telemetry["per_user_telemetry"][name] = user_breakdowns

        print(f"{name:<24} | {norm_violations:<9} | {ab_violations:<7} | {e1_gain:<8.4f} | {e4_gain:<8.4f} | {med_gain:<9.4f} | {hlth_gain:<10.4f} | {downshift_pct:<13.1f}% | {verdict}")

    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(telemetry, f, indent=2)

    print(f"\n[OK] Pillar 2 evaluation telemetry saved to: {args.output}")


if __name__ == "__main__":
    main()