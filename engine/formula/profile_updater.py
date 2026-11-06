"""
Adaptive Profile Update Engine for THARESYS

Computes error-driven profile evolution using completed hike feedback:
    Delta = Trail - Profile
    beta = R_tu / 2 if match else -(1 - R_tu) / 2
    Avg_Delta = mean(beta * Delta)
    P_new = clamp(Profile + Weights * Avg_Delta, 0.0, 1.0)
"""

import sys
from pathlib import Path
from typing import Optional, Union, List, Tuple
import numpy as np

# Ensure parent directory is in sys.path so parameters can be imported cleanly
_parent = str(Path(__file__).resolve().parent.parent)
if _parent not in sys.path:
    sys.path.insert(0, _parent)

try:
    from parameters import (
        BETA_LEARNING_RATE_DIVISOR,
        ANCHOR_MONOTONICITY_MIN_GAP,
        PROFILE_MAX_STEP_DELTA,
        TESTING_EASY_MATCH_CEILING_NUDGE,
    )
except ImportError:
    BETA_LEARNING_RATE_DIVISOR = 2.0
    ANCHOR_MONOTONICITY_MIN_GAP = 0.05
    PROFILE_MAX_STEP_DELTA = 0.10
    TESTING_EASY_MATCH_CEILING_NUDGE = 0.10

FEATURE_VECTOR_SIZE = 32
PHYSICAL_INDICES_COUNT = 6  # Indices 0-5: classification, length, elevation, gain, slope, easy


def compute_beta(rtu_score: float, is_match: bool, divisor: float = 2.0) -> float:
    """
    Computes the adaptive error-driven learning rate beta.
    
    Parameters:
        rtu_score: Recommendation distance in [0.0, 1.0] (0.0 = match, 1.0 = distant)
        is_match: User experience indicator (True = match, False = mismatch)
        divisor: Configurable learning rate divisor (default: BETA_LEARNING_RATE_DIVISOR)
        
    Returns:
        beta scalar in [-0.5, +0.5]
    """
    score = max(0.0, min(1.0, float(rtu_score)))
    div = max(1e-6, float(divisor))
    if is_match:
        return score / div
    else:
        return -(1.0 - score) / div


def update_profile_vector(
    current_profile: Union[List[float], np.ndarray],
    trail_vectors: Union[List[List[float]], np.ndarray],
    scores: Union[List[float], np.ndarray],
    matches: Union[List[bool], np.ndarray],
    weights: Optional[Union[List[float], np.ndarray]] = None,
    beta_divisor: float = BETA_LEARNING_RATE_DIVISOR,
    anchor_type: Optional[str] = None,
    max_step_delta: Optional[float] = None,
    easy_ceiling_nudge: float = TESTING_EASY_MATCH_CEILING_NUDGE,
    mismatch_types: Optional[Union[List[str], np.ndarray]] = None,
) -> np.ndarray:
    """
    Updates a single anchor profile vector based on a batch of completed hikes.
    
    Parameters:
        current_profile: 1D array of 32 floats in [0.0, 1.0]
        trail_vectors: 2D array of (N x 32) floats in [0.0, 1.0]
        scores: 1D array of N recommendation distance scores R_tu in [0.0, 1.0]
        matches: 1D array of N booleans (True = match, False = mismatch)
        weights: Optional 1D or 2D array of factor weights
        beta_divisor: Configurable learning rate divisor
        anchor_type: 'easy' or 'difficult' to govern one-sided directional updates
        max_step_delta: Upper bound on the absolute adjustment per hike per feature
        
    Returns:
        New clamped 32-element float array in [0.0, 1.0]
    """
    p = np.clip(np.array(current_profile, dtype=np.float32).flatten(), 0.0, 1.0)
    
    # Handle empty batch case
    if trail_vectors is None or len(trail_vectors) == 0:
        return p

    trails = np.array(trail_vectors, dtype=np.float32)
    if trails.ndim == 1:
        trails = trails.reshape(1, -1)
        
    n_samples, n_features = trails.shape
    if n_samples == 0:
        return p

    score_arr = np.array(scores, dtype=np.float32).flatten()
    match_arr = np.array(matches, dtype=bool).flatten()

    # Fallback/validation for matching array sizes
    if len(score_arr) < n_samples:
        score_arr = np.pad(score_arr, (0, n_samples - len(score_arr)), constant_values=0.5)
    if len(match_arr) < n_samples:
        match_arr = np.pad(match_arr, (0, n_samples - len(match_arr)), constant_values=True)

    # Weights handling: Support 2D (per-hike weight matrix) or 1D (broadcast to all hikes)
    w_mat = None
    if weights is not None:
        w_arr = np.array(weights, dtype=np.float32)
        if w_arr.ndim == 1:
            # 1D array: broadcast to all N hikes
            if len(w_arr) < n_features:
                w_arr = np.pad(w_arr, (0, n_features - len(w_arr)), constant_values=1.0)
            w_arr = w_arr[:n_features]
            w_mat = np.tile(w_arr, (n_samples, 1))
        elif w_arr.ndim == 2:
            # 2D array: distinct per-hike weight vectors (shape: n_samples x n_features)
            if w_arr.shape[0] < n_samples:
                pad_rows = n_samples - w_arr.shape[0]
                w_arr = np.pad(w_arr, ((0, pad_rows), (0, 0)), constant_values=1.0)
            if w_arr.shape[1] < n_features:
                pad_cols = n_features - w_arr.shape[1]
                w_arr = np.pad(w_arr, ((0, 0), (0, pad_cols)), constant_values=1.0)
            w_mat = w_arr[:n_samples, :n_features]

    if w_mat is None:
        w_mat = np.ones((n_samples, n_features), dtype=np.float32)

    weighted_deltas: List[np.ndarray] = []
    for i in range(n_samples):
        trail_feat = np.clip(trails[i], 0.0, 1.0)
        diff_i = trail_feat - p
        is_match = bool(match_arr[i])
        beta_i = compute_beta(float(score_arr[i]), is_match, divisor=beta_divisor)
        
        # Apply hike-specific factor weights
        hike_w = w_mat[i].copy()
        
        # Feature Presence Gating: For attribute/presence dimensions (indices 6..31),
        # if the trail does not contain the feature (0.0), do not alter user's profile
        if n_features >= 32:
            presence_mask = (trail_feat[6:32] <= 0.0)
            hike_w[6:32][presence_mask] = 0.0

        raw_delta_i = beta_i * diff_i

        # One-Sided / Directional Hinge Logic
        anchor_clean = str(anchor_type).strip().lower() if anchor_type else None
        if anchor_clean:
            if not is_match:
                if anchor_clean == "easy":
                    # Easy Anchor Mismatch: The trail was perceived as too difficult / demanding.
                    # Physical capability anchor should be lowered toward comfortable baseline.
                    for k in range(min(PHYSICAL_INDICES_COUNT, n_features)):
                        if trail_feat[k] < p[k]:
                            # Trail was easier than profile, yet user still struggled: profile was definitely too high
                            raw_delta_i[k] = -abs(beta_i) * max(0.05, (p[k] - trail_feat[k]) * 1.10)
                        else:
                            # Trail was harder than profile: user was over-exerted, adjust comfortable baseline downward
                            # Balanced midpoint (0.38) between baseline (0.25) and aggressive (0.50)
                            raw_delta_i[k] = -abs(beta_i) * max(0.04, p[k]) * 0.38

                elif anchor_clean in ("difficult", "diff"):
                    # Difficult Anchor Mismatch: Can be underwhelming (too easy) or overexerting (too hard).
                    m_kind = str(mismatch_types[i]).lower() if (mismatch_types is not None and i < len(mismatch_types) and mismatch_types[i]) else ""
                    if m_kind == "underwhelming":
                        is_overexertion = False
                    elif m_kind == "overexertion":
                        is_overexertion = True
                    else:
                        is_overexertion = True

                    for k in range(min(PHYSICAL_INDICES_COUNT, n_features)):
                        if is_overexertion:
                            # Severe overexertion: trail far overpowered user, lower difficult anchor toward reality
                            # Balanced midpoint (0.45) between baseline (0.35) and aggressive (0.55)
                            raw_delta_i[k] = -abs(beta_i) * max(0.05, p[k]) * 0.45
                        else:
                            # Underwhelming mismatch: user was under-challenged, raise difficult anchor upward toward 1.0
                            # Balanced midpoint (0.45) between baseline (0.35) and aggressive (0.55)
                            raw_delta_i[k] = abs(beta_i) * max(0.05, 1.0 - p[k]) * 0.45

                # Province protection: Finding a trail physically hard/easy must NEVER debuff province affinity
                if n_features >= 11:
                    raw_delta_i[6:11] = 0.0
            else:
                # One-Sided / Directional Hinge Logic for Matches
                if anchor_clean == "easy":
                    # Easy Anchor Match: The trail was comfortable and manageable.
                    # If trail demands exceeded current easy profile (T_k >= P_k), expand the comfort ceiling!
                    # If trail demands were below current easy profile (T_k < P_k), completing an accessible
                    # trail must NOT penalize physical capacity (preserve capacity ceiling).
                    for k in range(min(PHYSICAL_INDICES_COUNT, n_features)):
                        if trail_feat[k] < p[k]:
                            raw_delta_i[k] = 0.0  # Preserve capacity ceiling
                elif anchor_clean in ("difficult", "diff"):
                    # Difficult Anchor Match:
                    # If trail is at or above profile (T_k >= P_k), standard upward pull to trail.
                    # If trail is below profile (T_k < P_k), completing an accessible trail must NOT penalize upper limit!
                    for k in range(min(PHYSICAL_INDICES_COUNT, n_features)):
                        if trail_feat[k] < p[k]:
                            raw_delta_i[k] = 0.0  # Preserve upper capacity ceiling

        # Apply hike factor weights
        delta_i = hike_w * raw_delta_i

        # Per-feature step clamp (safety rail against extreme jumps)
        if max_step_delta is not None and max_step_delta > 0:
            delta_i = np.clip(delta_i, -max_step_delta, max_step_delta)

        weighted_deltas.append(delta_i)

    # Batched average of weighted deltas across N hikes
    avg_weighted_delta = np.mean(weighted_deltas, axis=0)

    # Update and clamp strictly to [0.0, 1.0]
    updated = np.clip(p + avg_weighted_delta, 0.0, 1.0)
    return updated.astype(np.float32)


def enforce_anchor_monotonicity(
    easy_profile: Union[List[float], np.ndarray],
    diff_profile: Union[List[float], np.ndarray],
    min_gap: float = ANCHOR_MONOTONICITY_MIN_GAP
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Guarantees that an updated Easy anchor does not exceed the Difficult anchor
    in physical exertion metrics (classification, length, elevation, gain, slope, easy rating).
    
    If easy[k] > diff[k], adjusts diff[k] = min(1.0, easy[k] + min_gap).
    """
    easy = np.clip(np.array(easy_profile, dtype=np.float32).copy(), 0.0, 1.0)
    diff = np.clip(np.array(diff_profile, dtype=np.float32).copy(), 0.0, 1.0)

    for k in range(min(PHYSICAL_INDICES_COUNT, len(easy), len(diff))):
        if easy[k] > diff[k]:
            diff[k] = min(1.0, easy[k] + min_gap)

    return easy, diff
