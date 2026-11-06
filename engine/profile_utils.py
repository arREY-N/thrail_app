"""
Profile Vector Serialization and Feature Extraction Utilities

Transforms UserProfiles and Trail Profile dictionaries into standardized,
fixed-order 1D float arrays compatible with the THARESYS distance engines.
"""

from typing import Dict, Any, List, Tuple, Optional, Union
import numpy as np

from parameters import (
    CANONICAL_FEATURES,
    REVIEW_ACTIVE_FACTOR_WEIGHT,
    REVIEW_BASELINE_UNSELECTED_WEIGHT,
    TERRAIN_PRESENCE_THRESHOLD,
    ANCHOR_MONOTONICITY_MIN_GAP,
    BETA_LEARNING_RATE_DIVISOR,
    PROFILE_MAX_STEP_DELTA,
    TESTING_ATTRIBUTE_UNSELECTED_NUDGE,
    TESTING_EASY_MATCH_CEILING_NUDGE,
)

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

FEATURE_VECTOR_SIZE = len(CANONICAL_FEATURES)  # 32
PHYSICAL_INDICES_COUNT = 6  # Indices 0-5: classification, length, elevation, gain, slope, easy


def build_feature_weight_vector(
    weights_map: Optional[Dict[str, float]] = None,
    default_unselected_weight: float = REVIEW_BASELINE_UNSELECTED_WEIGHT,
    attribute_unselected_nudge: float = TESTING_ATTRIBUTE_UNSELECTED_NUDGE,
) -> np.ndarray:
    """
    Constructs a 32-element 1D float array of weights aligned with CANONICAL_FEATURES.
    If weights_map is None, returns the balanced default weights.
    If weights_map is provided:
        - Features present in weights_map use their specified value (e.g. 1.0 for active, 0.0 for gated).
        - Features omitted from weights_map:
            - Physical exertion features use default_unselected_weight (default 0.20 baseline).
            - Environmental / attribute features (provinces, terrains, water, tourism) receive
              attribute_unselected_nudge (default 0.05 under testing, gentle baseline)
              to prevent rigid zero-freezing while avoiding excessive drift.
    """
    if weights_map is None:
        return np.array([f["default_weight"] for f in CANONICAL_FEATURES], dtype=np.float32)

    weight_array: List[float] = []
    for idx, f in enumerate(CANONICAL_FEATURES):
        key = f["key"]
        val = weights_map.get(key)
        if val is None:
            cat_prefix = f["category"].lower().split()[0]
            val = weights_map.get(f"{cat_prefix}_{key}")

        if val is not None:
            weight_array.append(max(0.0, float(val)))
        else:
            if idx < PHYSICAL_INDICES_COUNT:
                weight_array.append(float(default_unselected_weight))
            else:
                weight_array.append(float(attribute_unselected_nudge))

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
    has_med = bool(user_doc.get("medicalProfile", {}).get("hasCondition", False))
    factor = 0.80 if has_med else 1.00
    easy_val = 0.250 * factor
    diff_val = 0.750 * factor

    prefs = user_doc.get("preferences") or {}
    user_provs = [str(p).strip().lower() for p in (prefs.get("province") or [])]
    if not user_provs:
        user_provs = ["rizal"]

    fallback_easy_feats = {
        "classification": 0.0,
        "length": easy_val,
        "elevation": easy_val,
        "gain": easy_val,
        "slope": easy_val,
        "easy": easy_val,
        "province": {p: 0.85 if p in user_provs else 0.15 for p in PROVINCE_KEYS},
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
        "province": {p: 0.15 if p in user_provs else 0.85 for p in PROVINCE_KEYS},
        "terrain": {t: diff_val for t in TERRAIN_KEYS},
        "circularity": {c: 0.33 for c in CIRCULARITY_KEYS},
        "waterforms": {w: diff_val for w in WATERFORM_KEYS},
        "tourism": {tm: 0.40 for tm in TOURISM_KEYS}
    }

    raw_easy = {"features": fallback_easy_feats}
    raw_diff = {"features": fallback_diff_feats}

    return flatten_profile_features(fallback_easy_feats), flatten_profile_features(fallback_diff_feats), raw_easy, raw_diff


def unflatten_profile_features(vector: Union[List[float], np.ndarray]) -> Dict[str, Any]:
    """
    Reconstructs the hierarchical Profile 'features' dictionary from a 32-element 1D float array.
    """
    arr = np.clip(np.array(vector, dtype=np.float32).flatten(), 0.0, 1.0)
    if len(arr) < FEATURE_VECTOR_SIZE:
        arr = np.pad(arr, (0, FEATURE_VECTOR_SIZE - len(arr)))

    idx = 0
    classification = float(arr[idx]); idx += 1
    length = float(arr[idx]); idx += 1
    elevation = float(arr[idx]); idx += 1
    gain = float(arr[idx]); idx += 1
    slope = float(arr[idx]); idx += 1
    easy = float(arr[idx]); idx += 1

    province = {p: float(arr[idx + i]) for i, p in enumerate(PROVINCE_KEYS)}
    idx += len(PROVINCE_KEYS)

    terrain = {t: float(arr[idx + i]) for i, t in enumerate(TERRAIN_KEYS)}
    idx += len(TERRAIN_KEYS)

    circularity = {c: float(arr[idx + i]) for i, c in enumerate(CIRCULARITY_KEYS)}
    idx += len(CIRCULARITY_KEYS)

    waterforms = {w: float(arr[idx + i]) for i, w in enumerate(WATERFORM_KEYS)}
    idx += len(WATERFORM_KEYS)

    tourism = {tm: float(arr[idx + i]) for i, tm in enumerate(TOURISM_KEYS)}
    idx += len(TOURISM_KEYS)

    return {
        "classification": classification,
        "length": length,
        "elevation": elevation,
        "gain": gain,
        "slope": slope,
        "easy": easy,
        "province": province,
        "terrain": terrain,
        "circularity": circularity,
        "waterforms": waterforms,
        "tourism": tourism
    }


def process_dual_anchor_profile_update(
    current_easy_profile: Union[Dict[str, Any], List[float], np.ndarray],
    current_diff_profile: Union[Dict[str, Any], List[float], np.ndarray],
    hike_records: List[Dict[str, Any]],
    weights_map: Optional[Dict[str, float]] = None,
    beta_divisor: float = BETA_LEARNING_RATE_DIVISOR,
    min_gap: float = ANCHOR_MONOTONICITY_MIN_GAP,
    default_unselected_weight: float = REVIEW_BASELINE_UNSELECTED_WEIGHT,
    attribute_unselected_nudge: float = TESTING_ATTRIBUTE_UNSELECTED_NUDGE,
    easy_ceiling_nudge: float = TESTING_EASY_MATCH_CEILING_NUDGE,
) -> Dict[str, Any]:
    """
    Partitions completed hikes into Easy and Difficult batches based on their
    assigned recommendation category ('easy' or 'difficult').
    
    Executes update_profile_vector for each anchor, enforces monotonicity,
    and returns both the 1D arrays and unflattened structured feature dicts.
    """
    from formula.profile_updater import update_profile_vector, enforce_anchor_monotonicity

    easy_vec = flatten_profile_features(current_easy_profile)
    diff_vec = flatten_profile_features(current_diff_profile)

    default_w = (
        build_feature_weight_vector(
            weights_map,
            default_unselected_weight=default_unselected_weight,
            attribute_unselected_nudge=attribute_unselected_nudge,
        )
        if weights_map
        else np.ones(FEATURE_VECTOR_SIZE, dtype=np.float32)
    )

    easy_trails: List[np.ndarray] = []
    easy_scores: List[float] = []
    easy_matches: List[bool] = []
    easy_weights: List[np.ndarray] = []
    easy_mismatch_kinds: List[str] = []

    diff_trails: List[np.ndarray] = []
    diff_scores: List[float] = []
    diff_matches: List[bool] = []
    diff_weights: List[np.ndarray] = []
    diff_mismatch_kinds: List[str] = []

    for h in hike_records:
        raw_feat = h.get("trail_features") or h.get("trail") or {}
        feat_vec = flatten_profile_features(raw_feat)
        score = float(h.get("score") or h.get("recommendation_score") or 0.5)
        is_match = bool(h.get("is_match") if "is_match" in h else h.get("match", True))
        m_kind = str(h.get("mismatch_kind") or h.get("mismatch_type") or ("underwhelming" if str(h.get("perceivedDifficulty", "")).lower() in ("easy", "just right") else "overexertion"))

        # Check for distinct per-hike factor weights
        # On mismatch, retain a balanced baseline weight (0.28, midpoint between 0.15 baseline and 0.40 tuned)
        # for unselected physical features, ensuring smooth cohesive movement without late-stage over-adjustment.
        effective_baseline = default_unselected_weight if is_match else max(0.28, default_unselected_weight * 1.30)
        effective_attr_nudge = attribute_unselected_nudge if is_match else 0.03

        h_weight_dict = h.get("feature_weights") if "feature_weights" in h else h.get("weights")
        if h_weight_dict is not None and isinstance(h_weight_dict, dict):
            h_weight_vec = build_feature_weight_vector(
                h_weight_dict,
                default_unselected_weight=effective_baseline,
                attribute_unselected_nudge=effective_attr_nudge,
            )
        elif h_weight_dict is not None and isinstance(h_weight_dict, (list, np.ndarray)):
            h_weight_vec = np.array(h_weight_dict, dtype=np.float32)
        else:
            h_weight_vec = build_feature_weight_vector(
                weights_map,
                default_unselected_weight=effective_baseline,
                attribute_unselected_nudge=effective_attr_nudge,
            ) if (weights_map is not None or not is_match) else default_w

        anchor = str(h.get("target_anchor") or h.get("category") or "easy").strip().lower()
        if anchor in ("difficult", "diff"):
            diff_trails.append(feat_vec)
            diff_scores.append(score)
            diff_matches.append(is_match)
            diff_weights.append(h_weight_vec)
            diff_mismatch_kinds.append(m_kind)

            # Dual-Anchor Cross-Coupling:
            # If a Difficult hike was underwhelming (user found it too easy),
            # this trail's demands proved completely comfortable for the user.
            # Propagate upward expansion to the Easy anchor as well.
            if m_kind == "underwhelming":
                easy_trails.append(feat_vec)
                easy_scores.append(score)
                easy_matches.append(True)
                easy_weights.append(h_weight_vec)
                easy_mismatch_kinds.append("match")
        else:
            easy_trails.append(feat_vec)
            easy_scores.append(score)
            easy_matches.append(is_match)
            easy_weights.append(h_weight_vec)
            easy_mismatch_kinds.append(m_kind)

            # If an Easy hike was an overexertion mismatch (user struggled on an Easy trail),
            # this proves their Difficult ceiling was also critically overestimated.
            # Propagate downward correction to the Difficult anchor as well.
            if not is_match:
                diff_trails.append(feat_vec)
                diff_scores.append(score)
                diff_matches.append(False)
                diff_weights.append(h_weight_vec)
                diff_mismatch_kinds.append("overexertion")

    # Update Easy Anchor
    updated_easy = update_profile_vector(
        current_profile=easy_vec,
        trail_vectors=easy_trails,
        scores=easy_scores,
        matches=easy_matches,
        weights=easy_weights if easy_weights else None,
        beta_divisor=beta_divisor,
        anchor_type="easy",
        max_step_delta=PROFILE_MAX_STEP_DELTA,
        easy_ceiling_nudge=easy_ceiling_nudge,
        mismatch_types=easy_mismatch_kinds,
    )

    # Update Difficult Anchor
    updated_diff = update_profile_vector(
        current_profile=diff_vec,
        trail_vectors=diff_trails,
        scores=diff_scores,
        matches=diff_matches,
        weights=diff_weights if diff_weights else None,
        beta_divisor=beta_divisor,
        anchor_type="difficult",
        max_step_delta=PROFILE_MAX_STEP_DELTA,
        mismatch_types=diff_mismatch_kinds,
    )

    # Monotonicity check on physical indices (0..5) using configurable minimum gap
    adj_easy, adj_diff = enforce_anchor_monotonicity(updated_easy, updated_diff, min_gap=min_gap)

    return {
        "updated_easy_vector": adj_easy.tolist(),
        "updated_diff_vector": adj_diff.tolist(),
        "updated_easy_features": unflatten_profile_features(adj_easy),
        "updated_diff_features": unflatten_profile_features(adj_diff),
        "easy_hikes_count": len(easy_trails),
        "difficult_hikes_count": len(diff_trails)
    }


def resolve_review_factor_weights(
    selected_factors: List[str],
    trail_features: Optional[Dict[str, Any]] = None,
    active_weight: float = REVIEW_ACTIVE_FACTOR_WEIGHT,
    baseline_weight: float = REVIEW_BASELINE_UNSELECTED_WEIGHT,
    terrain_presence_threshold: float = TERRAIN_PRESENCE_THRESHOLD
) -> Dict[str, float]:
    """
    Parses review factor strings (both legacy canonical names and new conversational phrases)
    into a dictionary of feature weights with Feature Presence Gating for terrains.
    """
    weights: Dict[str, float] = {}
    normalized = [str(f).strip().lower() for f in (selected_factors or [])]

    def is_selected(terms: List[str]) -> bool:
        return any(any(t in sel for t in terms) for sel in normalized)

    # 1. Slope / Steepness
    if is_selected(["slope", "steep"]):
        weights["slope"] = active_weight

    # 2. Trail length / Distance
    if is_selected(["length", "distance", "long"]):
        weights["length"] = active_weight

    # 3. Altitude / Peak Elevation
    if is_selected(["altitude", "elevation", "breathing", "exhausting"]):
        weights["elevation"] = active_weight

    # 4. Elevation gain / Climbing
    if is_selected(["gain", "climb", "uphill"]):
        weights["gain"] = active_weight

    # 5. Terrain block with Feature Presence Gating
    if is_selected(["terrain", "footing", "surface", "ground", "rocky", "slippery", "stable"]):
        terrain_dict = {}
        if isinstance(trail_features, dict):
            terrain_dict = trail_features.get("terrain", {})
            if not isinstance(terrain_dict, dict):
                terrain_dict = {}

        for key in TERRAIN_KEYS:
            val = float(terrain_dict.get(key, 0.0) or 0.0)
            if val > terrain_presence_threshold:
                weights[key] = active_weight
            else:
                weights[key] = 0.0

    return weights
