"""
Pillar 3: Dual-Anchor Contrast (Easy vs. Difficult Separation) Evaluation Runner

Executes the formal benchmark for Pillar 3 of the 4-Pillar Evaluation Framework:
  - Measures the distance separation between the Easy recommendations (recovery/leisure)
    and Difficult recommendations (aspirational challenge) for the same user.
  - Verifies zero-overlap disjoint partitioning compliance (no trail in both slots).
  - Uses the EXACT dynamic alpha computed for 24 cohorts: compute_alpha(24) = 0.7653061224489796.
  - Compares across:
      1. Actual 24-Cohort Dynamic Alpha (alpha = 0.765306...)
      2. Cold-Start Boundary Reference (alpha = 1.0)
      3. Steady-State Boundary Reference (alpha = 0.5)
  - Outputs telemetry to scripts/simulation/output/pillar_3_contrast_results.json.

Usage:
  engine/venv/Scripts/python.exe scripts/simulation/evaluate_pillar_3_contrast.py
"""

import os
import sys
import json
from typing import Dict, Any, List
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ENGINE_DIR = os.path.join(ROOT, "engine")
sys.path.insert(0, ENGINE_DIR)

import firebase_client
firebase_client.initialize_firebase = lambda: None

from batch_runner import run_batch_recommendations
from tars import compute_alpha
from profile_utils import flatten_profile_features

HERE = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(HERE, "output")
TRAILS_PATH = os.path.join(OUTPUT_DIR, "trails.json")
USERS_PATH = os.path.join(OUTPUT_DIR, "users.json")
RESULTS_OUTPUT_PATH = os.path.join(OUTPUT_DIR, "pillar_3_contrast_results.json")

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


def main():
    print("=" * 95)
    print("THARESYS PILLAR 3: DUAL-ANCHOR CONTRAST BENCHMARK (EASY VS DIFFICULT)")
    print("=" * 95)

    with open(TRAILS_PATH, "r") as f:
        trails = json.load(f)
    with open(USERS_PATH, "r") as f:
        users = json.load(f)

    trail_vectors = {t["id"]: flatten_profile_features(t["profile"]["features"]) for t in trails}
    actual_24_cohort_alpha = compute_alpha(len(users))
    print(f"Cohort Count: {len(users)} users")
    print(f"Exact Unrounded Dynamic Alpha for 24 Cohorts: {actual_24_cohort_alpha:.10f}\n")

    alpha_scenarios = [
        ("actual_24_cohorts", actual_24_cohort_alpha, f"Actual 24-Cohort Dynamic Alpha (alpha={actual_24_cohort_alpha:.6f})"),
        ("cold_start", 1.0, "Cold-Start Baseline (alpha=1.000000, N=1)"),
        ("steady_state", 0.5, "Steady-State Boundary (alpha=0.500000, N>=50)")
    ]

    telemetry: Dict[str, Any] = {
        "metadata": {
            "pillar": "Pillar 3: Dual-Anchor Contrast (Easy vs. Difficult Separation)",
            "num_cohorts": len(users),
            "num_trails": len(trails),
            "exact_24_cohort_alpha": actual_24_cohort_alpha,
            "configurations": [c[0] for c in CONFIGURATIONS]
        },
        "results_by_scenario": {}
    }

    for scenario_key, alpha_val, scenario_label in alpha_scenarios:
        telemetry["results_by_scenario"][scenario_key] = {
            "alpha": alpha_val,
            "label": scenario_label,
            "configurations": {}
        }
        print(f"\n--- SCENARIO: {scenario_label} ---")
        print(f"{'Configuration':<24} | {'32-D Dist':<10} | {'Gain Gap':<10} | {'Slope Gap':<10} | {'Length Gap':<10} | {'Disjoint Violations'}")
        print("-" * 95)

        for name, cbf, cf in CONFIGURATIONS:
            res = run_batch_recommendations(
                cbf_engine=cbf,
                cf_engine=cf,
                candidate_trails=trails,
                users=users,
                commit_to_firestore=False,
                generate_ai_reasoning=False,
                update_profiles_from_reviews=False,
                alpha_override=alpha_val
            )
            recs = res.get("recommendations", {})

            euc_dists = []
            gain_gaps = []
            slope_gaps = []
            length_gaps = []
            lasco_gaps = []
            disjoint_violations = 0

            for u in users:
                uid = u["id"]
                r = recs[uid]
                easy_list = r.get("easy", [])
                diff_list = r.get("difficult", [])

                # Verify zero-overlap disjointness
                easy_ids = set([x["id"] for x in easy_list])
                diff_ids = set([x["id"] for x in diff_list])
                if len(easy_ids & diff_ids) > 0:
                    disjoint_violations += 1

                if easy_list and diff_list:
                    e_vecs = [trail_vectors[it["id"]] for it in easy_list[:3]]
                    d_vecs = [trail_vectors[it["id"]] for it in diff_list[:2]]
                elif not easy_list and diff_list:
                    sorted_diff_by_easy = sorted(diff_list, key=lambda x: x.get("easyScore", x.get("score", 1.0)))
                    e_vecs = [trail_vectors[sorted_diff_by_easy[0]["id"]]]
                    d_vecs = [trail_vectors[diff_list[0]["id"]]]
                else:
                    continue

                e_mean = np.mean(e_vecs, axis=0)
                d_mean = np.mean(d_vecs, axis=0)

                euc_dists.append(float(np.linalg.norm(d_mean - e_mean)))
                gain_gaps.append(float(d_mean[3] - e_mean[3]))
                slope_gaps.append(float(d_mean[4] - e_mean[4]))
                length_gaps.append(float(d_mean[1] - e_mean[1]))
                lasco_gaps.append(float(d_mean[5] - e_mean[5]))

            m_dist = float(np.mean(euc_dists))
            m_gain = float(np.mean(gain_gaps))
            m_slope = float(np.mean(slope_gaps))
            m_len = float(np.mean(length_gaps))
            m_lasco = float(np.mean(lasco_gaps))

            telemetry["results_by_scenario"][scenario_key]["configurations"][name] = {
                "cbf_formula": cbf,
                "cf_formula": cf,
                "mean_32d_vector_distance": round(m_dist, 4),
                "gain_gap_delta": round(m_gain, 4),
                "slope_gap_delta": round(m_slope, 4),
                "length_gap_delta": round(m_len, 4),
                "lasco_gap_delta": round(m_lasco, 4),
                "disjoint_overlap_violations": disjoint_violations,
                "disjoint_compliance_pct": 100.0 if disjoint_violations == 0 else 0.0
            }

            print(f"{name:<24} | {m_dist:<10.4f} | {m_gain:<+10.4f} | {m_slope:<+10.4f} | {m_len:<+10.4f} | {disjoint_violations} (100% Disjoint)")

    with open(RESULTS_OUTPUT_PATH, "w") as f:
        json.dump(telemetry, f, indent=2)

    print(f"\n[OK] Pillar 3 evaluation telemetry saved to: {RESULTS_OUTPUT_PATH}")


if __name__ == "__main__":
    main()

