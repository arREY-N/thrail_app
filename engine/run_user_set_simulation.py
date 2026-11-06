"""
THARESYS User Set Simulation Runner & UI Activator

Runs multi-cycle evaluation across any of the 5 seeded user sets, logs cycle-by-cycle
convergence metrics, and optionally activates the results directly into the UI.

Usage:
    # 1. Run with 8 Real Benchmark Trails (Default):
    .venv\\Scripts\\python.exe engine\\run_user_set_simulation.py --set 1 --cycles 20

    # 2. Run with 40 Synthetic Trails (Seed 42):
    .venv\\Scripts\\python.exe engine\\run_user_set_simulation.py --set 1 --cycles 20 --trails seed42

    # 3. Run with 40 Alternate Synthetic Trails (Seed 7):
    .venv\\Scripts\\python.exe engine\\run_user_set_simulation.py --set 1 --cycles 20 --trails seed7

    # 4. Run with Full 88-Trail Expanded Catalog (8 Real + 80 Synthetic):
    .venv\\Scripts\\python.exe engine\\run_user_set_simulation.py --set 1 --cycles 20 --trails 88

    # 5. Run with explicit trail file path & activate Superadmin UI:
    .venv\\Scripts\\python.exe engine\\run_user_set_simulation.py --set 1 --cycles 20 --trails scripts/simulation/trail_simulation/inputs/catalog_seed42.json --activate-ui

    # 6. Dynamically tune engine hyperparameters via CLI flags:
    .venv\\Scripts\\python.exe engine\\run_user_set_simulation.py --set 1 --trails 8 --cycles 6 --beta-divisor 3.0 --beta-decay 0.05 --freeze-on-exhaustion
    .venv\\Scripts\\python.exe engine\\run_user_set_simulation.py --set 1 --trails 88 --cycles 20 --cf-k 8 --alpha-override 0.50 --activate-ui
"""

import os
import sys
import json
import csv
import copy
import shutil
import argparse
from typing import Dict, Any, List, Set
import numpy as np

ENGINE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(ENGINE_DIR, ".."))
if ENGINE_DIR not in sys.path:
    sys.path.insert(0, ENGINE_DIR)

# Mock firebase_admin modules if running offline/without firebase-admin package
from unittest.mock import MagicMock
sys.modules["firebase_admin"] = MagicMock()
sys.modules["firebase_admin.credentials"] = MagicMock()
sys.modules["firebase_admin.firestore"] = MagicMock()

import firebase_client
firebase_client.initialize_firebase = lambda: None

from batch_runner import run_batch_recommendations
from formula import gower_distance, euclidean_distance, cosine_distance
from profile_utils import flatten_profile_features
from parameters import (
    BETA_LEARNING_RATE_DIVISOR,
    ALPHA_COLD_START,
    ALPHA_STEADY_STATE,
    ALPHA_STEADY_STATE_USER_THRESHOLD,
    CF_TOP_K,
    CF_DISTANCE_CUTOFF_TAU,
    ANCHOR_MONOTONICITY_MIN_GAP,
    REVIEW_ACTIVE_FACTOR_WEIGHT,
    REVIEW_BASELINE_UNSELECTED_WEIGHT,
    TERRAIN_PRESENCE_THRESHOLD,
)

DATA_DIR = os.path.join(ENGINE_DIR, "data", "seeded_user_sets")
APP_DATA_DIR = os.path.join(ROOT_DIR, "src", "recommendation", "data")

# Available Trail Catalog Presets
TRAIL_PRESETS = {
    # 8 Real Benchmark Trails (Default)
    "8": os.path.join(ROOT_DIR, "scripts", "simulation", "output", "trails.json"),
    "real": os.path.join(ROOT_DIR, "scripts", "simulation", "output", "trails.json"),
    "benchmark": os.path.join(ROOT_DIR, "scripts", "simulation", "output", "trails.json"),

    # 40-Trail Synthetic Topologies
    "40": os.path.join(ROOT_DIR, "scripts", "simulation", "trail_simulation", "inputs", "catalog_seed42.json"),
    "seed42": os.path.join(ROOT_DIR, "scripts", "simulation", "trail_simulation", "inputs", "catalog_seed42.json"),
    "seed7": os.path.join(ROOT_DIR, "scripts", "simulation", "trail_simulation", "inputs", "catalog_seed7.json"),

    # 88-Trail Expanded Catalog (8 Real Benchmark + 80 Synthetic)
    "88": os.path.join(ROOT_DIR, "src", "recommendation", "data", "trailSimulationCatalog.json"),
    "expanded": os.path.join(ROOT_DIR, "src", "recommendation", "data", "trailSimulationCatalog.json"),
}

DEFAULT_TRAILS_PATH = TRAIL_PRESETS["8"]

# Parameter Configuration Presets for Empirical Testing
PARAMETER_PRESETS = {
    # 1. Baseline Tuned Engine Defaults (from parameters.py / configuration.md)
    "baseline": {
        "beta_divisor": BETA_LEARNING_RATE_DIVISOR,  # 1.65
        "beta_decay": 0.0,
        "alpha_override": None,
        "alpha_steady_state": ALPHA_STEADY_STATE,  # 0.50
        "alpha_cold_start": ALPHA_COLD_START,      # 1.00
        "alpha_threshold": ALPHA_STEADY_STATE_USER_THRESHOLD,  # 50
        "cf_k": CF_TOP_K,                          # 5
        "cf_tau": CF_DISTANCE_CUTOFF_TAU,          # 0.35
        "monotonicity_min_gap": ANCHOR_MONOTONICITY_MIN_GAP,  # 0.05
        "review_active_weight": REVIEW_ACTIVE_FACTOR_WEIGHT,  # 1.00
        "review_baseline_weight": REVIEW_BASELINE_UNSELECTED_WEIGHT,  # 0.22
        "terrain_presence_threshold": TERRAIN_PRESENCE_THRESHOLD,      # 0.30
        "freeze_on_exhaustion": False,
        "description": "Baseline calibrated configuration from configuration.md"
    },

    # 2. Optimized for Small Sparse Catalogs (e.g. 8 Real Trails)
    "small-catalog": {
        "beta_divisor": 3.50,
        "beta_decay": 0.08,
        "alpha_override": None,
        "alpha_steady_state": 0.50,
        "alpha_cold_start": 1.00,
        "alpha_threshold": 50,
        "cf_k": 5,
        "cf_tau": 0.35,
        "monotonicity_min_gap": 0.05,
        "review_active_weight": 0.80,
        "review_baseline_weight": 0.15,
        "terrain_presence_threshold": 0.30,
        "freeze_on_exhaustion": True,
        "description": "Damped learning with cycle decay and exhaustion freezing to prevent runaway repetition drift on 8 trails"
    },

    # 3. Responsive Aberrant Correction (Fast Error Correction)
    "responsive": {
        "beta_divisor": 1.30,
        "beta_decay": 0.0,
        "alpha_override": 1.00,
        "alpha_steady_state": 0.50,
        "alpha_cold_start": 1.00,
        "alpha_threshold": 50,
        "cf_k": 5,
        "cf_tau": 0.35,
        "monotonicity_min_gap": 0.06,
        "review_active_weight": 1.20,
        "review_baseline_weight": 0.28,
        "terrain_presence_threshold": 0.25,
        "freeze_on_exhaustion": False,
        "description": "Aggressive learning rate and pure CBF to maximize error correction speed for miscalibrated cohorts"
    },

    # 4. Asymptotic Equilibrium (Long-Horizon Stability for 20-24 cycles)
    "equilibrium": {
        "beta_divisor": 2.50,
        "beta_decay": 0.02,
        "alpha_override": None,
        "alpha_steady_state": 0.40,
        "alpha_cold_start": 1.00,
        "alpha_threshold": 40,
        "cf_k": 8,
        "cf_tau": 0.35,
        "monotonicity_min_gap": 0.05,
        "review_active_weight": 0.65,
        "review_baseline_weight": 0.18,
        "terrain_presence_threshold": 0.35,
        "freeze_on_exhaustion": False,
        "description": "Smooth asymptotic glide into catalog resolution floor with zero bounce-back over 20-24 cycles"
    },

    # 5. Collaborative-Heavy Community Blend (CF Dominance)
    "cf-heavy": {
        "beta_divisor": 2.00,
        "beta_decay": 0.0,
        "alpha_override": 0.35,
        "alpha_steady_state": 0.30,
        "alpha_cold_start": 0.70,
        "alpha_threshold": 30,
        "cf_k": 10,
        "cf_tau": 0.40,
        "monotonicity_min_gap": 0.05,
        "review_active_weight": 0.85,
        "review_baseline_weight": 0.20,
        "terrain_presence_threshold": 0.30,
        "freeze_on_exhaustion": False,
        "description": "65% Collaborative Filtering weighting with expanded 10-peer neighborhood to test community similarity dynamics"
    },

    # 6. Content-Strict Conservative (Strict Monotonicity & Safety Barrier)
    "content-strict": {
        "beta_divisor": 2.20,
        "beta_decay": 0.0,
        "alpha_override": 1.00,
        "alpha_steady_state": 1.00,
        "alpha_cold_start": 1.00,
        "alpha_threshold": 50,
        "cf_k": 5,
        "cf_tau": 0.35,
        "monotonicity_min_gap": 0.08,
        "review_active_weight": 0.75,
        "review_baseline_weight": 0.18,
        "terrain_presence_threshold": 0.30,
        "freeze_on_exhaustion": False,
        "description": "100% Content-Based Filtering with strict 0.08 physical capability barrier between Easy and Difficult anchors"
    }
}

COVERED_INDICES = [0, 1, 2, 3, 4, 5, 11, 12, 13, 14]
PHYSICAL_KEYS = ["length", "elevation", "gain", "slope", "easy"]


def resolve_trails_path(trails_arg: str) -> str:
    """Resolves a trail preset name or explicit path to a valid JSON file."""
    if not trails_arg:
        return DEFAULT_TRAILS_PATH
    key = str(trails_arg).strip().lower()
    if key in TRAIL_PRESETS:
        return TRAIL_PRESETS[key]
    if os.path.exists(trails_arg):
        return os.path.abspath(trails_arg)
    rel_path = os.path.join(ROOT_DIR, trails_arg)
    if os.path.exists(rel_path):
        return rel_path
    raise FileNotFoundError(f"Trail catalog '{trails_arg}' not found. Available presets: {list(TRAIL_PRESETS.keys())}")


def extract_covered_10d(vec_32: np.ndarray) -> np.ndarray:
    return np.array([float(vec_32[i]) for i in COVERED_INDICES], dtype=np.float32)


def build_gt_covered_vector(gt_dict: Dict[str, Any]) -> np.ndarray:
    keys = ["classification", "length", "elevation", "gain", "slope", "easy", "muddy", "rocky", "grassland", "ridges"]
    return np.array([float(gt_dict.get(k, 0.0) or 0.0) for k in keys], dtype=np.float32)


def run_simulation(
    users_filepath: str,
    trails_filepath: str = DEFAULT_TRAILS_PATH,
    cycles: int = 10,
    cbf_engine: str = "GD",
    cf_engine: str = "GD",
    # Dynamic Engine Hyperparameters
    beta_divisor: float = BETA_LEARNING_RATE_DIVISOR,
    beta_decay: float = 0.0,
    alpha_override: Any = None,
    alpha_steady_state: float = ALPHA_STEADY_STATE,
    alpha_cold_start: float = ALPHA_COLD_START,
    alpha_threshold: int = ALPHA_STEADY_STATE_USER_THRESHOLD,
    cf_k: int = CF_TOP_K,
    cf_tau: float = CF_DISTANCE_CUTOFF_TAU,
    monotonicity_min_gap: float = ANCHOR_MONOTONICITY_MIN_GAP,
    review_active_weight: float = REVIEW_ACTIVE_FACTOR_WEIGHT,
    review_baseline_weight: float = REVIEW_BASELINE_UNSELECTED_WEIGHT,
    terrain_presence_threshold: float = TERRAIN_PRESENCE_THRESHOLD,
    freeze_on_exhaustion: bool = False,
    activate_ui: bool = False,
    output_dir: str = None
) -> Dict[str, Any]:
    resolved_trails_path = resolve_trails_path(trails_filepath)

    # 1. Load users and trails
    with open(users_filepath, "r", encoding="utf-8") as f:
        users = json.load(f)

    with open(resolved_trails_path, "r", encoding="utf-8") as f:
        trails_raw = json.load(f)
        trails = trails_raw.get("trails", trails_raw) if isinstance(trails_raw, dict) else trails_raw

    out_dir = output_dir or os.path.join(DATA_DIR, "simulation_output")
    os.makedirs(out_dir, exist_ok=True)

    base_year = 2026
    base_month = 10
    months = []
    for m in range(cycles + 1):
        cur_m = base_month + m
        cur_y = base_year + (cur_m - 1) // 12
        cur_m_norm = ((cur_m - 1) % 12) + 1
        months.append(f"{cur_y:04d}-{cur_m_norm:02d}")

    print("=" * 70)
    print("THARESYS USER SET MULTI-CYCLE SIMULATION")
    print("=" * 70)
    print(f"Users Source:  {users_filepath} ({len(users)} cohorts)")
    print(f"Trails Source: {resolved_trails_path} ({len(trails)} candidate trails)")
    print(f"Cycles:        {cycles} monthly hikes ({len(months)} batches: {months[0]} -> {months[-1]})")
    print(f"Engines:       CBF={cbf_engine}, CF={cf_engine}")
    print(f"Parameters:    beta_divisor={beta_divisor} (decay={beta_decay}), alpha_override={alpha_override}, cf_k={cf_k}, cf_tau={cf_tau}")
    print(f"Weights/Gaps:  active_w={review_active_weight}, baseline_w={review_baseline_weight}, min_gap={monotonicity_min_gap}, freeze_exhaust={freeze_on_exhaustion}")
    print("=" * 70)

    # Pre-extract trail vectors
    trail_by_id = {str(t["id"]): t for t in trails}
    trail_10d_map = {str(t["id"]): extract_covered_10d(flatten_profile_features(t.get("profile", t))) for t in trails}

    # Simulation state per user
    user_hikes_map: Dict[str, Set[str]] = {u["id"]: set() for u in users}
    user_hike_history: Dict[str, List[str]] = {u["id"]: [] for u in users}
    user_reviews_map: Dict[str, List[Dict[str, Any]]] = {u["id"]: [] for u in users}
    prev_recommendations_map: Dict[str, Dict[str, Any]] = {}
    user_cycle_telemetry: Dict[str, List[Dict[str, Any]]] = {u["id"]: [] for u in users}

    # Execute simulation cycle by cycle
    for cycle_idx, active_month in enumerate(months):
        effective_beta_divisor = beta_divisor * (1.0 + beta_decay * cycle_idx) if beta_decay > 0 else beta_divisor

        batch_report = run_batch_recommendations(
            cbf_engine=cbf_engine,
            cf_engine=cf_engine,
            month_id=active_month,
            candidate_trails=trails,
            users=users,
            user_hikes_map=user_hikes_map,
            user_reviews_map=user_reviews_map,
            prev_recommendations_map=prev_recommendations_map,
            commit_to_firestore=False,
            generate_ai_reasoning=False,
            update_profiles_from_reviews=True,
            cf_k=cf_k,
            cf_tau=cf_tau,
            alpha_override=alpha_override,
            alpha_steady_state=alpha_steady_state,
            alpha_cold_start=alpha_cold_start,
            alpha_threshold=alpha_threshold,
            beta_divisor=effective_beta_divisor,
            monotonicity_min_gap=monotonicity_min_gap,
            review_active_weight=review_active_weight,
            review_baseline_weight=review_baseline_weight,
            terrain_presence_threshold=terrain_presence_threshold
        )

        current_recos = batch_report["recommendations"]
        prev_recommendations_map = current_recos

        # Process each user's telemetry & simulate hike for this cycle
        for u in users:
            uid = u["id"]
            reco_doc = current_recos.get(uid, {})
            u_prof = reco_doc.get("profile") or u["profile"]
            # Carry adapted profile forward on the user record for subsequent cycles
            u["profile"] = copy.deepcopy(u_prof)

            e_32 = flatten_profile_features(u_prof["easy"])
            d_32 = flatten_profile_features(u_prof["difficult"])
            e_10 = extract_covered_10d(e_32)
            d_10 = extract_covered_10d(d_32)

            gt_easy_10 = build_gt_covered_vector(u["groundTruth"]["easy"])
            gt_diff_10 = build_gt_covered_vector(u["groundTruth"]["difficult"])

            easy_gd = float(gower_distance(e_10, gt_easy_10))
            diff_gd = float(gower_distance(d_10, gt_diff_10))
            easy_ed = float(euclidean_distance(e_10, gt_easy_10))
            diff_ed = float(euclidean_distance(d_10, gt_diff_10))
            easy_cs = float(cosine_distance(e_10, gt_easy_10))
            diff_cs = float(cosine_distance(d_10, gt_diff_10))
            mean_gd = round((easy_gd + diff_gd) / 2.0, 4)
            mean_ed = round((easy_ed + diff_ed) / 2.0, 4)
            mean_cs = round((easy_cs + diff_cs) / 2.0, 4)

            easy_recs = reco_doc.get("easy", [])
            diff_recs = reco_doc.get("difficult", [])

            def fmt_reco(r):
                tid = str(r.get("id"))
                tdoc = trail_by_id.get(tid, {})
                tname = tdoc.get("general", {}).get("name") or tdoc.get("name") or r.get("name") or f"Trail {tid[:6]}"
                return {
                    "id": tid,
                    "trailName": str(tname),
                    "score": round(float(r.get("score") or r.get("cbfScore") or 0.0), 4)
                }

            formatted_easy = [fmt_reco(r) for r in easy_recs[:10]]
            formatted_diff = [fmt_reco(r) for r in diff_recs[:10]]

            # If not terminal cycle, pick a trail and simulate review for next cycle
            hiked_obj = None
            review_obj = None
            if cycle_idx < cycles:
                stated_tier = int(u.get("stated_tier", 1))
                # Cadence: E1/E2 prefer easy (2 easy, 1 diff); E3/E4 prefer difficult (2 diff, 1 easy)
                if stated_tier in (1, 2):
                    target_slot = "difficult" if ((cycle_idx + 1) % 3 == 0) else "easy"
                else:
                    target_slot = "easy" if ((cycle_idx + 1) % 3 == 0) else "difficult"

                # Pick unhiked trails first; if all hiked, pick least recently completed
                unhiked_easy = [r for r in easy_recs if str(r.get("id")) not in user_hikes_map[uid]]
                unhiked_diff = [r for r in diff_recs if str(r.get("id")) not in user_hikes_map[uid]]

                def pick_least_recent(pool):
                    if not pool:
                        return None
                    history = user_hike_history[uid]
                    def last_hike_pos(item):
                        tid = str(item.get("id"))
                        try:
                            return len(history) - 1 - history[::-1].index(tid)
                        except ValueError:
                            return -1
                    return min(pool, key=last_hike_pos)

                if target_slot == "easy":
                    if unhiked_easy:
                        picked_item = unhiked_easy[0]
                    elif unhiked_diff:
                        picked_item = unhiked_diff[0]
                    else:
                        picked_item = pick_least_recent(easy_recs or diff_recs)
                else:
                    if unhiked_diff:
                        picked_item = unhiked_diff[0]
                    elif unhiked_easy:
                        picked_item = unhiked_easy[0]
                    else:
                        picked_item = pick_least_recent(diff_recs or easy_recs)

                if picked_item:
                    picked_tid = str(picked_item["id"])
                    user_hikes_map[uid].add(picked_tid)
                    user_hike_history[uid].append(picked_tid)

                    tdoc = trail_by_id.get(picked_tid, {})
                    picked_name = tdoc.get("general", {}).get("name") or tdoc.get("name") or f"Trail {picked_tid[:6]}"
                    picked_score = round(float(picked_item.get("score") or picked_item.get("cbfScore") or 0.0), 4)

                    # Determine review experience based on true Ground Truth
                    t_10 = trail_10d_map[picked_tid]
                    target_gt = gt_easy_10 if target_slot == "easy" else gt_diff_10
                    strain = float(np.mean(t_10[1:6] - target_gt[1:6]))

                    if target_slot == "easy":
                        if strain > 0.12:
                            is_match = False
                            perceived = "Difficult"
                            factors = ["The trail slope is noticeable", "The length is exhausting"]
                        else:
                            is_match = True
                            perceived = "Easy"
                            factors = ["The trail slope is manageable", "The length is just right"]
                    else:
                        underwhelming_check = float(np.mean(target_gt[1:6] - t_10[1:6]))
                        if strain > 0.15:
                            is_match = False
                            perceived = "Exhausting"
                            factors = ["The trail slope is exhausting", "The elevation climb is difficult"]
                        elif underwhelming_check > 0.18:
                            is_match = False
                            perceived = "Easy"
                            factors = ["The trail slope is gentle", "The length is short"]
                        else:
                            is_match = True
                            perceived = "Difficult"
                            factors = ["The trail slope is challenging", "The length is just right"]

                    hiked_obj = {
                        "id": picked_tid,
                        "trailId": picked_tid,
                        "trailName": picked_name,
                        "targetAnchor": target_slot,
                        "targetSlot": target_slot,
                        "score": picked_score,
                        "isMatch": is_match,
                    }

                    review_obj = {
                        "perceivedDifficulty": perceived,
                        "difficultyFactors": factors,
                        "primaryFactorKey": "slope",
                        "rawExperience": perceived,
                        "isMatch": is_match,
                        "targetAnchor": target_slot,
                    }

                    batch_review = {
                        "id": f"rev_{uid}_{cycle_idx}",
                        "trail": {"id": picked_tid},
                        "perceivedDifficulty": perceived,
                        "is_match": is_match,
                        "difficultyFactors": factors,
                        "createdAt": f"{active_month}-15T10:00:00Z",
                    }
                    # Exhaustion gating: freeze profile updates once user has hiked all eligible trails
                    is_exhausted = False
                    if freeze_on_exhaustion:
                        user_provs = [p.lower() for p in u.get("preferences", {}).get("province", [])]
                        eligible_ids = set()
                        for t in trails:
                            t_feats = t.get("profile", {}).get("features", {})
                            t_provs = [p.lower() for p, v in t_feats.get("province", {}).items() if v > 0]
                            if any(p in user_provs for p in t_provs):
                                eligible_ids.add(str(t["id"]))
                        if not eligible_ids:
                            eligible_ids = set(str(t["id"]) for t in trails)
                        if eligible_ids.issubset(user_hikes_map[uid]):
                            is_exhausted = True

                    if is_exhausted:
                        user_reviews_map[uid] = []
                    else:
                        user_reviews_map[uid] = [batch_review]

            user_cycle_telemetry[uid].append({
                "cycle": cycle_idx,
                "month": active_month,
                "profile": copy.deepcopy(u_prof),
                "distances": {
                    "easy": {"gd": round(easy_gd, 4), "ed": round(easy_ed, 4), "cs": round(easy_cs, 4)},
                    "difficult": {"gd": round(diff_gd, 4), "ed": round(diff_ed, 4), "cs": round(diff_cs, 4)},
                    "diff": {"gd": round(diff_gd, 4), "ed": round(diff_ed, 4), "cs": round(diff_cs, 4)},
                    "easy_gd": round(easy_gd, 4),
                    "diff_gd": round(diff_gd, 4),
                    "mean_gd": mean_gd,
                    "mean_ed": mean_ed,
                    "mean_cs": mean_cs,
                },
                "rec_alignment_rate": 1.0 if (hiked_obj and hiked_obj.get("isMatch")) else (0.5 if not hiked_obj else 0.0),
                "recommendations": {
                    "easy": formatted_easy,
                    "difficult": formatted_diff,
                },
                "hiked": hiked_obj,
                "review": review_obj,
            })

    # Package simulatedUsers.json for UI
    simulated_users_bundle = []
    for u in users:
        uid = u["id"]
        entry = copy.deepcopy(u)
        entry["cycleHistory"] = user_cycle_telemetry[uid]
        start_gd = entry["cycleHistory"][0]["distances"]["mean_gd"]
        end_gd = entry["cycleHistory"][-1]["distances"]["mean_gd"]
        delta_gd = round(end_gd - start_gd, 4)
        entry["convergence"] = {
            "start_gd": start_gd,
            "end_gd": end_gd,
            "ctrl_end_gd": start_gd,
            "delta_gd": delta_gd,
            "has_converged": bool(end_gd < start_gd),
        }
        simulated_users_bundle.append(entry)

    # Print terminal convergence summary table
    print("\n" + "=" * 78)
    print(f"{'User ID':<18} | {'Group':<10} | {'Start GD':<9} | {'End GD':<9} | {'Delta GD':<9} | {'Status'}")
    print("-" * 78)
    for u in simulated_users_bundle[:10]:
        c = u["convergence"]
        status = "CONVERGED" if c["has_converged"] else "DIVERGED"
        print(f"{u['id']:<18} | {u.get('cohort_group', 'normal'):<10} | {c['start_gd']:<9.4f} | {c['end_gd']:<9.4f} | {c['delta_gd']:<+9.4f} | {status}")
    if len(simulated_users_bundle) > 10:
        print(f"... and {len(simulated_users_bundle) - 10} more cohorts.")
    mean_start = float(np.mean([u["convergence"]["start_gd"] for u in simulated_users_bundle]))
    mean_end = float(np.mean([u["convergence"]["end_gd"] for u in simulated_users_bundle]))
    mean_delta = float(np.mean([u["convergence"]["delta_gd"] for u in simulated_users_bundle]))
    converged_count = sum(1 for u in simulated_users_bundle if u["convergence"]["has_converged"])
    print("-" * 78)
    print(f"Overall Cohort Mean: Start GD={mean_start:.4f} -> End GD={mean_end:.4f} (Delta={mean_delta:+.4f})")
    print(f"Convergence Success: {converged_count}/{len(simulated_users_bundle)} cohorts ({converged_count/len(simulated_users_bundle)*100:.1f}%)")
    print("=" * 78)

    # Save output artifacts
    users_out_path = os.path.join(out_dir, "simulatedUsers.json")
    with open(users_out_path, "w", encoding="utf-8") as f:
        json.dump(simulated_users_bundle, f, indent=2)

    harness_out_path = os.path.join(out_dir, "simulationHarnessResults.json")
    harness_payload = {
        "metadata": {
            "source_users_file": os.path.basename(users_filepath),
            "source_trails_file": os.path.basename(resolved_trails_path),
            "total_users": len(users),
            "total_trails": len(trails),
            "cycles": cycles,
            "months": months,
            "cbf": cbf_engine,
            "cf": cf_engine,
            "beta_divisor": beta_divisor,
            "beta_decay": beta_decay,
            "alpha_override": alpha_override,
            "alpha_steady_state": alpha_steady_state,
            "alpha_cold_start": alpha_cold_start,
            "alpha_threshold": alpha_threshold,
            "cf_k": cf_k,
            "cf_tau": cf_tau,
            "monotonicity_min_gap": monotonicity_min_gap,
            "review_active_weight": review_active_weight,
            "review_baseline_weight": review_baseline_weight,
            "terrain_presence_threshold": terrain_presence_threshold,
            "freeze_on_exhaustion": freeze_on_exhaustion,
        },
        "users": simulated_users_bundle
    }
    with open(harness_out_path, "w", encoding="utf-8") as f:
        json.dump(harness_payload, f, indent=2)

    print(f"\n[OK] Simulation artifacts generated in: {out_dir}")
    print(f"  - simulatedUsers.json ({len(simulated_users_bundle)} cohorts with full cycleHistory)")
    print(f"  - simulationHarnessResults.json")

    # If activate_ui flag is passed, copy directly to src/recommendation/data/
    if activate_ui:
        os.makedirs(APP_DATA_DIR, exist_ok=True)
        dst_users = os.path.join(APP_DATA_DIR, "simulatedUsers.json")
        dst_harness = os.path.join(APP_DATA_DIR, "simulationHarnessResults.json")
        shutil.copy2(users_out_path, dst_users)
        shutil.copy2(harness_out_path, dst_harness)
        print(f"\n[UI ACTIVATED] Copied simulation results into App UI data:")
        print(f"  -> {dst_users}")
        print(f"  -> {dst_harness}")
        print(f"The Superadmin 'Simulation' tab will now display this simulation run immediately!")

    return harness_payload


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="THARESYS Seeded User Set Simulation & UI Runner")
    # Dataset Selection
    parser.add_argument("--set", type=int, choices=[1, 2, 3, 4, 5], default=None, help="Index of seeded user set (1..5)")
    parser.add_argument("--users", type=str, default=None, help="Explicit path to a users JSON file")
    parser.add_argument("--trails", type=str, default="8", help="Trail preset ('8', '40', 'seed42', 'seed7', '88') or path to JSON catalog")
    parser.add_argument("--cycles", type=int, default=10, help="Number of monthly cycles (default: 10)")
    parser.add_argument("--cbf", type=str, default="GD", help="CBF formula ('GD', 'ED', 'CS')")
    parser.add_argument("--cf", type=str, default="GD", help="CF formula ('GD', 'ED', 'CS')")

    # Parameter Preset Selection
    parser.add_argument(
        "--preset",
        type=str,
        choices=list(PARAMETER_PRESETS.keys()),
        default=None,
        help="Use a named parameter configuration preset: 'baseline', 'small-catalog', 'responsive', 'equilibrium', 'cf-heavy', 'content-strict'"
    )

    # Engine Hyperparameters (Forwarded directly to batch_runner)
    parser.add_argument("--beta-divisor", type=float, default=BETA_LEARNING_RATE_DIVISOR, help=f"Learning rate divisor for beta (default: {BETA_LEARNING_RATE_DIVISOR})")
    parser.add_argument("--beta-decay", type=float, default=0.0, help="Cycle decay rate for beta updates (e.g. 0.05 or 0.10, default: 0.0)")
    parser.add_argument("--alpha-override", type=float, default=None, help="Explicit alpha weight between CBF and CF (0.0 to 1.0, default: None)")
    parser.add_argument("--alpha-steady-state", type=float, default=ALPHA_STEADY_STATE, help=f"Minimum alpha reached as user count matures (default: {ALPHA_STEADY_STATE})")
    parser.add_argument("--alpha-cold-start", type=float, default=ALPHA_COLD_START, help=f"Initial alpha weight for new users/cold start (default: {ALPHA_COLD_START})")
    parser.add_argument("--alpha-threshold", type=int, default=ALPHA_STEADY_STATE_USER_THRESHOLD, help=f"User threshold to reach alpha steady state (default: {ALPHA_STEADY_STATE_USER_THRESHOLD})")
    parser.add_argument("--cf-k", type=int, default=CF_TOP_K, help=f"Number of peer neighbors for CF (default: {CF_TOP_K})")
    parser.add_argument("--cf-tau", type=float, default=CF_DISTANCE_CUTOFF_TAU, help=f"Distance cutoff tau for CF peers (default: {CF_DISTANCE_CUTOFF_TAU})")
    parser.add_argument("--monotonicity-gap", type=float, default=ANCHOR_MONOTONICITY_MIN_GAP, help=f"Minimum physical gap between Easy and Difficult anchors (default: {ANCHOR_MONOTONICITY_MIN_GAP})")
    parser.add_argument("--review-active-weight", type=float, default=REVIEW_ACTIVE_FACTOR_WEIGHT, help=f"Weight for review-mentioned factors (default: {REVIEW_ACTIVE_FACTOR_WEIGHT})")
    parser.add_argument("--review-baseline-weight", type=float, default=REVIEW_BASELINE_UNSELECTED_WEIGHT, help=f"Weight for unmentioned physical factors (default: {REVIEW_BASELINE_UNSELECTED_WEIGHT})")
    parser.add_argument("--terrain-presence-threshold", type=float, default=TERRAIN_PRESENCE_THRESHOLD, help=f"Presence gating cutoff for terrain features (default: {TERRAIN_PRESENCE_THRESHOLD})")
    parser.add_argument("--freeze-on-exhaustion", action="store_true", help="Freeze profile updates once a user exhausts all eligible trails")

    # Output & UI
    parser.add_argument("--activate-ui", action="store_true", help="Copy results directly into app UI (src/recommendation/data/)")
    args = parser.parse_args()

    if args.users:
        target_path = args.users
    elif args.set is not None:
        target_path = os.path.join(DATA_DIR, f"set_{args.set}_users.json")
    else:
        target_path = os.path.join(DATA_DIR, "set_1_users.json")

    if not os.path.exists(target_path):
        print(f"Error: Target users file not found at: {target_path}")
        sys.exit(1)

    # Resolve preset values if --preset flag was provided
    preset_dict = PARAMETER_PRESETS.get(args.preset, {}) if args.preset else {}
    def get_param(cli_val, preset_key, fallback_default):
        cli_flag = "--" + preset_key.replace("_", "-")
        has_cli = any(arg.startswith(cli_flag) for arg in sys.argv)
        if has_cli:
            return cli_val
        if preset_key in preset_dict:
            return preset_dict[preset_key]
        return cli_val if cli_val is not None else fallback_default

    resolved_beta_divisor = get_param(args.beta_divisor, "beta_divisor", BETA_LEARNING_RATE_DIVISOR)
    resolved_beta_decay = get_param(args.beta_decay, "beta_decay", 0.0)
    resolved_alpha_override = get_param(args.alpha_override, "alpha_override", None)
    resolved_alpha_steady = get_param(args.alpha_steady_state, "alpha_steady_state", ALPHA_STEADY_STATE)
    resolved_alpha_cold = get_param(args.alpha_cold_start, "alpha_cold_start", ALPHA_COLD_START)
    resolved_alpha_thresh = get_param(args.alpha_threshold, "alpha_threshold", ALPHA_STEADY_STATE_USER_THRESHOLD)
    resolved_cf_k = get_param(args.cf_k, "cf_k", CF_TOP_K)
    resolved_cf_tau = get_param(args.cf_tau, "cf_tau", CF_DISTANCE_CUTOFF_TAU)
    resolved_mono_gap = get_param(args.monotonicity_gap, "monotonicity_min_gap", ANCHOR_MONOTONICITY_MIN_GAP)
    resolved_review_active = get_param(args.review_active_weight, "review_active_weight", REVIEW_ACTIVE_FACTOR_WEIGHT)
    resolved_review_base = get_param(args.review_baseline_weight, "review_baseline_weight", REVIEW_BASELINE_UNSELECTED_WEIGHT)
    resolved_terr_thresh = get_param(args.terrain_presence_threshold, "terrain_presence_threshold", TERRAIN_PRESENCE_THRESHOLD)
    resolved_freeze = args.freeze_on_exhaustion or bool(preset_dict.get("freeze_on_exhaustion", False))

    if args.preset:
        print(f"[PRESET ACTIVATED: '{args.preset.upper()}']")
        print(f"  Description: {preset_dict.get('description', '')}\n")

    run_simulation(
        users_filepath=target_path,
        trails_filepath=args.trails,
        cycles=args.cycles,
        cbf_engine=args.cbf,
        cf_engine=args.cf,
        beta_divisor=resolved_beta_divisor,
        beta_decay=resolved_beta_decay,
        alpha_override=resolved_alpha_override,
        alpha_steady_state=resolved_alpha_steady,
        alpha_cold_start=resolved_alpha_cold,
        alpha_threshold=resolved_alpha_thresh,
        cf_k=resolved_cf_k,
        cf_tau=resolved_cf_tau,
        monotonicity_min_gap=resolved_mono_gap,
        review_active_weight=resolved_review_active,
        review_baseline_weight=resolved_review_base,
        terrain_presence_threshold=resolved_terr_thresh,
        freeze_on_exhaustion=resolved_freeze,
        activate_ui=args.activate_ui
    )
