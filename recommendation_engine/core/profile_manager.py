"""
@file profile_manager.py
@description 18-Feature Dataset Vector Mapping, Two-Anchor Profile Generator (Easy P_e and Difficult P_d),
             and Profile Update Function with Beta Corrector Factor (BCF) matrix.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional

PROVINCES = ['cavite', 'laguna', 'batangas', 'rizal', 'quezon']
MOUNTAINS = ['mt1', 'mt2', 'mt3', 'mt4', 'mt5']
TOURISM_INFRASTRUCTURE = ['tourism_1', 'tourism_2', 'tourism_3', 'tourism_4', 'tourism_5']

NUM_FEATURES = 18

def build_18_feature_vector(entity_dict: Dict[str, Any]) -> np.ndarray:
    """
    @function build_18_feature_vector
    @description Maps item or user profile dictionary into normalized 18-dimensional vector in [0, 1]^18.
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

    # 4. Duration Dimension (Dimension 11)
    hours = float(entity_dict.get('difficulty_hours', 3.0)) #remove duration dimension
    vec[11] = float(np.clip(hours / 12.0, 0.0, 1.0))

    # 5. Length / Elevation Index Dimension (Dimension 12)
    length_km = float(entity_dict.get('difficulty_length', 5.0)) # no fallback on length if no value flaged as error
    gain_m = float(entity_dict.get('difficulty_gain', 300.0)) # no fallback on gain if no value flaged as error
    length_norm = min(length_km / 30.0, 1.0) # divide to max length of longest trail or maountain to normalize to 1
    gain_norm = min(gain_m / 2000.0, 1.0) # divide to max elevation of highest trail or maountain to normalize to 1
    vec[12] = float((length_norm + gain_norm) / 2.0) # divide gain to get the normalize value of 1

    # 6. Tourism Infrastructure Flags (Dimensions 13-17)
    for idx, infra in enumerate(TOURISM_INFRASTRUCTURE):
        val = entity_dict.get(infra, entity_dict.get(f"tourism_{idx+1}", False))
        if isinstance(val, bool):
            vec[13 + idx] = 1.0 if val else 0.0
        elif str(val).lower() in ['true', '1', 'yes']:
            vec[13 + idx] = 1.0
        else:
            vec[13 + idx] = 0.0

    return vec


class TwoAnchorProfileManager:
    """
    @class TwoAnchorProfileManager
    @description Manages Two-Anchor Profiles: Easy (P_e) and Difficult (P_d),
                 and Profile Updates via Beta Corrector Factor (BCF) matrix.
    """
    @staticmethod
    def create_anchor_profiles(preferences: Dict[str, Any]) -> Tuple[np.ndarray, np.ndarray]:
        p_e = build_18_feature_vector(preferences)
        p_d = p_e.copy()

        # Reverse-engineer P_d: Shift difficulty/stamina dimensions (10, 11, 12) upward
        p_d[10] = float(np.clip(p_e[10] + 0.35, 0.0, 1.0))
        p_d[11] = float(np.clip(p_e[11] + 0.35, 0.0, 1.0))
        p_d[12] = float(np.clip(p_e[12] + 0.35, 0.0, 1.0))

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
