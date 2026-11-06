"""
Setup Inputs for the THARESYS Trail Simulation Module.

Generates:
  - inputs/users_40trails.json
  - inputs/start_distances_40trails.csv
  - copies 40-trail catalogs, bounds, and spec into inputs/

Re-derives the 24 users' initial survey profiles (E2..E4) from the re-normalized
vectors of their ticked survey trails under the 40-trail bounds, so user priors
and 40-trail coordinates inhabit the exact same coordinate space, without ever
mutating the Cycle Simulation's users.json.
"""

import copy
import csv
import json
import os
import shutil
import sys
from typing import Any, Dict, List
import numpy as np

MODULE_DIR = os.path.dirname(os.path.abspath(__file__))
SIM_DIR = os.path.abspath(os.path.join(MODULE_DIR, ".."))
ROOT = os.path.abspath(os.path.join(SIM_DIR, "..", ".."))
ENGINE_DIR = os.path.join(ROOT, "engine")
GEN_DIR = os.path.join(MODULE_DIR, "trail_generator")

if ENGINE_DIR not in sys.path:
    sys.path.insert(0, ENGINE_DIR)
if GEN_DIR not in sys.path:
    sys.path.insert(0, GEN_DIR)

from formula import gower_distance, euclidean_distance, cosine_distance
from profile_utils import flatten_profile_features
from validate import rederive_user_profiles_40trails

INPUTS_DIR = os.path.join(MODULE_DIR, "inputs")
GEN_OUTPUT_DIR = os.path.join(GEN_DIR, "output")
CYCLE_INPUTS_DIR = os.path.join(SIM_DIR, "cycle_simulation", "inputs")

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


def extract_covered_10d(vec_32: np.ndarray) -> np.ndarray:
    return np.array([float(vec_32[f["index"]]) for f in COVERED_FEATURES], dtype=np.float32)


def extract_covered_from_dict(d: Dict[str, Any]) -> np.ndarray:
    vals = []
    for f in COVERED_FEATURES:
        k = f["key"]
        v = d.get(k)
        if v is None and "terrain" in d and isinstance(d["terrain"], dict):
            v = d["terrain"].get(k, 0.0)
        vals.append(float(v if v is not None else 0.0))
    return np.array(vals, dtype=np.float32)


def setup_inputs() -> None:
    os.makedirs(INPUTS_DIR, exist_ok=True)

    # 1. Copy catalogs and bounds from trail_generator/output
    shutil.copy2(os.path.join(GEN_OUTPUT_DIR, "catalog_seed42.json"), os.path.join(INPUTS_DIR, "catalog_seed42.json"))
    shutil.copy2(os.path.join(GEN_OUTPUT_DIR, "catalog_seed7.json"), os.path.join(INPUTS_DIR, "catalog_seed7.json"))
    shutil.copy2(os.path.join(GEN_OUTPUT_DIR, "real_trails_renormalized.json"), os.path.join(INPUTS_DIR, "real_trails_renormalized.json"))
    shutil.copy2(os.path.join(GEN_OUTPUT_DIR, "norm_bounds_40trails.json"), os.path.join(INPUTS_DIR, "norm_bounds_40trails.json"))
    shutil.copy2(os.path.join(CYCLE_INPUTS_DIR, "users_spec.json"), os.path.join(INPUTS_DIR, "users_spec.json"))
    shutil.copy2(os.path.join(CYCLE_INPUTS_DIR, "gt_ranges.json"), os.path.join(INPUTS_DIR, "gt_ranges.json"))

    # 2. Load base users and spec
    with open(os.path.join(CYCLE_INPUTS_DIR, "users.json"), "r", encoding="utf-8") as f:
        users_master = json.load(f)
    with open(os.path.join(INPUTS_DIR, "users_spec.json"), "r", encoding="utf-8") as f:
        users_spec = json.load(f)
    with open(os.path.join(INPUTS_DIR, "catalog_seed42.json"), "r", encoding="utf-8") as f:
        catalog = json.load(f)
    with open(os.path.join(INPUTS_DIR, "norm_bounds_40trails.json"), "r", encoding="utf-8") as f:
        bounds_40 = json.load(f)

    # 3. Rederive user profiles against 40-trail bounds
    rederived_users = rederive_user_profiles_40trails(
        users_master=users_master,
        users_spec=users_spec,
        catalog_trails=catalog["trails"],
    )

    # 4. Compute start distances against existing Ground Truth
    start_distance_rows: List[Dict[str, Any]] = []
    final_users_40: List[Dict[str, Any]] = []

    for u in rederived_users:
        uid = u["id"]
        exp = u["experience"]
        is_med = bool(u.get("medicalProfile", {}).get("hasCondition", False))

        app_easy_32 = flatten_profile_features(u["profile"]["easy"])
        app_diff_32 = flatten_profile_features(u["profile"]["difficult"])

        app_easy_10 = extract_covered_10d(app_easy_32)
        app_diff_10 = extract_covered_10d(app_diff_32)

        gt_easy_10 = extract_covered_from_dict(u["groundTruth"]["easy"])
        gt_diff_10 = extract_covered_from_dict(u["groundTruth"]["difficult"])

        easy_gd = round(float(gower_distance(app_easy_10, gt_easy_10)), 4)
        easy_ed = round(float(euclidean_distance(app_easy_10, gt_easy_10)), 4)
        easy_cs = round(float(cosine_distance(app_easy_10, gt_easy_10)), 4)

        diff_gd = round(float(gower_distance(app_diff_10, gt_diff_10)), 4)
        diff_ed = round(float(euclidean_distance(app_diff_10, gt_diff_10)), 4)
        diff_cs = round(float(cosine_distance(app_diff_10, gt_diff_10)), 4)

        dist_record = {
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
        }
        start_distance_rows.append(dist_record)

        u_record = copy.deepcopy(u)
        u_record["startDistances"] = dist_record
        u_record["versions"]["normalization_bounds"] = bounds_40
        final_users_40.append(u_record)

    final_users_40.sort(key=lambda x: x["id"])
    start_distance_rows.sort(key=lambda x: x["user_id"])

    # 5. Write outputs
    users_out = os.path.join(INPUTS_DIR, "users_40trails.json")
    with open(users_out, "w", encoding="utf-8", newline="\n") as f:
        json.dump(final_users_40, f, indent=2, sort_keys=True, ensure_ascii=False)

    csv_out = os.path.join(INPUTS_DIR, "start_distances_40trails.csv")
    with open(csv_out, "w", encoding="utf-8", newline="\n") as f:
        writer = csv.DictWriter(f, fieldnames=list(start_distance_rows[0].keys()))
        writer.writeheader()
        writer.writerows(start_distance_rows)

    print(f"[INPUTS] Generated {len(final_users_40)} users in {os.path.relpath(users_out, ROOT)}")
    print(f"[INPUTS] Generated start distances table in {os.path.relpath(csv_out, ROOT)}")


if __name__ == "__main__":
    setup_inputs()

