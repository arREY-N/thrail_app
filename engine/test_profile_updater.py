"""
Unit tests for THARESYS Adaptive Profile Update Engine (engine/formula/profile_updater.py)
"""

import unittest
import numpy as np
from formula import (
    compute_beta,
    update_profile_vector,
    enforce_anchor_monotonicity
)


class TestProfileUpdater(unittest.TestCase):

    def test_compute_beta_match(self):
        # Match with high distance (0.80): large positive step
        self.assertAlmostEqual(compute_beta(0.80, True), 0.40)
        # Match with low distance (0.10): subtle positive step
        self.assertAlmostEqual(compute_beta(0.10, True), 0.05)
        # Boundary 0.0 and 1.0
        self.assertAlmostEqual(compute_beta(0.0, True), 0.0)
        self.assertAlmostEqual(compute_beta(1.0, True), 0.5)

    def test_compute_beta_mismatch(self):
        # Mismatch when predicted close (0.10): large negative step
        self.assertAlmostEqual(compute_beta(0.10, False), -0.45)
        # Mismatch when predicted distant (0.90): minor negative step
        self.assertAlmostEqual(compute_beta(0.90, False), -0.05)
        # Boundary 0.0 and 1.0
        self.assertAlmostEqual(compute_beta(0.0, False), -0.5)
        self.assertAlmostEqual(compute_beta(1.0, False), 0.0)

    def test_walkthrough_numerical_example(self):
        """
        Validates the exact 2D numerical scenario from profile_update_engine_documentation.md
        with distinct per-hike factor weights applied BEFORE averaging:
            Profile = [0.10, 0.20]
            Trail 1 = [0.30, 0.35], R_tu = 0.40, Match = True, W1 = [0.50, 1.00]
            Trail 2 = [0.50, 0.20], R_tu = 0.20, Match = False, W2 = [1.00, 0.20]
            Expected: [0.0300, 0.2150]
        """
        profile = np.array([0.10, 0.20], dtype=np.float32)
        trails = np.array([
            [0.30, 0.35],
            [0.50, 0.20]
        ], dtype=np.float32)
        scores = np.array([0.40, 0.20], dtype=np.float32)
        matches = np.array([True, False], dtype=bool)
        # Distinct per-hike weights matrix (shape 2 x 2)
        weights = np.array([
            [0.50, 1.00],
            [1.00, 0.20]
        ], dtype=np.float32)

        new_profile = update_profile_vector(profile, trails, scores, matches, weights)

        self.assertAlmostEqual(float(new_profile[0]), 0.0300, places=4)
        self.assertAlmostEqual(float(new_profile[1]), 0.2150, places=4)

    def test_broadcast_1d_weights(self):
        """
        Validates that a 1D weight vector broadcasts to all hikes equivalently.
        """
        profile = np.array([0.10, 0.20], dtype=np.float32)
        trails = np.array([
            [0.30, 0.35],
            [0.50, 0.20]
        ], dtype=np.float32)
        scores = np.array([0.40, 0.20], dtype=np.float32)
        matches = np.array([True, False], dtype=bool)
        weights = np.array([1.00, 0.50], dtype=np.float32)

        new_profile = update_profile_vector(profile, trails, scores, matches, weights)

        self.assertAlmostEqual(float(new_profile[0]), 0.0400, places=4)
        self.assertAlmostEqual(float(new_profile[1]), 0.2075, places=4)

    def test_boundary_clamping(self):
        # Test extreme overflow and underflow
        profile = np.array([0.05, 0.95], dtype=np.float32)
        trails = np.array([
            [1.0, 0.0]
        ], dtype=np.float32)
        scores = np.array([0.0], dtype=np.float32)
        # Underflow attempt: Mismatch with R_tu = 0.0 gives beta = -0.5
        # diff = [1.0 - 0.05, 0.0 - 0.95] = [0.95, -0.95]
        # delta = -0.5 * [0.95, -0.95] = [-0.475, +0.475]
        # p + delta = [-0.425, 1.425]
        matches = np.array([False], dtype=bool)

        new_profile = update_profile_vector(profile, trails, scores, matches)
        self.assertEqual(float(new_profile[0]), 0.0)
        self.assertEqual(float(new_profile[1]), 1.0)

    def test_empty_batch(self):
        profile = np.array([0.25, 0.50, 0.75], dtype=np.float32)
        new_profile = update_profile_vector(profile, [], [], [])
        np.testing.assert_array_almost_equal(profile, new_profile)

    def test_monotonicity_guard(self):
        easy = np.array([0.70, 0.60, 0.50, 0.40, 0.30, 0.20] + [0.10] * 26, dtype=np.float32)
        diff = np.array([0.50, 0.55, 0.60, 0.70, 0.80, 0.90] + [0.90] * 26, dtype=np.float32)

        adj_easy, adj_diff = enforce_anchor_monotonicity(easy, diff, min_gap=0.05)

        # Index 0: easy was 0.70, diff was 0.50 -> diff should be raised to min(1.0, 0.70 + 0.05) = 0.75
        self.assertAlmostEqual(float(adj_diff[0]), 0.75)
        # Index 1: easy was 0.60, diff was 0.55 -> diff raised to 0.65
        self.assertAlmostEqual(float(adj_diff[1]), 0.65)
        # Index 2: easy was 0.50, diff was 0.60 -> unchanged
        self.assertAlmostEqual(float(adj_diff[2]), 0.60)

    def test_dual_anchor_partitioning_update(self):
        from profile_utils import process_dual_anchor_profile_update

        easy_prof = [0.20] * 32
        diff_prof = [0.70] * 32

        hikes = [
            {
                "trail_features": [0.30] * 32,
                "score": 0.40,
                "is_match": True,
                "target_anchor": "easy"
            },
            {
                "trail_features": [0.80] * 32,
                "score": 0.20,
                "is_match": True,
                "target_anchor": "difficult"
            }
        ]

        result = process_dual_anchor_profile_update(easy_prof, diff_prof, hikes)

        self.assertEqual(result["easy_hikes_count"], 1)
        self.assertEqual(result["difficult_hikes_count"], 1)
        self.assertIn("updated_easy_features", result)
        self.assertIn("updated_diff_features", result)
        # Easy profile moved towards 0.30
        self.assertGreater(result["updated_easy_vector"][0], 0.20)
        # Difficult profile moved towards 0.80
        self.assertGreater(result["updated_diff_vector"][0], 0.70)

    def test_feature_presence_gating_terrain(self):
        """
        Validates that when a trail has [0.5 rocky, 0.5 muddy, 0.7 grassland, 0.0 ridges],
        the whole terrain set updates according to presence gating:
        encountered terrains adapt towards trail values, while unencountered
        terrains (0.0 ridges) remain completely untouched (delta = 0).
        """
        from profile_utils import (
            process_dual_anchor_profile_update,
            flatten_profile_features
        )

        user_easy = {
            "classification": 0.0, "length": 0.2, "elevation": 0.2, "gain": 0.2, "slope": 0.2, "easy": 0.2,
            "province": {"cavite": 0.2, "laguna": 0.2, "batangas": 0.2, "rizal": 0.8, "quezon": 0.2},
            "terrain": {"muddy": 0.2, "rocky": 0.2, "grassland": 0.2, "ridges": 0.45},
            "circularity": {"out_and_back": 0.5, "traverse": 0.2, "circular": 0.3},
            "waterforms": {"fall": 0.2, "river": 0.2, "lake": 0.2},
            "tourism": {"shelter": 0.2}
        }
        user_diff = user_easy.copy()

        trail_features = {
            "classification": 0.0, "length": 0.3, "elevation": 0.3, "gain": 0.3, "slope": 0.3, "easy": 0.3,
            "province": {"cavite": 0.0, "laguna": 0.0, "batangas": 0.0, "rizal": 1.0, "quezon": 0.0},
            "terrain": {"muddy": 0.5, "rocky": 0.5, "grassland": 0.7, "ridges": 0.0}, # 0.0 ridges!
            "circularity": {"out_and_back": 1.0, "traverse": 0.0, "circular": 0.0},
            "waterforms": {"fall": 0.0, "river": 0.0, "lake": 0.0},
            "tourism": {"shelter": 0.0}
        }

        hike = {
            "trail_features": trail_features,
            "score": 0.40,
            "is_match": True,
            "target_anchor": "easy",
            "feature_weights": {
                "muddy": 1.0,
                "rocky": 1.0,
                "grassland": 1.0,
                "ridges": 0.0 # Gated by client
            }
        }

        result = process_dual_anchor_profile_update(user_easy, user_diff, [hike])
        updated_easy_terrain = result["updated_easy_features"]["terrain"]

        # Encountered terrains moved towards trail:
        # muddy: 0.20 -> moved up towards 0.50
        self.assertGreater(updated_easy_terrain["muddy"], 0.20)
        # rocky: 0.20 -> moved up towards 0.50
        self.assertGreater(updated_easy_terrain["rocky"], 0.20)
        # grassland: 0.20 -> moved up towards 0.70
        self.assertGreater(updated_easy_terrain["grassland"], 0.20)

        # Unencountered terrain: ridges MUST remain exactly 0.45!
        self.assertAlmostEqual(updated_easy_terrain["ridges"], 0.45, places=5)


if __name__ == "__main__":
    unittest.main()

