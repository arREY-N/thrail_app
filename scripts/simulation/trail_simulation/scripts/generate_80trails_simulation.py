"""
generate_80trails_simulation.py

Generates an expanded 80-synthetic-trail catalog (+ 8 real benchmark trails = 88 total),
providing trails with physical ranges beyond the previous min/max bounds:
  - Easy: length [1.2, 4.5] km, elevation [120, 580] MASL, gain [35, 260] m, slope [1.8, 6.2] %, Lasco [1, 3]
  - Moderate: length [4.5, 9.5] km, elevation [450, 1050] MASL, gain [200, 750] m, slope [4.5, 10.5] %, Lasco [3, 5]
  - Hard: length [9.5, 15.0] km, elevation [950, 1750] MASL, gain [750, 1500] m, slope [8.5, 14.5] %, Lasco [5, 7]
  - Very Hard: length [14.0, 26.5] km, elevation [1600, 2850] MASL, gain [1400, 2650] m, slope [10.5, 20.5] %, Lasco [7, 9]

Executes the THARESYS recommendation-update simulation for 12 monthly cycles (1 full year)
and saves the output to `scripts/simulation/trail_simulation/snapshots/scale_80trails_12cycles`.
"""

import copy
import csv
import json
import os
import sys
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple
import numpy as np

# Ensure root engine and module directories are importable
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODULE_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
SIM_DIR = os.path.abspath(os.path.join(MODULE_DIR, ".."))
ROOT = os.path.abspath(os.path.join(SIM_DIR, "..", ".."))
ENGINE_DIR = os.path.join(ROOT, "engine")
GEN_DIR = os.path.join(MODULE_DIR, "trail_generator")

for p in (ENGINE_DIR, MODULE_DIR, GEN_DIR):
    if p not in sys.path:
        sys.path.insert(0, p)

import firebase_client
firebase_client.initialize_firebase = lambda: None

from batch_runner import run_batch_recommendations
from formula import gower_distance, euclidean_distance, cosine_distance
from profile_utils import flatten_profile_features, unflatten_profile_features, resolve_review_factor_weights

from config import (
    PROVINCE_KEYS,
    PROVINCE_DISPLAY,
    TERRAIN_KEYS,
    CIRCULARITY_KEYS,
    CIRCULARITY_DISPLAY,
    WATERFORM_KEYS,
    TOURISM_KEYS,
    ADJACENT_PROVINCE_PAIRS,
    TERRAIN_PROBS_BY_TIER,
    WATERFORM_PROBS_BY_TIER,
    TOURISM_PROBS_BY_TIER,
    MAJOR_LASCO_THRESHOLD,
    MAJOR_COMBO_LASCO,
    MAJOR_COMBO_ELEVATION_MASL,
    LASCO_MAX_RATING,
)
from generate import load_and_export_real_trails
from run_trail_simulation_harness import (
    COVERED_FEATURES,
    extract_covered_vector_from_dict,
    extract_covered_vector_from_32d,
    compute_vector_distances,
    determine_simulated_review,
    run_simulation,
)

SNAPSHOT_DIR = os.path.join(MODULE_DIR, "snapshots", "scale_80trails_12cycles")
INPUTS_DIR = os.path.join(MODULE_DIR, "inputs")
CYCLE_INPUTS_DIR = os.path.join(SIM_DIR, "cycle_simulation", "inputs")

# Expanded Physical Ranges Beyond Current Min/Max
EXPANDED_TIER_RANGES: Dict[str, Dict[str, Any]] = {
    "easy": {
        "length_km": [1.2, 4.5],
        "elevation_masl": [120, 580],
        "gain_m": [35, 260],
        "slope_pct": [1.8, 6.2],
        "lasco_range": [1, 3],
        "hours_range": [1, 3],
        "obstacles_range": [0, 1],
    },
    "moderate": {
        "length_km": [4.5, 9.5],
        "elevation_masl": [450, 1050],
        "gain_m": [200, 750],
        "slope_pct": [4.5, 10.5],
        "lasco_range": [3, 5],
        "hours_range": [3, 5],
        "obstacles_range": [1, 2],
    },
    "hard": {
        "length_km": [9.5, 15.0],
        "elevation_masl": [950, 1750],
        "gain_m": [750, 1500],
        "slope_pct": [8.5, 14.5],
        "lasco_range": [5, 7],
        "hours_range": [5, 8],
        "obstacles_range": [2, 4],
    },
    "very_hard": {
        "length_km": [14.0, 26.5],
        "elevation_masl": [1600, 2850],
        "gain_m": [1400, 2650],
        "slope_pct": [10.5, 20.5],
        "lasco_range": [7, 9],
        "hours_range": [8, 14],
        "obstacles_range": [3, 7],
    },
}

TIERS = ["easy", "moderate", "hard", "very_hard"]
TRAILS_PER_TIER = 20  # 20 * 4 = 80 synthetic trails


def build_80trails_quota_plan(seed: int = 42) -> List[Dict[str, Any]]:
    """Builds quota slots for 80 synthetic trails across 4 tiers (20 per tier)."""
    rng = np.random.default_rng(seed)
    tier_circularities: Dict[str, List[str]] = {}
    for tier in TIERS:
        # 5 traverse, 5 circular, 10 out_and_back per tier
        tier_circs = ["traverse"] * 5 + ["circular"] * 5 + ["out_and_back"] * 10
        rng.shuffle(tier_circs)
        tier_circularities[tier] = tier_circs

    province_counts: Dict[str, int] = {p: 0 for p in PROVINCE_KEYS}
    slots: List[Dict[str, Any]] = []

    pair_indices = list(range(len(ADJACENT_PROVINCE_PAIRS)))
    # 20 multi-province trails (5 per tier)
    chosen_pairs_seq = [ADJACENT_PROVINCE_PAIRS[i % len(ADJACENT_PROVINCE_PAIRS)] for i in range(20)]
    rng.shuffle(chosen_pairs_seq)

    pair_idx = 0
    for tier in TIERS:
        circs = tier_circularities[tier]
        for slot_in_tier in range(TRAILS_PER_TIER):
            c_type = circs[slot_in_tier]
            if slot_in_tier < 5:  # First 5 in tier are multi-province
                provs = sorted(chosen_pairs_seq[pair_idx])
                pair_idx += 1
            else:
                sorted_provs = sorted(PROVINCE_KEYS, key=lambda p: (province_counts[p], rng.random()))
                provs = [sorted_provs[0]]

            for p in provs:
                province_counts[p] += 1

            slots.append({
                "tier": tier,
                "circularity": c_type,
                "provinces": provs,
            })

    return slots


def generate_single_expanded_trail(
    slot_id: int,
    slot_meta: Dict[str, Any],
    rng: np.random.Generator,
) -> Dict[str, Any]:
    tier = slot_meta["tier"]
    trange = EXPANDED_TIER_RANGES[tier]
    tid = f"SYN-{slot_id:02d}"

    for _ in range(1000):
        length = round(float(rng.uniform(trange["length_km"][0], trange["length_km"][1])), 2)
        target_slope = float(rng.uniform(trange["slope_pct"][0], trange["slope_pct"][1]))
        gain = int(round(length * 1000.0 * (target_slope / 100.0)))

        if trange["gain_m"][0] <= gain <= trange["gain_m"][1]:
            min_masl = max(trange["elevation_masl"][0], gain + 50)
            max_masl = trange["elevation_masl"][1]
            if min_masl <= max_masl:
                masl = int(round(float(rng.uniform(min_masl, max_masl))))
                slope = round((gain / (length * 1000.0)) * 100.0, 2)
                break
    else:
        length = round(float(np.mean(trange["length_km"])), 2)
        gain = int(round(np.mean(trange["gain_m"])))
        masl = int(round(np.mean(trange["elevation_masl"])))
        slope = round((gain / (length * 1000.0)) * 100.0, 2)

    lasco = int(rng.integers(trange["lasco_range"][0], trange["lasco_range"][1] + 1))
    hours = int(rng.integers(trange["hours_range"][0], trange["hours_range"][1] + 1))
    obstacles = int(rng.integers(trange["obstacles_range"][0], trange["obstacles_range"][1] + 1))

    is_major = (lasco >= MAJOR_LASCO_THRESHOLD) or (
        lasco >= MAJOR_COMBO_LASCO and masl >= MAJOR_COMBO_ELEVATION_MASL
    )
    classification_val = 1.0 if is_major else 0.0

    raw_dict = {
        "length": length,
        "elevation": masl,
        "gain": gain,
        "slope": slope,
        "lascoRating": lasco,
        "classification": classification_val,
        "estimatedHours": hours,
        "numberOfObstacles": obstacles,
    }

    prov_list = slot_meta["provinces"]
    prov_dict = {p: 1.0 if p in prov_list else 0.0 for p in PROVINCE_KEYS}
    prov_display = " & ".join(PROVINCE_DISPLAY[p] for p in prov_list)

    tprobs = TERRAIN_PROBS_BY_TIER[tier]
    terr_dict: Dict[str, float] = {}
    for tkey in TERRAIN_KEYS:
        terr_dict[tkey] = 1.0 if float(rng.random()) < tprobs[tkey] else 0.0
    if sum(terr_dict.values()) == 0:
        dominant_t = max(tprobs.items(), key=lambda kv: kv[1])[0]
        terr_dict[dominant_t] = 1.0

    c_type = slot_meta["circularity"]
    circ_dict = {c: 1.0 if c == c_type else 0.0 for c in CIRCULARITY_KEYS}

    wprobs = WATERFORM_PROBS_BY_TIER[tier]
    water_dict: Dict[str, float] = {}
    for wkey in WATERFORM_KEYS:
        water_dict[wkey] = 1.0 if float(rng.random()) < wprobs[wkey] else 0.0

    tmprobs = TOURISM_PROBS_BY_TIER[tier]
    tour_dict: Dict[str, float] = {}
    for tmkey in TOURISM_KEYS:
        if tmkey in ("waterfall", "river", "lake"):
            wmap = {"waterfall": "fall", "river": "river", "lake": "lake"}
            tour_dict[tmkey] = water_dict.get(wmap[tmkey], 0.0)
        else:
            tour_dict[tmkey] = 1.0 if float(rng.random()) < tmprobs[tmkey] else 0.0

    tier_label = {
        "easy": "Tier 1 (Easy Minor)",
        "moderate": "Tier 2 (Moderate Minor)",
        "hard": "Tier 3 (Technical Minor)",
        "very_hard": "Tier 4 (Major Expedition)",
    }[tier]

    name = f"Synthetic Trail {tid} ({tier.replace('_', ' ').title()})"

    return {
        "id": tid,
        "synthetic": True,
        "tier": tier_label,
        "name": name,
        "general": {"name": name, "description": f"Expanded synthetic benchmark trail in {prov_display}."},
        "geography": {"province": prov_display, "masl": masl},
        "difficulty": {
            "length": length,
            "elevation": masl,
            "gain": gain,
            "slope": slope,
            "lascoRating": lasco,
            "classification": "major" if is_major else "minor",
        },
        "raw": raw_dict,
        "unnormalized_features": {
            "classification": classification_val,
            "province": prov_dict,
            "terrain": terr_dict,
            "circularity": circ_dict,
            "waterforms": water_dict,
            "tourism": tour_dict,
        },
    }


def compute_expanded_bounds(all_trails: List[Dict[str, Any]]) -> Dict[str, List[float]]:
    lengths = [float(t["raw"]["length"]) for t in all_trails]
    elevations = [float(t["raw"]["elevation"]) for t in all_trails]
    gains = [float(t["raw"]["gain"]) for t in all_trails]
    slopes = [float(t["raw"]["slope"]) for t in all_trails]

    return {
        "length": [round(min(lengths), 2), round(max(lengths), 2)],
        "elevation": [int(min(elevations)), int(max(elevations))],
        "gain": [int(min(gains)), int(max(gains))],
        "slope": [round(min(slopes), 2), round(max(slopes), 2)],
        "lasco": [1, 9],
    }


def normalize_trail(trail: Dict[str, Any], bounds: Dict[str, List[float]]) -> Tuple[np.ndarray, Dict[str, Any]]:
    raw = trail["raw"]
    def mm(val, bmin, bmax):
        return 0.0 if bmax == bmin else float(np.clip((val - bmin) / (bmax - bmin), 0.0, 1.0))

    norm_len = mm(float(raw["length"]), bounds["length"][0], bounds["length"][1])
    norm_elev = mm(float(raw["elevation"]), bounds["elevation"][0], bounds["elevation"][1])
    norm_gain = mm(float(raw["gain"]), bounds["gain"][0], bounds["gain"][1])
    norm_slope = mm(float(raw["slope"]), bounds["slope"][0], bounds["slope"][1])
    norm_easy = float(np.clip(float(raw["lascoRating"]) / 9.0, 0.0, 1.0))
    cls_val = float(raw["classification"])

    if "unnormalized_features" in trail:
        unnorm = trail["unnormalized_features"]
        prov_dict = copy.deepcopy(unnorm["province"])
        terr_dict = copy.deepcopy(unnorm["terrain"])
        circ_dict = copy.deepcopy(unnorm["circularity"])
        water_dict = copy.deepcopy(unnorm["waterforms"])
        tour_dict = copy.deepcopy(unnorm["tourism"])
    else:
        orig = trail.get("profile", {}).get("features", {})
        prov_dict = {p: float(orig.get("province", {}).get(p, 0.0) or 0.0) for p in PROVINCE_KEYS}
        terr_dict = {t: float(orig.get("terrain", {}).get(t, 0.0) or 0.0) for t in TERRAIN_KEYS}
        circ_dict = {c: float(orig.get("circularity", {}).get(c, 0.0) or 0.0) for c in CIRCULARITY_KEYS}
        water_dict = {w: float(orig.get("waterforms", {}).get(w, 0.0) or 0.0) for w in WATERFORM_KEYS}
        tour_dict = {tm: float(orig.get("tourism", {}).get(tm, 0.0) or 0.0) for tm in TOURISM_KEYS}

    vec = [cls_val, norm_len, norm_elev, norm_gain, norm_slope, norm_easy]
    for p in PROVINCE_KEYS: vec.append(float(prov_dict.get(p, 0.0)))
    for t in TERRAIN_KEYS: vec.append(float(terr_dict.get(t, 0.0)))
    for c in CIRCULARITY_KEYS: vec.append(float(circ_dict.get(c, 0.0)))
    for w in WATERFORM_KEYS: vec.append(float(water_dict.get(w, 0.0)))
    for tm in TOURISM_KEYS: vec.append(float(tour_dict.get(tm, 0.0)))

    vec_np = np.array(vec, dtype=np.float32)
    feats = unflatten_profile_features(vec_np)
    return vec_np, feats


def rederive_users(users_master: List[Dict[str, Any]], users_spec: List[Dict[str, Any]], catalog_trails: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    spec_map = {u["id"]: u for u in users_spec}
    trail_by_id = {t["id"]: t for t in catalog_trails}
    rederived: List[Dict[str, Any]] = []

    for u in users_master:
        u_copy = copy.deepcopy(u)
        uid = u["id"]
        exp = u["experience"]
        has_med = bool(u.get("medicalProfile", {}).get("hasCondition", False))
        med_factor = 0.80 if has_med else 1.0

        spec = spec_map.get(uid, {})
        ticked_tids = [str(tid) for tid in spec.get("expected_trail_ids", [])]

        if exp == "E1" or not ticked_tids:
            easy_base = 0.25 * med_factor
            diff_base = 0.75 * med_factor
            prefs = u.get("preferences", {}).get("province", [])
            user_provs = [p.lower() for p in prefs] if prefs else ["rizal"]

            easy_feats = {
                "classification": 0.0,
                "length": easy_base, "elevation": easy_base, "gain": easy_base, "slope": easy_base, "easy": easy_base,
                "province": {p: 0.85 if p in user_provs else 0.15 for p in PROVINCE_KEYS},
                "terrain": {t: easy_base for t in ["muddy", "rocky", "grassland", "ridges"]},
                "circularity": {c: 0.33 for c in CIRCULARITY_KEYS},
                "waterforms": {w: easy_base for w in ["fall", "river", "lake"]},
                "tourism": {tm: 0.20 for tm in ["shelter", "resting", "information_board", "clean_water", "river", "lake", "waterfall", "monument", "community", "viewpoint", "network_connection"]},
            }
            diff_feats = {
                "classification": 1.0,
                "length": diff_base, "elevation": diff_base, "gain": diff_base, "slope": diff_base, "easy": diff_base,
                "province": {p: 0.15 if p in user_provs else 0.85 for p in PROVINCE_KEYS},
                "terrain": {t: diff_base for t in ["muddy", "rocky", "grassland", "ridges"]},
                "circularity": {c: 0.33 for c in CIRCULARITY_KEYS},
                "waterforms": {w: diff_base for w in ["fall", "river", "lake"]},
                "tourism": {tm: 0.40 for tm in ["shelter", "resting", "information_board", "clean_water", "river", "lake", "waterfall", "monument", "community", "viewpoint", "network_connection"]},
            }
        else:
            ticked_vectors = [np.array(trail_by_id[tid]["vector"], dtype=np.float32) for tid in ticked_tids if tid in trail_by_id]
            centroid = np.mean(ticked_vectors, axis=0)

            easy_factor = 0.50 * med_factor
            diff_factor = 1.35 * med_factor

            prefs = u.get("preferences", {}).get("province", [])
            user_provs = [p.lower() for p in prefs] if prefs else ["rizal"]

            c_cls, c_len, c_elev, c_gain, c_slope, c_easy = centroid[:6]
            easy_feats = {
                "classification": 0.0,
                "length": float(np.clip(c_len * easy_factor, 0.0, 1.0)),
                "elevation": float(np.clip(c_elev * easy_factor, 0.0, 1.0)),
                "gain": float(np.clip(c_gain * easy_factor, 0.0, 1.0)),
                "slope": float(np.clip(c_slope * easy_factor, 0.0, 1.0)),
                "easy": float(np.clip(c_easy * easy_factor, 0.0, 1.0)),
                "province": {p: float(centroid[6 + i]) if centroid[6 + i] > 0 else (0.85 if p in user_provs else 0.15) for i, p in enumerate(PROVINCE_KEYS)},
                "terrain": {t: float(np.clip(centroid[11 + i] * easy_factor, 0.0, 1.0)) if centroid[11 + i] > 0 else (0.25 * med_factor) for i, t in enumerate(["muddy", "rocky", "grassland", "ridges"])},
                "circularity": {c: float(np.clip(centroid[15 + i] * 0.50, 0.0, 1.0)) if centroid[15 + i] > 0 else 0.33 for i, c in enumerate(CIRCULARITY_KEYS)},
                "waterforms": {w: float(np.clip(centroid[18 + i] * 0.50, 0.0, 1.0)) if centroid[18 + i] > 0 else 0.25 for i, w in enumerate(["fall", "river", "lake"])},
                "tourism": {tm: float(np.clip(centroid[21 + i] * 0.50, 0.0, 1.0)) if centroid[21 + i] > 0 else 0.20 for i, tm in enumerate(["shelter", "resting", "information_board", "clean_water", "river", "lake", "waterfall", "monument", "community", "viewpoint", "network_connection"])},
            }
            diff_feats = {
                "classification": 1.0,
                "length": float(np.clip(c_len * diff_factor, 0.0, 1.0)),
                "elevation": float(np.clip(c_elev * diff_factor, 0.0, 1.0)),
                "gain": float(np.clip(c_gain * diff_factor, 0.0, 1.0)),
                "slope": float(np.clip(c_slope * diff_factor, 0.0, 1.0)),
                "easy": float(np.clip(c_easy * diff_factor, 0.0, 1.0)),
                "province": {p: float(centroid[6 + i]) if centroid[6 + i] > 0 else (0.15 if p in user_provs else 0.85) for i, p in enumerate(PROVINCE_KEYS)},
                "terrain": {t: float(np.clip(centroid[11 + i] * diff_factor, 0.0, 1.0)) if centroid[11 + i] > 0 else (0.75 * med_factor) for i, t in enumerate(["muddy", "rocky", "grassland", "ridges"])},
                "circularity": {c: float(np.clip(centroid[15 + i] * 1.35, 0.0, 1.0)) if centroid[15 + i] > 0 else 0.33 for i, c in enumerate(CIRCULARITY_KEYS)},
                "waterforms": {w: float(np.clip(centroid[18 + i] * 1.35, 0.0, 1.0)) if centroid[18 + i] > 0 else 0.75 for i, w in enumerate(["fall", "river", "lake"])},
                "tourism": {tm: float(np.clip(centroid[21 + i] * 1.35, 0.0, 1.0)) if centroid[21 + i] > 0 else 0.40 for i, tm in enumerate(["shelter", "resting", "information_board", "clean_water", "river", "lake", "waterfall", "monument", "community", "viewpoint", "network_connection"])},
            }

        u_copy["profile"] = {
            "easy": {"metadata": {"source": "80trails_rederived"}, "features": easy_feats},
            "difficult": {"metadata": {"source": "80trails_rederived"}, "features": diff_feats},
        }
        rederived.append(u_copy)

    return rederived


def main() -> None:
    print("=" * 80)
    print("EXPANDED 80 SYNTHETIC TRAILS GENERATION & 12-CYCLE SIMULATION")
    print("=" * 80)

    # 1. Load real trails
    real_trails = load_and_export_real_trails()
    print(f"Loaded {len(real_trails)} real benchmark trails.")

    # 2. Generate 80 synthetic trails
    slots = build_80trails_quota_plan(seed=42)
    rng = np.random.default_rng(42)
    synthetic_trails = []
    for slot_id, smeta in enumerate(slots, start=1):
        t = generate_single_expanded_trail(slot_id=slot_id, slot_meta=smeta, rng=rng)
        synthetic_trails.append(t)

    print(f"Generated {len(synthetic_trails)} expanded synthetic trails across 4 tiers (20/tier).")

    # 3. Compute empirical bounds across all 88 trails
    all_raw_trails = real_trails + synthetic_trails
    bounds = compute_expanded_bounds(all_raw_trails)
    print(f"\nEmpirical 88-trail bounds:")
    for k, v in bounds.items():
        print(f"  {k}: {v}")

    # 4. Normalize all trails
    for t in all_raw_trails:
        vec, feats = normalize_trail(t, bounds)
        t["vector"] = [round(float(x), 4) for x in vec]
        t["profile"] = {"metadata": {"source": "88trails_catalog"}, "features": feats}

    # 5. Save 88-trail catalog
    os.makedirs(SNAPSHOT_DIR, exist_ok=True)
    catalog_path = os.path.join(SNAPSHOT_DIR, "catalog_80trails.json")
    catalog_data = {
        "header": {
            "name": "THARESYS 88-Trail Catalog (80 Synthetic + 8 Real)",
            "trail_count": len(all_raw_trails),
            "synthetic_count": len(synthetic_trails),
            "real_count": len(real_trails),
            "bounds": bounds,
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
        "trails": all_raw_trails,
    }
    with open(catalog_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(catalog_data, f, indent=2)
    print(f"Saved catalog to {catalog_path}")

    # 6. Load user base and rederive
    with open(os.path.join(CYCLE_INPUTS_DIR, "users.json"), "r", encoding="utf-8") as f:
        users_master = json.load(f)
    with open(os.path.join(CYCLE_INPUTS_DIR, "users_spec.json"), "r", encoding="utf-8") as f:
        users_spec = json.load(f)

    rederived_users = rederive_users(users_master, users_spec, all_raw_trails)

    # 7. Run 20-cycle recommendation simulation
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--cycles", type=int, default=20, help="Number of monthly cycles (default 20)")
    args = parser.parse_args()
    cycles = args.cycles

    out_snapshot_dir = os.path.join(MODULE_DIR, "snapshots", f"scale_80trails_{cycles}cycles")
    os.makedirs(out_snapshot_dir, exist_ok=True)

    print(f"\nRunning {cycles}-Cycle Simulation on 88-Trail Catalog...")
    harness_res, users_bundle, csv_rows = run_simulation(
        candidate_trails=all_raw_trails,
        users_master=rederived_users,
        users_spec=users_spec,
        cycles=cycles,
    )

    print(f"\nSimulation Finished:")
    print(f"  Convergence Rate: {harness_res['convergence_rate'] * 100:.2f}%")
    print(f"  Mean Delta GD:    {harness_res['mean_delta_gd']}")

    # 8. Save snapshot files
    with open(os.path.join(out_snapshot_dir, "catalog_80trails.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(catalog_data, f, indent=2)
    with open(os.path.join(out_snapshot_dir, "harness_results.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(harness_res, f, indent=2)
    with open(os.path.join(out_snapshot_dir, "simulatedUsers.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(users_bundle, f, indent=2)
    with open(os.path.join(out_snapshot_dir, "convergence_summary.csv"), "w", encoding="utf-8", newline="\n") as f:
        writer = csv.DictWriter(f, fieldnames=list(csv_rows[0].keys()))
        writer.writeheader()
        writer.writerows(csv_rows)

    # Print cycle trajectory
    print(f"\nCycle-by-cycle trajectory (0 to {cycles}):")
    N = len(users_bundle)
    for c in range(cycles + 1):
        avg_gd = sum(u["cycleHistory"][c]["distances"]["mean_gd"] for u in users_bundle) / N
        print(f"  Cycle {c:02d}: {avg_gd:.4f}")

    print("\nComplete! All artifacts saved to:", out_snapshot_dir)


if __name__ == "__main__":
    main()

