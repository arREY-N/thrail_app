"""
Normalized Euclidean Distance Metric

Calculates the Normalized Euclidean Distance between two vectors.
Output format:
    0.0 = Identical items (maximum similarity)
    1.0 = Completely different items (maximum dissimilarity)
"""

from typing import Union, List, Optional
import numpy as np


def euclidean_distance(
    a: Union[List[float], np.ndarray],
    b: Union[List[float], np.ndarray],
    weights: Optional[Union[List[float], np.ndarray]] = None
) -> float:
    """
    Computes Normalized Euclidean Distance between two numeric vectors whose features are in [0, 1].

    Why Normalization is needed:
        Standard Euclidean Distance is: sqrt( sum( (a_i - b_i)^2 ) )
        If two vectors have dimension n, the maximum possible distance is sqrt(n).
        For example, with 17 features, standard Euclidean distance can reach sqrt(17) ≈ 4.123!
        
        To normalize the output strictly to [0.0, 1.0]:
        We divide by sqrt(n) (or sqrt(sum of weights)), which gives the Root Mean Squared Difference:
            Normalized Distance = sqrt( sum( w_i * (a_i - b_i)^2 ) / sum(w_i) )

    Args:
        a: First feature vector (values in [0, 1]).
        b: Second feature vector (values in [0, 1]).
        weights: Optional importance weight for each feature. Defaults to equal weights.

    Returns:
        float: Normalized distance in [0.0, 1.0] (0.0 = identical, 1.0 = completely opposite).
    """
    vec_a = np.asarray(a, dtype=np.float32)
    vec_b = np.asarray(b, dtype=np.float32)

    if vec_a.shape != vec_b.shape:
        raise ValueError(f"Vector shapes must match. Got {vec_a.shape} and {vec_b.shape}")

    n = len(vec_a)
    if n == 0:
        return 0.0

    # Squared differences
    squared_diff = (vec_a - vec_b) ** 2

    if weights is not None:
        w = np.asarray(weights, dtype=np.float32)
        if len(w) != n:
            raise ValueError(f"Weights length ({len(w)}) must match vectors length ({n})")
        w_sum = np.sum(w)
        if w_sum <= 0:
            return 1.0
        # Weighted mean squared difference, then square root
        mean_squared = np.sum(w * squared_diff) / w_sum
    else:
        # Uniform mean squared difference, then square root
        mean_squared = np.mean(squared_diff)

    distance = np.sqrt(mean_squared)

    # Clamp result to strict [0.0, 1.0] range
    return float(np.clip(distance, 0.0, 1.0))


if __name__ == "__main__":
    # Test 1: Identical items -> should be 0.0
    item_user = [1.0, 0.5, 0.2]
    item_trail_identical = [1.0, 0.5, 0.2]
    print("Identical items:", euclidean_distance(item_user, item_trail_identical))

    # Test 2: Slightly different items -> close to 0.0
    item_trail_close = [1.0, 0.45, 0.25]
    print("Close items:     ", round(euclidean_distance(item_user, item_trail_close), 4))

    # Test 3: Completely opposite items -> 1.0 (WITHOUT normalization this would have been sqrt(3) ≈ 1.732)
    item_trail_opposite = [0.0, 0.0, 1.0]
    print("Opposite items:  ", round(euclidean_distance(item_user, item_trail_opposite), 4))
