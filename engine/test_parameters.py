"""
Guards that the weight registry (CANONICAL_FEATURES) uses the same feature order
as the vectors built by profile_utils.flatten_profile_features.
"""

import unittest

import numpy as np

from parameters import CANONICAL_FEATURES
from profile_utils import (
    PROVINCE_KEYS,
    TERRAIN_KEYS,
    CIRCULARITY_KEYS,
    WATERFORM_KEYS,
    TOURISM_KEYS,
    FEATURE_VECTOR_SIZE,
    flatten_profile_features,
    build_feature_weight_vector,
)


class TestCanonicalFeatureOrder(unittest.TestCase):
    def test_registry_order_matches_vector_order(self):
        expected = (
            ["classification", "length", "elevation", "gain", "slope", "easy"]
            + PROVINCE_KEYS
            + TERRAIN_KEYS
            + CIRCULARITY_KEYS
            + WATERFORM_KEYS
            + TOURISM_KEYS
        )
        registry = [f["key"].replace("tourism_", "") for f in CANONICAL_FEATURES]
        self.assertEqual(len(registry), FEATURE_VECTOR_SIZE)
        self.assertEqual(registry, expected)

    def test_tourism_weights_land_on_matching_vector_indices(self):
        weights = build_feature_weight_vector(None)
        self.assertAlmostEqual(float(weights[23]), 0.30, places=5)  # information_board
        self.assertAlmostEqual(float(weights[24]), 0.40, places=5)  # clean_water

        feats = {"tourism": {"information_board": 0.7, "clean_water": 0.9}}
        vec = flatten_profile_features(feats)
        self.assertAlmostEqual(float(vec[23]), 0.7, places=5)
        self.assertAlmostEqual(float(vec[24]), 0.9, places=5)

    def test_default_weights_sum_to_100(self):
        self.assertAlmostEqual(float(np.sum(build_feature_weight_vector(None))), 100.0, places=3)


if __name__ == "__main__":
    unittest.main()

