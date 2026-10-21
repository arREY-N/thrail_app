"""
Profile Vector Serialization and Feature Extraction Utilities

Transforms UserProfiles and Trail Profile dictionaries into standardized,
fixed-order 1D float arrays compatible with the TARS distance engines.
"""

from typing import Dict, Any, List, Tuple, Optional, Union
import numpy as np

# Canonical feature ordering for deterministic vector alignment
PROVINCE_KEYS = ["cavite", "laguna", "batangas", "rizal", "quezon"]
TERRAIN_KEYS = ["muddy", "rocky", "grassland", "ridges"]
CIRCULARITY_KEYS = ["out_and_back", "traverse", "circular"]
WATERFORM_KEYS = ["fall", "river", "lake"]
TOURISM_KEYS = [
    "shelter", "resting", "information_board", "clean_water",
    "river", "lake", "waterfall", "monument", "community",
    "viewpoint", "network_connection"
]


def flatten_profile_features(profile_data: Union[Dict[str, Any], List[float], np.ndarray]) -> np.ndarray:
    """
    Converts a Profile object or its 'features' dictionary into a 1D float array.
    Guarantees consistent feature ordering across all items.
    """
    # 1. If already a numeric array/list
    if isinstance(profile_data, np.ndarray):
        return profile_data.astype(np.float32).flatten()
    if isinstance(profile_data, list):
        if len(profile_data) > 0 and isinstance(profile_data[0], (int, float)):
            return np.array(profile_data, dtype=np.float32)

    if not isinstance(profile_data, dict):
        # Fallback to zero vector if invalid
        return np.zeros(28, dtype=np.float32)

    # If wrapped in a Profile structure: extract 'features'
    feats = profile_data.get("features", profile_data)
    if not isinstance(feats, dict):
        return np.zeros(28, dtype=np.float32)

    vec: List[float] = []

    # 1. Core Physical Metrics
    vec.append(float(feats.get("classification", 0.0) or 0.0))
    vec.append(float(feats.get("length", 0.0) or 0.0))
    vec.append(float(feats.get("elevation", 0.0) or 0.0))
    vec.append(float(feats.get("gain", 0.0) or 0.0))
    vec.append(float(feats.get("slope", 0.0) or 0.0))
    vec.append(float(feats.get("easy", 0.0) or 0.0))

    # 2. Provinces
    prov_dict = feats.get("province", {})
    if isinstance(prov_dict, dict):
        for p in PROVINCE_KEYS:
            vec.append(float(prov_dict.get(p, 0.0) or 0.0))
    else:
        vec.extend([0.0] * len(PROVINCE_KEYS))

    # 3. Terrains
    terr_dict = feats.get("terrain", {})
    if isinstance(terr_dict, dict):
        for t in TERRAIN_KEYS:
            vec.append(float(terr_dict.get(t, 0.0) or 0.0))
    else:
        vec.extend([0.0] * len(TERRAIN_KEYS))

    # 4. Circularity
    circ_dict = feats.get("circularity", {})
    if isinstance(circ_dict, dict):
        for c in CIRCULARITY_KEYS:
            vec.append(float(circ_dict.get(c, 0.0) or 0.0))
    else:
        vec.extend([0.0] * len(CIRCULARITY_KEYS))

    # 5. Waterforms
    water_dict = feats.get("waterforms", {})
    if isinstance(water_dict, dict):
        for w in WATERFORM_KEYS:
            vec.append(float(water_dict.get(w, 0.0) or 0.0))
    else:
        vec.extend([0.0] * len(WATERFORM_KEYS))

    # 6. Tourism Amenities
    tour_dict = feats.get("tourism", {})
    if isinstance(tour_dict, dict):
        for tm in TOURISM_KEYS:
            vec.append(float(tour_dict.get(tm, 0.0) or 0.0))
    else:
        vec.extend([0.0] * len(TOURISM_KEYS))

    return np.array(vec, dtype=np.float32)


def extract_user_anchor_profiles(user_doc: Dict[str, Any]) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any], Dict[str, Any]]:
    """
    Extracts both Easy and Difficult anchor profiles from a User document.
    Returns:
        (easy_vector, difficult_vector, raw_easy_profile, raw_difficult_profile)
    """
    user_profiles = user_doc.get("profile", {})
    if not isinstance(user_profiles, dict):
        user_profiles = {}

    raw_easy = user_profiles.get("easy", {})
    raw_diff = user_profiles.get("difficult", {})

    # If the user already has generated profiles, flatten them
    if raw_easy and raw_diff:
        easy_vec = flatten_profile_features(raw_easy)
        diff_vec = flatten_profile_features(raw_diff)
        return easy_vec, diff_vec, raw_easy, raw_diff

    # Fallback default beginner priors if profile is uninitialized
    # Calibrated according to user_profile_generation_documentation.md (0.25 easy / 0.75 diff)
    has_med = bool(user_doc.get("medicalProfile", {}).get("hasCondition", False))
    factor = 0.80 if has_med else 1.00
    easy_val = 0.250 * factor
    diff_val = 0.750 * factor

    fallback_easy_feats = {
        "classification": 0.0,
        "length": easy_val,
        "elevation": easy_val,
        "gain": easy_val,
        "slope": easy_val,
        "easy": easy_val,
        "province": {p: 0.85 if p == "rizal" else 0.15 for p in PROVINCE_KEYS},
        "terrain": {t: easy_val for t in TERRAIN_KEYS},
        "circularity": {c: 0.33 for c in CIRCULARITY_KEYS},
        "waterforms": {w: easy_val for w in WATERFORM_KEYS},
        "tourism": {tm: 0.20 for tm in TOURISM_KEYS}
    }

    fallback_diff_feats = {
        "classification": 1.0,
        "length": diff_val,
        "elevation": diff_val,
        "gain": diff_val,
        "slope": diff_val,
        "easy": diff_val,
        "province": {p: 0.15 if p == "rizal" else 0.85 for p in PROVINCE_KEYS},
        "terrain": {t: diff_val for t in TERRAIN_KEYS},
        "circularity": {c: 0.33 for c in CIRCULARITY_KEYS},
        "waterforms": {w: diff_val for w in WATERFORM_KEYS},
        "tourism": {tm: 0.40 for tm in TOURISM_KEYS}
    }

    raw_easy = {"features": fallback_easy_feats}
    raw_diff = {"features": fallback_diff_feats}

    return flatten_profile_features(fallback_easy_feats), flatten_profile_features(fallback_diff_feats), raw_easy, raw_diff
