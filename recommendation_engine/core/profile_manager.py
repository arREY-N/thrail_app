"""
@file profile_manager.py
@description 17-Feature Dataset Vector Mapping (Duration dimension removed),
             Two-Anchor Profile Generator (Easy P_e and Difficult P_d),
             and Profile Update Function with Beta Corrector Factor (BCF) matrix.
             Dynamically derives max length and gain boundaries directly from the dataset.
"""

import os
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional, Union

PROVINCES = ['cavite', 'laguna', 'batangas', 'rizal', 'quezon']
MOUNTAINS = ['mt1', 'mt2', 'mt3', 'mt4', 'mt5']
TOURISM_INFRASTRUCTURE = ['tourism_1', 'tourism_2', 'tourism_3', 'tourism_4', 'tourism_5']

NUM_FEATURES = 17

_BOUNDS_CACHE: Optional[Tuple[float, float]] = None


def get_dataset_bounds(source: Optional[Union[str, pd.DataFrame]] = None) -> Tuple[float, float]:
    """
    @function get_dataset_bounds
    @description Dynamically retrieves the maximum trail length and elevation gain from the database/CSV dataset.
    """
    global _BOUNDS_CACHE
    if source is None and _BOUNDS_CACHE is not None:
        return _BOUNDS_CACHE

    df: Optional[pd.DataFrame] = None
    if isinstance(source, pd.DataFrame):
        df = source
    elif isinstance(source, str) and os.path.exists(source):
        df = pd.read_csv(source)
    else:
        # Resolve default trails_mock.csv path
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        default_csv = os.path.join(base_dir, "data", "trails_mock.csv")
        if os.path.exists(default_csv):
            df = pd.read_csv(default_csv)

    if df is not None and not df.empty:
        len_col = 'difficulty_length' if 'difficulty_length' in df.columns else ('length' if 'length' in df.columns else None)
        gain_col = 'difficulty_gain' if 'difficulty_gain' in df.columns else ('gain' if 'gain' in df.columns else None)

        max_len = float(df[len_col].dropna().max()) if len_col else 1.0
        max_gain = float(df[gain_col].dropna().max()) if gain_col else 1.0
        _BOUNDS_CACHE = (max_len, max_gain)
        return max_len, max_gain

    return 1.0, 1.0


def build_17_feature_vector(
    entity_dict: Dict[str, Any],
    max_length: Optional[float] = None,
    max_gain: Optional[float] = None
) -> np.ndarray:
    """
    @function build_17_feature_vector
    @description Maps item or user profile dictionary into normalized 17-dimensional vector in [0, 1]^17.
                 Features:
                 - 0..4: 5 Provinces (Cavite, Laguna, Batangas, Rizal, Quezon)
                 - 5..9: 5 Mountain Affinities (Mt1, Mt2, Mt3, Mt4, Mt5)
                 - 10: LASCO Rating requirement (normalized to [0, 1])
                 - 11: Length / Elevation Gain Index (normalized dynamically via dataset bounds)
                 - 12..16: 5 Tourism Infrastructure Flags (binary 0.0 or 1.0)
    """
    vec = np.zeros(NUM_FEATURES, dtype=np.float32)

    # 1. Location Flags (Dimensions 0-4: Cavite, Laguna, Batangas, Rizal, Quezon)
    province_input = entity_dict.get('province', [])
    if isinstance(province_input, str):
        province_list = [province_input.lower()]
    elif isinstance(province_input, list):
        province_list = [str(p).lower() for p in province_input]
    else:
        province_list = []

    for idx, prov in enumerate(PROVINCES):
        if prov in province_list:
            vec[idx] = 1.0

    # 2. Mountain Affinity Flags (Dimensions 5-9: Mt1, Mt2, Mt3, Mt4, Mt5)
    location_input = entity_dict.get('location', [])
    if isinstance(location_input, str):
        location_list = [location_input.lower()]
    elif isinstance(location_input, list):
        location_list = [str(l).lower() for l in location_input]
    else:
        location_list = []

    for idx, mt in enumerate(MOUNTAINS):
        if any(mt in loc for loc in location_list):
            vec[5 + idx] = 1.0

    # 3. Experience / LASCO Rating Dimension (Dimension 10)
    lasco = entity_dict.get('difficulty_lascoRating', 3.0)
    if isinstance(lasco, (int, float)):
        vec[10] = float(np.clip(lasco / 9.0, 0.0, 1.0))
    elif str(lasco).lower() == 'beginner':
        vec[10] = 3.0 / 9.0
    elif str(lasco).lower() == 'regular':
        vec[10] = 5.0 / 9.0
    elif str(lasco).lower() == 'experienced':
        vec[10] = 8.0 / 9.0
    else:
        vec[10] = 3.0 / 9.0

    # 4. Length / Elevation Index Dimension (Dimension 11) - (Duration removed)
    is_trail_entity = any(k in entity_dict for k in ['id', 'name', 'mountain', 'difficulty_classification'])
    raw_length = entity_dict.get('difficulty_length', entity_dict.get('length'))
    raw_gain = entity_dict.get('difficulty_gain', entity_dict.get('gain'))

    if is_trail_entity or (raw_length is not None or raw_gain is not None):
        # Strict validation for trail entities: No fallback, flag null/missing as explicit error
        if raw_length is None or str(raw_length).strip().lower() in ['none', 'null', 'nan', '']:
            raise ValueError("Trail record error: 'difficulty_length' / 'length' is missing or null. No fallback allowed.")
        if raw_gain is None or str(raw_gain).strip().lower() in ['none', 'null', 'nan', '']:
            raise ValueError("Trail record error: 'difficulty_gain' / 'gain' is missing or null. No fallback allowed.")

        try:
            length_km = float(raw_length)
            gain_m = float(raw_gain)
        except (ValueError, TypeError) as e:
            raise ValueError(f"Trail record error: invalid numeric value for length/gain: length='{raw_length}', gain='{raw_gain}'. Error: {e}")

        # Dynamically extract max values from dataset and normalize
        if max_length is None or max_gain is None:
            ds_max_l, ds_max_g = get_dataset_bounds()
            max_length = max_length or ds_max_l
            max_gain = max_gain or ds_max_g

        length_norm = min(length_km / max(1.0, max_length), 1.0)
        gain_norm = min(gain_m / max(1.0, max_gain), 1.0)

        denominator = gain_norm if gain_norm > 0 else 1.0
        vec[11] = float(np.clip((length_norm + gain_norm) / denominator, 0.0, 1.0))
    else:
        # User onboarding profile: physical stamina preference aligns directly with experience level
        vec[11] = vec[10]

    # 5. Tourism Infrastructure Flags (Dimensions 12-16)
    for idx, infra in enumerate(TOURISM_INFRASTRUCTURE):
        val = entity_dict.get(infra, entity_dict.get(f"tourism_{idx+1}", False))
        if isinstance(val, bool):
            vec[12 + idx] = 1.0 if val else 0.0
        elif str(val).lower() in ['true', '1', 'yes']:
            vec[12 + idx] = 1.0
        else:
            vec[12 + idx] = 0.0

    return vec

# Backwards compatibility alias
build_18_feature_vector = build_17_feature_vector


class TwoAnchorProfileManager:
    """
    @class TwoAnchorProfileManager
    @description Manages Two-Anchor Profiles: Easy (P_e) and Difficult (P_d),
                 and Profile Updates via Beta Corrector Factor (BCF) matrix.
    """
    @staticmethod
    def create_anchor_profiles(
        preferences: Dict[str, Any],
        max_length: Optional[float] = None,
        max_gain: Optional[float] = None
    ) -> Tuple[np.ndarray, np.ndarray]:
        p_e = build_17_feature_vector(preferences, max_length=max_length, max_gain=max_gain)
        p_d = p_e.copy()

        # Reverse-engineer P_d: Shift difficulty/physical dimensions (10, 11) upward
        p_d[10] = float(np.clip(p_e[10] + 0.35, 0.0, 1.0))
        p_d[11] = float(np.clip(p_e[11] + 0.35, 0.0, 1.0))

        return p_e, p_d

    @staticmethod
    def compute_beta_corrector(r_tu: float, is_matched: bool) -> float:
        r_tu = float(np.clip(r_tu, 0.0, 1.0))
        if is_matched:
            return float(r_tu / 2.0)
        else:
            return float(-(1.0 - r_tu) / 2.0)

    @classmethod
    def update_profile(
        cls,
        p_old: np.ndarray,
        hiked_trails_vectors: List[np.ndarray],
        r_tu_scores: List[float],
        actual_difficulties: List[str],
        anchor_type: str = "easy"
    ) -> np.ndarray:
        p_old = np.asarray(p_old, dtype=np.float32)
        k = len(hiked_trails_vectors)
        if k == 0:
            return p_old.copy()

        shift_sum = np.zeros_like(p_old)

        for i in range(k):
            h_xi = np.asarray(hiked_trails_vectors[i], dtype=np.float32)
            r_tu = r_tu_scores[i]
            actual = str(actual_difficulties[i]).strip().lower()

            is_matched = (actual == anchor_type.lower())
            beta_i = cls.compute_beta_corrector(r_tu, is_matched)

            shift_sum += beta_i * (h_xi - p_old)

        p_new = p_old + (1.0 / k) * shift_sum
        return np.clip(p_new, 0.0, 1.0).astype(np.float32)
