"""
Pillar 4: Score Discrimination (Dynamic Range & Score Dispersion) Evaluation Runner

Executes the formal benchmark for Pillar 4 of the 4-Pillar Evaluation Framework:
  - Evaluates the dynamic spread (R_max - R_min) and dispersion (Standard Deviation)
    across candidate trails in the catalog.
  - Detects score compression risk (clustering in narrow bands vs active discrimination).
  - Uses the EXACT dynamic alpha computed for 24 cohorts: compute_alpha(24) = 0.7653061224489796.
  - Compares across:
      1. Actual 24-Cohort Dynamic Alpha (alpha = 0.765306...)
      2. Cold-Start Boundary Reference (alpha = 1.0)
      3. Steady-State Boundary Reference (alpha = 0.5)
  - Outputs telemetry to scripts/simulation/output/pillar_4_discrimination_results.json.

Usage:
  engine/venv/Scripts/python.exe scripts/simulation/evaluate_pillar_4_discrimination.py
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

HERE = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(HERE, "output")
TRAILS_PATH = os.path.join(OUTPUT_DIR, "trails.json")
USERS_PATH = os.path.join(OUTPUT_DIR, "users.json")
RESULTS_OUTPUT_PATH = os.path.join(OUTPUT_DIR, "pillar_4_discrimination_results.json")

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
    print("THARESYS PILLAR 4: SCORE DISCRIMINATION BENCHMARK (DYNAMIC RANGE & SPREAD)")
    print("=" * 95)

    with open(TRAILS_PATH, "r") as f:
        trails = json.load(f)
    with open(USERS_PATH, "r") as f:
        users = json.load(f)

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
            "pillar": "Pillar 4: Score Discrimination (Dynamic Range & Score Dispersion)",
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
        print(f"{'Configuration':<24} | {'Assigned Min':<12} | {'Assigned Max':<12} | {'Spread (Range)':<14} | {'Std Dev':<9} | {'Compression Risk'}")
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

            assigned_mins = []
            assigned_maxs = []
            assigned_ranges = []
            assigned_stds = []

            easy_mins = []
            easy_maxs = []
            easy_ranges = []
            easy_stds = []

            diff_mins = []
            diff_maxs = []
            diff_ranges = []
            diff_stds = []

            for u in users:
                r = recs[u["id"]]
                all_items = r.get("easy", []) + r.get("difficult", [])
                scores = [x["score"] for x in all_items]
                assigned_mins.append(min(scores))
                assigned_maxs.append(max(scores))
                assigned_ranges.append(max(scores) - min(scores))
                assigned_stds.append(float(np.std(scores)))

                e_scores = [x.get("easyScore", x["score"]) for x in all_items]
                easy_mins.append(min(e_scores))
                easy_maxs.append(max(e_scores))
                easy_ranges.append(max(e_scores) - min(e_scores))
                easy_stds.append(float(np.std(e_scores)))

                d_scores = [x.get("diffScore", x["score"]) for x in all_items]
                diff_mins.append(min(d_scores))
                diff_maxs.append(max(d_scores))
                diff_ranges.append(max(d_scores) - min(d_scores))
                diff_stds.append(float(np.std(d_scores)))

            m_min = float(np.mean(assigned_mins))
            m_max = float(np.mean(assigned_maxs))
            m_range = float(np.mean(assigned_ranges))
            m_std = float(np.mean(assigned_stds))

            e_min = float(np.mean(easy_mins))
            e_max = float(np.mean(easy_maxs))
            e_range = float(np.mean(easy_ranges))
            e_std = float(np.mean(easy_stds))

            d_min = float(np.mean(diff_mins))
            d_max = float(np.mean(diff_maxs))
            d_range = float(np.mean(diff_ranges))
            d_std = float(np.mean(diff_stds))

            # Score compression check: Low spread (< 0.10) or low std dev (< 0.03)
            is_compressed = bool(m_range < 0.10 or m_std < 0.03)

            telemetry["results_by_scenario"][scenario_key]["configurations"][name] = {
                "cbf_formula": cbf,
                "cf_formula": cf,
                "assigned_score_min": round(m_min, 4),
                "assigned_score_max": round(m_max, 4),
                "assigned_score_spread": round(m_range, 4),
                "assigned_score_std": round(m_std, 4),
                "easy_anchor_min": round(e_min, 4),
                "easy_anchor_max": round(e_max, 4),
                "easy_anchor_spread": round(e_range, 4),
                "easy_anchor_std": round(e_std, 4),
                "diff_anchor_min": round(d_min, 4),
                "diff_anchor_max": round(d_max, 4),
                "diff_anchor_spread": round(d_range, 4),
                "diff_anchor_std": round(d_std, 4),
                "is_score_compressed": is_compressed,
                "discrimination_status": "POOR (Compressed)" if is_compressed else "HEALTHY (Discriminating)"
            }

            status_str = "POOR (Compressed)" if is_compressed else "None (Healthy Spread)"
            print(f"{name:<24} | {m_min:<12.4f} | {m_max:<12.4f} | {m_range:<14.4f} | {m_std:<9.4f} | {status_str}")

    with open(RESULTS_OUTPUT_PATH, "w") as f:
        json.dump(telemetry, f, indent=2)

    print(f"\n[OK] Pillar 4 evaluation telemetry saved to: {RESULTS_OUTPUT_PATH}")


if __name__ == "__main__":
    main()

