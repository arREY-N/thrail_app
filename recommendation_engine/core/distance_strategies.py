"""
@file distance_strategies.py
@description Strategy Pattern implementation for TARS distance engines (Gower's, Euclidean, Cosine).
             Supports 23 benchmark configurations (7 Content-Based, 7 Collaborative Filtering,
             7 Hybrid Ensembles, 2 Baseline Anchors).
"""

from abc import ABC, abstractmethod
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional

class DistanceStrategy(ABC):
    """
    @class DistanceStrategy
    @description Abstract base class for distance calculation strategies.
    """
    @abstractmethod
    def calculate_distance(self, vec_a: np.ndarray, vec_b: np.ndarray) -> float:
        """
        @function calculate_distance
        @description Calculates scalar distance between two 1D vectors vec_a and vec_b.
        @returns {float} Distance score in [0.0, 1.0] where 0 is identical and 1 is completely dissimilar.
        """
        pass

    @abstractmethod
    def calculate_matrix(self, matrix_a: np.ndarray, matrix_b: Optional[np.ndarray] = None, is_symmetric: bool = False) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        @function calculate_matrix
        @description Calculates pairwise distance matrix between rows of matrix_a and matrix_b.
        """
        pass


class GowerDistanceStrategy(DistanceStrategy):
    """
    @class GowerDistanceStrategy
    @description Calculates Gower's Distance GD = 1 - (1/p) * sum(S_ij).
    """
    def calculate_distance(self, vec_a: np.ndarray, vec_b: np.ndarray) -> float:
        vec_a = np.asarray(vec_a, dtype=np.float32)
        vec_b = np.asarray(vec_b, dtype=np.float32)
        p = len(vec_a)
        if p == 0:
            return 1.0
        
        sim_scores = 1.0 - np.abs(vec_a - vec_b)
        avg_sim = float(np.mean(sim_scores))
        gower_dist = 1.0 - avg_sim
        return float(np.clip(gower_dist, 0.0, 1.0))

    def calculate_matrix(self, matrix_a: np.ndarray, matrix_b: Optional[np.ndarray] = None, is_symmetric: bool = False) -> Tuple[np.ndarray, Dict[str, Any]]:
        n_a = len(matrix_a)
        if matrix_b is None or is_symmetric:
            matrix_b = matrix_a
            is_symmetric = True
        n_b = len(matrix_b)

        dist_matrix = np.zeros((n_a, n_b), dtype=np.float32)
        total_possible = n_a * n_b
        computed_count = 0
        skipped_count = 0

        if is_symmetric and n_a == n_b:
            for i in range(n_a):
                for j in range(i, n_b):
                    if i == j:
                        dist_matrix[i, j] = 0.0
                        skipped_count += 1
                        continue
                    d = self.calculate_distance(matrix_a[i], matrix_b[j])
                    dist_matrix[i, j] = d
                    dist_matrix[j, i] = d
                    computed_count += 1
                    skipped_count += 1
        else:
            for i in range(n_a):
                for j in range(n_b):
                    dist_matrix[i, j] = self.calculate_distance(matrix_a[i], matrix_b[j])
                    computed_count += 1

        stats = {
            "total_pairs": total_possible,
            "computed_pairs": computed_count,
            "skipped_pairs": skipped_count,
            "efficiency_gain_pct": round((skipped_count / total_possible) * 100.0, 2) if total_possible > 0 else 0.0
        }
        return dist_matrix, stats


class EuclideanDistanceStrategy(DistanceStrategy):
    """
    @class EuclideanDistanceStrategy
    @description Calculates normalized Euclidean Distance ED = sqrt(sum((a_i - b_i)^2)) / sqrt(p).
    """
    def calculate_distance(self, vec_a: np.ndarray, vec_b: np.ndarray) -> float:
        vec_a = np.asarray(vec_a, dtype=np.float32)
        vec_b = np.asarray(vec_b, dtype=np.float32)
        p = len(vec_a)
        if p == 0:
            return 1.0
        
        diff_sq = np.sum((vec_a - vec_b) ** 2)
        ed = np.sqrt(diff_sq) / np.sqrt(p)
        return float(np.clip(ed, 0.0, 1.0))

    def calculate_matrix(self, matrix_a: np.ndarray, matrix_b: Optional[np.ndarray] = None, is_symmetric: bool = False) -> Tuple[np.ndarray, Dict[str, Any]]:
        n_a = len(matrix_a)
        if matrix_b is None or is_symmetric:
            matrix_b = matrix_a
            is_symmetric = True
        n_b = len(matrix_b)

        dist_matrix = np.zeros((n_a, n_b), dtype=np.float32)
        computed_count = 0
        skipped_count = 0
        total_possible = n_a * n_b

        if is_symmetric and n_a == n_b:
            for i in range(n_a):
                for j in range(i, n_b):
                    if i == j:
                        dist_matrix[i, j] = 0.0
                        skipped_count += 1
                        continue
                    d = self.calculate_distance(matrix_a[i], matrix_b[j])
                    dist_matrix[i, j] = d
                    dist_matrix[j, i] = d
                    computed_count += 1
                    skipped_count += 1
        else:
            for i in range(n_a):
                for j in range(n_b):
                    dist_matrix[i, j] = self.calculate_distance(matrix_a[i], matrix_b[j])
                    computed_count += 1

        stats = {
            "total_pairs": total_possible,
            "computed_pairs": computed_count,
            "skipped_pairs": skipped_count,
            "efficiency_gain_pct": round((skipped_count / total_possible) * 100.0, 2) if total_possible > 0 else 0.0
        }
        return dist_matrix, stats


class CosineDistanceStrategy(DistanceStrategy):
    """
    @class CosineDistanceStrategy
    @description Calculates Cosine Distance CD = 1 - (sum(a_i * b_i) / (norm(a) * norm(b))).
    """
    def calculate_distance(self, vec_a: np.ndarray, vec_b: np.ndarray) -> float:
        vec_a = np.asarray(vec_a, dtype=np.float32)
        vec_b = np.asarray(vec_b, dtype=np.float32)
        norm_a = np.linalg.norm(vec_a)
        norm_b = np.linalg.norm(vec_b)
        
        if norm_a == 0 or norm_b == 0:
            return 1.0
        
        dot_product = np.dot(vec_a, vec_b)
        cosine_sim = dot_product / (norm_a * norm_b)
        cosine_dist = 1.0 - float(cosine_sim)
        return float(np.clip(cosine_dist, 0.0, 1.0))

    def calculate_matrix(self, matrix_a: np.ndarray, matrix_b: Optional[np.ndarray] = None, is_symmetric: bool = False) -> Tuple[np.ndarray, Dict[str, Any]]:
        n_a = len(matrix_a)
        if matrix_b is None or is_symmetric:
            matrix_b = matrix_a
            is_symmetric = True
        n_b = len(matrix_b)

        dist_matrix = np.zeros((n_a, n_b), dtype=np.float32)
        computed_count = 0
        skipped_count = 0
        total_possible = n_a * n_b

        if is_symmetric and n_a == n_b:
            for i in range(n_a):
                for j in range(i, n_b):
                    if i == j:
                        dist_matrix[i, j] = 0.0
                        skipped_count += 1
                        continue
                    d = self.calculate_distance(matrix_a[i], matrix_b[j])
                    dist_matrix[i, j] = d
                    dist_matrix[j, i] = d
                    computed_count += 1
                    skipped_count += 1
        else:
            for i in range(n_a):
                for j in range(n_b):
                    dist_matrix[i, j] = self.calculate_distance(matrix_a[i], matrix_b[j])
                    computed_count += 1

        stats = {
            "total_pairs": total_possible,
            "computed_pairs": computed_count,
            "skipped_pairs": skipped_count,
            "efficiency_gain_pct": round((skipped_count / total_possible) * 100.0, 2) if total_possible > 0 else 0.0
        }
        return dist_matrix, stats


class EnsembleDistanceStrategy(DistanceStrategy):
    """
    @class EnsembleDistanceStrategy
    @description Combines distance strategies (GD, ED, CD) with dynamic weights w_GD, w_ED, w_CD.
    """
    def __init__(self, weight_gower: float = 1.0, weight_euclidean: float = 0.0, weight_cosine: float = 0.0):
        total_w = weight_gower + weight_euclidean + weight_cosine
        if total_w <= 0:
            total_w = 1.0
            weight_gower = 1.0
        
        self.w_gd = weight_gower / total_w
        self.w_ed = weight_euclidean / total_w
        self.w_cd = weight_cosine / total_w
        
        self.gd_engine = GowerDistanceStrategy()
        self.ed_engine = EuclideanDistanceStrategy()
        self.cd_engine = CosineDistanceStrategy()

    def calculate_distance(self, vec_a: np.ndarray, vec_b: np.ndarray) -> float:
        dist = 0.0
        if self.w_gd > 0:
            dist += self.w_gd * self.gd_engine.calculate_distance(vec_a, vec_b)
        if self.w_ed > 0:
            dist += self.w_ed * self.ed_engine.calculate_distance(vec_a, vec_b)
        if self.w_cd > 0:
            dist += self.w_cd * self.cd_engine.calculate_distance(vec_a, vec_b)
        return float(np.clip(dist, 0.0, 1.0))

    def calculate_matrix(self, matrix_a: np.ndarray, matrix_b: Optional[np.ndarray] = None, is_symmetric: bool = False) -> Tuple[np.ndarray, Dict[str, Any]]:
        n_a = len(matrix_a)
        if matrix_b is None or is_symmetric:
            matrix_b = matrix_a
            is_symmetric = True
        n_b = len(matrix_b)

        dist_matrix = np.zeros((n_a, n_b), dtype=np.float32)
        computed_count = 0
        skipped_count = 0
        total_possible = n_a * n_b

        if is_symmetric and n_a == n_b:
            for i in range(n_a):
                for j in range(i, n_b):
                    if i == j:
                        dist_matrix[i, j] = 0.0
                        skipped_count += 1
                        continue
                    d = self.calculate_distance(matrix_a[i], matrix_b[j])
                    dist_matrix[i, j] = d
                    dist_matrix[j, i] = d
                    computed_count += 1
                    skipped_count += 1
        else:
            for i in range(n_a):
                for j in range(n_b):
                    dist_matrix[i, j] = self.calculate_distance(matrix_a[i], matrix_b[j])
                    computed_count += 1

        stats = {
            "total_pairs": total_possible,
            "computed_pairs": computed_count,
            "skipped_pairs": skipped_count,
            "efficiency_gain_pct": round((skipped_count / total_possible) * 100.0, 2) if total_possible > 0 else 0.0
        }
        return dist_matrix, stats


class EngineRegistry:
    """
    @class EngineRegistry
    @description Registry defining and instantiating the 23 TARS benchmark configurations.
    """
    BENCHMARK_CONFIGS = {
        # 1. Content-Based Variations (7)
        "CB_GOWER": {"category": "CB", "engine": EnsembleDistanceStrategy(1.0, 0.0, 0.0), "desc": "Single Content-Based (Gower)"},
        "CB_EUCLIDEAN": {"category": "CB", "engine": EnsembleDistanceStrategy(0.0, 1.0, 0.0), "desc": "Single Content-Based (Euclidean)"},
        "CB_COSINE": {"category": "CB", "engine": EnsembleDistanceStrategy(0.0, 0.0, 1.0), "desc": "Single Content-Based (Cosine)"},
        "CB_GOWER_EUCLIDEAN": {"category": "CB", "engine": EnsembleDistanceStrategy(0.5, 0.5, 0.0), "desc": "Dual Content-Based Ensemble (Gower + Euclidean)"},
        "CB_GOWER_COSINE": {"category": "CB", "engine": EnsembleDistanceStrategy(0.5, 0.0, 0.5), "desc": "Dual Content-Based Ensemble (Gower + Cosine)"},
        "CB_EUCLIDEAN_COSINE": {"category": "CB", "engine": EnsembleDistanceStrategy(0.0, 0.5, 0.5), "desc": "Dual Content-Based Ensemble (Euclidean + Cosine)"},
        "CB_TRIPLE_ENSEMBLE": {"category": "CB", "engine": EnsembleDistanceStrategy(1/3, 1/3, 1/3), "desc": "Triple Content-Based Ensemble (Gower + Euclidean + Cosine)"},

        # 2. Collaborative Filtering Variations (7)
        "CF_GOWER": {"category": "CF", "engine": EnsembleDistanceStrategy(1.0, 0.0, 0.0), "desc": "Single Collaborative Filtering (Gower)"},
        "CF_EUCLIDEAN": {"category": "CF", "engine": EnsembleDistanceStrategy(0.0, 1.0, 0.0), "desc": "Single Collaborative Filtering (Euclidean)"},
        "CF_COSINE": {"category": "CF", "engine": EnsembleDistanceStrategy(0.0, 0.0, 1.0), "desc": "Single Collaborative Filtering (Cosine)"},
        "CF_GOWER_EUCLIDEAN": {"category": "CF", "engine": EnsembleDistanceStrategy(0.5, 0.5, 0.0), "desc": "Dual Collaborative Filtering (Gower + Euclidean)"},
        "CF_GOWER_COSINE": {"category": "CF", "engine": EnsembleDistanceStrategy(0.5, 0.0, 0.5), "desc": "Dual Collaborative Filtering (Gower + Cosine)"},
        "CF_EUCLIDEAN_COSINE": {"category": "CF", "engine": EnsembleDistanceStrategy(0.0, 0.5, 0.5), "desc": "Dual Collaborative Filtering (Euclidean + Cosine)"},
        "CF_TRIPLE_ENSEMBLE": {"category": "CF", "engine": EnsembleDistanceStrategy(1/3, 1/3, 1/3), "desc": "Triple Collaborative Filtering (Gower + Euclidean + Cosine)"},

        # 3. Hybrid Combinations (7)
        "HYBRID_GOWER": {"category": "HYBRID", "engine": EnsembleDistanceStrategy(1.0, 0.0, 0.0), "desc": "Single Hybrid (Gower CB + Gower CF)"},
        "HYBRID_EUCLIDEAN": {"category": "HYBRID", "engine": EnsembleDistanceStrategy(0.0, 1.0, 0.0), "desc": "Single Hybrid (Euclidean CB + Euclidean CF)"},
        "HYBRID_COSINE": {"category": "HYBRID", "engine": EnsembleDistanceStrategy(0.0, 0.0, 1.0), "desc": "Single Hybrid (Cosine CB + Cosine CF)"},
        "HYBRID_GOWER_EUCLIDEAN": {"category": "HYBRID", "engine": EnsembleDistanceStrategy(0.5, 0.5, 0.0), "desc": "Dual Hybrid (Gower/Euclidean CB + CF)"},
        "HYBRID_GOWER_COSINE": {"category": "HYBRID", "engine": EnsembleDistanceStrategy(0.5, 0.0, 0.5), "desc": "Dual Hybrid (Gower/Cosine CB + CF)"},
        "HYBRID_EUCLIDEAN_COSINE": {"category": "HYBRID", "engine": EnsembleDistanceStrategy(0.0, 0.5, 0.5), "desc": "Dual Hybrid (Euclidean/Cosine CB + CF)"},
        "HYBRID_TRIPLE_ENSEMBLE": {"category": "HYBRID", "engine": EnsembleDistanceStrategy(1/3, 1/3, 1/3), "desc": "Triple Hybrid Ensemble (Gower + Euclidean + Cosine)"},

        # 4. Baseline Anchor Profiles (2)
        "ANCHOR_PE_ONLY": {"category": "ANCHOR", "engine": EnsembleDistanceStrategy(1.0, 0.0, 0.0), "desc": "Easy Anchor Profile (P_e) Only Baseline"},
        "ANCHOR_PD_ONLY": {"category": "ANCHOR", "engine": EnsembleDistanceStrategy(1.0, 0.0, 0.0), "desc": "Difficult Anchor Profile (P_d) Only Baseline"}
    }

    @classmethod
    def get_engine(cls, config_name: str) -> DistanceStrategy:
        name_upper = config_name.strip().upper()
        if name_upper in cls.BENCHMARK_CONFIGS:
            return cls.BENCHMARK_CONFIGS[name_upper]["engine"]
        return EnsembleDistanceStrategy(1.0, 0.0, 0.0)

    @classmethod
    def get_all_config_names(cls) -> List[str]:
        return list(cls.BENCHMARK_CONFIGS.keys())
