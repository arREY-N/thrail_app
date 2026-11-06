"""
THARESYS Recommendation Engine - Centralized Parameters

Houses all adjustable hyperparameters, thresholds, defaults, and feature weights
for the recommendation engine, collaborative filtering, and profile updater.
Adjust these values here to tune engine behavior system-wide.
"""

from typing import Dict, Any, List

# ==============================================================================
# 1. COLLABORATIVE FILTERING (CF) PARAMETERS
# ==============================================================================

# Distance cutoff tau: A peer is eligible for CF only if dist(user_a, peer_b) <= tau
# Scale: [0.0, 1.0] where 0.0 is identical and 1.0 is completely dissimilar.
CF_DISTANCE_CUTOFF_TAU: float = 0.35

# Top-k closest eligible peers to aggregate in the CF component.
CF_TOP_K: int = 5


# ==============================================================================
# 2. HYBRID BLENDING (ALPHA) PARAMETERS
# ==============================================================================

# Default distance metric formulas: 'GD' (Gower), 'ED' (Euclidean), 'CS' (Cosine)
DEFAULT_CBF_ENGINE: str = "GD"
DEFAULT_CF_ENGINE: str = "GD"

# Alpha (a): Weight given to Content-Based Filtering (CBF).
# CF receives weight (1 - a).
ALPHA_COLD_START: float = 1.0       # Used when user count <= 1 or when 0 peers pass tau
ALPHA_STEADY_STATE: float = 0.5     # Minimum alpha reached as user count matures
ALPHA_STEADY_STATE_USER_THRESHOLD: int = 50  # User count needed to reach ALPHA_STEADY_STATE


# ==============================================================================
# 3. ADAPTIVE PROFILE EVOLUTION (BETA) & ANCHOR CONSTRAINTS
# ==============================================================================

# Beta learning rate divisor: beta = rtu / 1.65 (match) or -(1.0 - rtu) / 1.65 (mismatch)
# Balanced midpoint between baseline (2.0) and aggressive (1.35) to prevent late-stage over-adjustment
BETA_LEARNING_RATE_DIVISOR: float = 1.65

# Minimum gap enforced between Easy and Difficult physical capability features (indices 0..5)
ANCHOR_MONOTONICITY_MIN_GAP: float = 0.05

# Feature Presence Gating: minimum terrain score on a trail to update the user's terrain preference
TERRAIN_PRESENCE_THRESHOLD: float = 0.05

# Review factor weights for user-submitted difficulty factors
REVIEW_ACTIVE_FACTOR_WEIGHT: float = 1.0
REVIEW_BASELINE_UNSELECTED_WEIGHT: float = 0.22

# ------------------------------------------------------------------------------
# EXPERIMENTAL / TESTING NUDGES (Non-permanent baselines for evaluation)
# ------------------------------------------------------------------------------
# Level 1: Gentle weight for unselected attribute/environmental dimensions (indices 6..31)
# during positive hike matches, preventing rigid zero-freezing while avoiding excessive drift.
TESTING_ATTRIBUTE_UNSELECTED_NUDGE: float = 0.10

# Level 2: Gentle downward relaxation factor when a hiker matches an easy trail whose
# physical demands fall below their current easy anchor (T_k < P_k).
# Balanced midpoint (0.15) to preserve capacity while avoiding late-stage fluctuation.
TESTING_EASY_MATCH_CEILING_NUDGE: float = 0.15


# Maximum single-hike profile adjustment bound per feature (safety rail against extreme swings)
# Balanced midpoint (0.14) between baseline (0.10) and aggressive (0.18) to ensure smooth asymptotic convergence
PROFILE_MAX_STEP_DELTA: float = 0.14

# Absolute exertion safety margin: a candidate trail cannot exceed the Easy anchor
# on core physical metrics by more than this threshold to be classified as 'easy'
EXERTION_SAFETY_MARGIN_DEFAULT: float = 0.35
EXERTION_SAFETY_MARGIN_VULNERABLE: float = 0.25  # For medical condition or E1 beginner cohorts


# ==============================================================================
# 4. CANONICAL 32-DIMENSIONAL FEATURE REGISTRY & BALANCED WEIGHT ALLOCATION
# ==============================================================================
# 5 Pillar Category Allocation:
# 1. Physical Difficulty: 50.0% total (primary capability & safety threshold)
# 2. Terrains: 20.0% total (technical footing & difficulty impact)
# 3. Route Type: 15.0% total (physical trajectory & circuit structure > location)
# 4. Provinces: 10.0% total (geographical accessibility preference)
# 5. Scenery & Amenities: 5.0% total (environmental & comfort tie-breakers)

CANONICAL_FEATURES: List[Dict[str, Any]] = [
    # 1. Core Physical Metrics (Indices 0..5, 50.0% total)
    {"key": "classification", "label": "Trail Classification (Minor/Major)", "category": "Physical Exertion", "default_weight": 8.00},
    {"key": "length", "label": "Trail Length (km)", "category": "Physical Exertion", "default_weight": 8.40},
    {"key": "elevation", "label": "Peak Elevation (MASL)", "category": "Physical Exertion", "default_weight": 8.40},
    {"key": "gain", "label": "Elevation Gain (m)", "category": "Physical Exertion", "default_weight": 8.40},
    {"key": "slope", "label": "Trail Slope / Gradient (%)", "category": "Physical Exertion", "default_weight": 8.40},
    {"key": "easy", "label": "Lasco / Easy Rating (1-9)", "category": "Physical Exertion", "default_weight": 8.40},

    # 2. Provinces (Indices 6..10, 10.0% total, 2.0% each) - Regional preference
    {"key": "cavite", "label": "Province: Cavite", "category": "Provinces", "default_weight": 2.00},
    {"key": "laguna", "label": "Province: Laguna", "category": "Provinces", "default_weight": 2.00},
    {"key": "batangas", "label": "Province: Batangas", "category": "Provinces", "default_weight": 2.00},
    {"key": "rizal", "label": "Province: Rizal", "category": "Provinces", "default_weight": 2.00},
    {"key": "quezon", "label": "Province: Quezon", "category": "Provinces", "default_weight": 2.00},

    # 3. Terrains (Indices 11..14, 20.0% total, 5.0% each) - Technical difficulty & footing
    {"key": "muddy", "label": "Terrain: Muddy Trails", "category": "Terrains", "default_weight": 5.00},
    {"key": "rocky", "label": "Terrain: Rocky Scrambles", "category": "Terrains", "default_weight": 5.00},
    {"key": "grassland", "label": "Terrain: Grassland / Open", "category": "Terrains", "default_weight": 5.00},
    {"key": "ridges", "label": "Terrain: Exposed Ridges", "category": "Terrains", "default_weight": 5.00},

    # 4. Circularity / Route (Indices 15..17, 15.0% total, 5.0% each)
    {"key": "out_and_back", "label": "Route: Out-and-Back", "category": "Route Type", "default_weight": 5.00},
    {"key": "traverse", "label": "Route: Point-to-Point Traverse", "category": "Route Type", "default_weight": 5.00},
    {"key": "circular", "label": "Route: Circular Loop", "category": "Route Type", "default_weight": 5.00},

    # 5. Scenery & Amenities (Indices 18..31, 5.0% total)
    # Waterforms (Indices 18..20, 1.40% subtotal)
    {"key": "fall", "label": "Waterform: Waterfall", "category": "Waterforms", "default_weight": 0.50},
    {"key": "river", "label": "Waterform: River Stream", "category": "Waterforms", "default_weight": 0.45},
    {"key": "lake", "label": "Waterform: Lake", "category": "Waterforms", "default_weight": 0.45},

    # Tourism Amenities (Indices 21..31, 3.60% subtotal)
    {"key": "shelter", "label": "Amenity: Shelter / Shed", "category": "Tourism Amenities", "default_weight": 0.40},
    {"key": "resting", "label": "Amenity: Resting Areas", "category": "Tourism Amenities", "default_weight": 0.40},
    {"key": "information_board", "label": "Amenity: Information Board", "category": "Tourism Amenities", "default_weight": 0.30},
    {"key": "clean_water", "label": "Amenity: Clean Water Supply", "category": "Tourism Amenities", "default_weight": 0.40},
    {"key": "tourism_river", "label": "Amenity: River Access", "category": "Tourism Amenities", "default_weight": 0.30},
    {"key": "tourism_lake", "label": "Amenity: Lake Access", "category": "Tourism Amenities", "default_weight": 0.30},
    {"key": "tourism_waterfall", "label": "Amenity: Waterfall Access", "category": "Tourism Amenities", "default_weight": 0.30},
    {"key": "monument", "label": "Amenity: Historical Monument", "category": "Tourism Amenities", "default_weight": 0.30},
    {"key": "community", "label": "Amenity: Guide Station / Community", "category": "Tourism Amenities", "default_weight": 0.30},
    {"key": "viewpoint", "label": "Amenity: Scenic Viewpoint", "category": "Tourism Amenities", "default_weight": 0.30},
    {"key": "network_connection", "label": "Amenity: Cellular Reception", "category": "Tourism Amenities", "default_weight": 0.30},
]

# Quick-lookup dictionary of default feature weights (derived from CANONICAL_FEATURES)
DEFAULT_FEATURE_WEIGHTS: Dict[str, float] = {
    f["key"]: float(f["default_weight"]) for f in CANONICAL_FEATURES
}
