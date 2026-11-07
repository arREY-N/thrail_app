"""
Defines the complete 48-cohort simulation population:
- 24 Base Normal Cohorts (E1..E4 x N/M x P1..P3, concordant: stated == actual)
- 24 Aberrant Cohorts (12 mismatch pairs x N/M, discordant: stated != actual)

Pairs:
  Overestimated: 4-1, 4-2, 4-3, 3-1, 3-2, 2-1
  Underestimated: 1-4, 1-3, 1-2, 2-4, 2-3, 3-4

Generates:
  - scripts/simulation/aberrant_simulation/output/users_spec.json
  - scripts/simulation/aberrant_simulation/output/users.json
  - scripts/simulation/aberrant_simulation/output/start_distances.csv
"""

import os
import sys
import json
import csv
import copy
import hashlib
from typing import Dict, Any, List
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
ENGINE_DIR = os.path.join(ROOT, "engine")
sys.path.insert(0, ENGINE_DIR)

from formula import gower_distance, euclidean_distance, cosine_distance
from profile_utils import flatten_profile_features

MODULE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INPUTS_DIR = os.path.join(MODULE_DIR, "inputs")
OUTPUT_DIR = os.path.join(MODULE_DIR, "output")

GT_RANGES_PATH = os.path.join(INPUTS_DIR, "gt_ranges.json")
TRAILS_PATH = os.path.join(INPUTS_DIR, "trails.json")
TRAILS_META_PATH = os.path.join(INPUTS_DIR, "trails_meta.json")
APP_PROFILES_PATH = os.path.join(INPUTS_DIR, "app_profiles.json")

COVERED_FEATURES = [
    {"key": "classification", "index": 0},
    {"key": "length", "index": 1},
    {"key": "elevation", "index": 2},
    {"key": "gain", "index": 3},
    {"key": "slope", "index": 4},
    {"key": "easy", "index": 5},
    {"key": "muddy", "index": 11},
    {"key": "rocky", "index": 12},
    {"key": "grassland", "index": 13},
    {"key": "ridges", "index": 14},
]
PHYSICAL_KEYS = ["length", "elevation", "gain", "slope", "easy"]
TERRAIN_KEYS = ["muddy", "rocky", "grassland", "ridges"]

# 12 Mismatch Permutations
MISMATCH_PAIRS = [
    # Overestimated (stated > actual)
    {"stated": 4, "actual": 1, "type": "overestimated", "label": "Max Overestimation (Novice -> Expert)"},
    {"stated": 4, "actual": 2, "type": "overestimated", "label": "High Overestimation (Gentle -> Expert)"},
    {"stated": 4, "actual": 3, "type": "overestimated", "label": "Slight Overestimation (Interm -> Expert)"},
    {"stated": 3, "actual": 1, "type": "overestimated", "label": "High Overestimation (Novice -> Interm)"},
    {"stated": 3, "actual": 2, "type": "overestimated", "label": "Slight Overestimation (Gentle -> Interm)"},
    {"stated": 2, "actual": 1, "type": "overestimated", "label": "Near-Tier Overestimation (Novice -> Gentle)"},
    # Underestimated (stated < actual)
    {"stated": 1, "actual": 4, "type": "underestimated", "label": "Max Underestimation (Expert -> Novice)"},
    {"stated": 1, "actual": 3, "type": "underestimated", "label": "High Underestimation (Interm -> Novice)"},
    {"stated": 1, "actual": 2, "type": "underestimated", "label": "Near-Tier Underestimation (Gentle -> Novice)"},
    {"stated": 2, "actual": 4, "type": "underestimated", "label": "Moderate Underestimation (Expert -> Gentle)"},
    {"stated": 2, "actual": 3, "type": "underestimated", "label": "Near-Tier Underestimation (Interm -> Gentle)"},
    {"stated": 3, "actual": 4, "type": "underestimated", "label": "Near-Tier Underestimation (Expert -> Interm)"},
]


def sample_single_user_gt(user_id: str, exp_level: str, is_medical: bool, config: Dict[str, Any]) -> Dict[str, Any]:
    uid_hash = hashlib.sha256(user_id.encode("utf-8")).hexdigest()
    uid_seed_int = int(uid_hash[:8], 16)
    ss = np.random.SeedSequence([42, uid_seed_int])
    rng = np.random.default_rng(ss)

    band = config["bands"][exp_level]
    cls_band = config["classification"]
    med_range = config["medical_scale_range"]
    min_physical_gap = config["min_physical_diff_gap"]

    for attempt in range(100):
        cls_easy = float(rng.uniform(cls_band["easy"][0], cls_band["easy"][1]))
        cls_diff = float(rng.uniform(cls_band["difficult"][0], cls_band["difficult"][1]))

        phys_easy = {}
        phys_diff = {}
        for k in PHYSICAL_KEYS:
            phys_easy[k] = float(rng.uniform(band["easy"][0], band["easy"][1]))
            phys_diff[k] = float(rng.uniform(band["difficult"][0], band["difficult"][1]))

        terr_easy = {}
        terr_diff = {}
        for k in TERRAIN_KEYS:
            terr_easy[k] = float(rng.uniform(band["easy"][0], band["easy"][1]))
            terr_diff[k] = float(rng.uniform(band["difficult"][0], band["difficult"][1]))

        m_scale = 1.0
        if is_medical:
            m_scale = float(rng.uniform(med_range[0], med_range[1]))
            for k in PHYSICAL_KEYS:
                phys_easy[k] = float(np.clip(phys_easy[k] * m_scale, 0.0, 1.0))
                phys_diff[k] = float(np.clip(phys_diff[k] * m_scale, 0.0, 1.0))
            for k in TERRAIN_KEYS:
                terr_easy[k] = float(np.clip(terr_easy[k] * m_scale, 0.0, 1.0))
                terr_diff[k] = float(np.clip(terr_diff[k] * m_scale, 0.0, 1.0))

        valid_gaps = all((phys_diff[k] - phys_easy[k]) >= min_physical_gap for k in PHYSICAL_KEYS)
        if valid_gaps:
            easy_features = {"classification": round(cls_easy, 4)}
            diff_features = {"classification": round(cls_diff, 4)}
            for k in PHYSICAL_KEYS:
                easy_features[k] = round(phys_easy[k], 4)
                diff_features[k] = round(phys_diff[k], 4)
            for k in TERRAIN_KEYS:
                easy_features[k] = round(terr_easy[k], 4)
                diff_features[k] = round(terr_diff[k], 4)

            return {
                "seed": [42, uid_seed_int],
                "medical_scale_factor": round(m_scale, 4) if is_medical else None,
                "attempts": attempt + 1,
                "easy": easy_features,
                "difficult": diff_features
            }

    raise RuntimeError(f"Could not sample ground truth for {user_id}")


def build_covered_vector(feat_dict: Dict[str, Any]) -> np.ndarray:
    return np.array([float(feat_dict[f["key"]]) for f in COVERED_FEATURES], dtype=np.float32)


def extract_app_covered_vector(app_32_vec: np.ndarray) -> np.ndarray:
    return np.array([float(app_32_vec[f["index"]]) for f in COVERED_FEATURES], dtype=np.float32)


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    with open(GT_RANGES_PATH, "r", encoding="utf-8") as f:
        gt_config = json.load(f)

    with open(TRAILS_META_PATH, "r", encoding="utf-8") as f:
        trails_meta = json.load(f)

    with open(APP_PROFILES_PATH, "r", encoding="utf-8") as f:
        app_users = json.load(f)

    app_user_map = {u["id"]: u for u in app_users}

    norm_bounds = {
        "length": [3.1, 14.1],
        "elevation": [438, 1090],
        "gain": [112, 948],
        "slope": [5.0, 14.0],
        "lasco": [1, 9]
    }

    final_users: List[Dict[str, Any]] = []
    start_distance_rows: List[Dict[str, Any]] = []
    users_spec: List[Dict[str, Any]] = []

    # 1. Add Base 24 Normal Cohorts
    for u in app_users:
        uid = u["id"]
        exp = u["experience"]
        is_med = bool(u.get("medicalProfile", {}).get("hasCondition", False))
        med_str = "M" if is_med else "N"
        prov = u.get("province_pattern", "P1")

        gt_data = sample_single_user_gt(uid, exp, is_med, gt_config)

        app_easy_32 = flatten_profile_features(u["profile"]["easy"])
        app_diff_32 = flatten_profile_features(u["profile"]["difficult"])
        app_easy_10 = extract_app_covered_vector(app_easy_32)
        app_diff_10 = extract_app_covered_vector(app_diff_32)
        gt_easy_10 = build_covered_vector(gt_data["easy"])
        gt_diff_10 = build_covered_vector(gt_data["difficult"])

        easy_gd = round(float(gower_distance(app_easy_10, gt_easy_10)), 4)
        easy_ed = round(float(euclidean_distance(app_easy_10, gt_easy_10)), 4)
        easy_cs = round(float(cosine_distance(app_easy_10, gt_easy_10)), 4)
        diff_gd = round(float(gower_distance(app_diff_10, gt_diff_10)), 4)
        diff_ed = round(float(euclidean_distance(app_diff_10, gt_diff_10)), 4)
        diff_cs = round(float(cosine_distance(app_diff_10, gt_diff_10)), 4)

        tier_num = int(exp[1])
        record = {
            "id": uid,
            "cohort_group": "normal",
            "experience": exp,
            "stated_experience": exp,
            "actual_experience": exp,
            "stated_tier": tier_num,
            "actual_tier": tier_num,
            "mismatch_type": "concordant",
            "mismatch_gap": 0,
            "label": f"Normal Concordant ({exp})",
            "medical": med_str,
            "province_pattern": prov,
            "medicalProfile": u.get("medicalProfile", {}),
            "preferences": u.get("preferences", {}),
            "profile": copy.deepcopy(u.get("profile", {})),
            "groundTruth": {
                "covered_features": [f["key"] for f in COVERED_FEATURES],
                "feature_indices": [f["index"] for f in COVERED_FEATURES],
                "seed": gt_data["seed"],
                "medical_scale_factor": gt_data["medical_scale_factor"],
                "attempts": gt_data["attempts"],
                "easy": gt_data["easy"],
                "difficult": gt_data["difficult"]
            },
            "versions": {
                "trail_export_hash": trails_meta.get("sha256", ""),
                "normalization_bounds": norm_bounds
            }
        }
        final_users.append(record)

        start_distance_rows.append({
            "user_id": uid,
            "cohort_group": "normal",
            "stated_tier": tier_num,
            "actual_tier": tier_num,
            "mismatch_type": "concordant",
            "mismatch_gap": 0,
            "medical": med_str,
            "province": prov,
            "easy_gower": easy_gd,
            "easy_euclidean": easy_ed,
            "easy_cosine": easy_cs,
            "diff_gower": diff_gd,
            "diff_euclidean": diff_ed,
            "diff_cosine": diff_cs,
            "mean_gower": round((easy_gd + diff_gd) / 2.0, 4)
        })

        ticked_locs = u.get("preferences", {}).get("location", [])
        users_spec.append({
            "id": uid,
            "cohort_group": "normal",
            "experience": exp,
            "stated_experience": exp,
            "actual_experience": exp,
            "medical": med_str,
            "province_pattern": prov,
            "expected_trail_ids": [],  # Will be mapped in harness
            "ticked_names": ticked_locs
        })

    # 2. Add 24 Aberrant Cohorts (12 pairs x N/M, standardized P1)
    for pair in MISMATCH_PAIRS:
        s = pair["stated"]
        a = pair["actual"]
        m_type = pair["type"]
        gap = s - a
        label = pair["label"]

        for med_str in ["N", "M"]:
            is_med = (med_str == "M")
            uid = f"AB-{s}-{a}-{med_str}-P1"
            base_template_id = f"E{s}-{med_str}-P1"
            base_user = app_user_map[base_template_id]

            # Sample ground truth from ACTUAL tier
            gt_data = sample_single_user_gt(uid, f"E{a}", is_med, gt_config)

            # App profile is cloned from STATED tier
            app_easy_32 = flatten_profile_features(base_user["profile"]["easy"])
            app_diff_32 = flatten_profile_features(base_user["profile"]["difficult"])
            app_easy_10 = extract_app_covered_vector(app_easy_32)
            app_diff_10 = extract_app_covered_vector(app_diff_32)
            gt_easy_10 = build_covered_vector(gt_data["easy"])
            gt_diff_10 = build_covered_vector(gt_data["difficult"])

            easy_gd = round(float(gower_distance(app_easy_10, gt_easy_10)), 4)
            easy_ed = round(float(euclidean_distance(app_easy_10, gt_easy_10)), 4)
            easy_cs = round(float(cosine_distance(app_easy_10, gt_easy_10)), 4)
            diff_gd = round(float(gower_distance(app_diff_10, gt_diff_10)), 4)
            diff_ed = round(float(euclidean_distance(app_diff_10, gt_diff_10)), 4)
            diff_cs = round(float(cosine_distance(app_diff_10, gt_diff_10)), 4)

            record = {
                "id": uid,
                "cohort_group": "aberrant",
                "experience": f"E{s}",  # App believes stated experience
                "stated_experience": f"E{s}",
                "actual_experience": f"E{a}",
                "stated_tier": s,
                "actual_tier": a,
                "mismatch_type": m_type,
                "mismatch_gap": gap,
                "label": label,
                "medical": med_str,
                "province_pattern": "P1",
                "medicalProfile": copy.deepcopy(base_user.get("medicalProfile", {})),
                "preferences": copy.deepcopy(base_user.get("preferences", {})),
                "profile": copy.deepcopy(base_user.get("profile", {})),
                "groundTruth": {
                    "covered_features": [f["key"] for f in COVERED_FEATURES],
                    "feature_indices": [f["index"] for f in COVERED_FEATURES],
                    "seed": gt_data["seed"],
                    "medical_scale_factor": gt_data["medical_scale_factor"],
                    "attempts": gt_data["attempts"],
                    "easy": gt_data["easy"],
                    "difficult": gt_data["difficult"]
                },
                "versions": {
                    "trail_export_hash": trails_meta.get("sha256", ""),
                    "normalization_bounds": norm_bounds
                }
            }
            final_users.append(record)

            start_distance_rows.append({
                "user_id": uid,
                "cohort_group": "aberrant",
                "stated_tier": s,
                "actual_tier": a,
                "mismatch_type": m_type,
                "mismatch_gap": gap,
                "medical": med_str,
                "province": "P1",
                "easy_gower": easy_gd,
                "easy_euclidean": easy_ed,
                "easy_cosine": easy_cs,
                "diff_gower": diff_gd,
                "diff_euclidean": diff_ed,
                "diff_cosine": diff_cs,
                "mean_gower": round((easy_gd + diff_gd) / 2.0, 4)
            })

            ticked_locs = base_user.get("preferences", {}).get("location", [])
            users_spec.append({
                "id": uid,
                "cohort_group": "aberrant",
                "experience": f"E{s}",
                "stated_experience": f"E{s}",
                "actual_experience": f"E{a}",
                "medical": med_str,
                "province_pattern": "P1",
                "expected_trail_ids": [],
                "ticked_names": ticked_locs
            })

    # Sort users by id
    final_users.sort(key=lambda x: x["id"])
    start_distance_rows.sort(key=lambda x: (x["cohort_group"] != "normal", x["user_id"]))
    users_spec.sort(key=lambda x: x["id"])

    # Write files
    users_json_path = os.path.join(OUTPUT_DIR, "users.json")
    with open(users_json_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(final_users, f, indent=2, sort_keys=True, ensure_ascii=False)

    users_spec_path = os.path.join(OUTPUT_DIR, "users_spec.json")
    with open(users_spec_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(users_spec, f, indent=2, sort_keys=True, ensure_ascii=False)

    csv_path = os.path.join(OUTPUT_DIR, "start_distances.csv")
    fieldnames = [
        "user_id", "cohort_group", "stated_tier", "actual_tier",
        "mismatch_type", "mismatch_gap", "medical", "province",
        "easy_gower", "easy_euclidean", "easy_cosine",
        "diff_gower", "diff_euclidean", "diff_cosine", "mean_gower"
    ]
    with open(csv_path, "w", encoding="utf-8", newline="\n") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(start_distance_rows)

    print(f"Generated {len(final_users)} total cohorts in {users_json_path}")
    print(f"  - Normal Cohorts: {sum(1 for u in final_users if u['cohort_group'] == 'normal')}")
    print(f"  - Aberrant Cohorts: {sum(1 for u in final_users if u['cohort_group'] == 'aberrant')}")
    print(f"Start distances saved to {csv_path}")


if __name__ == "__main__":
    main()
