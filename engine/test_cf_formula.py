"""
Unit and edge-case tests for the revised Collaborative Filtering (CF) formula:
    CF = sum(w_i * dist(u_i, t)) / sum(w_i) where w_i = 1 - dist(u_a, u_i)
    Eligible peers: dist(u_a, u_i) <= tau
    If 0 peers eligible: alpha = 1.0 (fallback to pure CBF)
"""

import unittest
import numpy as np
import sys
from pathlib import Path

# Add engine directory to path
engine_dir = str(Path(__file__).resolve().parent)
if engine_dir not in sys.path:
    sys.path.insert(0, engine_dir)

from tars import engine, engine_details, compute_alpha, GD, ED, CS
from parameters import CF_DISTANCE_CUTOFF_TAU, CF_TOP_K, ALPHA_COLD_START, ALPHA_STEADY_STATE


class TestRevisedCollaborativeFiltering(unittest.TestCase):

    def setUp(self):
        self.vec_len = 32

    def test_twin_who_dislikes_trail_bug_fixed(self):
        """
        Original failure case:
        Twin (dist(A,B) = 0.0) who dislikes the trail (dist(B,T) = 0.8).
        Previously: 0.0 * 0.8 = 0.0 (falsely scored as best possible match).
        Now: w_B = 1 - 0.0 = 1.0. CF = (1.0 * 0.8) / 1.0 = 0.80 (correctly penalized).
        """
        user_a = [0.0] * self.vec_len
        trail_t = [0.8] * self.vec_len
        peer_twin = [0.0] * self.vec_len

        res = engine_details("GD", "GD", user_a, trail_t, a=0.5, peer_profiles=[peer_twin])

        self.assertAlmostEqual(res["cf"], 0.80, places=4)
        self.assertAlmostEqual(res["score"], 0.80, places=4)
        self.assertEqual(res["eligible_peers"], 1)

    def test_twin_who_loves_trail(self):
        """
        Twin (dist(A,B) = 0.0) who loves the trail (dist(B,T) = 0.0).
        w_B = 1.0. CF = 0.00.
        """
        user_a = [0.0] * self.vec_len
        trail_t = [0.0] * self.vec_len
        peer_twin = [0.0] * self.vec_len

        res = engine_details("GD", "GD", user_a, trail_t, a=0.5, peer_profiles=[peer_twin])

        self.assertAlmostEqual(res["cf"], 0.00, places=4)
        self.assertAlmostEqual(res["score"], 0.00, places=4)
        self.assertEqual(res["eligible_peers"], 1)

    def test_stranger_who_loves_trail_rejected_by_tau(self):
        """
        Original failure case:
        Stranger (dist(A,B) = 0.80 > tau=0.35) who loves the trail (dist(B,T) = 0.0).
        Previously: 0.8 * 0.0 = 0.0 (falsely scored as best possible match).
        Now: dist(A,B) > tau, so 0 peers eligible -> fallback effective alpha = 1.0 (pure CBF).
        """
        user_a = [0.0] * self.vec_len
        trail_t = [0.5] * self.vec_len  # User A has moderate distance 0.5 to trail
        peer_stranger = [0.8] * self.vec_len  # dist(A, stranger) = 0.8 > 0.35

        res = engine_details("GD", "GD", user_a, trail_t, a=0.5, peer_profiles=[peer_stranger], tau=0.35)

        self.assertEqual(res["eligible_peers"], 0)
        self.assertAlmostEqual(res["alpha"], 1.0, places=4)
        self.assertAlmostEqual(res["score"], res["cbf"], places=4)
        self.assertAlmostEqual(res["score"], 0.5, places=4)

    def test_top_k_selection_and_weighting(self):
        """
        Tests top-k peer sorting and convex combination.
        Suppose tau = 0.40, k = 2.
        Peer 1: dist(A, P1) = 0.10 -> w_1 = 0.90, dist(P1, T) = 0.20
        Peer 2: dist(A, P2) = 0.20 -> w_2 = 0.80, dist(P2, T) = 0.40
        Peer 3: dist(A, P3) = 0.30 -> w_3 = 0.70, dist(P3, T) = 0.90 (should be excluded by k=2)
        Peer 4: dist(A, P4) = 0.50 -> excluded by tau=0.40

        Expected CF = (0.90 * 0.20 + 0.80 * 0.40) / (0.90 + 0.80)
                    = (0.18 + 0.32) / 1.70 = 0.50 / 1.70 = 0.2941176...
        """
        user_a = [0.0] * self.vec_len
        trail_t = [0.0] * self.vec_len  # will calibrate peer trail vectors directly

        # P1 vector has GD distance 0.10 to A
        p1 = [0.10] * self.vec_len
        # P2 vector has GD distance 0.20 to A
        p2 = [0.20] * self.vec_len
        # P3 vector has GD distance 0.30 to A
        p3 = [0.30] * self.vec_len
        # P4 vector has GD distance 0.50 to A (exceeds tau=0.40)
        p4 = [0.50] * self.vec_len

        # To give specific dist(P, T):
        # Let trail_t be [0.0]*32. Then dist(P1, T) is 0.10, dist(P2, T) is 0.20.
        # Expected: w_1 = 0.90, w_2 = 0.80
        # CF = (0.90 * 0.10 + 0.80 * 0.20) / (0.90 + 0.80) = (0.09 + 0.16) / 1.70 = 0.25 / 1.70 = 0.1470588
        res = engine_details("GD", "GD", user_a, trail_t, a=0.5, peer_profiles=[p4, p2, p3, p1], k=2, tau=0.40)

        expected_cf = (0.90 * 0.10 + 0.80 * 0.20) / (0.90 + 0.80)
        self.assertEqual(res["eligible_peers"], 3)  # p1, p2, p3 pass tau=0.40
        self.assertAlmostEqual(res["cf"], expected_cf, places=4)

    def test_denominator_zero_safety(self):
        """
        If tau = 1.0 and a peer has dist = 1.0, weight is 0.0 -> sum_weights <= 1e-9.
        Engine must safely fall back to alpha = 1.0 without dividing by zero.
        """
        user_a = [0.0] * self.vec_len
        trail_t = [0.5] * self.vec_len
        peer_opposite = [1.0] * self.vec_len

        res = engine_details("GD", "GD", user_a, trail_t, a=0.5, peer_profiles=[peer_opposite], tau=1.0)
        self.assertEqual(res["alpha"], 1.0)
        self.assertAlmostEqual(res["score"], res["cbf"], places=4)

    def test_dynamic_alpha_cold_start_and_steady_state(self):
        """
        Verifies dynamic alpha scaling from parameters.
        """
        self.assertEqual(compute_alpha(0), ALPHA_COLD_START)
        self.assertEqual(compute_alpha(1), ALPHA_COLD_START)
        self.assertEqual(compute_alpha(50), ALPHA_STEADY_STATE)
        self.assertEqual(compute_alpha(100), ALPHA_STEADY_STATE)

    def test_centralized_parameters_propagation(self):
        """
        Verifies that defaults from engine/parameters.py are wired into tars,
        batch_runner, profile_utils, and formula/profile_updater with zero circular imports.
        """
        import inspect
        import parameters
        import profile_utils
        from formula import profile_updater
        import batch_runner

        # 1. Verify tars defaults match parameters.py
        sig_engine = inspect.signature(engine)
        self.assertEqual(sig_engine.parameters["k"].default, parameters.CF_TOP_K)
        self.assertEqual(sig_engine.parameters["tau"].default, parameters.CF_DISTANCE_CUTOFF_TAU)

        # 2. Verify batch_runner defaults match parameters.py
        sig_batch = inspect.signature(batch_runner.run_batch_recommendations)
        self.assertEqual(sig_batch.parameters["cf_k"].default, parameters.CF_TOP_K)
        self.assertEqual(sig_batch.parameters["cf_tau"].default, parameters.CF_DISTANCE_CUTOFF_TAU)

        # 3. Verify profile_utils & profile_updater defaults match parameters.py
        sig_weights = inspect.signature(profile_utils.build_feature_weight_vector)
        self.assertEqual(
            sig_weights.parameters["default_unselected_weight"].default,
            parameters.REVIEW_BASELINE_UNSELECTED_WEIGHT,
        )
        sig_mono = inspect.signature(profile_updater.enforce_anchor_monotonicity)
        self.assertEqual(
            sig_mono.parameters["min_gap"].default,
            parameters.ANCHOR_MONOTONICITY_MIN_GAP,
        )
        self.assertEqual(len(parameters.DEFAULT_FEATURE_WEIGHTS), 32)

    def test_superadmin_optional_hyperparameter_overrides(self):
        """
        Verifies that the engine and batch_runner accept optional hyperparameter overrides
        (e.g., sent from the Superadmin Dashboard) while falling back to parameters.py defaults.
        """
        from batch_runner import run_batch_recommendations

        # Custom alpha scaling via optional parameters
        a_custom = compute_alpha(
            user_count=10,
            steady_state_threshold=19,
            cold_start_alpha=1.0,
            steady_state_alpha=0.2,
        )
        # At user_count=10 out of threshold=19 (halfway), alpha should be 0.6
        self.assertAlmostEqual(a_custom, 0.6, places=4)

        # Verify batch_runner accepts alpha_override, cf_k, cf_tau, beta_divisor, etc.
        mock_trails = [
            {"id": "t1", "general": {"name": "Trail 1"}, "profile": {"features": {"length": 0.3}}}
        ]
        mock_users = [
            {
                "id": "u1",
                "profile": {
                    "easy": {"features": {"length": 0.25}},
                    "difficult": {"features": {"length": 0.75}},
                },
            }
        ]
        rep = run_batch_recommendations(
            candidate_trails=mock_trails,
            users=mock_users,
            commit_to_firestore=False,
            generate_ai_reasoning=False,
            update_profiles_from_reviews=False,
            cf_k=3,
            cf_tau=0.25,
            alpha_override=0.65,
            beta_divisor=4.0,
            monotonicity_min_gap=0.08,
        )
        self.assertEqual(rep["status"], "success")
        self.assertAlmostEqual(rep["alpha"], 0.65, places=4)


if __name__ == "__main__":
    unittest.main()

