"""
@file test_tars_recommender.py
@description Automated test suite for TARS 2.0 specs:
             1. 23 Benchmark Configurations (7 CB, 7 CF, 7 Hybrid, 2 Anchors)
             2. Strategy Pattern Distance Engines (Gower, Euclidean, Cosine, Ensemble)
             3. 17-Feature Vector Mapping
             4. Two-Anchor Profiles (Easy P_e and Difficult P_d)
             5. Alpha-Tuner Parameter alpha(u, m)
             6. Profile Update Function with Beta Corrector Factor (BCF) matrix.
"""

import sys
import os
import unittest
import numpy as np
import pandas as pd

# Add recommendation_engine root directory to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
rec_engine_dir = os.path.dirname(current_dir)
if rec_engine_dir not in sys.path:
    sys.path.insert(0, rec_engine_dir)

from core.distance_strategies import (
    DistanceStrategy,
    GowerDistanceStrategy,
    EuclideanDistanceStrategy,
    CosineDistanceStrategy,
    EnsembleDistanceStrategy,
    EngineRegistry
)
from core.profile_manager import (
    build_17_feature_vector,
    build_18_feature_vector,
    TwoAnchorProfileManager,
    NUM_FEATURES
)
from core.recommender import (
    HybridRecommender,
    calculate_alpha_tuner
)


class TestTARS20Specs(unittest.TestCase):

    def setUp(self):
        self.mock_trails_path = os.path.join(rec_engine_dir, "data", "trails_mock.csv")
        self.mock_ratings_path = os.path.join(rec_engine_dir, "data", "user_ratings_mock.csv")

    def test_17_feature_vector_mapping(self):
        sample_trail = {
            "province": "Rizal",
            "location": ["Mt. Daraitan"],
            "difficulty_lascoRating": 4.5,
            "difficulty_hours": 6.0,
            "difficulty_length": 15.0,
            "difficulty_gain": 1000.0,
            "tourism_1": True,
            "tourism_3": True
        }
        vec = build_17_feature_vector(sample_trail)
        self.assertEqual(len(vec), 17)
        self.assertTrue(np.all(vec >= 0.0) and np.all(vec <= 1.0))
        self.assertEqual(vec[3], 1.0)
        self.assertAlmostEqual(vec[10], 0.5, places=2)
        self.assertEqual(vec[12], 1.0)

    def test_strict_null_length_gain_validation(self):
        # Trail with missing/null length or gain should raise ValueError
        invalid_trail_1 = {"name": "Mt. Invalid", "difficulty_length": None, "difficulty_gain": 500}
        invalid_trail_2 = {"name": "Mt. Invalid", "difficulty_length": 10.0, "difficulty_gain": None}
        
        with self.assertRaises(ValueError):
            build_17_feature_vector(invalid_trail_1)
        with self.assertRaises(ValueError):
            build_17_feature_vector(invalid_trail_2)

    def test_two_anchor_profiles_pe_pd(self):
        preferences = {
            "experience": "Beginner",
            "province": ["Batangas"],
            "difficulty_hours": 3.0
        }
        p_e, p_d = TwoAnchorProfileManager.create_anchor_profiles(preferences)
        self.assertEqual(len(p_e), 17)
        self.assertEqual(len(p_d), 17)
        self.assertGreater(p_d[10], p_e[10])
        self.assertGreater(p_d[11], p_e[11])

    def test_alpha_tuner_parameter_formula(self):
        m = 50
        self.assertEqual(calculate_alpha_tuner(0, m), 1.0)
        self.assertEqual(calculate_alpha_tuner(50, m), 0.50)
        self.assertEqual(calculate_alpha_tuner(100, m), 0.50)

    def test_beta_corrector_factor_matrix(self):
        r_tu = 0.4
        beta_matched = TwoAnchorProfileManager.compute_beta_corrector(r_tu, is_matched=True)
        beta_mismatched = TwoAnchorProfileManager.compute_beta_corrector(r_tu, is_matched=False)

        self.assertAlmostEqual(beta_matched, 0.20, places=4)
        self.assertAlmostEqual(beta_mismatched, -0.30, places=4)

    def test_profile_update_function(self):
        p_old = np.zeros(17, dtype=np.float32)
        hiked_trail = np.ones(17, dtype=np.float32)
        r_tu = 0.4
        
        p_updated = TwoAnchorProfileManager.update_profile(
            p_old=p_old,
            hiked_trails_vectors=[hiked_trail],
            r_tu_scores=[r_tu],
            actual_difficulties=["easy"],
            anchor_type="easy"
        )
        self.assertGreater(p_updated[0], p_old[0])

    def test_all_23_benchmark_configurations(self):
        recommender = HybridRecommender(self.mock_trails_path, self.mock_ratings_path)
        configs = EngineRegistry.get_all_config_names()
        self.assertEqual(len(configs), 23, "Should contain exactly 23 benchmark configurations")

        test_prefs = {"experience": "Beginner", "province": ["Rizal"]}

        for config_name in configs:
            res = recommender.get_hybrid_recommendations(
                user_id="user_test",
                preferences=test_prefs,
                top_k=2,
                active_user_count=15,
                config_override=config_name
            )
            self.assertEqual(res["config_used"], config_name)
            self.assertEqual(len(res["easy_anchor_recommendations"]), 2)
            self.assertEqual(len(res["difficult_anchor_recommendations"]), 2)

    def test_feature_weighting_toggle_modes(self):
        recommender = HybridRecommender(self.mock_trails_path, self.mock_ratings_path)
        test_prefs = {"experience": "Beginner", "province": ["Rizal"]}

        res_uniform = recommender.get_hybrid_recommendations(
            user_id="user_test",
            preferences=test_prefs,
            top_k=5,
            weight_mode="uniform"
        )
        res_weighted = recommender.get_hybrid_recommendations(
            user_id="user_test",
            preferences=test_prefs,
            top_k=5,
            weight_mode="group_balanced"
        )

        self.assertEqual(len(res_uniform["easy_anchor_recommendations"]), 5)
        self.assertEqual(len(res_weighted["easy_anchor_recommendations"]), 5)
        # Verify that group balanced weights produce valid recommendation scores
        for rec in res_weighted["easy_anchor_recommendations"]:
            self.assertTrue(0.0 <= rec["r_tu"] <= 1.0)


if __name__ == "__main__":
    unittest.main()
