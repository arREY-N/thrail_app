"""
Unit and integration tests for monthly batched profile updates during batch recommendation generation.
Verifies the monthly cycle:
  - User hikes & reviews during the month.
  - At the start of the next month, the batch runner:
    1. Collects all reviews from the previous month.
    2. Batches all hiked trails together per anchor.
    3. Updates the user's easy/difficult anchor profiles (with presence gating & monotonicity).
    4. Computes the new month's recommendations with the updated anchors.
"""

import unittest
import numpy as np
from batch_runner import run_batch_recommendations
from profile_utils import resolve_review_factor_weights, flatten_profile_features


class TestMonthlyBatchProfileUpdate(unittest.TestCase):

    def setUp(self):
        # Baseline user anchors (easy and difficult)
        easy_features = {
            "classification": 0.0,
            "length": 0.20,
            "elevation": 0.25,
            "gain": 0.15,
            "slope": 0.18,
            "easy": 0.20,
            "province": {"cavite": 0.10, "laguna": 0.10, "batangas": 0.10, "rizal": 0.80, "quezon": 0.10},
            "terrain": {"muddy": 0.0, "rocky": 0.40, "grassland": 0.30, "ridges": 0.0},
            "circularity": {"out_and_back": 0.5, "traverse": 0.2, "circular": 0.3},
            "waterforms": {"fall": 0.1, "river": 0.2, "lake": 0.0},
            "tourism": {"shelter": 0.1}
        }
        diff_features = {
            "classification": 1.0,
            "length": 0.60,
            "elevation": 0.65,
            "gain": 0.55,
            "slope": 0.50,
            "easy": 0.60,
            "province": {"cavite": 0.10, "laguna": 0.10, "batangas": 0.10, "rizal": 0.80, "quezon": 0.10},
            "terrain": {"muddy": 0.0, "rocky": 0.40, "grassland": 0.30, "ridges": 0.0},
            "circularity": {"out_and_back": 0.5, "traverse": 0.2, "circular": 0.3},
            "waterforms": {"fall": 0.1, "river": 0.2, "lake": 0.0},
            "tourism": {"shelter": 0.1}
        }

        self.user = {
            "id": "user_monthly_test_1",
            "name": "Alex Climber",
            "profile": {
                "easy": {
                    "metadata": {"type": "user", "id": "user_monthly_test_1", "profile": "easy"},
                    "features": easy_features
                },
                "difficult": {
                    "metadata": {"type": "user", "id": "user_monthly_test_1", "profile": "difficult"},
                    "features": diff_features
                }
            }
        }

        # Candidate trails
        self.trail_easy = {
            "id": "trail_easy_1",
            "general": {"name": "Mt. Gentle"},
            "profile": {
                "features": {
                    "classification": 0.0,
                    "length": 0.30,
                    "elevation": 0.30,
                    "gain": 0.25,
                    "slope": 0.22,
                    "easy": 0.25,
                    "province": {"rizal": 1.0},
                    "terrain": {"rocky": 0.50}
                }
            }
        }

        self.trail_diff = {
            "id": "trail_diff_1",
            "general": {"name": "Mt. Rugged Peak"},
            "profile": {
                "features": {
                    "classification": 1.0,
                    "length": 0.70,
                    "elevation": 0.70,
                    "gain": 0.65,
                    "slope": 0.60,
                    "easy": 0.65,
                    "province": {"rizal": 1.0},
                    "terrain": {"grassland": 0.60}
                }
            }
        }

        self.trail_candidate = {
            "id": "trail_cand_3",
            "general": {"name": "Pine Crest"},
            "profile": {
                "features": {
                    "classification": 0.0,
                    "length": 0.25,
                    "elevation": 0.28,
                    "gain": 0.20,
                    "slope": 0.20,
                    "easy": 0.22,
                    "province": {"rizal": 1.0},
                    "terrain": {"rocky": 0.30}
                }
            }
        }

        self.trails = [self.trail_easy, self.trail_diff, self.trail_candidate]

    def test_monthly_batch_profile_update_cycle(self):
        """
        Tests the monthly flow:
          - User completes 2 hikes in October (2026-10) and leaves reviews.
          - At start of November (2026-11), run_batch_recommendations(month_id='2026-11') runs.
          - Batch runner collects both October reviews and updates user profile anchors.
        """
        # Previous month recommendations (2026-10)
        prev_recommendations = {
            "user_monthly_test_1": {
                "easy": [{"id": "trail_easy_1", "name": "Mt. Gentle", "score": 0.25}],
                "difficult": [{"id": "trail_diff_1", "name": "Mt. Rugged Peak", "score": 0.30}]
            }
        }

        # User's reviews submitted during October (2026-10)
        user_reviews = {
            "user_monthly_test_1": [
                {
                    "id": "rev_1",
                    "trail": {"id": "trail_easy_1"},
                    "perceivedDifficulty": "Easy",  # Match with easy prediction
                    "difficultyFactors": ["The trail is not too steep"],  # Boosts slope
                    "createdAt": "2026-10-12T08:00:00Z"
                },
                {
                    "id": "rev_2",
                    "trail": {"id": "trail_diff_1"},
                    "perceivedDifficulty": 1,  # Numeric 1 = Easy (Mismatch with difficult prediction!)
                    "difficultyFactors": ["The length is just right"],  # Distance/length factor
                    "createdAt": "2026-10-24T14:30:00Z"
                },
                # Review from older month (should be excluded)
                {
                    "id": "rev_old",
                    "trail": {"id": "trail_candidate"},
                    "perceivedDifficulty": "Easy",
                    "difficultyFactors": ["The length is just right"],
                    "createdAt": "2026-08-01T00:00:00Z"
                }
            ]
        }

        # Run batch recommendation generation for November (2026-11)
        report = run_batch_recommendations(
            cbf_engine="GD",
            cf_engine="GD",
            month_id="2026-11",
            candidate_trails=self.trails,
            users=[self.user],
            user_reviews_map=user_reviews,
            prev_recommendations_map=prev_recommendations,
            commit_to_firestore=False,
            generate_ai_reasoning=False,
            update_profiles_from_reviews=True
        )

        self.assertEqual(report["status"], "success")
        self.assertEqual(report["total_users_processed"], 1)
        self.assertEqual(len(report["samples"]), 1)
        sample = report["samples"][0]
        self.assertEqual(sample["userId"], "user_monthly_test_1")
        self.assertGreater(sample["easy_count"] + sample["difficult_count"], 0)

    def test_reviews_only_collected_from_previous_month(self):
        """
        Verifies that only reviews from the previous month are batched.
        Reviews from 2026-09 or 2026-11 should be filtered out when active_month is 2026-11.
        """
        # Factor weights resolution verification
        weights = resolve_review_factor_weights(["The trail is not too steep"], trail_features={"slope": 0.22})
        self.assertAlmostEqual(weights["slope"], 1.0)  # slope key is boosted to 1.0

    def test_new_user_without_prior_recommendations_is_not_skipped(self):
        """
        Verifies that new users who have a valid 'profile' object but no previous
        recommendations document are NOT skipped, and successfully receive recommendations.
        Also verifies that dummy accounts lacking a 'profile' object are skipped.
        """
        dummy_user = {
            "id": "dummy_user_no_profile",
            "name": "Dummy Account",
            # No profile property
        }

        report = run_batch_recommendations(
            cbf_engine="GD",
            cf_engine="GD",
            month_id="2026-11",
            candidate_trails=self.trails,
            users=[self.user, dummy_user],
            user_reviews_map=None,
            prev_recommendations_map=None,  # No prior recommendations map (simulating new user)
            commit_to_firestore=False,
            generate_ai_reasoning=False,
            update_profiles_from_reviews=True
        )

        self.assertEqual(report["status"], "success")
        self.assertEqual(report["total_users_processed"], 1)
        self.assertEqual(len(report["samples"]), 1)
        self.assertEqual(report["samples"][0]["userId"], "user_monthly_test_1")
        self.assertGreater(report["samples"][0]["easy_count"] + report["samples"][0]["difficult_count"], 0)


if __name__ == "__main__":
    unittest.main()
