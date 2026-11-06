"""
THARESYS User Set Simulation Runner & UI Activator

Runs multi-cycle evaluation across any of the 5 seeded user sets, logs cycle-by-cycle
convergence metrics, evaluates recommendation match/accuracy rates against ground truth,
tracks the 2x2 Hike Difficulty Experience Matrix (predicted vs actual difficulty),
and optionally activates the results directly into the UI.

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

    # 7. Evaluate recommendation match rate with specific match mode and export CSV telemetry:
    .venv\\Scripts\\python.exe engine\\run_user_set_simulation.py --set 1 --trails 88 --cycles 10 --match-mode strict --export-csv
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


def evaluate_trail_recommendation(
    trail_id: str,
    target_slot: str,
    gt_easy_10: np.ndarray,
    gt_diff_10: np.ndarray,
    trail_10d_map: Dict[str, np.ndarray],
    trail_by_id: Dict[str, Any],
    score: float = 0.0,
    match_mode: str = "strict",
) -> Dict[str, Any]:
    """
    Evaluates whether an individual recommended trail is a correct / match recommendation
    relative to the user's ground truth physical capability and slot classification.

    Match Modes:
        - 'strict' (default): Requires BOTH physiological compatibility AND anchor slot alignment.
        - 'physical': Physiological capability & fatigue safety match only.
        - 'slot': Relative anchor slot alignment only (closer to intended GT anchor).
    """
    tid = str(trail_id)
    tdoc = trail_by_id.get(tid, {})
    tname = tdoc.get("general", {}).get("name") or tdoc.get("name") or f"Trail {tid[:6]}"

    t_10 = trail_10d_map.get(tid)
    if t_10 is None:
        return {
            "trailId": tid,
            "trailName": str(tname),
            "recommendedSlot": target_slot,
            "score": round(float(score), 4),
            "dist_gt_easy": 0.0,
            "dist_gt_diff": 0.0,
            "strain": 0.0,
            "is_phys_match": True,
            "is_gt_aligned": True,
            "is_match": True,
        }

    dist_easy = float(gower_distance(t_10, gt_easy_10))
    dist_diff = float(gower_distance(t_10, gt_diff_10))

    if target_slot == "easy":
        strain = float(np.mean(t_10[1:6] - gt_easy_10[1:6]))
        is_phys_match = bool(strain <= 0.12)
        is_gt_aligned = bool(dist_easy <= dist_diff)
    else:
        strain = float(np.mean(t_10[1:6] - gt_diff_10[1:6]))
        underwhelming = float(np.mean(gt_diff_10[1:6] - t_10[1:6]))
        is_phys_match = bool(strain <= 0.15 and underwhelming <= 0.18)
        is_gt_aligned = bool(dist_diff <= dist_easy)

    if match_mode == "physical":
        is_match = is_phys_match
    elif match_mode == "slot":
        is_match = is_gt_aligned
    else:  # 'strict' default
        is_match = bool(is_phys_match and is_gt_aligned)

    return {
        "trailId": tid,
        "trailName": str(tname),
        "recommendedSlot": target_slot,
        "score": round(float(score), 4),
        "dist_gt_easy": round(dist_easy, 4),
        "dist_gt_diff": round(dist_diff, 4),
        "strain": round(strain, 4),
        "is_phys_match": is_phys_match,
        "is_gt_aligned": is_gt_aligned,
        "is_match": is_match,
    }


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
    match_mode: str = "strict",
    export_csv: bool = False,
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

    print("=" * 80)
    print("THARESYS USER SET MULTI-CYCLE SIMULATION & RECOMMENDATION MATCH EVALUATION")
    print("=" * 80)
    print(f"Users Source:  {users_filepath} ({len(users)} cohorts)")
    print(f"Trails Source: {resolved_trails_path} ({len(trails)} candidate trails)")
    print(f"Cycles:        {cycles} monthly hikes ({len(months)} batches: {months[0]} -> {months[-1]})")
    print(f"Engines:       CBF={cbf_engine}, CF={cf_engine}")
    print(f"Match Mode:    {match_mode.upper()} ('strict': phys compatibility + slot alignment)")
    print(f"Parameters:    beta_divisor={beta_divisor} (decay={beta_decay}), alpha_override={alpha_override}, cf_k={cf_k}, cf_tau={cf_tau}")
    print(f"Weights/Gaps:  active_w={review_active_weight}, baseline_w={review_baseline_weight}, min_gap={monotonicity_min_gap}, freeze_exhaust={freeze_on_exhaustion}")
    print("=" * 80)

    # Pre-extract trail vectors
    trail_by_id = {str(t["id"]): t for t in trails}
    trail_10d_map = {str(t["id"]): extract_covered_10d(flatten_profile_features(t.get("profile", t))) for t in trails}

    # Simulation state per user
    user_hikes_map: Dict[str, Set[str]] = {u["id"]: set() for u in users}
    user_hike_history: Dict[str, List[str]] = {u["id"]: [] for u in users}
    user_reviews_map: Dict[str, List[Dict[str, Any]]] = {u["id"]: [] for u in users}
    prev_recommendations_map: Dict[str, Dict[str, Any]] = {}
    user_cycle_telemetry: Dict[str, List[Dict[str, Any]]] = {u["id"]: [] for u in users}

    cycle_progression_metrics = []

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

        cycle_user_gds = []
        cycle_rec_match_rates = []
        cycle_phys_match_rates = []
        cycle_slot_match_rates = []

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

            cycle_user_gds.append(mean_gd)

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

            # Rigorous evaluation of all recommendations presented to user in this cycle
            easy_checks = [
                evaluate_trail_recommendation(
                    trail_id=r["id"],
                    target_slot="easy",
                    gt_easy_10=gt_easy_10,
                    gt_diff_10=gt_diff_10,
                    trail_10d_map=trail_10d_map,
                    trail_by_id=trail_by_id,
                    score=r["score"],
                    match_mode=match_mode,
                )
                for r in formatted_easy
            ]

            diff_checks = [
                evaluate_trail_recommendation(
                    trail_id=r["id"],
                    target_slot="difficult",
                    gt_easy_10=gt_easy_10,
                    gt_diff_10=gt_diff_10,
                    trail_10d_map=trail_10d_map,
                    trail_by_id=trail_by_id,
                    score=r["score"],
                    match_mode=match_mode,
                )
                for r in formatted_diff
            ]

            alignment_checks = easy_checks + diff_checks
            total_checks = len(alignment_checks)
            matched_count = sum(1 for c in alignment_checks if c["is_match"])
            phys_matched_count = sum(1 for c in alignment_checks if c["is_phys_match"])
            slot_matched_count = sum(1 for c in alignment_checks if c["is_gt_aligned"])

            rec_match_rate = round(matched_count / max(1, total_checks), 4)
            rec_phys_match_rate = round(phys_matched_count / max(1, total_checks), 4)
            rec_slot_alignment_rate = round(slot_matched_count / max(1, total_checks), 4)

            easy_match_rate = round(sum(1 for c in easy_checks if c["is_match"]) / max(1, len(easy_checks)), 4)
            diff_match_rate = round(sum(1 for c in diff_checks if c["is_match"]) / max(1, len(diff_checks)), 4)

            cycle_rec_match_rates.append(rec_match_rate)
            cycle_phys_match_rates.append(rec_phys_match_rate)
            cycle_slot_match_rates.append(rec_slot_alignment_rate)

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
                            factors = ["The trail slope is noticeable", "The trail is too long"]
                        else:
                            is_match = True
                            perceived = "Easy"
                            factors = ["The trail slope is manageable", "The length is just right"]
                    else:
                        underwhelming_check = float(np.mean(target_gt[1:6] - t_10[1:6]))
                        if underwhelming_check > 0.18:
                            is_match = False
                            perceived = "Easy"
                            factors = ["The trail slope is gentle", "The length is short"]
                        else:
                            is_match = True
                            perceived = "Difficult"
                            factors = ["The trail slope is challenging", "The elevation climb is difficult"]

                    # 2x2 Hike Difficulty Experience Matrix Classification
                    # Normalizes perceived experience into binary easy vs difficult
                    actual_diff = "easy" if perceived.lower() == "easy" else "difficult"
                    if target_slot == "easy":
                        hike_outcome = "easy-easy" if actual_diff == "easy" else "easy-difficult"
                    else:
                        hike_outcome = "difficult-difficult" if actual_diff == "difficult" else "difficult-easy"

                    is_easier_than_predicted = bool(target_slot == "difficult" and actual_diff == "easy")
                    is_harder_than_predicted = bool(target_slot == "easy" and actual_diff == "difficult")

                    hiked_obj = {
                        "id": picked_tid,
                        "trailId": picked_tid,
                        "trailName": picked_name,
                        "targetAnchor": target_slot,
                        "targetSlot": target_slot,
                        "score": picked_score,
                        "predictedDifficulty": target_slot,
                        "actualDifficulty": actual_diff,
                        "hikeOutcome": hike_outcome,
                        "isMatch": is_match,
                        "isEasierThanPredicted": is_easier_than_predicted,
                        "isHarderThanPredicted": is_harder_than_predicted,
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
                "rec_alignment_rate": rec_match_rate,
                "rec_match_rate": rec_match_rate,
                "rec_phys_match_rate": rec_phys_match_rate,
                "rec_slot_alignment_rate": rec_slot_alignment_rate,
                "easy_match_rate": easy_match_rate,
                "diff_match_rate": diff_match_rate,
                "alignment_checks": alignment_checks,
                "recommendations": {
                    "easy": formatted_easy,
                    "difficult": formatted_diff,
                },
                "hiked": hiked_obj,
                "review": review_obj,
            })

        # Cycle Progression Telemetry Summary
        c_mean_gd = round(float(np.mean(cycle_user_gds)), 4)
        c_rec_match = round(float(np.mean(cycle_rec_match_rates)), 4)
        c_phys_match = round(float(np.mean(cycle_phys_match_rates)), 4)
        c_slot_match = round(float(np.mean(cycle_slot_match_rates)), 4)

        # 2x2 Hike Matrix for this cycle
        cycle_hikes = [user_cycle_telemetry[u["id"]][cycle_idx]["hiked"] for u in users if user_cycle_telemetry[u["id"]][cycle_idx].get("hiked")]
        if cycle_hikes:
            total_cycle_hikes = len(cycle_hikes)
            c_ee = sum(1 for h in cycle_hikes if h.get("hikeOutcome") == "easy-easy")
            c_dd = sum(1 for h in cycle_hikes if h.get("hikeOutcome") == "difficult-difficult")
            c_ed = sum(1 for h in cycle_hikes if h.get("hikeOutcome") == "easy-difficult")
            c_de = sum(1 for h in cycle_hikes if h.get("hikeOutcome") == "difficult-easy")
            c_matches = c_ee + c_dd
            c_safe_or_easier = c_ee + c_dd + c_de

            hike_matrix_cycle = {
                "predicted_easy_actual_easy": c_ee,
                "predicted_difficult_actual_difficult": c_dd,
                "predicted_easy_actual_difficult": c_ed,
                "predicted_difficult_actual_easy": c_de,
                "total_hikes": total_cycle_hikes,
                "matches": c_matches,
                "safe_or_easier_than_predicted": c_safe_or_easier,
                "match_rate": round(c_matches / total_cycle_hikes, 4),
                "safe_or_easier_rate": round(c_safe_or_easier / total_cycle_hikes, 4),
            }

            print(f"\nCycle {cycle_idx:2d} ({active_month}): Mean GD={c_mean_gd:.4f} | Rec Match={c_rec_match*100:5.1f}%")
            print(f"  - predicted easy-actual easy:           {c_ee:2d}/{total_cycle_hikes} ({c_ee/total_cycle_hikes*100:5.1f}%)")
            print(f"  - predicted difficult-actual difficult: {c_dd:2d}/{total_cycle_hikes} ({c_dd/total_cycle_hikes*100:5.1f}%)")
            print(f"  - predicted easy-actual difficult:      {c_ed:2d}/{total_cycle_hikes} ({c_ed/total_cycle_hikes*100:5.1f}%)")
            print(f"  - predicted difficult-actual easy:      {c_de:2d}/{total_cycle_hikes} ({c_de/total_cycle_hikes*100:5.1f}%)")
            print(f"  Hike Matches: {c_matches}/{total_cycle_hikes} ({c_matches/total_cycle_hikes*100:5.1f}%) | Safe / At least easier than predicted: {c_safe_or_easier}/{total_cycle_hikes} ({c_safe_or_easier/total_cycle_hikes*100:5.1f}%)")
        else:
            hike_matrix_cycle = None
            print(f"\nCycle {cycle_idx:2d} ({active_month}) [Terminal]: Mean GD={c_mean_gd:.4f} | Rec Match={c_rec_match*100:5.1f}% [Evaluation State - No Hike]")

        cycle_progression_metrics.append({
            "cycle": cycle_idx,
            "month": active_month,
            "mean_gd": c_mean_gd,
            "rec_match_rate": c_rec_match,
            "rec_phys_match_rate": c_phys_match,
            "rec_slot_alignment_rate": c_slot_match,
            "hike_difficulty_breakdown": hike_matrix_cycle,
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

        start_match = entry["cycleHistory"][0]["rec_match_rate"]
        end_match = entry["cycleHistory"][-1]["rec_match_rate"]
        delta_match = round(end_match - start_match, 4)
        mean_match = round(float(np.mean([c["rec_match_rate"] for c in entry["cycleHistory"]])), 4)

        user_hikes = [c["hiked"] for c in entry["cycleHistory"] if c.get("hiked")]
        u_ee = sum(1 for h in user_hikes if h.get("hikeOutcome") == "easy-easy")
        u_dd = sum(1 for h in user_hikes if h.get("hikeOutcome") == "difficult-difficult")
        u_ed = sum(1 for h in user_hikes if h.get("hikeOutcome") == "easy-difficult")
        u_de = sum(1 for h in user_hikes if h.get("hikeOutcome") == "difficult-easy")
        total_hikes = len(user_hikes)
        hiked_matches = u_ee + u_dd
        hiked_rate = round(hiked_matches / max(1, total_hikes), 4)
        safe_or_easier = u_ee + u_dd + u_de
        safe_rate = round(safe_or_easier / max(1, total_hikes), 4)

        entry["convergence"] = {
            "start_gd": start_gd,
            "end_gd": end_gd,
            "ctrl_end_gd": start_gd,
            "delta_gd": delta_gd,
            "has_converged": bool(end_gd < start_gd),
            "start_match_rate": start_match,
            "end_match_rate": end_match,
            "delta_match_rate": delta_match,
            "mean_rec_match_rate": mean_match,
            "hiked_matches": hiked_matches,
            "total_hikes": total_hikes,
            "hiked_match_rate": hiked_rate,
            "safe_or_easier_rate": safe_rate,
            "hike_matrix": {
                "easy_easy": u_ee,
                "diff_diff": u_dd,
                "easy_diff": u_ed,
                "diff_easy": u_de,
                "total_hikes": total_hikes,
            }
        }
        simulated_users_bundle.append(entry)

    mean_start = float(np.mean([u["convergence"]["start_gd"] for u in simulated_users_bundle]))
    mean_end = float(np.mean([u["convergence"]["end_gd"] for u in simulated_users_bundle]))
    mean_delta = float(np.mean([u["convergence"]["delta_gd"] for u in simulated_users_bundle]))
    converged_count = sum(1 for u in simulated_users_bundle if u["convergence"]["has_converged"])

    mean_start_rec = float(np.mean([u["convergence"]["start_match_rate"] for u in simulated_users_bundle]))
    mean_end_rec = float(np.mean([u["convergence"]["end_match_rate"] for u in simulated_users_bundle]))
    mean_delta_rec = float(np.mean([u["convergence"]["delta_match_rate"] for u in simulated_users_bundle]))
    overall_rec_match = float(np.mean([u["convergence"]["mean_rec_match_rate"] for u in simulated_users_bundle]))

    # Cumulative Hike 2x2 Matrix Totals
    total_hikes_cohort = sum(u["convergence"]["total_hikes"] for u in simulated_users_bundle)
    tot_ee = sum(u["convergence"]["hike_matrix"]["easy_easy"] for u in simulated_users_bundle)
    tot_dd = sum(u["convergence"]["hike_matrix"]["diff_diff"] for u in simulated_users_bundle)
    tot_ed = sum(u["convergence"]["hike_matrix"]["easy_diff"] for u in simulated_users_bundle)
    tot_de = sum(u["convergence"]["hike_matrix"]["diff_easy"] for u in simulated_users_bundle)
    tot_matches = tot_ee + tot_dd
    tot_safe_or_easier = tot_matches + tot_de

    ee_rate = tot_ee / max(1, total_hikes_cohort)
    dd_rate = tot_dd / max(1, total_hikes_cohort)
    ed_rate = tot_ed / max(1, total_hikes_cohort)
    de_rate = tot_de / max(1, total_hikes_cohort)
    match_rate = tot_matches / max(1, total_hikes_cohort)
    safe_rate = tot_safe_or_easier / max(1, total_hikes_cohort)

    # Print Summary of Hike Difficulty Experience Matrix
    print(f"\nSummary ({cycles} cycles, {total_hikes_cohort} total hikes):")
    print(f"  - predicted easy-actual easy:             {tot_ee:3d}/{total_hikes_cohort} ({ee_rate*100:5.1f}%)")
    print(f"  - predicted difficult-actual difficult:   {tot_dd:3d}/{total_hikes_cohort} ({dd_rate*100:5.1f}%)")
    print(f"  - predicted easy-actual difficult:        {tot_ed:3d}/{total_hikes_cohort} ({ed_rate*100:5.1f}%)")
    print(f"  - predicted difficult-actual easy:        {tot_de:3d}/{total_hikes_cohort} ({de_rate*100:5.1f}%)")
    print("-" * 65)
    print(f"  Matches (easy-easy + difficult-difficult):       {tot_matches:3d}/{total_hikes_cohort} ({match_rate*100:5.1f}%)")
    print(f"  Safe / At least easier than predicted:           {tot_safe_or_easier:3d}/{total_hikes_cohort} ({safe_rate*100:5.1f}%)")
    print("=" * 65)

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
            "match_mode": match_mode,
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
        "summary": {
            "total_users": len(users),
            "total_trails": len(trails),
            "cycles": cycles,
            "converged_count": converged_count,
            "convergence_rate": round(converged_count / len(users), 4),
            "mean_start_gd": round(mean_start, 4),
            "mean_end_gd": round(mean_end, 4),
            "mean_delta_gd": round(mean_delta, 4),
            "mean_start_rec_match_rate": round(mean_start_rec, 4),
            "mean_end_rec_match_rate": round(mean_end_rec, 4),
            "mean_delta_rec_match_rate": round(mean_delta_rec, 4),
            "overall_rec_match_rate": round(overall_rec_match, 4),
            "total_hikes": total_hikes_cohort,
            "hike_difficulty_matrix": {
                "predicted_easy_actual_easy": {"count": tot_ee, "rate": round(ee_rate, 4), "percentage": f"{ee_rate*100:.1f}%"},
                "predicted_difficult_actual_difficult": {"count": tot_dd, "rate": round(dd_rate, 4), "percentage": f"{dd_rate*100:.1f}%"},
                "predicted_easy_actual_difficult": {"count": tot_ed, "rate": round(ed_rate, 4), "percentage": f"{ed_rate*100:.1f}%"},
                "predicted_difficult_actual_easy": {"count": tot_de, "rate": round(de_rate, 4), "percentage": f"{de_rate*100:.1f}%"},
                "total_hikes": total_hikes_cohort,
                "matches": tot_matches,
                "match_rate": round(match_rate, 4),
                "safe_or_easier_than_predicted": tot_safe_or_easier,
                "safe_or_easier_rate": round(safe_rate, 4),
            },
            "cycle_progression": cycle_progression_metrics,
        },
        "users": simulated_users_bundle
    }
    with open(harness_out_path, "w", encoding="utf-8") as f:
        json.dump(harness_payload, f, indent=2)

    # Optional CSV Export of all telemetry rows
    if export_csv:
        csv_out_path = os.path.join(out_dir, "simulation_telemetry.csv")
        fieldnames = [
            "user_id", "cohort_group", "experience", "medical", "cycle", "month",
            "mean_gd", "mean_ed", "mean_cs",
            "rec_match_rate", "rec_phys_match_rate", "rec_slot_alignment_rate",
            "easy_match_rate", "diff_match_rate",
            "hiked_trail_id", "hiked_trail_name", "hiked_predicted_difficulty",
            "hiked_actual_difficulty", "hiked_outcome", "hiked_is_match", "hiked_is_easier"
        ]
        with open(csv_out_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for u in simulated_users_bundle:
                uid = u["id"]
                group = u.get("cohort_group", "normal")
                exp = u.get("experience", "")
                med = u.get("medical", "")
                for entry in u["cycleHistory"]:
                    hiked = entry.get("hiked") or {}
                    writer.writerow({
                        "user_id": uid,
                        "cohort_group": group,
                        "experience": exp,
                        "medical": med,
                        "cycle": entry["cycle"],
                        "month": entry["month"],
                        "mean_gd": entry["distances"]["mean_gd"],
                        "mean_ed": entry["distances"]["mean_ed"],
                        "mean_cs": entry["distances"]["mean_cs"],
                        "rec_match_rate": entry["rec_match_rate"],
                        "rec_phys_match_rate": entry["rec_phys_match_rate"],
                        "rec_slot_alignment_rate": entry["rec_slot_alignment_rate"],
                        "easy_match_rate": entry.get("easy_match_rate", 0.0),
                        "diff_match_rate": entry.get("diff_match_rate", 0.0),
                        "hiked_trail_id": hiked.get("trailId", ""),
                        "hiked_trail_name": hiked.get("trailName", ""),
                        "hiked_predicted_difficulty": hiked.get("predictedDifficulty", ""),
                        "hiked_actual_difficulty": hiked.get("actualDifficulty", ""),
                        "hiked_outcome": hiked.get("hikeOutcome", ""),
                        "hiked_is_match": hiked.get("isMatch", ""),
                        "hiked_is_easier": hiked.get("isEasierThanPredicted", ""),
                    })
        print(f"  - simulation_telemetry.csv ({len(simulated_users_bundle) * len(months)} rows)")

    print(f"\n[OK] Simulation artifacts generated in: {out_dir}")
    print(f"  - simulatedUsers.json ({len(simulated_users_bundle)} cohorts with full cycleHistory and alignment_checks)")
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
    parser = argparse.ArgumentParser(description="THARESYS Seeded User Set Simulation & Recommendation Match Evaluator")
    # Dataset Selection
    parser.add_argument("--set", type=int, choices=[1, 2, 3, 4, 5], default=None, help="Index of seeded user set (1..5)")
    parser.add_argument("--users", type=str, default=None, help="Explicit path to a users JSON file")
    parser.add_argument("--trails", type=str, default="8", help="Trail preset ('8', '40', 'seed42', 'seed7', '88') or path to JSON catalog")
    parser.add_argument("--cycles", type=int, default=10, help="Number of monthly cycles (default: 10)")
    parser.add_argument("--cbf", type=str, default="GD", help="CBF formula ('GD', 'ED', 'CS')")
    parser.add_argument("--cf", type=str, default="GD", help="CF formula ('GD', 'ED', 'CS')")

    # Match Evaluation Mode
    parser.add_argument(
        "--match-mode",
        type=str,
        choices=["strict", "physical", "slot"],
        default="strict",
        help="Recommendation match criterion: 'strict' (phys tolerance + slot alignment, default), 'physical' (strain tolerance only), 'slot' (slot relative distance only)"
    )
    parser.add_argument("--export-csv", action="store_true", help="Export detailed cycle-by-cycle telemetry rows to CSV")

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
        match_mode=args.match_mode,
        export_csv=args.export_csv,
        activate_ui=args.activate_ui
    )
