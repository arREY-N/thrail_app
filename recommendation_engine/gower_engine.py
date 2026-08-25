"""
@file gower_engine.py
@description Gower's Distance Similarity Engine for mixed data types (numerical, ordinal, nominal).
             Implements upper triangular symmetric optimization and self-similarity bypass.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional

# Default feature configuration for Thrail App trails and user profiles
DEFAULT_FEATURE_CONFIG = {
    'numerical': {
        'difficulty_length': {'min': 0.0, 'max': 30.0},
        'difficulty_gain': {'min': 0.0, 'max': 2000.0},
        'difficulty_slope': {'min': 0.0, 'max': 45.0},
        'difficulty_hours': {'min': 0.0, 'max': 12.0},
        'difficulty_obstacles': {'min': 0.0, 'max': 200.0},
        'general_rating': {'min': 1.0, 'max': 5.0}
    },
    'ordinal': {
        'difficulty_lascoRating': {'min_rank': 1.0, 'max_rank': 9.0}
    },
    'nominal': [
        'province',
        'difficulty_classification',
        'difficulty_circularity',
        'tourism_shelter',
        'tourism_resting',
        'tourism_clean_water',
        'tourism_river',
        'tourism_lake',
        'tourism_waterfall',
        'tourism_network_connection'
    ]
}


def gower_attribute_similarity(
    val_a: Any,
    val_b: Any,
    attr_name: str,
    attr_type: str,
    config: Dict[str, Any]
) -> float:
    """
    @function gower_attribute_similarity
    @description Computes Gower similarity score S_j(A_j, B_j) for a single attribute dimension j.
    @param val_a Value of attribute for entity A.
    @param val_b Value of attribute for entity B.
    @param attr_name Name of the attribute.
    @param attr_type Attribute type: 'numerical', 'ordinal', or 'nominal'.
    @param config Feature configuration containing bounds and ranges.
    @returns {float} Attribute similarity score S_j in [0.0, 1.0].
    """
    if pd.isna(val_a) or pd.isna(val_b) or val_a is None or val_b is None:
        return 0.5  # Neutral fallback for missing values

    if attr_type == 'numerical':
        # Formula: S_j(A_j, B_j) = 1 - (|A_j - B_j| / Range_j)
        num_cfg = config.get('numerical', {}).get(attr_name, {})
        val_range = num_cfg.get('max', 1.0) - num_cfg.get('min', 0.0)
        if val_range <= 0:
            return 1.0 if float(val_a) == float(val_b) else 0.0
        diff = abs(float(val_a) - float(val_b))
        sim = 1.0 - (diff / val_range)
        return float(np.clip(sim, 0.0, 1.0))

    elif attr_type == 'ordinal':
        # Formula: Normalize ranks to [0, 1] then apply Manhattan distance ratio:
        # rank_norm = (rank - min_rank) / (max_rank - min_rank)
        # S_j = 1 - |rank_norm(A) - rank_norm(B)|
        ord_cfg = config.get('ordinal', {}).get(attr_name, {})
        min_r = ord_cfg.get('min_rank', 1.0)
        max_r = ord_cfg.get('max_rank', 9.0)
        r_range = max_r - min_r
        if r_range <= 0:
            return 1.0 if float(val_a) == float(val_b) else 0.0
        
        norm_a = (float(val_a) - min_r) / r_range
        norm_b = (float(val_b) - min_r) / r_range
        sim = 1.0 - abs(norm_a - norm_b)
        return float(np.clip(sim, 0.0, 1.0))

    elif attr_type == 'nominal':
        # Formula: S_j(A_j, B_j) = 1 if match else 0
        str_a = str(val_a).strip().lower()
        str_b = str(val_b).strip().lower()
        return 1.0 if str_a == str_b else 0.0

    return 0.0


def compute_gower_similarity_single(
    dict_a: Dict[str, Any],
    dict_b: Dict[str, Any],
    feature_config: Optional[Dict[str, Any]] = None
) -> float:
    """
    @function compute_gower_similarity_single
    @description Computes overall Gower similarity score S(A, B) = (1/p) * sum_{j=1}^p S_j(A_j, B_j)
    @param dict_a Feature dictionary for entity A.
    @param dict_b Feature dictionary for entity B.
    @param feature_config Configuration schema for attribute types and ranges.
    @returns {float} Overall Gower similarity in [0.0, 1.0].
    """
    cfg = feature_config or DEFAULT_FEATURE_CONFIG
    scores = []

    # 1. Numerical Attributes
    for attr, num_info in cfg.get('numerical', {}).items():
        if attr in dict_a and attr in dict_b:
            s_j = gower_attribute_similarity(dict_a[attr], dict_b[attr], attr, 'numerical', cfg)
            scores.append(s_j)

    # 2. Ordinal Attributes
    for attr, ord_info in cfg.get('ordinal', {}).items():
        if attr in dict_a and attr in dict_b:
            s_j = gower_attribute_similarity(dict_a[attr], dict_b[attr], attr, 'ordinal', cfg)
            scores.append(s_j)

    # 3. Nominal Attributes
    for attr in cfg.get('nominal', []):
        if attr in dict_a and attr in dict_b:
            s_j = gower_attribute_similarity(dict_a[attr], dict_b[attr], attr, 'nominal', cfg)
            scores.append(s_j)

    if not scores:
        return 0.0

    return float(np.mean(scores))


class GowerSimilarityEngine:
    """
    @class GowerSimilarityEngine
    @description Vectorized similarity calculation engine supporting mixed attribute types and optimized matrix operations.
    """
    def __init__(self, feature_config: Optional[Dict[str, Any]] = None):
        self.config = feature_config or DEFAULT_FEATURE_CONFIG

    def compute_pairwise_matrix(
        self,
        df_a: pd.DataFrame,
        df_b: Optional[pd.DataFrame] = None,
        is_symmetric: bool = False
    ) -> Tuple[np.ndarray, Dict[str, int]]:
        """
        @function compute_pairwise_matrix
        @description Computes pairwise Gower similarity matrix between rows of df_a and df_b.
                     Applies optimization rules:
                     1. Skip Self-Similarity (S(A, A) = 1.0)
                     2. Upper Triangular / Symmetric Computation (S(A, B) = S(B, A)), cutting calculations by >50%.
        @param df_a DataFrame containing N entities.
        @param df_b DataFrame containing M entities (if None, computes N x N matrix for df_a).
        @param is_symmetric If True, computes N x N symmetric matrix using upper triangular mirroring.
        @returns {Tuple[np.ndarray, Dict[str, int]]} Pairwise matrix and optimization metrics dictionary.
        """
        n_a = len(df_a)
        if df_b is None or is_symmetric:
            df_b = df_a
            is_symmetric = True
        n_b = len(df_b)

        matrix = np.zeros((n_a, n_b), dtype=np.float32)

        total_possible = n_a * n_b
        computed_count = 0
        skipped_count = 0

        # Convert dataframes to dictionaries for rapid row access
        records_a = df_a.to_dict(orient='records')
        records_b = df_b.to_dict(orient='records')

        if is_symmetric and n_a == n_b:
            for i in range(n_a):
                for j in range(i, n_b):
                    # Optimization Rule 1: Skip Self-Similarity
                    if i == j:
                        matrix[i, j] = 1.0
                        skipped_count += 1
                        continue

                    # Optimization Rule 2: Compute Upper Triangular once & Mirror
                    sim_score = compute_gower_similarity_single(records_a[i], records_b[j], self.config)
                    matrix[i, j] = sim_score
                    matrix[j, i] = sim_score
                    computed_count += 1
                    skipped_count += 1  # The mirrored calculation j,i was saved!
        else:
            for i in range(n_a):
                for j in range(n_b):
                    sim_score = compute_gower_similarity_single(records_a[i], records_b[j], self.config)
                    matrix[i, j] = sim_score
                    computed_count += 1

        stats = {
            "total_pairs": total_possible,
            "computed_pairs": computed_count,
            "skipped_pairs": skipped_count,
            "efficiency_gain_pct": round((skipped_count / total_possible) * 100.0, 2) if total_possible > 0 else 0.0
        }

        return matrix, stats
