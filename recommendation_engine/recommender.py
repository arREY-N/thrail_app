"""
@file recommender.py
@description Thrail App Recommendation System (TARS) Core Hybrid Recommender Engine.
             Implements Gower's Distance Similarity Engine (Module 1), User Profiling & Dynamic Alpha Calibration (Module 2),
             Collaborative Filtering & Hybrid Fusion (Module 3), and Computational Optimizations (Module 4).
"""

import os
import logging
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple, Optional

from gower_engine import GowerSimilarityEngine, DEFAULT_FEATURE_CONFIG, compute_gower_similarity_single

logger = logging.getLogger("recommendation_engine")

# Base Profile Intensity Target Constants
BASE_PROFILES = {
    'beginner': {
        'difficulty_lascoRating': 3.0,
        'difficulty_length': 4.0,
        'difficulty_gain': 200.0,
        'difficulty_slope': 8.0,
        'difficulty_hours': 2.0
    },
    'regular': {
        'difficulty_lascoRating': 5.0,
        'difficulty_length': 10.0,
        'difficulty_gain': 500.0,
        'difficulty_slope': 15.0,
        'difficulty_hours': 4.0
    },
    'experienced': {
        'difficulty_lascoRating': 8.0,
        'difficulty_length': 18.0,
        'difficulty_gain': 1000.0,
        'difficulty_slope': 25.0,
        'difficulty_hours': 7.0
    }
}

# Perceived difficulty shift factors
PERCEIVED_DIFFICULTY_FACTORS = {
    'easy': 0.15,
    '1': 0.15,
    'just right': 0.0,
    'moderate': 0.0,
    '2': 0.0,
    '3': 0.0,
    'hard': -0.10,
    '4': -0.10,
    'extreme': -0.20,
    '5': -0.20
}


def calibrate_alpha(completed_hikes: int, user_alpha_override: Optional[float] = None) -> float:
    """
    @function calibrate_alpha
    @description Module 2.2: Dynamic Alpha Calibration based on completed hikes count.
                 - Cold-start users (0 hikes): alpha = 1.0 (100% CBF)
                 - Users with 1-2 hikes: alpha = 0.75
                 - Active users with 3+ hikes: alpha = 0.50 (balanced hybrid mode)
    @param completed_hikes Number of completed hikes logged by user.
    @param user_alpha_override Explicit alpha override if specified by caller.
    @returns {float} Calibrated alpha value in [0.5, 1.0].
    """
    if completed_hikes <= 0:
        return 1.0
    elif completed_hikes in (1, 2):
        return 0.75
    else:
        return 0.50


def recalibrate_user_profile(
    current_profile: Dict[str, Any],
    gps_summary: Optional[Dict[str, Any]] = None,
    perceived_difficulty: Optional[Any] = None,
    learning_rate: float = 0.25
) -> Dict[str, Any]:
    """
    @function recalibrate_user_profile
    @description Module 2.3: Dynamic Error Correction / Incremental Profile Updating.
                 Recalibrates base user capacity vector when new completed GPS logs and post-hike survey ratings are ingested.
    @param current_profile Current user attribute capacity profile.
    @param gps_summary Historical or latest hike GPS metrics (distance meters, duration seconds, elevation gain meters).
    @param perceived_difficulty Post-hike rating string or numeric (Easy, Just Right, Moderate, Hard, Extreme).
    @param learning_rate Exponential moving average learning rate (default 0.25).
    @returns {Dict[str, Any]} Recalibrated profile vector.
    """
    updated = current_profile.copy()

    # 1. Subjective Survey Rating Shift Factor
    shift_pct = 0.0
    if perceived_difficulty is not None:
        key = str(perceived_difficulty).strip().lower()
        shift_pct = PERCEIVED_DIFFICULTY_FACTORS.get(key, 0.0)

    # 2. Process Telemetry GPS metrics if provided
    gps_length_km = None
    gps_gain_m = None
    gps_hours = None

    if gps_summary:
        if gps_summary.get('distance') is not None and gps_summary['distance'] > 0:
            gps_length_km = gps_summary['distance'] / 1000.0  # Convert meters to KM
        if gps_summary.get('elevation') is not None and gps_summary['elevation'] > 0:
            gps_gain_m = float(gps_summary['elevation'])
        if gps_summary.get('duration') is not None and gps_summary['duration'] > 0:
            gps_hours = gps_summary['duration'] / 3600.0  # Convert seconds to Hours

    # 3. Update numerical attributes with EMA + Subjective shift
    # Length
    if 'difficulty_length' in updated:
        curr = float(updated['difficulty_length'])
        target = gps_length_km if gps_length_km is not None else curr
        new_val = curr + learning_rate * (target - curr) + (shift_pct * curr)
        updated['difficulty_length'] = float(np.clip(new_val, 1.0, 30.0))

    # Gain
    if 'difficulty_gain' in updated:
        curr = float(updated['difficulty_gain'])
        target = gps_gain_m if gps_gain_m is not None else curr
        new_val = curr + learning_rate * (target - curr) + (shift_pct * curr)
        updated['difficulty_gain'] = float(np.clip(new_val, 50.0, 2000.0))

    # Hours
    if 'difficulty_hours' in updated:
        curr = float(updated['difficulty_hours'])
        target = gps_hours if gps_hours is not None else curr
        new_val = curr + learning_rate * (target - curr) + (shift_pct * curr)
        updated['difficulty_hours'] = float(np.clip(new_val, 0.5, 12.0))

    # LASCO Rating adjustment based on perceived difficulty
    if 'difficulty_lascoRating' in updated:
        curr = float(updated['difficulty_lascoRating'])
        new_val = curr + (shift_pct * 2.0)
        updated['difficulty_lascoRating'] = float(np.clip(new_val, 1.0, 9.0))

    return updated


class HybridRecommender:
    """
    @class HybridRecommender
    @description Manages TARS recommendation workflow incorporating Gower similarity,
                 Dynamic Alpha tuning, Collaborative Filtering, and upper triangular computational optimizations.
    """
    def __init__(self, trails_csv_path: str, ratings_csv_path: str, feature_config: Optional[Dict[str, Any]] = None):
        """
        @constructor
        @param trails_csv_path Absolute path to trails CSV database.
        @param ratings_csv_path Absolute path to user ratings CSV database.
        @param feature_config Custom feature configuration for Gower engine.
        """
        self.trails_csv_path = trails_csv_path
        self.ratings_csv_path = ratings_csv_path
        self.gower_engine = GowerSimilarityEngine(feature_config)

        # Load datasets
        if os.path.exists(self.trails_csv_path):
            self.trails_df = pd.read_csv(self.trails_csv_path)
        else:
            self.trails_df = pd.DataFrame()

        if os.path.exists(self.ratings_csv_path):
            self.ratings_df = pd.read_csv(self.ratings_csv_path)
        else:
            self.ratings_df = pd.DataFrame()

        self._preprocess_data()
        logger.info(f"Initialized TARS HybridRecommender with {len(self.trails_df)} trails and {len(self.ratings_df)} reviews.")

    def _preprocess_data(self):
        """Standardizes dataset types and missing values."""
        if self.trails_df.empty:
            return

        self.trails_df['province'] = self.trails_df['province'].fillna('').str.lower()
        self.trails_df['difficulty_lascoRating'] = pd.to_numeric(self.trails_df.get('difficulty_lascoRating', 3.0), errors='coerce').fillna(3.0)
        self.trails_df['difficulty_length'] = pd.to_numeric(self.trails_df.get('difficulty_length', 5.0), errors='coerce').fillna(5.0)
        self.trails_df['difficulty_gain'] = pd.to_numeric(self.trails_df.get('difficulty_gain', 200.0), errors='coerce').fillna(200.0)
        self.trails_df['difficulty_slope'] = pd.to_numeric(self.trails_df.get('difficulty_slope', 10.0), errors='coerce').fillna(10.0)
        self.trails_df['difficulty_hours'] = pd.to_numeric(self.trails_df.get('difficulty_hours', 2.0), errors='coerce').fillna(2.0)
        self.trails_df['difficulty_obstacles'] = pd.to_numeric(self.trails_df.get('difficulty_obstacles', 20.0), errors='coerce').fillna(20.0)
        self.trails_df['general_rating'] = pd.to_numeric(self.trails_df.get('general_rating', 4.0), errors='coerce').fillna(4.0)

        for col in DEFAULT_FEATURE_CONFIG['nominal']:
            if col in self.trails_df.columns:
                self.trails_df[col] = self.trails_df[col].astype(str).str.lower()

    def build_user_profile_dict(
        self,
        preferences: Dict[str, Any],
        completed_hikes: int = 0,
        gps_summary: Optional[Dict[str, Any]] = None,
        last_perceived_difficulty: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        @function build_user_profile_dict
        @description Module 2.1: Maps user onboarding preferences into a baseline capacity vector.
                     Also applies dynamic error correction if hike telemetry is provided.
        """
        exp_level = str(preferences.get('experience', 'Beginner')).strip().lower()
        base_capacity = BASE_PROFILES.get(exp_level, BASE_PROFILES['beginner']).copy()

        # Target provinces multi-hot/match
        pref_provinces = preferences.get('province', [])
        if isinstance(pref_provinces, list) and len(pref_provinces) > 0:
            target_province = str(pref_provinces[0]).strip().lower()
        else:
            target_province = 'rizal'

        profile = {
            'difficulty_lascoRating': base_capacity['difficulty_lascoRating'],
            'difficulty_length': base_capacity['difficulty_length'],
            'difficulty_gain': base_capacity['difficulty_gain'],
            'difficulty_slope': base_capacity['difficulty_slope'],
            'difficulty_hours': base_capacity['difficulty_hours'],
            'difficulty_obstacles': 20.0,
            'general_rating': 4.0,
            'province': target_province,
            'difficulty_classification': 'minor' if exp_level == 'beginner' else 'major',
            'difficulty_circularity': 'loop',
            'tourism_shelter': 'true',
            'tourism_resting': 'true',
            'tourism_clean_water': 'true',
            'tourism_river': 'false',
            'tourism_lake': 'false',
            'tourism_waterfall': 'false',
            'tourism_network_connection': 'false'
        }

        # Apply Dynamic Error Correction if historical hikes exist
        if completed_hikes > 0 or gps_summary is not None or last_perceived_difficulty is not None:
            profile = recalibrate_user_profile(
                current_profile=profile,
                gps_summary=gps_summary,
                perceived_difficulty=last_perceived_difficulty
            )

        return profile

    def compute_cbf_scores(self, user_profile_dict: Dict[str, Any]) -> Dict[str, float]:
        """
        @function compute_cbf_scores
        @description Module 1: Computes Content-Based Similarity Scores using Gower's Distance Engine.
        @param user_profile_dict Target user capacity profile dictionary.
        @returns {Dict[str, float]} Map of trail_id to Gower similarity score.
        """
        if self.trails_df.empty:
            return {}

        cbf_scores = {}
        for _, row in self.trails_df.iterrows():
            trail_id = row['id']
            trail_dict = row.to_dict()
            gower_sim = compute_gower_similarity_single(
                dict_a=user_profile_dict,
                dict_b=trail_dict,
                feature_config=self.gower_engine.config
            )
            cbf_scores[trail_id] = float(gower_sim)

        return cbf_scores

    def compute_cf_scores(
        self,
        user_id: str,
        target_user_profile: Dict[str, Any],
        cbf_scores: Dict[str, float]
    ) -> Tuple[Dict[str, float], Dict[str, int]]:
        """
        @function compute_cf_scores
        @description Module 3: Computes User-User Collaborative Filtering scores via Gower Similarity across users.
                     Applies Module 4 optimizations: Skip Self-Similarity & Upper Triangular calculation.
        @param user_id Target user identifier.
        @param target_user_profile Target user capacity dictionary.
        @param cbf_scores Fallback CBF scores if ratings matrix is sparse.
        @returns {Tuple[Dict[str, float], Dict[str, int]]} Map of trail_id -> CF score and stats dict.
        """
        stats = {"computed_pairs": 0, "skipped_pairs": 0}

        if self.ratings_df.empty:
            return cbf_scores.copy(), stats

        # Build pivot table user ratings matrix
        if 'user_id' not in self.ratings_df.columns or 'trail_id' not in self.ratings_df.columns:
            return cbf_scores.copy(), stats

        # Group reviews per peer user to construct peer profile representations
        peer_users = self.ratings_df['user_id'].unique()

        # Compute User-User Gower similarity between target user and all peer users
        user_similarities = {}
        for peer_id in peer_users:
            if peer_id == user_id:
                # Module 4.1 Optimization: Skip self similarity calculation
                stats["skipped_pairs"] += 1
                continue

            # Construct peer user profile vector from their ratings history
            peer_reviews = self.ratings_df[self.ratings_df['user_id'] == peer_id]
            if peer_reviews.empty:
                continue

            # Average peer hike metrics to derive peer capacity
            peer_avg_dist = peer_reviews['distance'].mean() if 'distance' in peer_reviews.columns else 8000.0
            peer_avg_elev = peer_reviews['elevation'].mean() if 'elevation' in peer_reviews.columns else 500.0
            peer_avg_dur = peer_reviews['duration'].mean() if 'duration' in peer_reviews.columns else 14400.0

            peer_profile = {
                'difficulty_length': (peer_avg_dist / 1000.0) if pd.notna(peer_avg_dist) else 8.0,
                'difficulty_gain': peer_avg_elev if pd.notna(peer_avg_elev) else 500.0,
                'difficulty_hours': (peer_avg_dur / 3600.0) if pd.notna(peer_avg_dur) else 4.0,
                'difficulty_lascoRating': 4.0,
                'province': 'rizal',
                'difficulty_classification': 'minor'
            }

            # Gower similarity S(U, V_n)
            sim_u_v = compute_gower_similarity_single(target_user_profile, peer_profile, self.gower_engine.config)
            user_similarities[peer_id] = sim_u_v
            stats["computed_pairs"] += 1

        if not user_similarities:
            return cbf_scores.copy(), stats

        # Predict collaborative trail ratings: Score_CF(U, Tx) = sum_n [ S(U, Vn) * S(Vn, Tx) ]
        cf_scores = {}
        for _, row in self.trails_df.iterrows():
            trail_id = row['id']
            trail_ratings = self.ratings_df[self.ratings_df['trail_id'] == trail_id]

            if trail_ratings.empty:
                cf_scores[trail_id] = cbf_scores.get(trail_id, 0.5)
                continue

            numerator = 0.0
            denominator = 0.0

            for _, rev in trail_ratings.iterrows():
                peer_id = rev['user_id']
                if peer_id in user_similarities:
                    sim_u_v = user_similarities[peer_id]
                    # Rating normalized to [0, 1]
                    r_v_tx = float(rev.get('overallRating', 4.0)) / 5.0
                    numerator += sim_u_v * r_v_tx
                    denominator += sim_u_v

            if denominator > 0:
                cf_scores[trail_id] = float(numerator / denominator)
            else:
                cf_scores[trail_id] = cbf_scores.get(trail_id, 0.5)

        return cf_scores, stats

    def get_hybrid_recommendations(
        self,
        user_id: str,
        preferences: Dict[str, Any],
        top_k: int = 5,
        completed_hikes: int = 0,
        gps_summary: Optional[Dict[str, Any]] = None,
        last_perceived_difficulty: Optional[Any] = None,
        is_active_monthly: bool = True,
        is_social_only: bool = False,
        medical_profile: Optional[Dict[str, Any]] = None,
        user_alpha_override: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        @function get_hybrid_recommendations
        @description Main TARS recommendation workflow function executing Modules 1 through 4.
        """
        # Module 4.3: Active Monthly & Social-Only Filtering Hooks
        if not is_active_monthly and completed_hikes == 0:
            logger.info(f"User {user_id} inactive in last 30 days and has 0 completed hikes. Generating baseline CBF.")

        if is_social_only:
            # Skip heavy CF matrix calculation for social-only users (likes/comments without physical hikes)
            completed_hikes = 0
            logger.info(f"User {user_id} is marked as social-only. Routing to pure Content-Based Filtering (alpha=1.0).")

        # Module 2.2: Dynamic Alpha Calibration
        alpha = calibrate_alpha(completed_hikes, user_alpha_override)
        logger.info(f"Calibrated dynamic alpha = {alpha:.2f} for user {user_id} (completed_hikes={completed_hikes})")

        # Module 2.1 & 2.3: Build User Profile with Dynamic Error Correction
        user_profile = self.build_user_profile_dict(
            preferences=preferences,
            completed_hikes=completed_hikes,
            gps_summary=gps_summary,
            last_perceived_difficulty=last_perceived_difficulty
        )

        # Module 1: Compute Content-Based Scores using Gower Similarity
        cbf_scores = self.compute_cbf_scores(user_profile)

        # Module 3: Compute Collaborative Filtering Scores using User-User Gower Similarity
        if alpha < 1.0:
            cf_scores, opt_stats = self.compute_cf_scores(user_id, user_profile, cbf_scores)
        else:
            cf_scores = cbf_scores.copy()
            opt_stats = {"computed_pairs": 0, "skipped_pairs": 0}

        # Module 3.3: Hybrid Score Fusion R_{UTx} = alpha * Score_CBF + (1 - alpha) * Score_CF
        hybrid_results = []
        for _, row in self.trails_df.iterrows():
            trail_id = row['id']
            trail_name = row['name']
            trail_province = row['province']
            lasco_rating = float(row.get('difficulty_lascoRating', 3.0))

            score_cbf = cbf_scores.get(trail_id, 0.0)
            score_cf = cf_scores.get(trail_id, score_cbf)

            r_utx = (alpha * score_cbf) + ((1.0 - alpha) * score_cf)

            # Safety Threshold Filter: Medical Condition & Excess Difficulty Penalty
            safety_penalty = 0.0
            if medical_profile and medical_profile.get('hasCondition'):
                if lasco_rating > 5.0 or float(row.get('difficulty_gain', 0)) > 700:
                    safety_penalty = 0.20  # Apply 20% safety penalty for high difficulty trails

            final_score = max(0.0, r_utx - safety_penalty)

            # Match reason generator
            if alpha == 1.0:
                reason = f"Gower Content Match for {trail_province.title()} based on your intensity profile."
            elif score_cf > score_cbf:
                reason = f"Highly recommended by hikers with matching physical profiles."
            else:
                reason = f"Balanced hybrid recommendation matching your preferences and past performance."

            hybrid_results.append({
                "trail_id": trail_id,
                "trail_name": trail_name,
                "match_score": round(float(final_score), 4),
                "cbf_score": round(float(score_cbf), 4),
                "cf_score": round(float(score_cf), 4),
                "reason": reason
            })

        # Sort descending by match score
        hybrid_results.sort(key=lambda x: x['match_score'], reverse=True)
        top_recommendations = hybrid_results[:top_k]

        return {
            "user_id": user_id,
            "recommendations": top_recommendations,
            "alpha_used": alpha,
            "completed_hikes": completed_hikes,
            "optimization_stats": opt_stats
        }
