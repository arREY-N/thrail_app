"""
@file recommender.py
@description Official Thrail App Recommendation System (TARS) Core Engine.
             Integrates Strategy Pattern Distance Engines, 18-Feature Dataset Vector Mapping,
             Two-Anchor Profiles (Easy P_e and Difficult P_d), Dynamic Alpha Tuner Parameter (alpha),
             Profile Update Function with Beta Corrector Factor (BCF) matrix, and support for all 23 benchmark configurations.
"""

import os
import logging
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple, Optional

from .distance_strategies import DistanceStrategy, EngineRegistry, EnsembleDistanceStrategy
from .profile_manager import build_18_feature_vector, TwoAnchorProfileManager, NUM_FEATURES

logger = logging.getLogger("recommendation_engine")


def calculate_alpha_tuner(active_user_count: int, steady_state_threshold: int = 50) -> float:
    u = max(0, active_user_count)
    m = max(1, steady_state_threshold)
    if u <= m:
        alpha = 1.0 - (float(u) / (2.0 * float(m)))
    else:
        alpha = 0.5
    return float(np.clip(alpha, 0.5, 1.0))


class HybridRecommender:
    def __init__(
        self,
        trails_csv_path: str,
        ratings_csv_path: str,
        config_name: str = "HYBRID_GOWER",
        steady_state_threshold: int = 50
    ):
        self.trails_csv_path = trails_csv_path
        self.ratings_csv_path = ratings_csv_path
        self.config_name = config_name
        self.steady_state_threshold = steady_state_threshold

        self.strategy = EngineRegistry.get_engine(self.config_name)

        if os.path.exists(self.trails_csv_path):
            self.trails_df = pd.read_csv(self.trails_csv_path)
        else:
            self.trails_df = pd.DataFrame()

        if os.path.exists(self.ratings_csv_path):
            self.ratings_df = pd.read_csv(self.ratings_csv_path)
        else:
            self.ratings_df = pd.DataFrame()

        self._preprocess_data()
        logger.info(f"Initialized TARS HybridRecommender using config '{self.config_name}' with {len(self.trails_df)} trails and {len(self.ratings_df)} reviews.")

    def _preprocess_data(self):
        if self.trails_df.empty:
            self.trail_vectors = np.zeros((0, NUM_FEATURES), dtype=np.float32)
            self.trail_ids = []
            return

        self.trail_ids = self.trails_df['id'].tolist() if 'id' in self.trails_df.columns else [f"trail_{i:03d}" for i in range(len(self.trails_df))]
        
        vectors = []
        for _, row in self.trails_df.iterrows():
            row_dict = row.to_dict()
            vec = build_18_feature_vector(row_dict)
            vectors.append(vec)

        self.trail_vectors = np.array(vectors, dtype=np.float32)

    def set_config(self, config_name: str):
        self.config_name = config_name
        self.strategy = EngineRegistry.get_engine(self.config_name)
        logger.info(f"Swapped TARS Strategy Engine to '{self.config_name}'")

    def compute_cb_scores(self, user_profile_vec: np.ndarray) -> np.ndarray:
        if len(self.trail_vectors) == 0:
            return np.array([], dtype=np.float32)

        cb_scores = np.zeros(len(self.trail_vectors), dtype=np.float32)
        for i in range(len(self.trail_vectors)):
            cb_scores[i] = self.strategy.calculate_distance(user_profile_vec, self.trail_vectors[i])

        return cb_scores

    def compute_cf_scores(self, target_profile_vec: np.ndarray, cb_scores: np.ndarray) -> Tuple[np.ndarray, Dict[str, Any]]:
        stats = {"computed_pairs": 0, "skipped_pairs": 0}
        n_trails = len(self.trail_vectors)
        if n_trails == 0 or self.ratings_df.empty or 'user_id' not in self.ratings_df.columns:
            return cb_scores.copy(), stats

        peer_user_ids = self.ratings_df['user_id'].unique()
        if len(peer_user_ids) == 0:
            return cb_scores.copy(), stats

        peer_profiles = []
        for peer_id in peer_user_ids:
            peer_reviews = self.ratings_df[self.ratings_df['user_id'] == peer_id]
            if peer_reviews.empty:
                peer_profiles.append(target_profile_vec)
                continue

            peer_trail_ids = peer_reviews['trail_id'].unique()
            matched_indices = [self.trail_ids.index(tid) for tid in peer_trail_ids if tid in self.trail_ids]
            if matched_indices:
                avg_vec = np.mean(self.trail_vectors[matched_indices], axis=0)
            else:
                avg_vec = target_profile_vec
            peer_profiles.append(avg_vec)

        peer_matrix = np.array(peer_profiles, dtype=np.float32)

        cb_uv = np.zeros(len(peer_matrix), dtype=np.float32)
        for v in range(len(peer_matrix)):
            cb_uv[v] = self.strategy.calculate_distance(target_profile_vec, peer_matrix[v])
            stats["computed_pairs"] += 1

        cb_vt_matrix, matrix_stats = self.strategy.calculate_matrix(peer_matrix, self.trail_vectors)
        stats["skipped_pairs"] += matrix_stats.get("skipped_pairs", 0)

        cf_scores = np.zeros(n_trails, dtype=np.float32)
        m = len(peer_matrix)
        for t in range(n_trails):
            sum_prod = np.sum(cb_uv * cb_vt_matrix[:, t])
            cf_scores[t] = float(sum_prod / float(m))

        return cf_scores, stats

    def get_hybrid_recommendations(
        self,
        user_id: str,
        preferences: Dict[str, Any],
        top_k: int = 5,
        active_user_count: int = 1,
        config_override: Optional[str] = None
    ) -> Dict[str, Any]:
        current_config = config_override if config_override else self.config_name
        current_strategy = EngineRegistry.get_engine(current_config)

        p_e, p_d = TwoAnchorProfileManager.create_anchor_profiles(preferences)

        alpha = calculate_alpha_tuner(active_user_count, self.steady_state_threshold)
        logger.info(f"Calculated Alpha Tuner alpha = {alpha:.4f} for u = {active_user_count} active users.")

        cb_easy = np.zeros(len(self.trail_vectors), dtype=np.float32)
        for i in range(len(self.trail_vectors)):
            cb_easy[i] = current_strategy.calculate_distance(p_e, self.trail_vectors[i])

        cb_diff = np.zeros(len(self.trail_vectors), dtype=np.float32)
        for i in range(len(self.trail_vectors)):
            cb_diff[i] = current_strategy.calculate_distance(p_d, self.trail_vectors[i])

        cf_easy, opt_stats = self.compute_cf_scores(p_e, cb_easy)
        cf_diff, _ = self.compute_cf_scores(p_d, cb_diff)

        norm_factor = np.sqrt(float(NUM_FEATURES))

        recs_easy = []
        recs_diff = []

        for idx, row in self.trails_df.iterrows():
            trail_id = row['id']
            trail_name = row['name']
            province = row.get('province', 'Rizal')

            r_tu_easy = (alpha * cb_easy[idx] + (1.0 - alpha) * cf_easy[idx]) / norm_factor
            r_tu_easy = float(np.clip(r_tu_easy, 0.0, 1.0))

            r_tu_diff = (alpha * cb_diff[idx] + (1.0 - alpha) * cf_diff[idx]) / norm_factor
            r_tu_diff = float(np.clip(r_tu_diff, 0.0, 1.0))

            recs_easy.append({
                "trail_id": trail_id,
                "trail_name": trail_name,
                "province": province,
                "r_tu": round(r_tu_easy, 4),
                "cb_score": round(float(cb_easy[idx]), 4),
                "cf_score": round(float(cf_easy[idx]), 4),
                "reason": f"Easy Anchor Profile match (low uncertainty: {r_tu_easy:.4f})"
            })

            recs_diff.append({
                "trail_id": trail_id,
                "trail_name": trail_name,
                "province": province,
                "r_tu": round(r_tu_diff, 4),
                "cb_score": round(float(cb_diff[idx]), 4),
                "cf_score": round(float(cf_diff[idx]), 4),
                "reason": f"Difficult Anchor Profile match (low uncertainty: {r_tu_diff:.4f})"
            })

        recs_easy.sort(key=lambda x: x['r_tu'])
        recs_diff.sort(key=lambda x: x['r_tu'])

        return {
            "user_id": user_id,
            "config_used": current_config,
            "alpha_tuner": round(alpha, 4),
            "active_users": active_user_count,
            "easy_anchor_recommendations": recs_easy[:top_k],
            "difficult_anchor_recommendations": recs_diff[:top_k],
            "optimization_stats": opt_stats
        }
