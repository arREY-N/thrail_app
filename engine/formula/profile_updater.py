"""
Adaptive Profile Update Engine for THARESYS

Computes error-driven profile evolution using completed hike feedback:
    Delta = Trail - Profile
    beta = R_tu / 2 if match else -(1 - R_tu) / 2
    Avg_Delta = mean(beta * Delta)
    P_new = clamp(Profile + Weights * Avg_Delta, 0.0, 1.0)
"""

from typing import Optional, Union, List, Tuple
import numpy as np

FEATURE_VECTOR_SIZE = 32
PHYSICAL_INDICES_COUNT = 6  # Indices 0-5: classification, length, elevation, gain, slope, easy


def compute_beta(rtu_score: float, is_match: bool) -> float:
    """
    Computes the adaptive error-driven learning rate beta.
    
    Parameters:
        rtu_score: Recommendation distance in [0.0, 1.0] (0.0 = match, 1.0 = distant)
        is_match: User experience indicator (True = match, False = mismatch)
        
    Returns:
        beta scalar in [-0.5, +0.5]
    """
    score = max(0.0, min(1.0, float(rtu_score)))
    if is_match:
        return score / 2.0
    else:
        return -(1.0 - score) / 2.0


def update_profile_vector(
    current_profile: Union[List[float], np.ndarray],
    trail_vectors: Union[List[List[float]], np.ndarray],
    scores: Union[List[float], np.ndarray],
    matches: Union[List[bool], np.ndarray],
    weights: Optional[Union[List[float], np.ndarray]] = None
) -> np.ndarray:
    """
    Updates a single anchor profile vector based on a batch of completed hikes.
    
    Parameters:
        current_profile: 1D array of 32 floats in [0.0, 1.0]
        trail_vectors: 2D array of (N x 32) floats in [0.0, 1.0]
        scores: 1D array of N recommendation distance scores R_tu in [0.0, 1.0]
        matches: 1D array of N booleans (True = match, False = mismatch)
        weights: Optional 1D array of 32 factor weights, defaults to uniform 1.0
        
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
        # Vector difference: moving towards trail on match (Trail - Profile)
        diff_i = trail_feat - p
        beta_i = compute_beta(float(score_arr[i]), bool(match_arr[i]))
        # Apply hike-specific factor weights directly to this hike's delta BEFORE averaging
        hike_w = w_mat[i].copy()
        # Feature Presence Gating: For attribute/presence dimensions (indices 6..31),
        # if the trail does not contain the feature (0.0), do not alter user's profile
        if n_features >= 32:
            presence_mask = (trail_feat[6:32] <= 0.0)
            hike_w[6:32][presence_mask] = 0.0

        weighted_delta_i = hike_w * (beta_i * diff_i)
        weighted_deltas.append(weighted_delta_i)

    # Batched average of weighted deltas across N hikes
    avg_weighted_delta = np.mean(weighted_deltas, axis=0)

    # Update and clamp strictly to [0.0, 1.0]
    updated = np.clip(p + avg_weighted_delta, 0.0, 1.0)
    return updated.astype(np.float32)


def enforce_anchor_monotonicity(
    easy_profile: Union[List[float], np.ndarray],
    diff_profile: Union[List[float], np.ndarray],
    min_gap: float = 0.05
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
