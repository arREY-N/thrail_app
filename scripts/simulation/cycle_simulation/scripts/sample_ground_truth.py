"""
Step 5 & 6: Ground Truth Sampling and Users Serialization.

Generates:
  - scripts/simulation/output/users.json
  - scripts/simulation/output/start_distances.csv

Deterministic per user: seed is [42, uint32(sha256(user_id))].
Adding/removing a user does not change anyone else's ground truth.
"""

import os
import sys
import json
import csv
import hashlib
import subprocess
from typing import Dict, Any, List, Tuple
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "engine"))

from formula import gower_distance, euclidean_distance, cosine_distance
from profile_utils import flatten_profile_features

HERE = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(HERE, "output")
GT_RANGES_PATH = os.path.join(HERE, "gt_ranges.json")
TRAILS_META_PATH = os.path.join(OUTPUT_DIR, "trails_meta.json")
APP_PROFILES_PATH = os.path.join(OUTPUT_DIR, "app_profiles.json")

# 10 Ground Truth Features and canonical indices in 32-dim vector
COVERED_FEATURES = [
    {"key": "classification", "index": 0, "type": "classification"},
    {"key": "length", "index": 1, "type": "physical"},
    {"key": "elevation", "index": 2, "type": "physical"},
    {"key": "gain", "index": 3, "type": "physical"},
    {"key": "slope", "index": 4, "type": "physical"},
    {"key": "easy", "index": 5, "type": "physical"},  # Lasco rating
    {"key": "muddy", "index": 11, "type": "terrain"},
    {"key": "rocky", "index": 12, "type": "terrain"},
    {"key": "grassland", "index": 13, "type": "terrain"},
    {"key": "ridges", "index": 14, "type": "terrain"},
]

PHYSICAL_KEYS = ["length", "elevation", "gain", "slope", "easy"]
TERRAIN_KEYS = ["muddy", "rocky", "grassland", "ridges"]


def get_git_commit() -> str:
    try:
        res = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=True
        )
        return res.stdout.strip()
    except Exception:
        return "8007798b"


def sample_single_user_gt(user_id: str, exp_level: str, is_medical: bool, config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Samples Ground Truth easy and difficult anchors for a single user deterministically.
    Seed is derived solely from [42, stable_int(sha256(user_id))].
    """
    uid_hash = hashlib.sha256(user_id.encode("utf-8")).hexdigest()
    uid_seed_int = int(uid_hash[:8], 16)
    ss = np.random.SeedSequence([42, uid_seed_int])
    rng = np.random.default_rng(ss)

    band = config["bands"][exp_level]
    cls_band = config["classification"]
    med_range = config["medical_scale_range"]
    min_physical_gap = config["min_physical_diff_gap"]

    for attempt in range(100):
        # 1. Classification
        cls_easy = float(rng.uniform(cls_band["easy"][0], cls_band["easy"][1]))
        cls_diff = float(rng.uniform(cls_band["difficult"][0], cls_band["difficult"][1]))

        # 2. Physical features
        phys_easy = {}
        phys_diff = {}
        for k in PHYSICAL_KEYS:
            phys_easy[k] = float(rng.uniform(band["easy"][0], band["easy"][1]))
            phys_diff[k] = float(rng.uniform(band["difficult"][0], band["difficult"][1]))

        # 3. Terrain features
        terr_easy = {}
        terr_diff = {}
        for k in TERRAIN_KEYS:
            terr_easy[k] = float(rng.uniform(band["easy"][0], band["easy"][1]))
            terr_diff[k] = float(rng.uniform(band["difficult"][0], band["difficult"][1]))

        # 4. Medical scaling
        m_scale = 1.0
        if is_medical:
            m_scale = float(rng.uniform(med_range[0], med_range[1]))
            for k in PHYSICAL_KEYS:
                phys_easy[k] = float(np.clip(phys_easy[k] * m_scale, 0.0, 1.0))
                phys_diff[k] = float(np.clip(phys_diff[k] * m_scale, 0.0, 1.0))
            for k in TERRAIN_KEYS:
                terr_easy[k] = float(np.clip(terr_easy[k] * m_scale, 0.0, 1.0))
                terr_diff[k] = float(np.clip(terr_diff[k] * m_scale, 0.0, 1.0))

        # 5. Check difficult minus easy >= 0.15 on the five physical features
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

    raise RuntimeError(f"Could not sample valid ground truth for user {user_id} within 100 attempts.")


def build_covered_vector(feat_dict: Dict[str, Any]) -> np.ndarray:
    """Builds a 10-element vector in canonical COVERED_FEATURES order."""
    return np.array([float(feat_dict[f["key"]]) for f in COVERED_FEATURES], dtype=np.float32)


def extract_app_covered_vector(app_32_vec: np.ndarray) -> np.ndarray:
    """Extracts the 10 covered feature values from a 32-element app vector."""
    return np.array([float(app_32_vec[f["index"]]) for f in COVERED_FEATURES], dtype=np.float32)


def main():
    with open(GT_RANGES_PATH, "r", encoding="utf-8") as f:
        gt_config = json.load(f)

    with open(TRAILS_META_PATH, "r", encoding="utf-8") as f:
        trails_meta = json.load(f)

    with open(APP_PROFILES_PATH, "r", encoding="utf-8") as f:
        app_users = json.load(f)

    commit_sha = get_git_commit()
    trail_export_hash = trails_meta.get("sha256", "")
    norm_bounds = {
        "length": [3.1, 14.1],
        "elevation": [438, 1090],
        "gain": [112, 948],
        "slope": [5.0, 14.0],
        "lasco": [1, 9]
    }

    final_users: List[Dict[str, Any]] = []
    start_distance_rows: List[Dict[str, Any]] = []

    for u in app_users:
        uid = u["id"]
        exp = u["experience"]
        is_med = bool(u.get("medicalProfile", {}).get("hasCondition", False))

        # Sample Ground Truth
        gt_data = sample_single_user_gt(uid, exp, is_med, gt_config)

        # Build vectors for distance measurement
        app_easy_32 = flatten_profile_features(u["profile"]["easy"])
        app_diff_32 = flatten_profile_features(u["profile"]["difficult"])

        app_easy_10 = extract_app_covered_vector(app_easy_32)
        app_diff_10 = extract_app_covered_vector(app_diff_32)

        gt_easy_10 = build_covered_vector(gt_data["easy"])
        gt_diff_10 = build_covered_vector(gt_data["difficult"])

        # Compute start distances across 3 metrics
        easy_gd = round(float(gower_distance(app_easy_10, gt_easy_10)), 4)
        easy_ed = round(float(euclidean_distance(app_easy_10, gt_easy_10)), 4)
        easy_cs = round(float(cosine_distance(app_easy_10, gt_easy_10)), 4)

        diff_gd = round(float(gower_distance(app_diff_10, gt_diff_10)), 4)
        diff_ed = round(float(euclidean_distance(app_diff_10, gt_diff_10)), 4)
        diff_cs = round(float(cosine_distance(app_diff_10, gt_diff_10)), 4)

        start_distance_rows.append({
            "user_id": uid,
            "experience": exp,
            "medical": "M" if is_med else "N",
            "province_pattern": u.get("province_pattern", ""),
            "easy_gower": easy_gd,
            "easy_euclidean": easy_ed,
            "easy_cosine": easy_cs,
            "diff_gower": diff_gd,
            "diff_euclidean": diff_ed,
            "diff_cosine": diff_cs,
        })

        record = {
            "id": uid,
            "experience": exp,
            "medical": u.get("medical", "N"),
            "province_pattern": u.get("province_pattern", ""),
            "medicalProfile": u.get("medicalProfile", {}),
            "preferences": u.get("preferences", {}),
            "profile": u.get("profile", {}),
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
                "commit": commit_sha,
                "trail_export_hash": trail_export_hash,
                "normalization_bounds": norm_bounds
            }
        }
        final_users.append(record)

    # Sort users by id deterministically
    final_users.sort(key=lambda x: x["id"])
    start_distance_rows.sort(key=lambda x: x["user_id"])

    # Write users.json
    users_json_path = os.path.join(OUTPUT_DIR, "users.json")
    with open(users_json_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(final_users, f, indent=2, sort_keys=True, ensure_ascii=False)

    # Write start_distances.csv
    csv_path = os.path.join(OUTPUT_DIR, "start_distances.csv")
    fieldnames = [
        "user_id", "experience", "medical", "province_pattern",
        "easy_gower", "easy_euclidean", "easy_cosine",
        "diff_gower", "diff_euclidean", "diff_cosine"
    ]
    with open(csv_path, "w", encoding="utf-8", newline="\n") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(start_distance_rows)

    print(f"Successfully generated {len(final_users)} users in {users_json_path}")
    print(f"Successfully generated start distances table in {csv_path}")


if __name__ == "__main__":
    main()

