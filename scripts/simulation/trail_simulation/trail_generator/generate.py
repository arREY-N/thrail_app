"""
THARESYS Synthetic Trail Generator (`trail_generator/generate.py`).

Generates 32 synthetic trails across 4 difficulty tiers and combines them with
the 8 real trails into a 40-trail catalog (`catalog_seed42.json`, `catalog_seed7.json`)
and re-normalized real trails (`real_trails_renormalized.json`).
"""

import copy
import hashlib
import json
import os
import sys
from typing import Any, Dict, List, Tuple
import numpy as np

# Ensure root engine is importable
MODULE_DIR = os.path.dirname(os.path.abspath(__file__))
SIM_DIR = os.path.abspath(os.path.join(MODULE_DIR, "..", ".."))
ROOT = os.path.abspath(os.path.join(SIM_DIR, "..", ".."))
ENGINE_DIR = os.path.join(ROOT, "engine")
if ENGINE_DIR not in sys.path:
    sys.path.insert(0, ENGINE_DIR)
if MODULE_DIR not in sys.path:
    sys.path.insert(0, MODULE_DIR)

from profile_utils import flatten_profile_features, unflatten_profile_features  # noqa: E402
from config import (  # noqa: E402
    MAIN_SEED,
    ROBUSTNESS_SEED,
    SYNTHETIC_TRAIL_COUNT,
    REAL_TRAIL_COUNT,
    TOTAL_CATALOG_COUNT,
    TRAILS_PER_TIER,
    TIERS,
    PROVINCE_KEYS,
    PROVINCE_DISPLAY,
    TERRAIN_KEYS,
    CIRCULARITY_KEYS,
    CIRCULARITY_DISPLAY,
    WATERFORM_KEYS,
    TOURISM_KEYS,
    MIN_PROVINCE_APPEARANCES,
    MIN_TRAVERSE_COUNT,
    MIN_CIRCULAR_COUNT,
    TWO_PROVINCE_TRAIL_COUNT,
    ADJACENT_PROVINCE_PAIRS,
    TIER_RANGES,
    MAJOR_LASCO_THRESHOLD,
    MAJOR_COMBO_LASCO,
    MAJOR_COMBO_ELEVATION_MASL,
    LASCO_MAX_RATING,
    TERRAIN_PROBS_BY_TIER,
    WATERFORM_PROBS_BY_TIER,
    TOURISM_PROBS_BY_TIER,
    compute_config_hash,
)

OUTPUT_DIR = os.path.join(MODULE_DIR, "output")
REAL_TRAILS_SRC = os.path.join(SIM_DIR, "cycle_simulation", "inputs", "trails.json")

# Effective raw gains for the 8 real trails computed via calculateTrailGain
REAL_EFFECTIVE_GAINS: Dict[str, int] = {
    "00JGDwgZQQeIGXVituut": 229,
    "7aTSWWzmcnhS1Q4nfCog": 850,
    "B1ro3QWzbDwi2DKppspQ": 118,
    "DMq31CXnrRdGcMJbH8Dh": 157,
    "X3dyTBzI69aIysvX697H": 443,
    "bocOhrJcgk26AbByYazx": 954,
    "o1Oc3DAYGScmQWMOMlwu": 735,
    "p8Og0yqESHF4pHCfRLYq": 572,
}


def load_and_export_real_trails() -> List[Dict[str, Any]]:
    """Loads the 8 real trails from cycle_simulation/inputs/trails.json and exports them."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(REAL_TRAILS_SRC, "r", encoding="utf-8") as f:
        raw_trails = json.load(f)

    sorted_trails = sorted(raw_trails, key=lambda t: str(t["id"]))
    real_trails_formatted: List[Dict[str, Any]] = []

    for t in sorted_trails:
        tid = t["id"]
        diff = t.get("difficulty", {})
        geo = t.get("geography", {})
        gen = t.get("general", {})

        masl = int(geo.get("masl") or diff.get("elevation") or 0)
        length = float(diff.get("length", 0.0))
        gain = int(REAL_EFFECTIVE_GAINS.get(tid, diff.get("gain", 0)))
        slope = float(diff.get("slope", 0.0))
        lasco = int(diff.get("lascoRating", 0))
        cls_str = str(diff.get("classification", "minor")).lower()
        cls_val = 1.0 if cls_str == "major" else 0.0

        raw_dict = {
            "length": length,
            "elevation": masl,
            "gain": gain,
            "slope": slope,
            "lascoRating": lasco,
            "classification": cls_val,
        }

        # Build clean copy
        t_copy = copy.deepcopy(t)
        t_copy["synthetic"] = False
        t_copy["raw"] = raw_dict
        # Categorize real trails into tier based on lasco / length
        if lasco <= 3 and length < 6.0:
            tier = "easy"
        elif lasco <= 4 and length < 9.0:
            tier = "moderate"
        elif lasco <= 5 or length < 12.0:
            tier = "hard"
        else:
            tier = "very_hard"
        t_copy["tier"] = tier

        real_trails_formatted.append(t_copy)

    # Write real_trails.json
    out_path = os.path.join(OUTPUT_DIR, "real_trails.json")
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(real_trails_formatted, f, indent=2, sort_keys=True)
    print(f"[EXPORT] Saved {len(real_trails_formatted)} real trails to {os.path.relpath(out_path, ROOT)}")

    return real_trails_formatted


def build_quota_plan(seed: int) -> List[Dict[str, Any]]:
    """
    Deterministically assigns tier, route type, and provinces to 32 synthetic slots.
    Guarantees:
      - 8 trails per tier (32 total)
      - traverse >= 6, circular >= 6
      - each province >= 4 trails
      - exactly TWO_PROVINCE_TRAIL_COUNT trails span 2 provinces
    """
    rng = np.random.default_rng(seed)

    # 1. Tiers: exactly 8 per tier
    slot_tiers: List[str] = []
    for tier in TIERS:
        slot_tiers.extend([tier] * TRAILS_PER_TIER)

    # 2. Circularity allocation: 8 traverse, 8 circular, 16 out_and_back
    # Distributed evenly across tiers (2 traverse, 2 circular, 4 out_and_back per tier)
    tier_circularities: Dict[str, List[str]] = {}
    for tier in TIERS:
        tier_circs = ["traverse"] * 2 + ["circular"] * 2 + ["out_and_back"] * 4
        rng.shuffle(tier_circs)
        tier_circularities[tier] = tier_circs

    # 3. Province allocation:
    # 8 multi-province trails (2 per tier), 24 single-province trails (6 per tier)
    # Ensure all 5 provinces appear >= 4 times
    province_counts: Dict[str, int] = {p: 0 for p in PROVINCE_KEYS}
    slots: List[Dict[str, Any]] = []

    # Select 8 adjacent pairs for multi-province trails
    pair_indices = list(range(len(ADJACENT_PROVINCE_PAIRS)))
    chosen_pair_indices = rng.choice(pair_indices, size=TWO_PROVINCE_TRAIL_COUNT, replace=False)
    chosen_pairs = [ADJACENT_PROVINCE_PAIRS[i] for i in chosen_pair_indices]

    pair_idx = 0
    for tier in TIERS:
        circs = tier_circularities[tier]
        for slot_in_tier in range(TRAILS_PER_TIER):
            c_type = circs[slot_in_tier]
            if slot_in_tier < 2:  # First 2 slots in each tier are multi-province
                provs = sorted(chosen_pairs[pair_idx])
                pair_idx += 1
            else:
                # Single province: pick province with lowest current count to balance
                sorted_provs = sorted(PROVINCE_KEYS, key=lambda p: (province_counts[p], rng.random()))
                provs = [sorted_provs[0]]

            for p in provs:
                province_counts[p] += 1

            slots.append({
                "tier": tier,
                "circularity": c_type,
                "provinces": provs,
            })

    # Validate quotas immediately
    for p, count in province_counts.items():
        if count < MIN_PROVINCE_APPEARANCES:
            raise RuntimeError(f"Quota failed for province {p}: {count} < {MIN_PROVINCE_APPEARANCES}")

    trav_count = sum(1 for s in slots if s["circularity"] == "traverse")
    circ_count = sum(1 for s in slots if s["circularity"] == "circular")
    if trav_count < MIN_TRAVERSE_COUNT or circ_count < MIN_CIRCULAR_COUNT:
        raise RuntimeError(f"Circularity quota failed: traverse={trav_count}, circular={circ_count}")

    return slots


def generate_single_synthetic_trail(
    slot_id: int,
    slot_meta: Dict[str, Any],
    rng: np.random.Generator,
) -> Dict[str, Any]:
    """Generates all raw attributes, categorical features, and profile dict for one synthetic trail."""
    tier = slot_meta["tier"]
    trange = TIER_RANGES[tier]
    tid = f"SYN-{slot_id:02d}"

    # 1. Physical attributes
    # Draw length and target slope, then derive gain, guaranteeing slope == gain / (length * 1000) * 100
    for _ in range(1000):
        length = round(float(rng.uniform(trange["length_km"][0], trange["length_km"][1])), 2)
        target_slope = float(rng.uniform(trange["slope_pct"][0], trange["slope_pct"][1]))
        gain = int(round(length * 1000.0 * (target_slope / 100.0)))

        if trange["gain_m"][0] <= gain <= trange["gain_m"][1]:
            # Draw peak elevation such that masl >= gain + 50 (trailhead >= 50 MASL) within tier bounds
            min_masl = max(trange["elevation_masl"][0], gain + 50)
            max_masl = trange["elevation_masl"][1]
            if min_masl <= max_masl:
                masl = int(round(float(rng.uniform(min_masl, max_masl))))
                slope = round((gain / (length * 1000.0)) * 100.0, 2)
                break
    else:
        # Fallback if rejection loop exceeded
        length = round(float(np.mean(trange["length_km"])), 2)
        gain = int(round(np.mean(trange["gain_m"])))
        masl = int(round(np.mean(trange["elevation_masl"])))
        slope = round((gain / (length * 1000.0)) * 100.0, 2)

    lasco = int(rng.integers(trange["lasco_range"][0], trange["lasco_range"][1] + 1))
    hours = int(rng.integers(trange["hours_range"][0], trange["hours_range"][1] + 1))
    obstacles = int(rng.integers(trange["obstacles_range"][0], trange["obstacles_range"][1] + 1))

    # Classification rule
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
    }

    # 2. Categorical features
    # Provinces
    provinces = slot_meta["provinces"]
    prov_features = {p: 1.0 if p in provinces else 0.0 for p in PROVINCE_KEYS}

    # Circularity
    c_type = slot_meta["circularity"]
    circ_features = {c: 1.0 if c == c_type else 0.0 for c in CIRCULARITY_KEYS}

    # Terrains (multi-hot, at least one is 1.0)
    t_probs = TERRAIN_PROBS_BY_TIER[tier]
    terrain_features = {}
    for t_key in TERRAIN_KEYS:
        terrain_features[t_key] = 1.0 if rng.random() < t_probs[t_key] else 0.0
    if sum(terrain_features.values()) == 0.0:
        # Guarantee at least one terrain: pick highest probability terrain for this tier
        top_t = max(t_probs.keys(), key=lambda k: t_probs[k])
        terrain_features[top_t] = 1.0

    # Waterforms (sparse)
    w_probs = WATERFORM_PROBS_BY_TIER[tier]
    waterform_features = {}
    for w_key in WATERFORM_KEYS:
        waterform_features[w_key] = 1.0 if rng.random() < w_probs[w_key] else 0.0

    # Tourism Amenities (synchronized with waterforms)
    tm_probs = TOURISM_PROBS_BY_TIER[tier]
    tourism_features = {}
    for tm_key in TOURISM_KEYS:
        if tm_key == "waterfall":
            tourism_features[tm_key] = waterform_features.get("fall", 0.0)
        elif tm_key in ("river", "lake"):
            tourism_features[tm_key] = waterform_features.get(tm_key, 0.0)
        else:
            tourism_features[tm_key] = 1.0 if rng.random() < tm_probs.get(tm_key, 0.3) else 0.0

    # Build descriptive text
    prov_str = " / ".join(PROVINCE_DISPLAY[p] for p in provinces)
    circ_display = CIRCULARITY_DISPLAY[c_type]

    trail_doc = {
        "id": tid,
        "synthetic": True,
        "tier": tier,
        "raw": raw_dict,
        "general": {
            "name": f"Synthetic Trail {tid} ({tier.replace('_', ' ').title()})",
            "province": [PROVINCE_DISPLAY[p] for p in provinces],
            "address": f"{prov_str}, Philippines",
            "active": True,
            "description": (
                f"Synthetic benchmark route {tid} in {prov_str}. "
                f"Tier: {tier}. Length: {length} km, Gain: {gain} m, "
                f"Elevation: {masl} MASL, Lasco: {lasco}/9, Slope: {slope}%."
            ),
            "guidelines": ["Practice Leave No Trace (LNT) principles"],
            "lgu_rules": ["Follow local community regulations"],
            "mountain": [f"Mt. Synthetic {slot_id:02d}"],
            "rating": round(float(rng.uniform(3.5, 4.8)), 1),
            "reviewCount": int(rng.integers(5, 30)),
            "safety_tips": ["Bring adequate hydration and appropriate trail footwear."],
        },
        "difficulty": {
            "classification": "major" if is_major else "minor",
            "circularity": circ_display,
            "length": length,
            "elevation": masl,
            "gain": gain,
            "slope": slope,
            "lascoRating": lasco,
            "hours": hours,
            "obstacles": obstacles,
            "quality": [f"{k.capitalize()} terrain" for k, v in terrain_features.items() if v > 0],
            "difficulty_points": [f"Obstacles level {obstacles}"],
        },
        "geography": {
            "masl": masl,
            "start": {"latitude": round(14.0 + float(rng.uniform(0.0, 0.7)), 6), "longitude": round(120.8 + float(rng.uniform(0.0, 0.7)), 6)},
            "end": {"latitude": round(14.0 + float(rng.uniform(0.0, 0.7)), 6), "longitude": round(120.8 + float(rng.uniform(0.0, 0.7)), 6)},
        },
        "tourism": {k: bool(v > 0) for k, v in tourism_features.items()},
        "unnormalized_features": {
            "classification": classification_val,
            "length": length,
            "elevation": float(masl),
            "gain": float(gain),
            "slope": slope,
            "easy": lasco / LASCO_MAX_RATING,
            "province": prov_features,
            "terrain": terrain_features,
            "circularity": circ_features,
            "waterforms": waterform_features,
            "tourism": tourism_features,
        },
    }

    return trail_doc


def compute_40trail_bounds(
    real_trails: List[Dict[str, Any]],
    synthetic_trails: List[Dict[str, Any]],
) -> Dict[str, List[float]]:
    """
    Computes empirical min-max bounds over all 40 trails strictly for indices 1..4:
    length, elevation, gain, and slope.
    """
    all_trails = real_trails + synthetic_trails
    lengths = [float(t["raw"]["length"]) for t in all_trails]
    elevations = [float(t["raw"]["elevation"]) for t in all_trails]
    gains = [float(t["raw"]["gain"]) for t in all_trails]
    slopes = [float(t["raw"]["slope"]) for t in all_trails]

    return {
        "length": [round(min(lengths), 2), round(max(lengths), 2)],
        "elevation": [int(min(elevations)), int(max(elevations))],
        "gain": [int(min(gains)), int(max(gains))],
        "slope": [round(min(slopes), 2), round(max(slopes), 2)],
        "lasco": [1, 9],  # Fixed scale divisor (lascoRating / 9.0)
    }


def normalize_trail_features(
    trail_doc: Dict[str, Any],
    bounds: Dict[str, List[float]],
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Normalizes a trail doc against the 40-trail bounds:
      - index 0: classification (binary {0.0, 1.0})
      - indices 1..4: minMaxNormalize(length, elevation, gain, slope)
      - index 5: easy = lascoRating / 9.0
      - indices 6..31: categorical features (already in [0, 1])
    Returns (32-element numpy vector, unflattened nested profile features dict).
    """
    raw = trail_doc["raw"]

    def min_max(val: float, b_min: float, b_max: float) -> float:
        if b_max == b_min:
            return 0.0
        return float(np.clip((val - b_min) / (b_max - b_min), 0.0, 1.0))

    norm_len = min_max(float(raw["length"]), bounds["length"][0], bounds["length"][1])
    norm_elev = min_max(float(raw["elevation"]), bounds["elevation"][0], bounds["elevation"][1])
    norm_gain = min_max(float(raw["gain"]), bounds["gain"][0], bounds["gain"][1])
    norm_slope = min_max(float(raw["slope"]), bounds["slope"][0], bounds["slope"][1])
    norm_easy = float(np.clip(float(raw["lascoRating"]) / LASCO_MAX_RATING, 0.0, 1.0))
    cls_val = float(raw["classification"])

    if "unnormalized_features" in trail_doc:
        unnorm = trail_doc["unnormalized_features"]
        prov_dict = copy.deepcopy(unnorm["province"])
        terr_dict = copy.deepcopy(unnorm["terrain"])
        circ_dict = copy.deepcopy(unnorm["circularity"])
        water_dict = copy.deepcopy(unnorm["waterforms"])
        tour_dict = copy.deepcopy(unnorm["tourism"])
    else:
        # Real trail: extract from existing profile.features
        orig_feats = trail_doc.get("profile", {}).get("features", {})
        prov_dict = {p: float(orig_feats.get("province", {}).get(p, 0.0) or 0.0) for p in PROVINCE_KEYS}
        terr_dict = {t: float(orig_feats.get("terrain", {}).get(t, 0.0) or 0.0) for t in TERRAIN_KEYS}
        circ_dict = {c: float(orig_feats.get("circularity", {}).get(c, 0.0) or 0.0) for c in CIRCULARITY_KEYS}
        water_dict = {w: float(orig_feats.get("waterforms", {}).get(w, 0.0) or 0.0) for w in WATERFORM_KEYS}
        tour_dict = {tm: float(orig_feats.get("tourism", {}).get(tm, 0.0) or 0.0) for tm in TOURISM_KEYS}

    # Assemble 32-element array
    vec: List[float] = [
        cls_val,
        norm_len,
        norm_elev,
        norm_gain,
        norm_slope,
        norm_easy,
    ]
    for p in PROVINCE_KEYS:
        vec.append(float(prov_dict.get(p, 0.0)))
    for t in TERRAIN_KEYS:
        vec.append(float(terr_dict.get(t, 0.0)))
    for c in CIRCULARITY_KEYS:
        vec.append(float(circ_dict.get(c, 0.0)))
    for w in WATERFORM_KEYS:
        vec.append(float(water_dict.get(w, 0.0)))
    for tm in TOURISM_KEYS:
        vec.append(float(tour_dict.get(tm, 0.0)))

    vector_np = np.array(vec, dtype=np.float32)
    profile_features = unflatten_profile_features(vector_np)

    return vector_np, profile_features


def generate_catalog(seed: int, real_trails: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generates the full 40-trail catalog (8 real + 32 synthetic) for a given seed."""
    print(f"\n[CATALOG] Generating 40-trail catalog for seed={seed}...")
    rng = np.random.default_rng(seed)

    # 1. Quota plan
    quota_slots = build_quota_plan(seed=seed)

    # 2. Generate 32 synthetic trails
    synthetic_trails: List[Dict[str, Any]] = []
    for idx, slot_meta in enumerate(quota_slots, start=1):
        synth_doc = generate_single_synthetic_trail(
            slot_id=idx,
            slot_meta=slot_meta,
            rng=rng,
        )
        synthetic_trails.append(synth_doc)

    # 3. Compute 40-trail bounds
    bounds = compute_40trail_bounds(real_trails=real_trails, synthetic_trails=synthetic_trails)
    print(f"[BOUNDS]  40-Trail Min-Max Bounds: {bounds}")

    # 4. Normalize all 40 trails
    all_final_trails: List[Dict[str, Any]] = []

    # Real trails
    real_renormalized: List[Dict[str, Any]] = []
    for rt in real_trails:
        rt_copy = copy.deepcopy(rt)
        vec, prof_feats = normalize_trail_features(rt_copy, bounds)
        rt_copy["vector"] = [round(float(v), 6) for v in vec]
        rt_copy["profile"] = {
            "metadata": {"id": rt_copy["id"], "type": "trail"},
            "features": prof_feats,
        }
        all_final_trails.append(rt_copy)
        real_renormalized.append(rt_copy)

    # Synthetic trails
    for st in synthetic_trails:
        st_copy = copy.deepcopy(st)
        vec, prof_feats = normalize_trail_features(st_copy, bounds)
        st_copy["vector"] = [round(float(v), 6) for v in vec]
        st_copy["profile"] = {
            "metadata": {"id": st_copy["id"], "type": "trail"},
            "features": prof_feats,
        }
        if "unnormalized_features" in st_copy:
            del st_copy["unnormalized_features"]
        all_final_trails.append(st_copy)

    # Sort deterministically by id
    all_final_trails.sort(key=lambda t: str(t["id"]))

    catalog_header = {
        "catalog_name": f"THARESYS 40-Trail Combined Catalog (Seed {seed})",
        "seed": seed,
        "config_hash": compute_config_hash(),
        "total_trails": len(all_final_trails),
        "real_trail_count": len(real_trails),
        "synthetic_trail_count": len(synthetic_trails),
        "bounds": bounds,
    }

    catalog = {
        "header": catalog_header,
        "trails": all_final_trails,
    }

    return catalog, real_renormalized, bounds


def main() -> None:
    print("=" * 80)
    print("THARESYS SYNTHETIC TRAIL GENERATOR")
    print("=" * 80)

    # 1. Export real trails
    real_trails = load_and_export_real_trails()

    # 2. Generate main catalog (seed 42)
    cat42, real_renorm42, bounds42 = generate_catalog(seed=MAIN_SEED, real_trails=real_trails)
    out_cat42 = os.path.join(OUTPUT_DIR, "catalog_seed42.json")
    with open(out_cat42, "w", encoding="utf-8", newline="\n") as f:
        json.dump(cat42, f, indent=2, sort_keys=True)
    print(f"[SAVE]    Saved main catalog to {os.path.relpath(out_cat42, ROOT)}")

    # 3. Save bounds file and renormalized real trails
    out_bounds = os.path.join(OUTPUT_DIR, "norm_bounds_40trails.json")
    with open(out_bounds, "w", encoding="utf-8", newline="\n") as f:
        json.dump(bounds42, f, indent=2, sort_keys=True)
    print(f"[SAVE]    Saved 40-trail bounds to {os.path.relpath(out_bounds, ROOT)}")

    out_real_renorm = os.path.join(OUTPUT_DIR, "real_trails_renormalized.json")
    with open(out_real_renorm, "w", encoding="utf-8", newline="\n") as f:
        json.dump(real_renorm42, f, indent=2, sort_keys=True)
    print(f"[SAVE]    Saved renormalized real trails to {os.path.relpath(out_real_renorm, ROOT)}")

    # 4. Generate robustness catalog (seed 7)
    cat7, _, _ = generate_catalog(seed=ROBUSTNESS_SEED, real_trails=real_trails)
    out_cat7 = os.path.join(OUTPUT_DIR, "catalog_seed7.json")
    with open(out_cat7, "w", encoding="utf-8", newline="\n") as f:
        json.dump(cat7, f, indent=2, sort_keys=True)
    print(f"[SAVE]    Saved robustness catalog to {os.path.relpath(out_cat7, ROOT)}")

    print("\nGeneration completed successfully.")


if __name__ == "__main__":
    main()
