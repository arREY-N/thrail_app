"""
Gower's Distance Metric

Calculates the weighted Gower Distance between two vectors.
Output format:
    0.0 = Identical items (maximum similarity)
    1.0 = Completely different items (maximum dissimilarity)
"""

from typing import Union, List, Optional
import numpy as np


def gower_distance(
    a: Union[List[float], np.ndarray],
    b: Union[List[float], np.ndarray],
    weights: Optional[Union[List[float], np.ndarray]] = None
) -> float:
    """
    Computes Gower's Distance between two numeric vectors whose features are normalized in [0, 1].

    Formula:
        For each feature i:
            score_i = |a_i - b_i|  (since features are in range [0, 1])
        Gower Distance = sum(w_i * score_i) / sum(w_i)

    Args:
        a: First feature vector (values in [0, 1]).
        b: Second feature vector (values in [0, 1]).
        weights: Optional importance weight for each feature. Defaults to equal weights.

    Returns:
        float: Distance score in [0.0, 1.0] (0.0 = identical, 1.0 = completely opposite).
    """
    vec_a = np.asarray(a, dtype=np.float32)
    vec_b = np.asarray(b, dtype=np.float32)

    if vec_a.shape != vec_b.shape:
        raise ValueError(f"Vector shapes must match. Got {vec_a.shape} and {vec_b.shape}")

    if len(vec_a) == 0:
        return 0.0

    # Calculate absolute differences for each feature
    abs_diff = np.abs(vec_a - vec_b)

    # Apply weights if provided, otherwise uniform weights
    if weights is not None:
        w = np.asarray(weights, dtype=np.float32)
        if len(w) != len(vec_a):
            raise ValueError(f"Weights length ({len(w)}) must match vectors length ({len(vec_a)})")
        w_sum = np.sum(w)
        if w_sum <= 0:
            return 1.0
        distance = np.sum(w * abs_diff) / w_sum
    else:
        distance = np.mean(abs_diff)

    # Clamp result to strict [0.0, 1.0] range
    return float(np.clip(distance, 0.0, 1.0))


if __name__ == "__main__":
    # Test 1: Identical items -> should be 0.0
    item_user = [1.0, 0.5, 0.2]
    item_trail_identical = [1.0, 0.5, 0.2]
    print("Identical items:", gower_distance(item_user, item_trail_identical))

    # Test 2: Slightly different items -> close to 0.0
    item_trail_close = [1.0, 0.45, 0.25]
    print("Close items:     ", round(gower_distance(item_user, item_trail_close), 4))

    # Test 3: Completely opposite items -> 1.0
    item_trail_opposite = [0.0, 0.0, 1.0]
    print("Opposite items:  ", round(gower_distance(item_user, item_trail_opposite), 4))
