"""
THARESYS: Thrail App Recommendation System Core Engine

Hybrid Formula:
    R_tu = (alpha * CBF) + ((1 - alpha) * CF)

Where:
    CBF = dist(User_A, Trail_T)
    CF  = Normalized similarity-weighted average of up to top-k eligible peers:
          CF = sum(w_i * dist(User_i, Trail_T)) / sum(w_i)
          where w_i = 1 - dist(User_A, User_i)
          and a peer User_i is eligible iff dist(User_A, User_i) <= tau.
          If no peer is eligible (or sum(w_i) == 0), alpha is set to 1.0 (pure CBF fallback).
"""

from typing import Union, List, Optional, Callable, Dict, Any, Tuple
import numpy as np

# Import distance formulas
from formula import gower_distance, euclidean_distance, cosine_distance

# Import centralized parameters
from parameters import (
    CF_DISTANCE_CUTOFF_TAU,
    CF_TOP_K,
    ALPHA_COLD_START,
    ALPHA_STEADY_STATE,
    ALPHA_STEADY_STATE_USER_THRESHOLD,
    DEFAULT_CBF_ENGINE,
    DEFAULT_CF_ENGINE,
)

# Shorthand aliases for convenience
GD = gower_distance
ED = euclidean_distance
CS = cosine_distance

# Dictionary mapping string names/codes to the actual formula functions
FORMULA_MAP = {
    "GD": gower_distance,
    "gower": gower_distance,
    "gower_distance": gower_distance,
    "ED": euclidean_distance,
    "euclidean": euclidean_distance,
    "euclidean_distance": euclidean_distance,
    "CS": cosine_distance,
    "cosine": cosine_distance,
    "cosine_distance": cosine_distance,
}


def resolve_formula(f: Union[str, Callable]) -> Callable:
    """
    Resolves a formula whether passed as a function (GD, ED, CS) or as a string ('GD', 'ED', 'CS').
    """
    if callable(f):
        return f
    if isinstance(f, str) and f in FORMULA_MAP:
        return FORMULA_MAP[f]
    raise ValueError(f"Unknown formula: {f}. Use GD, ED, CS or 'GD', 'ED', 'CS'.")


def compute_alpha(
    user_count: int,
    steady_state_threshold: int = ALPHA_STEADY_STATE_USER_THRESHOLD,
    cold_start_alpha: float = ALPHA_COLD_START,
    steady_state_alpha: float = ALPHA_STEADY_STATE
) -> float:
    """
    Calculates the dynamic alpha score based on user count.

    Behavior:
        - When user_count <= 1: alpha = cold_start_alpha (default 1.0 = 100% CBF, 0% CF, Cold Start)
        - When user_count increases: alpha smoothly decreases towards steady_state_alpha
        - When user_count >= steady_state_threshold: alpha = steady_state_alpha (default 0.5 = 50% CBF, 50% CF)

    Formula:
        alpha = cold_start_alpha - ((cold_start_alpha - steady_state_alpha) * (user_count - 1) / (steady_state_threshold - 1))
    """
    cs = float(cold_start_alpha)
    ss = float(steady_state_alpha)
    thresh = max(2, int(steady_state_threshold))

    if user_count <= 1:
        return cs
    if user_count >= thresh:
        return ss

    decay_span = cs - ss
    decay = decay_span * (float(user_count - 1) / float(thresh - 1))
    alpha = cs - decay
    low, high = min(ss, cs), max(ss, cs)
    return float(np.clip(alpha, low, high))


def compute_cf_component(
    func_cf: Callable,
    vec_user_a: np.ndarray,
    vec_trail_t: np.ndarray,
    peer_profiles: Optional[Union[List[List[float]], List[np.ndarray], np.ndarray]] = None,
    weights: Optional[Union[List[float], np.ndarray]] = None,
    k: int = CF_TOP_K,
    tau: float = CF_DISTANCE_CUTOFF_TAU,
    base_alpha: float = ALPHA_STEADY_STATE
) -> Tuple[float, float, int]:
    """
    Computes the revised similarity-weighted, tau-gated top-k CF score.

    Formula:
        For eligible peers where dist(u_a, u_i) <= tau:
            weight w_i = 1.0 - dist(u_a, u_i)
            CF = sum(w_i * dist(u_i, t)) / sum(w_i)
        If 0 peers are eligible, effective_alpha = 1.0 (pure CBF fallback) and cf_score = 0.0.

    Returns:
        (cf_score, effective_alpha, eligible_peer_count)
    """
    if peer_profiles is None:
        return 0.0, float(ALPHA_COLD_START), 0

    # Standardize peer_profiles to a list of numpy float arrays
    peers = []
    if isinstance(peer_profiles, np.ndarray) and peer_profiles.ndim == 1:
        peers = [peer_profiles]
    elif isinstance(peer_profiles, list) and len(peer_profiles) > 0 and not isinstance(peer_profiles[0], (list, np.ndarray)):
        peers = [np.asarray(peer_profiles, dtype=np.float32)]
    else:
        peers = [np.asarray(p, dtype=np.float32) for p in peer_profiles]

    if len(peers) == 0:
        return 0.0, float(ALPHA_COLD_START), 0

    # 1. Filter peers where dist(user_a, user_b) <= tau
    eligible_peer_dists: List[Tuple[float, np.ndarray]] = []
    for vec_user_b in peers:
        dist_a_b = float(func_cf(vec_user_a, vec_user_b, weights=weights))
        if dist_a_b <= tau:
            eligible_peer_dists.append((dist_a_b, vec_user_b))

    eligible_count = len(eligible_peer_dists)
    if eligible_count == 0:
        # Fallback to pure CBF when no peer passes tau cutoff
        return 0.0, float(ALPHA_COLD_START), 0

    # 2. Sort ascending by peer distance and take top-k closest peers
    eligible_peer_dists.sort(key=lambda item: item[0])
    selected_k_peers = eligible_peer_dists[:max(1, int(k))]

    # 3. Compute normalized similarity-weighted average
    weights_list: List[float] = []
    trail_dists_list: List[float] = []

    for dist_a_b, vec_user_b in selected_k_peers:
        w_i = max(0.0, 1.0 - dist_a_b)
        dist_b_t = float(func_cf(vec_user_b, vec_trail_t, weights=weights))
        weights_list.append(w_i)
        trail_dists_list.append(dist_b_t)

    sum_weights = sum(weights_list)
    if sum_weights <= 1e-9:
        # Denominator safety guard (e.g. if tau was 1.0 and all peers had dist=1.0)
        return 0.0, float(ALPHA_COLD_START), 0

    cf_score = float(sum(w * d for w, d in zip(weights_list, trail_dists_list)) / sum_weights)
    effective_alpha = float(np.clip(base_alpha, 0.0, 1.0))

    return float(np.clip(cf_score, 0.0, 1.0)), effective_alpha, eligible_count


def engine(
    cbf_engine: Union[str, Callable] = DEFAULT_CBF_ENGINE,
    cf_engine: Union[str, Callable] = DEFAULT_CF_ENGINE,
    array_1: Union[List[float], np.ndarray] = None,
    array_2: Union[List[float], np.ndarray] = None,
    a: float = ALPHA_STEADY_STATE,
    peer_profiles: Optional[Union[List[List[float]], List[np.ndarray], np.ndarray]] = None,
    weights: Optional[Union[List[float], np.ndarray]] = None,
    k: int = CF_TOP_K,
    tau: float = CF_DISTANCE_CUTOFF_TAU
) -> float:
    """
    THARESYS Recommendation Engine Function.

    Calculates the hybrid recommendation score (R_tu) for a user and a trail.

    Parameters:
        cbf_engine: Formula for Content-Based Filtering (GD, ED, or CS)
        cf_engine:  Formula for Collaborative Filtering (GD, ED, or CS)
        array_1:    User A profile vector
        array_2:    Trail T profile vector
        a:          Dynamic alpha score in range [0.5, 1.0]
        peer_profiles: Optional peer user(s) (User B).
        weights:    Optional 1D array of feature importance weights.
        k:          Maximum number of closest eligible peers to evaluate (default: CF_TOP_K)
        tau:        Maximum peer distance cutoff for eligibility (default: CF_DISTANCE_CUTOFF_TAU)

    Returns:
        float: R_tu score in [0.0, 1.0] (near 0.0 = highly recommended, near 1.0 = not recommended)
    """
    func_cbf = resolve_formula(cbf_engine)
    func_cf = resolve_formula(cf_engine)

    vec_user_a = np.asarray(array_1, dtype=np.float32)
    vec_trail_t = np.asarray(array_2, dtype=np.float32)

    # 1. CBF Component: similarity between User A and Trail T
    cbf_score = float(func_cbf(vec_user_a, vec_trail_t, weights=weights))

    # 2. CF Component: similarity-weighted average of up to top-k eligible peers
    cf_score, effective_alpha, _ = compute_cf_component(
        func_cf=func_cf,
        vec_user_a=vec_user_a,
        vec_trail_t=vec_trail_t,
        peer_profiles=peer_profiles,
        weights=weights,
        k=k,
        tau=tau,
        base_alpha=a
    )

    # 3. Final Blended Recommendation Score (R_tu)
    #    R_tu = (alpha * CBF) + ((1 - alpha) * CF)
    r_tu = (effective_alpha * cbf_score) + ((1.0 - effective_alpha) * cf_score)

    return float(np.clip(r_tu, 0.0, 1.0))


def engine_details(
    cbf_engine: Union[str, Callable] = DEFAULT_CBF_ENGINE,
    cf_engine: Union[str, Callable] = DEFAULT_CF_ENGINE,
    array_1: Union[List[float], np.ndarray] = None,
    array_2: Union[List[float], np.ndarray] = None,
    a: float = ALPHA_STEADY_STATE,
    peer_profiles: Optional[Union[List[List[float]], List[np.ndarray], np.ndarray]] = None,
    weights: Optional[Union[List[float], np.ndarray]] = None,
    k: int = CF_TOP_K,
    tau: float = CF_DISTANCE_CUTOFF_TAU
) -> dict:
    """
    Returns full breakdown of THARESYS calculation:
    { "score": float, "cbf": float, "cf": float, "alpha": float, "eligible_peers": int }
    """
    func_cbf = resolve_formula(cbf_engine)
    func_cf = resolve_formula(cf_engine)

    vec_user_a = np.asarray(array_1, dtype=np.float32)
    vec_trail_t = np.asarray(array_2, dtype=np.float32)

    cbf_score = float(func_cbf(vec_user_a, vec_trail_t, weights=weights))

    cf_score, effective_alpha, eligible_count = compute_cf_component(
        func_cf=func_cf,
        vec_user_a=vec_user_a,
        vec_trail_t=vec_trail_t,
        peer_profiles=peer_profiles,
        weights=weights,
        k=k,
        tau=tau,
        base_alpha=a
    )

    r_tu = float(np.clip((effective_alpha * cbf_score) + ((1.0 - effective_alpha) * cf_score), 0.0, 1.0))

    return {
        "score": r_tu,
        "cbf": cbf_score,
        "cf": cf_score,
        "alpha": effective_alpha,
        "eligible_peers": eligible_count
    }


if __name__ == "__main__":
    print("==================================================")
    print("  TESTING REVISED THARESYS CF & HYBRID ENGINE     ")
    print("==================================================")

    user_a = [1.0, 0.4, 0.2, 0.8]      # Target user preference vector
    trail_t = [1.0, 0.45, 0.25, 0.75]  # Candidate trail vector
    peer_b = [1.0, 0.5, 0.3, 0.7]       # A peer hiker with similar taste

    user_count = 10
    a = compute_alpha(user_count)
    print(f"\nUser count = {user_count} -> Dynamic alpha (a) = {a:.4f} (CBF weight: {a:.2f}, CF weight: {1-a:.2f})\n")

    res = engine_details(GD, GD, user_a, trail_t, a, peer_profiles=peer_b)
    print("Sample GD/GD breakdown:", res)
