"""
Profile Vector Serialization and Feature Extraction Utilities

Transforms UserProfiles and Trail Profile dictionaries into standardized,
fixed-order 1D float arrays compatible with the THARESYS distance engines.
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

# Complete 32-dimensional canonical feature registry with calibrated default weights
# Physical Exertion: ~50% total (safety & capability constraint)
# Provinces: 20% total (regional affinity)
# 5 Pillar Category Allocation:
# 1. Physical Difficulty: 50.0% total (primary capability & safety threshold)
# 2. Terrains: 20.0% total (technical footing & difficulty impact)
# 3. Route Type: 15.0% total (physical trajectory & circuit structure > location)
# 4. Provinces: 10.0% total (geographical accessibility preference)
# 5. Scenery & Amenities: 5.0% total (smallest category, environmental & comfort tie-breakers)
CANONICAL_FEATURES: List[Dict[str, Any]] = [
    # 1. Core Physical Metrics (50.0% total)
    {"key": "classification", "label": "Trail Classification (Minor/Major)", "category": "Physical Exertion", "default_weight": 8.00},
    {"key": "length", "label": "Trail Length (km)", "category": "Physical Exertion", "default_weight": 8.40},
    {"key": "elevation", "label": "Peak Elevation (MASL)", "category": "Physical Exertion", "default_weight": 8.40},
    {"key": "gain", "label": "Elevation Gain (m)", "category": "Physical Exertion", "default_weight": 8.40},
    {"key": "slope", "label": "Trail Slope / Gradient (%)", "category": "Physical Exertion", "default_weight": 8.40},
    {"key": "easy", "label": "Lasco / Easy Rating (1-9)", "category": "Physical Exertion", "default_weight": 8.40},

    # 2. Terrains (20.0% total, 5.0% each) - Technical difficulty & footing
    {"key": "muddy", "label": "Terrain: Muddy Trails", "category": "Terrains", "default_weight": 5.00},
    {"key": "rocky", "label": "Terrain: Rocky Scrambles", "category": "Terrains", "default_weight": 5.00},
    {"key": "grassland", "label": "Terrain: Grassland / Open", "category": "Terrains", "default_weight": 5.00},
    {"key": "ridges", "label": "Terrain: Exposed Ridges", "category": "Terrains", "default_weight": 5.00},

    # 3. Circularity / Route (15.0% total, 5.0% each) - Physical trajectory > Location
    {"key": "out_and_back", "label": "Route: Out-and-Back", "category": "Route Type", "default_weight": 5.00},
    {"key": "traverse", "label": "Route: Point-to-Point Traverse", "category": "Route Type", "default_weight": 5.00},
    {"key": "circular", "label": "Route: Circular Loop", "category": "Route Type", "default_weight": 5.00},

    # 4. Provinces (10.0% total, 2.0% each) - Regional preference
    {"key": "cavite", "label": "Province: Cavite", "category": "Provinces", "default_weight": 2.00},
    {"key": "laguna", "label": "Province: Laguna", "category": "Provinces", "default_weight": 2.00},
    {"key": "batangas", "label": "Province: Batangas", "category": "Provinces", "default_weight": 2.00},
    {"key": "rizal", "label": "Province: Rizal", "category": "Provinces", "default_weight": 2.00},
    {"key": "quezon", "label": "Province: Quezon", "category": "Provinces", "default_weight": 2.00},

    # 5. Scenery & Amenities (5.0% total) - Smallest category overall
    # Waterforms (1.40% subtotal)
    {"key": "fall", "label": "Waterform: Waterfall", "category": "Waterforms", "default_weight": 0.50},
    {"key": "river", "label": "Waterform: River Stream", "category": "Waterforms", "default_weight": 0.45},
    {"key": "lake", "label": "Waterform: Lake", "category": "Waterforms", "default_weight": 0.45},

    # Tourism Amenities (3.60% subtotal)
    {"key": "shelter", "label": "Amenity: Shelter / Shed", "category": "Tourism Amenities", "default_weight": 0.40},
    {"key": "resting", "label": "Amenity: Resting Areas", "category": "Tourism Amenities", "default_weight": 0.40},
    {"key": "clean_water", "label": "Amenity: Clean Water Supply", "category": "Tourism Amenities", "default_weight": 0.40},
    {"key": "information_board", "label": "Amenity: Information Board", "category": "Tourism Amenities", "default_weight": 0.30},
    {"key": "tourism_river", "label": "Amenity: River Access", "category": "Tourism Amenities", "default_weight": 0.30},
    {"key": "tourism_lake", "label": "Amenity: Lake Access", "category": "Tourism Amenities", "default_weight": 0.30},
    {"key": "tourism_waterfall", "label": "Amenity: Waterfall Access", "category": "Tourism Amenities", "default_weight": 0.30},
    {"key": "monument", "label": "Amenity: Historical Monument", "category": "Tourism Amenities", "default_weight": 0.30},
    {"key": "community", "label": "Amenity: Guide Station / Community", "category": "Tourism Amenities", "default_weight": 0.30},
    {"key": "viewpoint", "label": "Amenity: Scenic Viewpoint", "category": "Tourism Amenities", "default_weight": 0.30},
    {"key": "network_connection", "label": "Amenity: Cellular Reception", "category": "Tourism Amenities", "default_weight": 0.30},
]

FEATURE_VECTOR_SIZE = len(CANONICAL_FEATURES)  # 32


def build_feature_weight_vector(weights_map: Optional[Dict[str, float]] = None) -> np.ndarray:
    """
    Constructs a 32-element 1D float array of weights aligned with CANONICAL_FEATURES.
    If weights_map is None, returns the balanced default weights.
    If a feature has weight 0.0, it is effectively excluded from distance calculation.
    """
    if not weights_map:
        return np.array([f["default_weight"] for f in CANONICAL_FEATURES], dtype=np.float32)

    weight_array: List[float] = []
    for f in CANONICAL_FEATURES:
        key = f["key"]
        # Allow exact key or prefixed variations (e.g. province_cavite, tourism_resting)
        val = weights_map.get(key)
        if val is None:
            # Check prefixed variant
            cat_prefix = f["category"].lower().split()[0]
            val = weights_map.get(f"{cat_prefix}_{key}")

        if val is not None:
            weight_array.append(max(0.0, float(val)))
        else:
            # If not in map, default to 0.0 if explicit map is given, or default weight
            weight_array.append(float(f["default_weight"]))

    return np.array(weight_array, dtype=np.float32)


def flatten_profile_features(profile_data: Union[Dict[str, Any], List[float], np.ndarray]) -> np.ndarray:
    """
    Converts a Profile object or its 'features' dictionary into a 1D float array.
    Guarantees consistent feature ordering across all items.
    """
    # 1. If already a numeric array/list
    if isinstance(profile_data, np.ndarray):
        arr = profile_data.astype(np.float32).flatten()
        if len(arr) == FEATURE_VECTOR_SIZE:
            return arr
    if isinstance(profile_data, list):
        if len(profile_data) == FEATURE_VECTOR_SIZE and isinstance(profile_data[0], (int, float)):
            return np.array(profile_data, dtype=np.float32)

    if not isinstance(profile_data, dict):
        return np.zeros(FEATURE_VECTOR_SIZE, dtype=np.float32)

    # If wrapped in a Profile structure: extract 'features'
    feats = profile_data.get("features", profile_data)
    if not isinstance(feats, dict):
        return np.zeros(FEATURE_VECTOR_SIZE, dtype=np.float32)

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
