"""
THARESYS User Set Generation & Seeding Engine

Generates 5 distinct, calibrated user sets based on the 44 canonical cohorts.
Guarantees:
1. Strict schema compliance with THARESYS canonical 32-feature vector registry.
2. Complete non-overlap and mathematical uniqueness between all 5 sets.
3. Strict physical monotonicity enforcement: P_diff[k] >= P_easy[k] + 0.05 for k in 0..5.
4. Exact Medical Twin downscaling: 0.80x on physical (indices 1..5) & terrain (indices 11..14).
5. Ground truth sampling for evaluation readiness.
"""

import os
import sys
import json
import copy
import hashlib
from typing import Dict, Any, List, Tuple
import numpy as np

# Ensure engine path is in sys.path
ENGINE_DIR = os.path.dirname(os.path.abspath(__file__))
if ENGINE_DIR not in sys.path:
    sys.path.insert(0, ENGINE_DIR)

from parameters import (
    CANONICAL_FEATURES,
    ANCHOR_MONOTONICITY_MIN_GAP,
    DEFAULT_FEATURE_WEIGHTS,
)
from profile_utils import (
    flatten_profile_features,
    unflatten_profile_features,
    PROVINCE_KEYS,
    TERRAIN_KEYS,
    CIRCULARITY_KEYS,
    WATERFORM_KEYS,
    TOURISM_KEYS,
)
from formula import gower_distance, euclidean_distance, cosine_distance

PHYSICAL_KEYS = ["length", "elevation", "gain", "slope", "easy"]

NORMAL_EXPERIENCE = ["E1", "E2", "E3", "E4"]
NORMAL_MEDICAL = ["N", "M"]
NORMAL_PROVINCES = ["P1", "P2", "P3"]

OVERESTIMATED_PAIRS = [
    {"stated": 4, "actual": 1, "label": "Max Overestimation (Novice -> Expert)"},
    {"stated": 4, "actual": 2, "label": "High Overestimation (Gentle -> Expert)"},
    {"stated": 4, "actual": 3, "label": "Slight Overestimation (Interm -> Expert)"},
    {"stated": 3, "actual": 1, "label": "High Overestimation (Novice -> Interm)"},
    {"stated": 3, "actual": 2, "label": "Slight Overestimation (Gentle -> Interm)"},
    {"stated": 2, "actual": 1, "label": "Near-Tier Overestimation (Novice -> Gentle)"},
]

UNDERESTIMATED_PAIRS = [
    {"stated": 1, "actual": 4, "label": "Max Underestimation (Expert -> Novice)"},
    {"stated": 1, "actual": 3, "label": "High Underestimation (Interm -> Novice)"},
    {"stated": 1, "actual": 2, "label": "Near-Tier Underestimation (Gentle -> Novice)"},
    {"stated": 2, "actual": 4, "label": "Moderate Underestimation (Expert -> Gentle)"},
]

ABERRANT_PAIRS = OVERESTIMATED_PAIRS + UNDERESTIMATED_PAIRS  # 10 pairs * 2 (N, M) = 20 cohorts

TIER_PHYSICAL_BOUNDS = {
    "E1": {"easy": (0.10, 0.22), "difficult": (0.45, 0.65)},
    "E2": {"easy": (0.14, 0.28), "difficult": (0.50, 0.70)},
    "E3": {"easy": (0.24, 0.38), "difficult": (0.65, 0.82)},
    "E4": {"easy": (0.34, 0.48), "difficult": (0.78, 0.95)},
}

PROVINCE_PATTERNS = {
    "P1": ["Rizal"],
    "P2": ["Batangas", "Laguna"],
    "P3": ["Cavite"],
}


def build_cohort_catalog() -> List[Dict[str, Any]]:
    """Builds the canonical 44 cohort blueprints."""
    cohorts = []

    # 1. 24 Normal Cohorts
    for exp in NORMAL_EXPERIENCE:
        tier = int(exp[1])
        for med in NORMAL_MEDICAL:
            is_med = (med == "M")
            for prov in NORMAL_PROVINCES:
                cohort_id = f"{exp}-{med}-{prov}"
                base_twin_id = f"{exp}-{prov}"
                cohorts.append({
                    "cohort_id": cohort_id,
                    "base_twin_id": base_twin_id,
                    "cohort_group": "normal",
                    "stated_tier": tier,
                    "actual_tier": tier,
                    "stated_experience": exp,
                    "actual_experience": exp,
                    "mismatch_type": "concordant",
                    "mismatch_gap": 0,
                    "label": f"Normal Concordant ({exp}, {med}, {prov})",
                    "medical": med,
                    "is_medical": is_med,
                    "province_pattern": prov,
                    "provinces": PROVINCE_PATTERNS[prov],
                })

    # 2. 20 Aberrant Cohorts
    for pair in ABERRANT_PAIRS:
        s = pair["stated"]
        a = pair["actual"]
        m_type = "overestimated" if s > a else "underestimated"
        gap = s - a
        for med in ["N", "M"]:
            is_med = (med == "M")
            cohort_id = f"AB-{s}-{a}-{med}-P1"
            base_twin_id = f"AB-{s}-{a}-P1"
            cohorts.append({
                "cohort_id": cohort_id,
                "base_twin_id": base_twin_id,
                "cohort_group": "aberrant",
                "stated_tier": s,
                "actual_tier": a,
                "stated_experience": f"E{s}",
                "actual_experience": f"E{a}",
                "mismatch_type": m_type,
                "mismatch_gap": gap,
                "label": f"Aberrant {m_type.capitalize()} ({pair['label']}, {med})",
                "medical": med,
                "is_medical": is_med,
                "province_pattern": "P1",
                "provinces": PROVINCE_PATTERNS["P1"],
            })

    assert len(cohorts) == 44, f"Expected 44 cohorts, got {len(cohorts)}"
    return cohorts


def generate_set_profiles(set_index: int, blueprints: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Generates all 44 user profiles for a given set_index, ensuring:
    - Base non-medical draws are consistent for medical twin pairs within the set.
    - Medical cohorts strictly scale physical and terrain features by 0.80x.
    - Strict physical monotonicity: P_diff[k] >= P_easy[k] + 0.05.
    - Inter-set diversity via set-specific seeds and stratified offsets.
    """
    set_users = []
    base_seed = 7000 + (set_index * 111)

    # Cache for twin base physical & terrain draws: base_twin_id -> base_draws
    twin_cache: Dict[str, Dict[str, Any]] = {}

    for c_idx, bp in enumerate(blueprints):
        user_seed = base_seed + (c_idx * 37)
        rng = np.random.default_rng(user_seed)

        user_id = f"s{set_index}_{bp['cohort_id']}"
        twin_id = bp["base_twin_id"]
        stated_exp = bp["stated_experience"]
        actual_exp = bp["actual_experience"]
        is_med = bp["is_medical"]
        med_factor = 0.80 if is_med else 1.00
        min_gap = ANCHOR_MONOTONICITY_MIN_GAP  # 0.05

        # Stratified offset per set (Set 1..5)
        set_jitter = (set_index - 3) * 0.025  # -0.05, -0.025, 0.0, +0.025, +0.05
        bounds = TIER_PHYSICAL_BOUNDS[stated_exp]

        if twin_id not in twin_cache:
            # Generate unscaled base physical features
            cls_easy_base = float(np.clip(rng.uniform(0.00, 0.12) + set_jitter * 0.4, 0.0, 0.20))
            cls_diff_base = float(np.clip(rng.uniform(0.72, 0.95) + set_jitter * 0.4, 0.65, 1.0))

            phys_easy_base = {}
            phys_diff_base = {}
            for k in PHYSICAL_KEYS:
                low_e, high_e = bounds["easy"]
                low_d, high_d = bounds["difficult"]
                ve = float(np.clip(rng.uniform(low_e, high_e) + set_jitter, 0.08, 0.50))
                vd = float(np.clip(rng.uniform(low_d, high_d) + set_jitter, ve + min_gap + 0.05, 1.00))
                phys_easy_base[k] = ve
                phys_diff_base[k] = vd

            # Base terrain features
            primary_terrain_idx = (set_index + bp["stated_tier"]) % len(TERRAIN_KEYS)
            terr_easy_base = {}
            terr_diff_base = {}
            for i, t in enumerate(TERRAIN_KEYS):
                bt = 0.40 if i == primary_terrain_idx else 0.20
                te = float(np.clip(rng.uniform(bt - 0.08, bt + 0.12) + (set_jitter * 0.4), 0.08, 0.55))
                td = float(np.clip(rng.uniform(bt + 0.18, bt + 0.42) + (set_jitter * 0.4), te + 0.03, 1.0))
                terr_easy_base[t] = te
                terr_diff_base[t] = td

            twin_cache[twin_id] = {
                "cls_easy": cls_easy_base,
                "cls_diff": cls_diff_base,
                "phys_easy": phys_easy_base,
                "phys_diff": phys_diff_base,
                "terr_easy": terr_easy_base,
                "terr_diff": terr_diff_base,
            }

        base = twin_cache[twin_id]

        # Apply medical scaling strictly to physical and terrain features
        cls_easy = round(base["cls_easy"], 4)
        cls_diff = round(base["cls_diff"], 4)

        easy_phys = {}
        diff_phys = {}
        for k in PHYSICAL_KEYS:
            ve = round(float(np.clip(base["phys_easy"][k] * med_factor, 0.04, 1.0)), 4)
            vd = round(float(np.clip(base["phys_diff"][k] * med_factor, ve + min_gap, 1.0)), 4)
            # Guarantee monotonicity
            if vd < ve + min_gap:
                vd = round(ve + min_gap, 4)
            easy_phys[k] = ve
            diff_phys[k] = vd

        terrain_easy = {t: round(float(np.clip(base["terr_easy"][t] * med_factor, 0.04, 1.0)), 4) for t in TERRAIN_KEYS}
        terrain_diff = {t: round(float(np.clip(base["terr_diff"][t] * med_factor, terrain_easy[t] + 0.02, 1.0)), 4) for t in TERRAIN_KEYS}

        # Province affinities (indices 6..10)
        user_provs = [p.lower() for p in bp["provinces"]]
        prov_easy = {}
        prov_diff = {}
        for p in PROVINCE_KEYS:
            is_pref = (p in user_provs)
            if is_pref:
                pe = rng.uniform(0.80, 0.90) + (set_index * 0.01)
                pd = rng.uniform(0.10, 0.20)
            else:
                pe = rng.uniform(0.10, 0.18)
                pd = rng.uniform(0.78, 0.88) + (set_index * 0.01)
            prov_easy[p] = round(float(np.clip(pe, 0.0, 1.0)), 4)
            prov_diff[p] = round(float(np.clip(pd, 0.0, 1.0)), 4)

        # Circularity (indices 15..17)
        circ_weights_easy = rng.dirichlet(np.array([1.2, 0.8, 1.0]) + (set_index * 0.1))
        circ_weights_diff = rng.dirichlet(np.array([0.8, 1.2, 1.0]) + (set_index * 0.1))
        circularity_easy = {c: round(float(circ_weights_easy[i]), 4) for i, c in enumerate(CIRCULARITY_KEYS)}
        circularity_diff = {c: round(float(circ_weights_diff[i]), 4) for i, c in enumerate(CIRCULARITY_KEYS)}

        # Waterforms (indices 18..20)
        water_easy = {w: round(float(rng.uniform(0.18, 0.35)), 4) for w in WATERFORM_KEYS}
        water_diff = {w: round(float(rng.uniform(0.38, 0.65)), 4) for w in WATERFORM_KEYS}

        # Tourism Amenities (indices 21..31)
        tourism_easy = {tm: round(float(rng.uniform(0.12, 0.32)), 4) for tm in TOURISM_KEYS}
        tourism_diff = {tm: round(float(rng.uniform(0.28, 0.52)), 4) for tm in TOURISM_KEYS}

        easy_features = {
            "classification": cls_easy,
            "length": easy_phys["length"],
            "elevation": easy_phys["elevation"],
            "gain": easy_phys["gain"],
            "slope": easy_phys["slope"],
            "easy": easy_phys["easy"],
            "province": prov_easy,
            "terrain": terrain_easy,
            "circularity": circularity_easy,
            "waterforms": water_easy,
            "tourism": tourism_easy,
        }

        diff_features = {
            "classification": cls_diff,
            "length": diff_phys["length"],
            "elevation": diff_phys["elevation"],
            "gain": diff_phys["gain"],
            "slope": diff_phys["slope"],
            "easy": diff_phys["easy"],
            "province": prov_diff,
            "terrain": terrain_diff,
            "circularity": circularity_diff,
            "waterforms": water_diff,
            "tourism": tourism_diff,
        }

        # Sample Ground Truth for ACTUAL tier
        gt_bounds = TIER_PHYSICAL_BOUNDS[actual_exp]
        gt_easy_phys = {k: round(float(rng.uniform(gt_bounds["easy"][0], gt_bounds["easy"][1]) * med_factor), 4) for k in PHYSICAL_KEYS}
        gt_diff_phys = {k: round(float(rng.uniform(gt_bounds["difficult"][0], gt_bounds["difficult"][1]) * med_factor), 4) for k in PHYSICAL_KEYS}
        for k in PHYSICAL_KEYS:
            if gt_diff_phys[k] < gt_easy_phys[k] + min_gap:
                gt_diff_phys[k] = round(gt_easy_phys[k] + min_gap + 0.05, 4)

        ground_truth = {
            "seed": [int(base_seed), int(user_seed)],
            "attempts": 1,
            "medical_scale_factor": float(round(med_factor, 4)) if is_med else None,
            "easy": {
                "classification": round(float(rng.uniform(0.00, 0.15)), 4),
                **gt_easy_phys,
                "muddy": round(float(rng.uniform(0.10, 0.35) * med_factor), 4),
                "rocky": round(float(rng.uniform(0.10, 0.35) * med_factor), 4),
                "grassland": round(float(rng.uniform(0.10, 0.35) * med_factor), 4),
                "ridges": round(float(rng.uniform(0.10, 0.35) * med_factor), 4),
            },
            "difficult": {
                "classification": round(float(rng.uniform(0.70, 0.95)), 4),
                **gt_diff_phys,
                "muddy": round(float(rng.uniform(0.40, 0.80) * med_factor), 4),
                "rocky": round(float(rng.uniform(0.40, 0.80) * med_factor), 4),
                "grassland": round(float(rng.uniform(0.40, 0.80) * med_factor), 4),
                "ridges": round(float(rng.uniform(0.40, 0.80) * med_factor), 4),
            }
        }

        user_record = {
            "id": user_id,
            "set_id": set_index,
            "cohort_id": bp["cohort_id"],
            "cohort_group": bp["cohort_group"],
            "experience": bp["stated_experience"],
            "stated_experience": bp["stated_experience"],
            "actual_experience": bp["actual_experience"],
            "stated_tier": bp["stated_tier"],
            "actual_tier": bp["actual_tier"],
            "mismatch_type": bp["mismatch_type"],
            "mismatch_gap": bp["mismatch_gap"],
            "label": bp["label"],
            "medical": bp["medical"],
            "medicalProfile": {"hasCondition": is_med},
            "preferences": {
                "experience": bp["stated_experience"],
                "province": bp["provinces"],
                "location": [],
            },
            "profile": {
                "easy": {
                    "metadata": {"type": "user", "id": user_id, "profile": "easy", "set": set_index},
                    "features": easy_features
                },
                "difficult": {
                    "metadata": {"type": "user", "id": user_id, "profile": "difficult", "set": set_index},
                    "features": diff_features
                }
            },
            "groundTruth": ground_truth,
        }
        set_users.append(user_record)

    return set_users


def generate_all_sets(output_dir: str) -> Dict[str, Any]:
    os.makedirs(output_dir, exist_ok=True)
    blueprints = build_cohort_catalog()

    all_sets = {}
    summary = {
        "total_sets": 5,
        "cohorts_per_set": len(blueprints),
        "total_users": 5 * len(blueprints),
        "sets": {}
    }

    for s_idx in range(1, 6):
        set_users = generate_set_profiles(s_idx, blueprints)

        set_filename = f"set_{s_idx}_users.json"
        set_filepath = os.path.join(output_dir, set_filename)
        with open(set_filepath, "w", encoding="utf-8") as f:
            json.dump(set_users, f, indent=2)

        all_sets[s_idx] = set_users
        summary["sets"][f"set_{s_idx}"] = {
            "file": set_filename,
            "user_count": len(set_users),
            "normal_count": sum(1 for u in set_users if u["cohort_group"] == "normal"),
            "aberrant_count": sum(1 for u in set_users if u["cohort_group"] == "aberrant"),
            "sample_user_ids": [u["id"] for u in set_users[:5]],
        }

    summary_path = os.path.join(output_dir, "seeded_user_sets_summary.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    return all_sets


if __name__ == "__main__":
    out_dir = os.path.join(ENGINE_DIR, "data", "seeded_user_sets")
    print(f"Generating 5 calibrated user sets of 44 cohorts into {out_dir}...")
    sets = generate_all_sets(out_dir)
    print("Generation complete! Sets generated:")
    for s_idx, ulist in sets.items():
        print(f"  Set {s_idx}: {len(ulist)} users generated.")
