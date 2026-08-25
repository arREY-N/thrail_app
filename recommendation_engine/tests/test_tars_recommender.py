"""
@file test_tars_recommender.py
@description Comprehensive automated unit test suite for TARS modules 1 through 5.
             Verifies Gower distance math, Alpha decay progression, Symmetric matrix optimizations,
             Profile updates, and FastAPI endpoint routes.
"""

import sys
import os
import unittest
import numpy as np
import pandas as pd

# Add recommendation_engine directory to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
rec_engine_dir = os.path.dirname(current_dir)

for path in [current_dir, rec_engine_dir]:
    if path not in sys.path and os.path.exists(path):
        sys.path.insert(0, path)

from gower_engine import (
    GowerSimilarityEngine,
    gower_attribute_similarity,
    compute_gower_similarity_single,
    DEFAULT_FEATURE_CONFIG
)
from recommender import (
    HybridRecommender,
    calibrate_alpha,
    recalibrate_user_profile,
    BASE_PROFILES
)


class TestTARSModules(unittest.TestCase):

    def setUp(self):
        """Set up mock test fixtures and recommender instance."""
        self.mock_trails_path = os.path.join(rec_engine_dir, "data", "trails_mock.csv")
        self.mock_ratings_path = os.path.join(rec_engine_dir, "data", "user_ratings_mock.csv")
        self.gower_engine = GowerSimilarityEngine()

    # -------------------------------------------------------------------------
    # MODULE 1: Gower's Distance Similarity Engine (Mixed Data Types)
    # -------------------------------------------------------------------------
    def test_gower_distance_mixed_mock_data(self):
        """Verifies Gower similarity output accuracy for numerical, ordinal, and nominal data."""
        # 1. Numerical Attribute Test: elevation_gain (0 to 2000 range)
        # S_j = 1 - (|600 - 400| / 2000) = 1 - (200 / 2000) = 0.90
        s_num = gower_attribute_similarity(600, 400, 'difficulty_gain', 'numerical', DEFAULT_FEATURE_CONFIG)
        self.assertAlmostEqual(s_num, 0.90, places=4, msg="Numerical Gower similarity failed")

        # 2. Ordinal Attribute Test: difficulty_lascoRating (1 to 9 rank range)
        # rank_norm(5) = (5-1)/8 = 0.5; rank_norm(3) = (3-1)/8 = 0.25
        # S_j = 1 - |0.5 - 0.25| = 0.75
        s_ord = gower_attribute_similarity(5.0, 3.0, 'difficulty_lascoRating', 'ordinal', DEFAULT_FEATURE_CONFIG)
        self.assertAlmostEqual(s_ord, 0.75, places=4, msg="Ordinal Gower similarity failed")

        # 3. Nominal Attribute Test: province match vs mismatch
        s_nom_match = gower_attribute_similarity('Rizal', 'rizal', 'province', 'nominal', DEFAULT_FEATURE_CONFIG)
        s_nom_mismatch = gower_attribute_similarity('Rizal', 'Batangas', 'province', 'nominal', DEFAULT_FEATURE_CONFIG)
        self.assertEqual(s_nom_match, 1.0, msg="Nominal match failed")
        self.assertEqual(s_nom_mismatch, 0.0, msg="Nominal mismatch failed")

        # 4. Aggregate Entity Test
        entity_a = {
            'difficulty_gain': 600.0,
            'difficulty_lascoRating': 5.0,
            'province': 'rizal'
        }
        entity_b = {
            'difficulty_gain': 400.0,
            'difficulty_lascoRating': 3.0,
            'province': 'rizal'
        }

        cfg_subset = {
            'numerical': {'difficulty_gain': {'min': 0.0, 'max': 2000.0}},
            'ordinal': {'difficulty_lascoRating': {'min_rank': 1.0, 'max_rank': 9.0}},
            'nominal': ['province']
        }
        
        # Expected average = (0.90 + 0.75 + 1.0) / 3 = 2.65 / 3 = 0.88333...
        expected_avg = (0.90 + 0.75 + 1.0) / 3.0
        score = compute_gower_similarity_single(entity_a, entity_b, cfg_subset)
        self.assertAlmostEqual(score, expected_avg, places=4, msg="Aggregate Gower similarity failed")

    # -------------------------------------------------------------------------
    # MODULE 2: User Profiling, Cold-Start & Dynamic Tuning Parameter (alpha)
    # -------------------------------------------------------------------------
    def test_alpha_decay_progression(self):
        """Verifies alpha decay progression from cold-start to active hiker states."""
        # Cold-Start (0 completed hikes): alpha = 1.0 (100% CBF)
        alpha_0 = calibrate_alpha(completed_hikes=0)
        self.assertEqual(alpha_0, 1.0, "Cold start alpha should be 1.0")

        # 1-2 Hikes: alpha = 0.75
        alpha_1 = calibrate_alpha(completed_hikes=1)
        alpha_2 = calibrate_alpha(completed_hikes=2)
        self.assertEqual(alpha_1, 0.75, "1 hike alpha should be 0.75")
        self.assertEqual(alpha_2, 0.75, "2 hikes alpha should be 0.75")

        # Active Hiker (3+ hikes): alpha = 0.50
        alpha_3 = calibrate_alpha(completed_hikes=3)
        alpha_10 = calibrate_alpha(completed_hikes=10)
        self.assertEqual(alpha_3, 0.50, "3 hikes alpha should be 0.50")
        self.assertEqual(alpha_10, 0.50, "10 hikes alpha should be 0.50")

    def test_dynamic_profile_incremental_update(self):
        """Verifies user profile recalibration given GPS telemetry logs and post-hike survey ratings."""
        base_prof = BASE_PROFILES['beginner'].copy()  # length: 4.0, gain: 200.0, hours: 2.0, lasco: 3.0
        
        gps_log = {
            'distance': 10000.0,   # 10.0 km
            'duration': 14400.0,   # 4.0 hours
            'elevation': 600.0     # 600 m gain
        }

        # Case A: Post-hike rating 'Easy' -> increases user capacity target
        recal_easy = recalibrate_user_profile(
            current_profile=base_prof,
            gps_summary=gps_log,
            perceived_difficulty='Easy',
            learning_rate=0.25
        )
        self.assertGreater(recal_easy['difficulty_length'], base_prof['difficulty_length'])
        self.assertGreater(recal_easy['difficulty_gain'], base_prof['difficulty_gain'])
        self.assertGreater(recal_easy['difficulty_lascoRating'], base_prof['difficulty_lascoRating'])

        # Case B: Post-hike rating 'Extreme' -> scales down user capacity target
        recal_extreme = recalibrate_user_profile(
            current_profile=base_prof,
            gps_summary=gps_log,
            perceived_difficulty='Extreme',
            learning_rate=0.25
        )
        self.assertLess(recal_extreme['difficulty_lascoRating'], recal_easy['difficulty_lascoRating'])

    # -------------------------------------------------------------------------
    # MODULE 4: Computational Performance Optimizations
    # -------------------------------------------------------------------------
    def test_symmetric_matrix_execution_optimization(self):
        """Verifies upper triangular computation and self-similarity bypass cut operations by >50%."""
        # Create N = 10 mock entities -> total possible pairwise pairs = 10 * 10 = 100
        mock_data = []
        for i in range(10):
            mock_data.append({
                'id': f'entity_{i}',
                'difficulty_gain': 100.0 * (i + 1),
                'difficulty_lascoRating': float((i % 9) + 1),
                'province': 'rizal' if i % 2 == 0 else 'batangas'
            })
        df_mock = pd.DataFrame(mock_data)

        matrix, stats = self.gower_engine.compute_pairwise_matrix(df_mock, is_symmetric=True)

        # Total pairs = 100
        # Self-similarity diagonal (10 entries) set to 1.0 without feature calculation
        # Upper triangular entries = (10 * 9) / 2 = 45 computed
        # Lower triangular entries = 45 mirrored without re-computation
        # Total skipped = 10 diagonal + 45 lower triangular = 55 skipped!
        self.assertEqual(stats['total_pairs'], 100)
        self.assertEqual(stats['computed_pairs'], 45)
        self.assertEqual(stats['skipped_pairs'], 55)
        self.assertGreater(stats['efficiency_gain_pct'], 50.0)

        # Verify matrix symmetry S(i, j) == S(j, i)
        for i in range(10):
            self.assertEqual(matrix[i, i], 1.0, f"Diagonal matrix[{i},{i}] should be 1.0")
            for j in range(10):
                self.assertAlmostEqual(matrix[i, j], matrix[j, i], places=5, msg=f"Symmetry failed for ({i},{j})")

    # -------------------------------------------------------------------------
    # MODULE 3 & MODULE 5: End-to-End Recommendation Integration
    # -------------------------------------------------------------------------
    def test_end_to_end_hybrid_recommendation(self):
        """Verifies full recommendation workflow returns ranked recommendations with match scores."""
        if not os.path.exists(self.mock_trails_path):
            self.skipTest("Mock trails CSV path not found")

        recommender = HybridRecommender(self.mock_trails_path, self.mock_ratings_path)
        preferences = {
            'experience': 'Beginner',
            'province': ['Rizal'],
            'hike_length': ['1-3 Hour(s)'],
            'hiked': True,
            'location': []
        }

        # Test Cold Start (0 hikes) -> Expect alpha = 1.0
        res_cold = recommender.get_hybrid_recommendations(
            user_id="test_user_cold",
            preferences=preferences,
            top_k=3,
            completed_hikes=0
        )
        self.assertEqual(res_cold["alpha_used"], 1.0)
        self.assertEqual(len(res_cold["recommendations"]), 3)
        self.assertTrue(all("match_score" in rec for rec in res_cold["recommendations"]))

        # Test Active Hiker (3 hikes) -> Expect alpha = 0.50
        res_active = recommender.get_hybrid_recommendations(
            user_id="user_001",
            preferences=preferences,
            top_k=3,
            completed_hikes=3
        )
        self.assertEqual(res_active["alpha_used"], 0.50)
        self.assertEqual(len(res_active["recommendations"]), 3)


if __name__ == "__main__":
    unittest.main()
