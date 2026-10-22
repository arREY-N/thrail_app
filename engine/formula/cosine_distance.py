"""
Cosine Distance Metric

Calculates the Cosine Distance between two vectors.
Output format:
    0.0 = Identical items (maximum similarity)
    1.0 = Completely different items (maximum dissimilarity)
"""

from typing import Union, List, Optional
import numpy as np


def cosine_distance(
    a: Union[List[float], np.ndarray],
    b: Union[List[float], np.ndarray],
    weights: Optional[Union[List[float], np.ndarray]] = None
) -> float:
    """
    Computes Cosine Distance between two numeric vectors whose features are in [0, 1].

    Why Cosine Distance is used:
        Standard Cosine Similarity calculates the angle between two vectors:
            Cosine Similarity = (a · b) / ( ||a|| * ||b|| )
        For non-negative vectors in [0, 1], Cosine Similarity produces:
            1.0 = Identical orientation (same profile direction)
            0.0 = Orthogonal (completely dissimilar)

        To match our required format (0 = identical, 1 = dissimilar),
        we convert similarity to Cosine Distance:
            Cosine Distance = 1.0 - Cosine Similarity

    Args:
        a: First feature vector (values in [0, 1]).
        b: Second feature vector (values in [0, 1]).
        weights: Optional importance weight for each feature.

    Returns:
        float: Distance score in [0.0, 1.0] (0.0 = identical, 1.0 = completely opposite).
    """
    vec_a = np.asarray(a, dtype=np.float32)
    vec_b = np.asarray(b, dtype=np.float32)

    if vec_a.shape != vec_b.shape:
        raise ValueError(f"Vector shapes must match. Got {vec_a.shape} and {vec_b.shape}")

    if len(vec_a) == 0:
        return 0.0

    # Apply feature weights if provided
    if weights is not None:
        w = np.sqrt(np.asarray(weights, dtype=np.float32))
        if len(w) != len(vec_a):
            raise ValueError(f"Weights length ({len(w)}) must match vectors length ({len(vec_a)})")
        vec_a = vec_a * w
        vec_b = vec_b * w

    # Calculate L2 norms (magnitudes)
    norm_a = float(np.linalg.norm(vec_a))
    norm_b = float(np.linalg.norm(vec_b))

    # Edge cases: zero vectors
    if norm_a == 0.0 and norm_b == 0.0:
        return 0.0  # Both are completely empty / zero -> identical
    if norm_a == 0.0 or norm_b == 0.0:
        return 1.0  # One is empty and the other is not -> completely dissimilar

    # Dot product and cosine similarity
    dot_product = float(np.dot(vec_a, vec_b))
    cosine_sim = dot_product / (norm_a * norm_b)

    # Convert similarity (1=same, 0=different) into distance (0=same, 1=different)
    cosine_dist = 1.0 - cosine_sim

    # Clamp result to strict [0.0, 1.0] range
    return float(np.clip(cosine_dist, 0.0, 1.0))


if __name__ == "__main__":
    # Test 1: Identical items -> should be 0.0
    item_user = [1.0, 0.5, 0.2]
    item_trail_identical = [1.0, 0.5, 0.2]
    print("Identical items:", cosine_distance(item_user, item_trail_identical))

    # Test 2: Slightly different items -> close to 0.0
    item_trail_close = [1.0, 0.45, 0.25]
    print("Close items:     ", round(cosine_distance(item_user, item_trail_close), 4))

    # Test 3: Completely orthogonal items -> 1.0
    item_user_only_first = [1.0, 0.0, 0.0]
    item_trail_other = [0.0, 1.0, 1.0]
    print("Opposite items:  ", round(cosine_distance(item_user_only_first, item_trail_other), 4))
