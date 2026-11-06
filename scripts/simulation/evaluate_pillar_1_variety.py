"""
Pillar 1: Inter-User Variety (Personalization Diversity) Evaluation Runner

Executes the formal benchmark for Pillar 1 of the 4-Pillar Evaluation Framework:
  - 44 calibrated synthetic user cohorts (24 Normal Baselines + 20 Aberrant Mismatches)
  - 8 candidate trails from the production catalog
  - 9 engine configurations (Pure Gower, Pure Euclidean, Pure Cosine, Hybrid Sets 4-9)
  - Uses the EXACT dynamic alpha computed for 44 cohorts: compute_alpha(44) = 0.5612244898.
  - Compares across:
      1. Actual 44-Cohort Dynamic Alpha (alpha = 0.561224...)
      2. Cold-Start Boundary Reference (alpha = 1.0)
      3. Transitional Reference (alpha = 0.75)
      4. Steady-State Boundary Reference (alpha = 0.5)
  - Evaluates pairwise Jaccard Variety: Variety = 1.0 - (|Recs_A ∩ Recs_B| / |Recs_A ∪ Recs_B|)
  - Outputs full telemetry to scripts/simulation/output/pillar_1_variety_results.json

Usage:
  engine/venv/Scripts/python.exe scripts/simulation/evaluate_pillar_1_variety.py
"""

import os
import sys
import json
import itertools
import argparse
from typing import Dict, Any, List, Set, Tuple
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ENGINE_DIR = os.path.join(ROOT, "engine")
sys.path.insert(0, ENGINE_DIR)

from unittest.mock import MagicMock
sys.modules["firebase_admin"] = MagicMock()
sys.modules["firebase_admin.credentials"] = MagicMock()
sys.modules["firebase_admin.firestore"] = MagicMock()

import firebase_client
firebase_client.initialize_firebase = lambda: None

from batch_runner import run_batch_recommendations
from tars import compute_alpha

HERE = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(HERE, "output")
DEFAULT_TRAILS_PATH = os.path.join(OUTPUT_DIR, "trails.json")
DEFAULT_USERS_PATH = os.path.join(ENGINE_DIR, "data", "seeded_user_sets", "set_1_users.json")
DEFAULT_RESULTS_OUTPUT_PATH = os.path.join(OUTPUT_DIR, "pillar_1_variety_results.json")

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


def extract_top5_dual_anchor(recs_doc: Dict[str, Any]) -> List[str]:
    """Dual-anchor recommendation extraction: Top 3 Easy + Top 2 Difficult (with fallback fill)."""
    e = [x["id"] for x in recs_doc.get("easy", [])]
    d = [x["id"] for x in recs_doc.get("difficult", [])]
    top = e[:3] + d[:max(0, 5 - len(e[:3]))]
    if len(top) < 5:
        top += [x for x in d if x not in top][:5 - len(top)]
    return top


def extract_top3_overall(recs_doc: Dict[str, Any]) -> List[str]:
    """Extracts top 3 items with closest R_tu proximity score across both anchors."""
    all_items = []
    for x in recs_doc.get("easy", []):
        all_items.append((x["id"], x.get("score", 1.0)))
    for x in recs_doc.get("difficult", []):
        all_items.append((x["id"], x.get("score", 1.0)))
    all_items.sort(key=lambda it: it[1])
    return [it[0] for it in all_items[:3]]


def jaccard_variety(s1: Set[str], s2: Set[str]) -> float:
    """Computes Jaccard Dissimilarity: 1.0 - (|s1 ∩ s2| / |s1 ∪ s2|)."""
    inter = len(s1 & s2)
    union = len(s1 | s2)
    return float(1.0 - (inter / union)) if union > 0 else 0.0


def parse_args():
    parser = argparse.ArgumentParser(description="Pillar 1: Inter-User Variety Evaluation")
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

    print("=" * 95)
    print(f"THARESYS PILLAR 1: INTER-USER VARIETY BENCHMARK ({len(CONFIGURATIONS)} CONFIGS)")
    print("=" * 95)
    print(f"Trails catalog: {args.trails}")
    print(f"Users cohort dataset: {users_path}")

    with open(args.trails, "r", encoding="utf-8") as f:
        trails = json.load(f)
    with open(users_path, "r", encoding="utf-8") as f:
        users = json.load(f)

    n_users = len(users)
    actual_cohort_alpha = compute_alpha(n_users)
    print(f"Loaded {n_users} user cohorts and {len(trails)} candidate trails.")
    uids = sorted([u["id"] for u in users])
    user_map = {u["id"]: u for u in users}
    all_pairs = list(itertools.combinations(uids, 2))
    print(f"Total cohort pairwise evaluations per configuration: {len(all_pairs)} pairs")
    print(f"Exact Unrounded Dynamic Alpha for {n_users} Cohorts: {actual_cohort_alpha:.10f}\n")

    alpha_scenarios = [
        ("actual_dynamic_alpha", actual_cohort_alpha, f"Operational Dynamic Alpha (alpha={actual_cohort_alpha:.6f}, N={n_users})"),
        ("cold_start", 1.0, "Cold-Start Baseline (alpha=1.000000, 100% CBF)"),
        ("transitional", 0.75, "Transitional Benchmark (alpha=0.750000, 75% CBF / 25% CF)"),
        ("steady_state", 0.5, "Steady-State Boundary (alpha=0.500000, 50% CBF / 50% CF)")
    ]

    telemetry: Dict[str, Any] = {
        "metadata": {
            "pillar": "Pillar 1: Inter-User Variety (Personalization Diversity)",
            "num_cohorts": n_users,
            "num_trails": len(trails),
            "num_pairs": len(all_pairs),
            "exact_dynamic_alpha": actual_cohort_alpha,
            "users_dataset": users_path,
            "trails_dataset": args.trails,
            "configurations": [c[0] for c in CONFIGURATIONS]
        },
        "results_by_scenario": {}
    }

    # Identify demographic and experimental sub-cohorts
    normal_uids = [u["id"] for u in users if u.get("cohort_group") == "normal"]
    aberrant_uids = [u["id"] for u in users if u.get("cohort_group") == "aberrant"]

    e1_uids = [u["id"] for u in users if u.get("cohort_group") == "normal" and u.get("stated_experience") == "E1"]
    e4_uids = [u["id"] for u in users if u.get("cohort_group") == "normal" and u.get("stated_experience") == "E4"]
    polar_pairs = list(itertools.product(e1_uids, e4_uids))

    def get_user_provinces(u: Dict[str, Any]) -> Set[str]:
        prefs = u.get("preferences", {})
        prov = prefs.get("province", [])
        if isinstance(prov, list):
            return set(prov)
        return {str(prov)}

    cross_prov_pairs = [(u1, u2) for u1, u2 in all_pairs if get_user_provinces(user_map[u1]) != get_user_provinces(user_map[u2])]
    cross_med_pairs = [(u1, u2) for u1, u2 in all_pairs if user_map[u1].get("medical") != user_map[u2].get("medical")]
    ab_vs_norm_pairs = [(u1, u2) for u1, u2 in all_pairs if (u1 in aberrant_uids and u2 in normal_uids) or (u1 in normal_uids and u2 in aberrant_uids)]

    # Target pair resolution
    target_e1_id = next((u["id"] for u in users if "E1-M-P1" in u.get("cohort_id", u["id"])), uids[0])
    target_e4_id = next((u["id"] for u in users if "E4-N-P2" in u.get("cohort_id", u["id"])), uids[-1])

    for scenario_key, alpha_val, scenario_label in alpha_scenarios:
        telemetry["results_by_scenario"][scenario_key] = {
            "alpha": alpha_val,
            "label": scenario_label,
            "configurations": {}
        }
        print(f"\n--- SCENARIO: {scenario_label} ---")
        print(f"{'Configuration':<25} | {'Top-5 Mean':<10} | {'Top-5 Max':<9} | {'Top-3 Mean':<10} | {'E1 vs E4':<9} | {'Med (M/N)':<9} | {'Target Pair'}")
        print("-" * 110)

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

            top5_map = {uid: set(extract_top5_dual_anchor(recs[uid])) for uid in uids}
            top3_map = {uid: set(extract_top3_overall(recs[uid])) for uid in uids}

            # Top-5 pairwise variety
            top5_vars = [jaccard_variety(top5_map[u1], top5_map[u2]) for u1, u2 in all_pairs]
            top3_vars = [jaccard_variety(top3_map[u1], top3_map[u2]) for u1, u2 in all_pairs]

            polar_vars = [jaccard_variety(top5_map[u1], top5_map[u2]) for u1, u2 in polar_pairs] if polar_pairs else [0.0]
            prov_vars = [jaccard_variety(top5_map[u1], top5_map[u2]) for u1, u2 in cross_prov_pairs] if cross_prov_pairs else [0.0]
            med_vars = [jaccard_variety(top5_map[u1], top5_map[u2]) for u1, u2 in cross_med_pairs] if cross_med_pairs else [0.0]
            ab_norm_vars = [jaccard_variety(top5_map[u1], top5_map[u2]) for u1, u2 in ab_vs_norm_pairs] if ab_vs_norm_pairs else [0.0]

            target_top5 = jaccard_variety(top5_map[target_e1_id], top5_map[target_e4_id])
            target_top3 = jaccard_variety(top3_map[target_e1_id], top3_map[target_e4_id])

            m_top5 = float(np.mean(top5_vars))
            max_top5 = float(np.max(top5_vars))
            m_top3 = float(np.mean(top3_vars))
            m_polar = float(np.mean(polar_vars))
            m_med = float(np.mean(med_vars))
            m_prov = float(np.mean(prov_vars))
            m_ab_norm = float(np.mean(ab_norm_vars))

            telemetry["results_by_scenario"][scenario_key]["configurations"][name] = {
                "cbf_formula": cbf,
                "cf_formula": cf,
                "top5_mean_variety": round(m_top5, 4),
                "top5_std_variety": round(float(np.std(top5_vars)), 4),
                "top5_min_variety": round(float(np.min(top5_vars)), 4),
                "top5_max_variety": round(max_top5, 4),
                "top3_mean_variety": round(m_top3, 4),
                "top3_std_variety": round(float(np.std(top3_vars)), 4),
                "top3_max_variety": round(float(np.max(top3_vars)), 4),
                "polar_e1_vs_e4_variety": round(m_polar, 4),
                "cross_medical_variety": round(m_med, 4),
                "cross_province_variety": round(m_prov, 4),
                "aberrant_vs_normal_variety": round(m_ab_norm, 4),
                "target_e1mp1_vs_e4np2_top5": round(target_top5, 4),
                "target_e1mp1_vs_e4np2_top3": round(target_top3, 4),
            }

            print(f"{name:<25} | {m_top5:<10.4f} | {max_top5:<9.4f} | {m_top3:<10.4f} | {m_polar:<9.4f} | {m_med:<9.4f} | Top5: {target_top5:.2f}, Top3: {target_top3:.2f}")

    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(telemetry, f, indent=2)

    print(f"\n[OK] Pillar 1 evaluation telemetry saved to: {args.output}")


if __name__ == "__main__":
    main()



if __name__ == "__main__":
    main()
