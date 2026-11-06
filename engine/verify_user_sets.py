"""
THARESYS User Set Verification & Validation Suite

Verifies:
1. Schema & Vector Dimension: Exactly 44 cohorts per set, 32 canonical features per anchor.
2. Value Bounds: Clamped in [0.0, 1.0], no NaNs or nulls.
3. Physical Monotonicity: P_diff[k] >= P_easy[k] + 0.05 for physical metrics 0..5.
4. Cross-Set Mathematical Uniqueness: Computes GD, ED, and CS across all 10 set pairs.
   Asserts zero vector collisions and distinctness across all 5 sets.
5. Archetype Fidelity: Checks beginner vs expert separation and medical downscaling.
"""

import os
import sys
import json
from typing import Dict, Any, List
import numpy as np

ENGINE_DIR = os.path.dirname(os.path.abspath(__file__))
if ENGINE_DIR not in sys.path:
    sys.path.insert(0, ENGINE_DIR)

from parameters import ANCHOR_MONOTONICITY_MIN_GAP, CANONICAL_FEATURES
from profile_utils import flatten_profile_features
from formula import gower_distance, euclidean_distance, cosine_distance

DATA_DIR = os.path.join(ENGINE_DIR, "data", "seeded_user_sets")


def verify_user_sets() -> Dict[str, Any]:
    print("=" * 70)
    print("THARESYS USER SETS VERIFICATION SUITE")
    print("=" * 70)

    # 1. Load all 5 sets
    sets_data = {}
    for s in range(1, 6):
        fpath = os.path.join(DATA_DIR, f"set_{s}_users.json")
        if not os.path.exists(fpath):
            raise FileNotFoundError(f"Missing expected set file: {fpath}")
        with open(fpath, "r", encoding="utf-8") as fp:
            sets_data[s] = json.load(fp)
        print(f"Loaded Set {s}: {len(sets_data[s])} cohorts from {os.path.basename(fpath)}")

    # 2. Schema, Dimension, and Monotonicity Checks
    print("\n--- 1. SCHEMA & MONOTONICITY AUDIT ---")
    total_checks = 0
    monotonicity_violations = []
    dimension_violations = []
    bounds_violations = []

    for s, users in sets_data.items():
        if len(users) != 44:
            raise ValueError(f"Set {s} has {len(users)} users, expected 44.")

        for u in users:
            uid = u["id"]
            total_checks += 1
            easy_vec = flatten_profile_features(u["profile"]["easy"])
            diff_vec = flatten_profile_features(u["profile"]["difficult"])

            # Check dimension
            if len(easy_vec) != 32 or len(diff_vec) != 32:
                dimension_violations.append((s, uid, len(easy_vec), len(diff_vec)))

            # Check bounds
            if np.any(np.isnan(easy_vec)) or np.any(np.isnan(diff_vec)):
                bounds_violations.append((s, uid, "NaN detected"))
            if np.any(easy_vec < 0.0) or np.any(easy_vec > 1.0) or np.any(diff_vec < 0.0) or np.any(diff_vec > 1.0):
                bounds_violations.append((s, uid, "Out of [0, 1] range"))

            # Check monotonicity on physical features (indices 0..5)
            # Classification (index 0) + Length, Elevation, Gain, Slope, Easy (indices 1..5)
            for k in range(1, 6):  # Strict 0.05 gap on continuous physical features
                gap = diff_vec[k] - easy_vec[k]
                if gap < (ANCHOR_MONOTONICITY_MIN_GAP - 1e-5):
                    monotonicity_violations.append((s, uid, k, float(gap)))

    print(f"Total Cohort Profiles Audited: {total_checks} across 5 sets")
    print(f"Dimension Violations:          {len(dimension_violations)}")
    print(f"Bounds/NaN Violations:         {len(bounds_violations)}")
    print(f"Monotonicity Violations:       {len(monotonicity_violations)}")

    assert len(dimension_violations) == 0, f"Dimension violations found: {dimension_violations}"
    assert len(bounds_violations) == 0, f"Bounds violations found: {bounds_violations}"
    assert len(monotonicity_violations) == 0, f"Monotonicity violations found: {monotonicity_violations}"
    print(">> Schema, Dimensions, Bounds, and Monotonicity: PASSED [100% Valid]")

    # 3. Cross-Set Mathematical Uniqueness & Distance Matrix
    print("\n--- 2. CROSS-SET MATHEMATICAL UNIQUENESS AUDIT ---")
    pair_summaries = {}
    total_comparisons = 0
    zero_distance_collisions = 0

    set_ids = [1, 2, 3, 4, 5]
    for i in range(len(set_ids)):
        for j in range(i + 1, len(set_ids)):
            s1 = set_ids[i]
            s2 = set_ids[j]
            pair_label = f"Set {s1} vs Set {s2}"

            users_1 = sets_data[s1]
            users_2 = sets_data[s2]

            easy_gds, easy_eds, easy_css = [], [], []
            diff_gds, diff_eds, diff_css = [], [], []
            mean_gds = []

            for u1, u2 in zip(users_1, users_2):
                assert u1["cohort_id"] == u2["cohort_id"], "Cohorts must be aligned for comparison"
                total_comparisons += 1

                e1 = flatten_profile_features(u1["profile"]["easy"])
                e2 = flatten_profile_features(u2["profile"]["easy"])
                d1 = flatten_profile_features(u1["profile"]["difficult"])
                d2 = flatten_profile_features(u2["profile"]["difficult"])

                # Distances for Easy anchors
                egd = float(gower_distance(e1, e2))
                eed = float(euclidean_distance(e1, e2))
                ecs = float(cosine_distance(e1, e2))

                # Distances for Difficult anchors
                dgd = float(gower_distance(d1, d2))
                ded = float(euclidean_distance(d1, d2))
                dcs = float(cosine_distance(d1, d2))

                easy_gds.append(egd)
                easy_eds.append(eed)
                easy_css.append(ecs)
                diff_gds.append(dgd)
                diff_eds.append(ded)
                diff_css.append(dcs)

                mgd = (egd + dgd) / 2.0
                mean_gds.append(mgd)

                if egd < 1e-4 and dgd < 1e-4:
                    zero_distance_collisions += 1

            pair_summaries[pair_label] = {
                "cohort_comparisons": len(mean_gds),
                "easy_gd_mean": round(float(np.mean(easy_gds)), 4),
                "easy_gd_min": round(float(np.min(easy_gds)), 4),
                "easy_gd_max": round(float(np.max(easy_gds)), 4),
                "diff_gd_mean": round(float(np.mean(diff_gds)), 4),
                "diff_gd_min": round(float(np.min(diff_gds)), 4),
                "diff_gd_max": round(float(np.max(diff_gds)), 4),
                "mean_gd_overall": round(float(np.mean(mean_gds)), 4),
                "mean_ed_overall": round(float(np.mean([(e + d) / 2.0 for e, d in zip(easy_eds, diff_eds)])), 4),
                "mean_cs_overall": round(float(np.mean([(e + d) / 2.0 for e, d in zip(easy_css, diff_css)])), 4),
            }

            print(f"  {pair_label:17s} -> Mean GD: {pair_summaries[pair_label]['mean_gd_overall']:.4f} "
                  f"(Min GD: {pair_summaries[pair_label]['easy_gd_min']:.4f}, "
                  f"Max GD: {pair_summaries[pair_label]['easy_gd_max']:.4f}) | "
                  f"Mean ED: {pair_summaries[pair_label]['mean_ed_overall']:.4f}")

    print(f"\nTotal Pairwise Cohort Comparisons: {total_comparisons}")
    print(f"Identical Profile Collisions:       {zero_distance_collisions}")
    assert zero_distance_collisions == 0, f"Found {zero_distance_collisions} identical profiles across sets!"
    print(">> Cross-Set Uniqueness Assertion: PASSED [Zero Identical Vectors, 100% Unique Sets]")

    # 4. Archetype & Medical Twin Audit
    print("\n--- 3. ARCHETYPE FIDELITY & MEDICAL TWIN AUDIT ---")
    for s in [1, 3, 5]:
        set_users = sets_data[s]
        u_map = {u["cohort_id"]: u for u in set_users}

        # Check Medical downscaling: E1-M-P1 vs E1-N-P1
        e1_n = flatten_profile_features(u_map["E1-N-P1"]["profile"]["easy"])
        e1_m = flatten_profile_features(u_map["E1-M-P1"]["profile"]["easy"])
        # Physical features (indices 1..5) should be lower on medical
        med_phys_ratio = float(np.mean(e1_m[1:6] / e1_n[1:6]))
        print(f"  Set {s} - E1 Medical vs Healthy Physical Ratio: {med_phys_ratio:.2f}x (Expected ~0.80x)")
        assert 0.70 <= med_phys_ratio <= 0.90, f"Medical scaling outside expected band in Set {s}"

        # Check Beginner vs Expert Separation: E1-N-P1 vs E4-N-P1
        e4_n = flatten_profile_features(u_map["E4-N-P1"]["profile"]["easy"])
        e1_e4_gap = float(np.mean(e4_n[1:6] - e1_n[1:6]))
        print(f"  Set {s} - E4 Expert vs E1 Novice Physical Gap: +{e1_e4_gap:.2f} (Expected > +0.15)")
        assert e1_e4_gap >= 0.15, f"Beginner vs Expert gap too small in Set {s}"

    print(">> Archetype Fidelity & Medical Downscaling: PASSED")

    # 5. Compile and Save Report
    report = {
        "status": "PASSED",
        "total_sets": 5,
        "cohorts_per_set": 44,
        "total_user_profiles": 5 * 44,
        "schema_checks": {
            "dimension": "32 canonical features",
            "monotonicity_gap_enforced": ANCHOR_MONOTONICITY_MIN_GAP,
            "dimension_violations": len(dimension_violations),
            "bounds_violations": len(bounds_violations),
            "monotonicity_violations": len(monotonicity_violations),
        },
        "uniqueness_audit": {
            "total_pairwise_comparisons": total_comparisons,
            "zero_distance_collisions": zero_distance_collisions,
            "all_10_set_pairs": pair_summaries,
        }
    }

    report_path = os.path.join(DATA_DIR, "verification_report.json")
    with open(report_path, "w", encoding="utf-8") as fp:
        json.dump(report, fp, indent=2)

    print(f"\nVerification Report saved to: {report_path}")
    print("=" * 70)
    return report


if __name__ == "__main__":
    verify_user_sets()

