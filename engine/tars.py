"""
THARESYS: Thrail App Recommendation System Core Engine

Formula:
    R_tu = (alpha * CBF) + ( (1 - alpha) * CF )
Where:
    CBF = distance(User_A, Trail_T)
    CF  = average over all Peer Users B of [ distance(User_A, User_B) * distance(User_B, Trail_T) ]
"""

from typing import Union, List, Optional, Callable
import numpy as np

# Import the 3 standalone formulas
from formula import gower_distance, euclidean_distance, cosine_distance

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


def compute_alpha(user_count: int, steady_state_threshold: int = 50) -> float:
    """
    Calculates the dynamic alpha score based on user count.

    Behavior:
        - When user_count <= 1: alpha = 1.0 (100% CBF, 0% CF, Cold Start)
        - When user_count increases: alpha smoothly decreases towards 0.5
        - When user_count >= steady_state_threshold: alpha = 0.5 (50% CBF, 50% CF, Steady State)

    Formula:
        alpha = 1.0 - (0.5 * (user_count - 1) / (steady_state_threshold - 1))
    """
    if user_count <= 1:
        return 1.0
    if user_count >= steady_state_threshold:
        return 0.5

    # Linear decay from 1.0 down to 0.5
    decay = 0.5 * (float(user_count - 1) / float(steady_state_threshold - 1))
    alpha = 1.0 - decay
    return float(np.clip(alpha, 0.5, 1.0))


def engine(
    cbf_engine: Union[str, Callable],
    cf_engine: Union[str, Callable],
    array_1: Union[List[float], np.ndarray],
    array_2: Union[List[float], np.ndarray],
    a: float,
    peer_profiles: Optional[Union[List[List[float]], List[np.ndarray], np.ndarray]] = None,
    weights: Optional[Union[List[float], np.ndarray]] = None
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
        peer_profiles: Optional peer user(s) (User B) who have hiked or reviewed trails.
                       Can be a single profile vector or a list of profile vectors.
        weights:    Optional 1D array of feature importance weights.

    Returns:
        float: R_tu score in [0.0, 1.0] (near 0.0 = highly recommended, near 1.0 = not recommended)
    """
    # 1. Resolve formula functions
    func_cbf = resolve_formula(cbf_engine)
    func_cf = resolve_formula(cf_engine)

    vec_user_a = np.asarray(array_1, dtype=np.float32)
    vec_trail_t = np.asarray(array_2, dtype=np.float32)

    # 2. CBF Component: similarity between User A and Trail T
    cbf_score = func_cbf(vec_user_a, vec_trail_t, weights=weights)

    # 3. CF Component: similarity between User A and Peer User(s) B, and Peer User(s) B and Trail T
    #    Formula: (User_A - User_B) * (User_B - Trail_T)
    cf_score = 0.0

    if peer_profiles is not None:
        # Standardize peer_profiles to a list of vectors
        peers = []
        if isinstance(peer_profiles, np.ndarray) and peer_profiles.ndim == 1:
            peers = [peer_profiles]
        elif isinstance(peer_profiles, list) and len(peer_profiles) > 0 and not isinstance(peer_profiles[0], (list, np.ndarray)):
            # Single vector passed as a list of floats
            peers = [np.asarray(peer_profiles, dtype=np.float32)]
        else:
            peers = [np.asarray(p, dtype=np.float32) for p in peer_profiles]

        if len(peers) > 0:
            peer_terms = []
            for vec_user_b in peers:
                # Distance between User A and Peer User B
                dist_a_b = func_cf(vec_user_a, vec_user_b, weights=weights)
                # Distance between Peer User B and Trail T
                dist_b_t = func_cf(vec_user_b, vec_trail_t, weights=weights)
                # Product of the two distances
                peer_terms.append(dist_a_b * dist_b_t)

            cf_score = float(np.mean(peer_terms))

    # 4. Final Blended Recommendation Score (R_tu)
    #    R_tu = (alpha * CBF) + ((1 - alpha) * CF)
    alpha = float(np.clip(a, 0.0, 1.0))
    r_tu = (alpha * cbf_score) + ((1.0 - alpha) * cf_score)

    return float(np.clip(r_tu, 0.0, 1.0))


def engine_details(
    cbf_engine: Union[str, Callable],
    cf_engine: Union[str, Callable],
    array_1: Union[List[float], np.ndarray],
    array_2: Union[List[float], np.ndarray],
    a: float,
    peer_profiles: Optional[Union[List[List[float]], List[np.ndarray], np.ndarray]] = None,
    weights: Optional[Union[List[float], np.ndarray]] = None
) -> dict:
    """
    Returns full breakdown of THARESYS calculation:
    { "score": float, "cbf": float, "cf": float, "alpha": float }
    """
    func_cbf = resolve_formula(cbf_engine)
    func_cf = resolve_formula(cf_engine)

    vec_user_a = np.asarray(array_1, dtype=np.float32)
    vec_trail_t = np.asarray(array_2, dtype=np.float32)

    cbf_score = float(func_cbf(vec_user_a, vec_trail_t, weights=weights))
    cf_score = 0.0

    if peer_profiles is not None:
        peers = []
        if isinstance(peer_profiles, np.ndarray) and peer_profiles.ndim == 1:
            peers = [peer_profiles]
        elif isinstance(peer_profiles, list) and len(peer_profiles) > 0 and not isinstance(peer_profiles[0], (list, np.ndarray)):
            peers = [np.asarray(peer_profiles, dtype=np.float32)]
        else:
            peers = [np.asarray(p, dtype=np.float32) for p in peer_profiles]

        if len(peers) > 0:
            peer_terms = []
            for vec_user_b in peers:
                dist_a_b = func_cf(vec_user_a, vec_user_b, weights=weights)
                dist_b_t = func_cf(vec_user_b, vec_trail_t, weights=weights)
                peer_terms.append(dist_a_b * dist_b_t)
            cf_score = float(np.mean(peer_terms))

    alpha = float(np.clip(a, 0.0, 1.0))
    r_tu = float(np.clip((alpha * cbf_score) + ((1.0 - alpha) * cf_score), 0.0, 1.0))

    return {
        "score": r_tu,
        "cbf": cbf_score,
        "cf": cf_score,
        "alpha": alpha
    }


if __name__ == "__main__":
    print("==================================================")
    print("  TESTING THARESYS ENGINE FUNCTION WITH COMBINATIONS  ")
    print("==================================================")

    # Sample data
    user_a = [1.0, 0.4, 0.2, 0.8]      # Target user preference vector
    trail_t = [1.0, 0.45, 0.25, 0.75]  # Candidate trail vector
    peer_b = [1.0, 0.5, 0.3, 0.7]       # A peer hiker with similar taste

    # Alpha computed before processing
    user_count = 10
    a = compute_alpha(user_count)
    print(f"\nUser count = {user_count} -> Dynamic alpha (a) = {a:.4f} (CBF weight: {a:.2f}, CF weight: {1-a:.2f})\n")

    # Testing different formula combinations as requested
    scoreA = engine(GD, GD, user_a, trail_t, a, peer_profiles=peer_b)
    scoreB = engine(GD, ED, user_a, trail_t, a, peer_profiles=peer_b)
    scoreC = engine(GD, CS, user_a, trail_t, a, peer_profiles=peer_b)
    scoreD = engine(ED, GD, user_a, trail_t, a, peer_profiles=peer_b)
    scoreE = engine(ED, ED, user_a, trail_t, a, peer_profiles=peer_b)
    scoreF = engine(ED, CS, user_a, trail_t, a, peer_profiles=peer_b)
    scoreG = engine(CS, GD, user_a, trail_t, a, peer_profiles=peer_b)
    scoreH = engine(CS, ED, user_a, trail_t, a, peer_profiles=peer_b)
    scoreI = engine(CS, CS, user_a, trail_t, a, peer_profiles=peer_b)

    print("Set 1 (CBF: GD, CF: GD):", round(scoreA, 5))
    print("Set 2 (CBF: GD, CF: ED):", round(scoreB, 5))
    print("Set 3 (CBF: GD, CF: CS):", round(scoreC, 5))
    print("Set 4 (CBF: ED, CF: GD):", round(scoreD, 5))
    print("Set 5 (CBF: ED, CF: ED):", round(scoreE, 5))
    print("Set 6 (CBF: ED, CF: CS):", round(scoreF, 5))
    print("Set 7 (CBF: CS, CF: GD):", round(scoreG, 5))
    print("Set 8 (CBF: CS, CF: ED):", round(scoreH, 5))
    print("Set 9 (CBF: CS, CF: CS):", round(scoreI, 5))
