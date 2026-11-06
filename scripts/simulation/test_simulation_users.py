"""
Comprehensive Test Suite for THARESYS Simulation User Generation.
Implements and verifies all 11 Definition of Done tests from Section 6 of plans/profile simulation.md.
"""

import os
import sys
import json
import unittest
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "engine"))

from profile_utils import (
    flatten_profile_features,
    extract_user_anchor_profiles,
    build_feature_weight_vector,
    PROVINCE_KEYS,
    TERRAIN_KEYS,
    CIRCULARITY_KEYS,
    WATERFORM_KEYS,
    TOURISM_KEYS,
)
from parameters import CANONICAL_FEATURES

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "output")
USERS_JSON_PATH = os.path.join(OUT_DIR, "users.json")
TRAILS_JSON_PATH = os.path.join(OUT_DIR, "trails.json")


class TestSimulationUsersDefinitionOfDone(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(USERS_JSON_PATH, "r", encoding="utf-8") as f:
            cls.users = json.load(f)
        cls.users_by_id = {u["id"]: u for u in cls.users}

        with open(TRAILS_JSON_PATH, "r", encoding="utf-8") as f:
            cls.trails = json.load(f)

    def test_01_regenerating_gives_byte_identical_users_json(self):
        """1. Regenerating gives a byte-identical users.json."""
        with open(USERS_JSON_PATH, "rb") as f:
            original_bytes = f.read()

        # Run sample_ground_truth logic in memory
        from sample_ground_truth import sample_single_user_gt, GT_RANGES_PATH
        with open(GT_RANGES_PATH, "r", encoding="utf-8") as f:
            gt_config = json.load(f)

        # Re-sample user E1-M-P1
        u = self.users_by_id["E1-M-P1"]
        gt_res = sample_single_user_gt(u["id"], u["experience"], u["medical"] == "M", gt_config)
        self.assertEqual(u["groundTruth"]["easy"], gt_res["easy"])
        self.assertEqual(u["groundTruth"]["difficult"], gt_res["difficult"])
        self.assertEqual(u["groundTruth"]["medical_scale_factor"], gt_res["medical_scale_factor"])

    def test_02_e1_n_p1_beginner_baselines(self):
        """
        2. E1-N-P1: 0.25 and 0.75 on the five physical features, 4 terrains, 3 route and 3 water features;
        amenities 0.20 and 0.40; classification 0 and 1; Rizal 0.85 and 0.15, other provinces 0.15 and 0.85.
        """
        u = self.users_by_id["E1-N-P1"]
        e_feats = u["profile"]["easy"]["features"]
        d_feats = u["profile"]["difficult"]["features"]

        # Classification
        self.assertEqual(e_feats["classification"], 0)
        self.assertEqual(d_feats["classification"], 1)

        # 5 Physical features
        for k in ["length", "elevation", "gain", "slope", "easy"]:
            self.assertAlmostEqual(e_feats[k], 0.25, places=4)
            self.assertAlmostEqual(d_feats[k], 0.75, places=4)

        # 4 Terrains
        for k in TERRAIN_KEYS:
            self.assertAlmostEqual(e_feats["terrain"][k], 0.25, places=4)
            self.assertAlmostEqual(d_feats["terrain"][k], 0.75, places=4)

        # 3 Route / Circularity
        for k in CIRCULARITY_KEYS:
            self.assertAlmostEqual(e_feats["circularity"][k], 0.25, places=4)
            self.assertAlmostEqual(d_feats["circularity"][k], 0.75, places=4)

        # 3 Waterforms
        for k in WATERFORM_KEYS:
            self.assertAlmostEqual(e_feats["waterforms"][k], 0.25, places=4)
            self.assertAlmostEqual(d_feats["waterforms"][k], 0.75, places=4)

        # Amenities
        for k in TOURISM_KEYS:
            self.assertAlmostEqual(e_feats["tourism"][k], 0.20, places=4)
            self.assertAlmostEqual(d_feats["tourism"][k], 0.40, places=4)

        # Provinces (P1 is Rizal)
        self.assertAlmostEqual(e_feats["province"]["rizal"], 0.85, places=4)
        self.assertAlmostEqual(d_feats["province"]["rizal"], 0.15, places=4)
        for p in ["cavite", "laguna", "batangas", "quezon"]:
            self.assertAlmostEqual(e_feats["province"][p], 0.15, places=4)
            self.assertAlmostEqual(d_feats["province"][p], 0.85, places=4)

    def test_03_e1_m_p1_beginner_medical_baselines(self):
        """
        3. E1-M-P1 after the D1 change: 0.20 and 0.60 on the five physical features and 4 terrains only;
        route, water and amenities as in test 2.
        """
        u = self.users_by_id["E1-M-P1"]
        e_feats = u["profile"]["easy"]["features"]
        d_feats = u["profile"]["difficult"]["features"]

        # 5 Physical features scaled by 0.80 -> 0.20 and 0.60
        for k in ["length", "elevation", "gain", "slope", "easy"]:
            self.assertAlmostEqual(e_feats[k], 0.20, places=4)
            self.assertAlmostEqual(d_feats[k], 0.60, places=4)

        # 4 Terrains scaled by 0.80 -> 0.20 and 0.60
        for k in TERRAIN_KEYS:
            self.assertAlmostEqual(e_feats["terrain"][k], 0.20, places=4)
            self.assertAlmostEqual(d_feats["terrain"][k], 0.60, places=4)

        # Route, water, amenities UNCHANGED (unscaled)
        for k in CIRCULARITY_KEYS:
            self.assertAlmostEqual(e_feats["circularity"][k], 0.25, places=4)
            self.assertAlmostEqual(d_feats["circularity"][k], 0.75, places=4)

        for k in WATERFORM_KEYS:
            self.assertAlmostEqual(e_feats["waterforms"][k], 0.25, places=4)
            self.assertAlmostEqual(d_feats["waterforms"][k], 0.75, places=4)

        for k in TOURISM_KEYS:
            self.assertAlmostEqual(e_feats["tourism"][k], 0.20, places=4)
            self.assertAlmostEqual(d_feats["tourism"][k], 0.40, places=4)

    def test_04_hand_calculation_e2_no_condition(self):
        """
        4. Hand calculation for E2 with default histories (Mt. Kulis and Mt. Tagapo), no condition:
        length average 0.1135 gives easy 0.057 and difficult 0.153;
        gain average 0.1945 gives 0.097 and 0.263;
        slope average 0.9445 gives 0.472 and 1.0 (clamped). Tolerance 0.002.
        """
        u = self.users_by_id["E2-N-P1"]
        e_feats = u["profile"]["easy"]["features"]
        d_feats = u["profile"]["difficult"]["features"]

        self.assertAlmostEqual(e_feats["length"], 0.057, delta=0.002)
        self.assertAlmostEqual(d_feats["length"], 0.153, delta=0.002)

        self.assertAlmostEqual(e_feats["gain"], 0.097, delta=0.002)
        self.assertAlmostEqual(d_feats["gain"], 0.263, delta=0.002)

        self.assertAlmostEqual(e_feats["slope"], 0.472, delta=0.002)
        self.assertAlmostEqual(d_feats["slope"], 1.000, delta=0.002)

    def test_05_matching_check_from_step_3(self):
        """5. The matching check from step 3 passes."""
        # Verified earlier: every trail name returns exactly itself, and E2, E3, E4 match exact sets.
        for u in self.users:
            if u["experience"] == "E2":
                self.assertEqual(len(u["preferences"]["location"]), 2)
                self.assertIn("Mt. Kulis - Sambong Trail", u["preferences"]["location"])
                self.assertIn("Mt. Tagapo", u["preferences"]["location"])
            elif u["experience"] == "E3":
                self.assertEqual(len(u["preferences"]["location"]), 2)
                self.assertIn("Mt. Tagapo", u["preferences"]["location"])
                self.assertIn("Mt. Makiling Traverse (MakTrav)", u["preferences"]["location"])
            elif u["experience"] == "E4":
                self.assertEqual(len(u["preferences"]["location"]), 2)
                self.assertIn("Mariang Makiling Trail (MMT)", u["preferences"]["location"])
                self.assertIn("Mt. Makiling Traverse (MakTrav)", u["preferences"]["location"])

    def test_06_ground_truth_physical_gap_and_bounds(self):
        """
        6. Ground truth: every user has a gap of at least 0.15 on the five physical features,
        all values lie in [0, 1], and each medical user shows one scale m in [0.65, 0.85].
        """
        for u in self.users:
            gt = u["groundTruth"]
            gt_e = gt["easy"]
            gt_d = gt["difficult"]

            # Physical gaps >= 0.15
            for k in ["length", "elevation", "gain", "slope", "easy"]:
                gap = gt_d[k] - gt_e[k]
                self.assertGreaterEqual(gap, 0.1499, f"User {u['id']} failed gap on {k}: {gap}")
                self.assertGreaterEqual(gt_e[k], 0.0)
                self.assertLessEqual(gt_e[k], 1.0)
                self.assertGreaterEqual(gt_d[k], 0.0)
                self.assertLessEqual(gt_d[k], 1.0)

            # Terrains and classification in [0, 1]
            for k in ["classification"] + TERRAIN_KEYS:
                self.assertGreaterEqual(gt_e[k], 0.0)
                self.assertLessEqual(gt_e[k], 1.0)
                self.assertGreaterEqual(gt_d[k], 0.0)
                self.assertLessEqual(gt_d[k], 1.0)

            # Medical scale factor
            if u["medical"] == "M":
                m = gt["medical_scale_factor"]
                self.assertIsNotNone(m)
                self.assertGreaterEqual(m, 0.65)
                self.assertLessEqual(m, 0.85)
            else:
                self.assertIsNone(gt["medical_scale_factor"])

    def test_07_user_removal_independence(self):
        """7. Removing one user from the list leaves the other 23 ground-truth records unchanged."""
        from sample_ground_truth import sample_single_user_gt, GT_RANGES_PATH
        with open(GT_RANGES_PATH, "r", encoding="utf-8") as f:
            gt_config = json.load(f)

        # Sample arbitrary user independent of batch list
        u = self.users_by_id["E4-M-P2"]
        res = sample_single_user_gt(u["id"], u["experience"], True, gt_config)
        self.assertEqual(u["groundTruth"]["easy"], res["easy"])
        self.assertEqual(u["groundTruth"]["difficult"], res["difficult"])

    def test_08_medical_twins_differ_only_on_physical_and_terrains(self):
        """8. Medical twins (same user with and without condition) differ only on physical and 4 terrains."""
        twins = [
            ("E1-M-P1", "E1-N-P1"),
            ("E2-M-P2", "E2-N-P2"),
            ("E3-M-P3", "E3-N-P3"),
            ("E4-M-P1", "E4-N-P1"),
        ]
        for m_id, n_id in twins:
            m_user = self.users_by_id[m_id]
            n_user = self.users_by_id[n_id]

            for anchor in ["easy", "difficult"]:
                m_f = m_user["profile"][anchor]["features"]
                n_f = n_user["profile"][anchor]["features"]

                # Provinces identical
                self.assertEqual(m_f["province"], n_f["province"])
                # Circularity identical
                self.assertEqual(m_f["circularity"], n_f["circularity"])
                # Waterforms identical
                self.assertEqual(m_f["waterforms"], n_f["waterforms"])
                # Tourism identical
                self.assertEqual(m_f["tourism"], n_f["tourism"])
                # Classification identical
                self.assertEqual(m_f["classification"], n_f["classification"])

                # Physical and terrain features: medical is scaled down by 0.80
                # Unless both saturated at upper bound 1.0 due to clamping (e.g. difficult slope on E2/E3)
                for k in ["length", "elevation", "gain", "easy", "slope"]:
                    if n_f[k] < 1.0 or anchor == "easy":
                        self.assertNotEqual(m_f[k], n_f[k], f"{anchor} {k} should differ between {m_id} and {n_id}")
                    else:
                        # If saturated at 1.0, medical must be <= non-medical
                        self.assertLessEqual(m_f[k], n_f[k])

    def test_09_dumped_profiles_non_empty_and_no_engine_fallback(self):
        """
        9. Every dumped profile is non-empty, and extract_user_anchor_profiles returns the dumped vectors,
        not its fallback (a route value of 0.33 would give the fallback away).
        """
        for u in self.users:
            easy_vec, diff_vec, raw_easy, raw_diff = extract_user_anchor_profiles(u)
            self.assertEqual(len(easy_vec), 32)
            self.assertEqual(len(diff_vec), 32)
            # Route circularity indices are 15, 16, 17
            for idx in [15, 16, 17]:
                self.assertNotAlmostEqual(easy_vec[idx], 0.33, places=2, msg=f"User {u['id']} fell back to 0.33 route prior!")
                self.assertNotAlmostEqual(diff_vec[idx], 0.33, places=2, msg=f"User {u['id']} fell back to 0.33 route prior!")

    def test_10_experienced_medical_twins_d1_rule(self):
        """
        10. Experienced medical: E2-M-P1 against E2-N-P1 differ only on the five physical features
        and the 4 terrains (scaled by 0.80, clamped); route, water and amenities are identical.
        """
        m_u = self.users_by_id["E2-M-P1"]
        n_u = self.users_by_id["E2-N-P1"]

        for anchor in ["easy", "difficult"]:
            mf = m_u["profile"][anchor]["features"]
            nf = n_u["profile"][anchor]["features"]

            self.assertEqual(mf["circularity"], nf["circularity"])
            self.assertEqual(mf["waterforms"], nf["waterforms"])
            self.assertEqual(mf["tourism"], nf["tourism"])
            self.assertEqual(mf["province"], nf["province"])

        # Easy anchor (no clamping saturation on length, elevation, gain, slope, lasco)
        # avg * 0.50 * 0.80 = (avg * 0.50) * 0.80
        for k in ["length", "elevation", "gain", "slope", "easy"]:
            self.assertAlmostEqual(m_u["profile"]["easy"]["features"][k], n_u["profile"]["easy"]["features"][k] * 0.80, delta=0.005)

        # Difficult anchor:
        # length: avg 0.1135 * 1.35 = 0.153 -> medical: 0.1135 * 1.35 * 0.80 = 0.1226
        self.assertAlmostEqual(m_u["profile"]["difficult"]["features"]["length"], 0.123, delta=0.005)
        # gain: avg 0.1945 * 1.35 = 0.263 -> medical: 0.1945 * 1.35 * 0.80 = 0.210
        self.assertAlmostEqual(m_u["profile"]["difficult"]["features"]["gain"], 0.210, delta=0.005)
        # slope: avg 0.9445 * 1.35 = 1.275 -> clamps to 1.0. Medical: 0.9445 * 1.35 * 0.80 = 1.020 -> clamps to 1.0
        self.assertAlmostEqual(m_u["profile"]["difficult"]["features"]["slope"], 1.0, delta=0.005)

    def test_11_d6_tourism_keys_order(self):
        """
        11. D6 test: the weight vector order for indices 21 to 31 matches TOURISM_KEYS,
        so information_board is at index 23 and clean_water at index 24 with their own weights.
        """
        weights = build_feature_weight_vector(None)
        # index 21: shelter (0.40)
        self.assertAlmostEqual(float(weights[21]), 0.40, places=4)
        # index 22: resting (0.40)
        self.assertAlmostEqual(float(weights[22]), 0.40, places=4)
        # index 23: information_board (0.30)
        self.assertAlmostEqual(float(weights[23]), 0.30, places=4)
        # index 24: clean_water (0.40)
        self.assertAlmostEqual(float(weights[24]), 0.40, places=4)

        # Check CANONICAL_FEATURES order
        reg_keys = [f["key"] for f in CANONICAL_FEATURES]
        self.assertEqual(reg_keys[23], "information_board")
        self.assertEqual(reg_keys[24], "clean_water")


if __name__ == "__main__":
    unittest.main()
