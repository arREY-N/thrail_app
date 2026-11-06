"""
Configuration for the THARESYS Synthetic Trail Generator (`trail_generator`).

All tier ranges, quotas, feature probabilities, and thresholds are defined here
as explicit modelling parameters (not survey data) and hashed into each output
catalog's header (`config_hash`) for deterministic reproducibility.
"""

import hashlib
import json
from typing import Any, Dict, List

# Seeds specified in plans/synthetic_trails_generation_v2.md
MAIN_SEED: int = 42
ROBUSTNESS_SEED: int = 7

# Quotas
SYNTHETIC_TRAIL_COUNT: int = 32
REAL_TRAIL_COUNT: int = 8
TOTAL_CATALOG_COUNT: int = 40
TRAILS_PER_TIER: int = 8

TIERS: List[str] = ["easy", "moderate", "hard", "very_hard"]

# Exact feature keys matching engine/profile_utils.py
PROVINCE_KEYS: List[str] = ["cavite", "laguna", "batangas", "rizal", "quezon"]
PROVINCE_DISPLAY: Dict[str, str] = {
    "cavite": "Cavite",
    "laguna": "Laguna",
    "batangas": "Batangas",
    "rizal": "Rizal",
    "quezon": "Quezon",
}

TERRAIN_KEYS: List[str] = ["muddy", "rocky", "grassland", "ridges"]

CIRCULARITY_KEYS: List[str] = ["out_and_back", "traverse", "circular"]
CIRCULARITY_DISPLAY: Dict[str, str] = {
    "out_and_back": "Out-and-Back",
    "traverse": "Traverse",
    "circular": "Circular",
}

WATERFORM_KEYS: List[str] = ["fall", "river", "lake"]

TOURISM_KEYS: List[str] = [
    "shelter",
    "resting",
    "information_board",
    "clean_water",
    "river",
    "lake",
    "waterfall",
    "monument",
    "community",
    "viewpoint",
    "network_connection",
]

# Quota rules
MIN_PROVINCE_APPEARANCES: int = 4
MIN_TRAVERSE_COUNT: int = 6
MIN_CIRCULAR_COUNT: int = 6
TWO_PROVINCE_TRAIL_COUNT: int = 8  # Out of 32 synthetic trails, 8 span 2 adjacent provinces

# Adjacent CALABARZON province pairs for realistic 2-province trails
ADJACENT_PROVINCE_PAIRS: List[List[str]] = [
    ["cavite", "batangas"],
    ["cavite", "laguna"],
    ["laguna", "batangas"],
    ["laguna", "rizal"],
    ["laguna", "quezon"],
    ["rizal", "quezon"],
    ["batangas", "quezon"],
    ["cavite", "rizal"],
]

# Tier physical ranges (stretching slightly below Kulis/Tagapo/Batulao and above MakTrav/MMT)
# Real 8 bounds: length [3.1, 14.1] km, elevation [438, 1090] MASL, gain [118, 954] m,
#                slope [5.0, 14.0] %, lascoRating [2, 6]
TIER_RANGES: Dict[str, Dict[str, Any]] = {
    "easy": {
        "length_km": [2.2, 4.8],
        "elevation_masl": [300, 620],
        "gain_m": [70, 300],
        "slope_pct": [3.2, 6.8],
        "lasco_range": [1, 3],
        "hours_range": [2, 3],
        "obstacles_range": [0, 1],
    },
    "moderate": {
        "length_km": [5.0, 9.2],
        "elevation_masl": [550, 960],
        "gain_m": [250, 700],
        "slope_pct": [5.0, 9.8],
        "lasco_range": [3, 5],
        "hours_range": [3, 5],
        "obstacles_range": [1, 2],
    },
    "hard": {
        "length_km": [9.2, 13.8],
        "elevation_masl": [950, 1550],
        "gain_m": [820, 1400],
        "slope_pct": [8.8, 13.8],
        "lasco_range": [5, 7],
        "hours_range": [5, 8],
        "obstacles_range": [2, 4],
    },
    "very_hard": {
        "length_km": [13.8, 19.5],
        "elevation_masl": [1500, 2350],
        "gain_m": [1350, 2150],
        "slope_pct": [10.5, 16.5],
        "lasco_range": [7, 9],
        "hours_range": [8, 12],
        "obstacles_range": [3, 6],
    },
}

# Classification rule for synthetic trails:
# Major climb (1.0) if lascoRating >= 6 OR (lascoRating >= 5 and elevation >= 1000 MASL)
MAJOR_LASCO_THRESHOLD: int = 6
MAJOR_COMBO_LASCO: int = 5
MAJOR_COMBO_ELEVATION_MASL: int = 1000

# Lasco scale divisor
LASCO_MAX_RATING: float = 9.0

# Terrain probabilities per tier (multi-hot; rocky and ridges increase with tier)
TERRAIN_PROBS_BY_TIER: Dict[str, Dict[str, float]] = {
    "easy": {
        "muddy": 0.35,
        "rocky": 0.25,
        "grassland": 0.70,
        "ridges": 0.20,
    },
    "moderate": {
        "muddy": 0.45,
        "rocky": 0.50,
        "grassland": 0.55,
        "ridges": 0.45,
    },
    "hard": {
        "muddy": 0.55,
        "rocky": 0.75,
        "grassland": 0.40,
        "ridges": 0.70,
    },
    "very_hard": {
        "muddy": 0.65,
        "rocky": 0.90,
        "grassland": 0.30,
        "ridges": 0.85,
    },
}

# Waterform probabilities per tier (sparse; synchronised with tourism waterfall/river/lake)
WATERFORM_PROBS_BY_TIER: Dict[str, Dict[str, float]] = {
    "easy": {"fall": 0.30, "river": 0.45, "lake": 0.25},
    "moderate": {"fall": 0.25, "river": 0.40, "lake": 0.20},
    "hard": {"fall": 0.20, "river": 0.35, "lake": 0.15},
    "very_hard": {"fall": 0.15, "river": 0.30, "lake": 0.10},
}

# Tourism amenity probabilities per tier (easier trails have higher infrastructure density)
TOURISM_PROBS_BY_TIER: Dict[str, Dict[str, float]] = {
    "easy": {
        "shelter": 0.85,
        "resting": 0.90,
        "information_board": 0.80,
        "clean_water": 0.55,
        "monument": 0.25,
        "community": 0.65,
        "viewpoint": 0.85,
        "network_connection": 0.75,
    },
    "moderate": {
        "shelter": 0.70,
        "resting": 0.80,
        "information_board": 0.65,
        "clean_water": 0.40,
        "monument": 0.20,
        "community": 0.50,
        "viewpoint": 0.85,
        "network_connection": 0.50,
    },
    "hard": {
        "shelter": 0.45,
        "resting": 0.60,
        "information_board": 0.45,
        "clean_water": 0.30,
        "monument": 0.15,
        "community": 0.30,
        "viewpoint": 0.90,
        "network_connection": 0.25,
    },
    "very_hard": {
        "shelter": 0.25,
        "resting": 0.40,
        "information_board": 0.30,
        "clean_water": 0.20,
        "monument": 0.10,
        "community": 0.15,
        "viewpoint": 0.95,
        "network_connection": 0.10,
    },
}

# Minimum normalized Euclidean distance between any two trails in the 40-trail catalog
MIN_PAIRWISE_EUCLIDEAN_DISTANCE: float = 0.03

# Real 8-trail effective gain bounds from the stored Nov 3 export
REAL_GAIN_MIN: int = 118
REAL_GAIN_MAX: int = 954


def get_config_dict() -> Dict[str, Any]:
    """Returns a serializable dictionary of all generator configuration parameters."""
    return {
        "synthetic_trail_count": SYNTHETIC_TRAIL_COUNT,
        "real_trail_count": REAL_TRAIL_COUNT,
        "total_catalog_count": TOTAL_CATALOG_COUNT,
        "trails_per_tier": TRAILS_PER_TIER,
        "tiers": TIERS,
        "province_keys": PROVINCE_KEYS,
        "terrain_keys": TERRAIN_KEYS,
        "circularity_keys": CIRCULARITY_KEYS,
        "waterform_keys": WATERFORM_KEYS,
        "tourism_keys": TOURISM_KEYS,
        "min_province_appearances": MIN_PROVINCE_APPEARANCES,
        "min_traverse_count": MIN_TRAVERSE_COUNT,
        "min_circular_count": MIN_CIRCULAR_COUNT,
        "two_province_trail_count": TWO_PROVINCE_TRAIL_COUNT,
        "adjacent_province_pairs": ADJACENT_PROVINCE_PAIRS,
        "tier_ranges": TIER_RANGES,
        "major_lasco_threshold": MAJOR_LASCO_THRESHOLD,
        "major_combo_lasco": MAJOR_COMBO_LASCO,
        "major_combo_elevation_masl": MAJOR_COMBO_ELEVATION_MASL,
        "lasco_max_rating": LASCO_MAX_RATING,
        "terrain_probs_by_tier": TERRAIN_PROBS_BY_TIER,
        "waterform_probs_by_tier": WATERFORM_PROBS_BY_TIER,
        "tourism_probs_by_tier": TOURISM_PROBS_BY_TIER,
        "min_pairwise_euclidean_distance": MIN_PAIRWISE_EUCLIDEAN_DISTANCE,
        "real_gain_min": REAL_GAIN_MIN,
        "real_gain_max": REAL_GAIN_MAX,
    }


def compute_config_hash() -> str:
    """Computes a deterministic SHA-256 hex digest of the generator configuration."""
    payload = json.dumps(get_config_dict(), sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

