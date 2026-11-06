"""
Unit Tests for THARESYS Synthetic Trail Generator.
"""

import copy
import json
import os
import sys
import unittest
import numpy as np

MODULE_DIR = os.path.dirname(os.path.abspath(__file__))
GEN_DIR = os.path.abspath(os.path.join(MODULE_DIR, ".."))
SIM_DIR = os.path.abspath(os.path.join(GEN_DIR, "..", ".."))
ROOT = os.path.abspath(os.path.join(SIM_DIR, "..", ".."))
ENGINE_DIR = os.path.join(ROOT, "engine")
if ENGINE_DIR not in sys.path:
    sys.path.insert(0, ENGINE_DIR)
if GEN_DIR not in sys.path:
    sys.path.insert(0, GEN_DIR)

from profile_utils import flatten_profile_features, unflatten_profile_features  # noqa: E402
from config import (  # noqa: E402
    TIERS,
    TRAILS_PER_TIER,
    PROVINCE_KEYS,
    MIN_PROVINCE_APPEARANCES,
    MIN_TRAVERSE_COUNT,
    MIN_CIRCULAR_COUNT,
)
from generate import (  # noqa: E402
    build_quota_plan,
    generate_catalog,
    load_and_export_real_trails,
)


class TestTrailGenerator(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.real_trails = load_and_export_real_trails()
        cls.cat42, cls.real_renorm, cls.bounds = generate_catalog(42, cls.real_trails)

    def test_quota_plan_counts(self):
        slots = build_quota_plan(seed=42)
        self.assertEqual(len(slots), 32)

        tier_counts = {t: 0 for t in TIERS}
        for s in slots:
            tier_counts[s["tier"]] += 1
        for t, c in tier_counts.items():
            self.assertEqual(c, TRAILS_PER_TIER)

        trav_count = sum(1 for s in slots if s["circularity"] == "traverse")
        circ_count = sum(1 for s in slots if s["circularity"] == "circular")
        self.assertGreaterEqual(trav_count, MIN_TRAVERSE_COUNT)
        self.assertGreaterEqual(circ_count, MIN_CIRCULAR_COUNT)

    def test_synthetic_slope_consistency(self):
        for t in self.cat42["trails"]:
            if t.get("synthetic", False):
                raw = t["raw"]
                expected_slope = (raw["gain"] / (raw["length"] * 1000.0)) * 100.0
                self.assertAlmostEqual(raw["slope"], expected_slope, delta=0.08)

    def test_real_trails_raw_preservation(self):
        real_map = {t["id"]: t for t in self.real_trails}
        for t in self.cat42["trails"]:
            if not t.get("synthetic", False):
                tid = t["id"]
                self.assertIn(tid, real_map)
                orig = real_map[tid]["raw"]
                self.assertEqual(t["raw"]["length"], orig["length"])
                self.assertEqual(t["raw"]["elevation"], orig["elevation"])
                self.assertEqual(t["raw"]["gain"], orig["gain"])
                self.assertEqual(t["raw"]["slope"], orig["slope"])

    def test_unflatten_roundtrip(self):
        for t in self.cat42["trails"]:
            vec = np.array(t["vector"], dtype=np.float32)
            prof = t["profile"]
            reconstructed = flatten_profile_features(prof)
            np.testing.assert_allclose(reconstructed, vec, atol=1e-5)

    def test_determinism(self):
        cat_again, _, _ = generate_catalog(42, self.real_trails)
        self.assertEqual(
            json.dumps(self.cat42, sort_keys=True),
            json.dumps(cat_again, sort_keys=True),
        )


if __name__ == "__main__":
    unittest.main()

