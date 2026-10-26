"""
Test script comparing all 3 distance formulas side-by-side.
"""

from formula import gower_distance, euclidean_distance, cosine_distance


def compare_metrics(name: str, a: list, b: list):
    print(f"\n--- {name} ---")
    print(f"Vector A: {a}")
    print(f"Vector B: {b}")

    gower = gower_distance(a, b)
    euclid = euclidean_distance(a, b)
    cosine = cosine_distance(a, b)

    print(f"  Gower Distance:     {gower:.4f}")
    print(f"  Euclidean (Norm):   {euclid:.4f}")
    print(f"  Cosine Distance:    {cosine:.4f}")


if __name__ == "__main__":
    print("==================================================")
    print("  COMPARING THE 3 ENGINE DISTANCE METRICS         ")
    print("  Output scale: 0.0 = Identical, 1.0 = Dissimilar ")
    print("==================================================")

    # 1. Identical items
    compare_metrics("Test 1: Perfectly Identical Items", 
                    [1.0, 0.4, 0.2, 1.0], 
                    [1.0, 0.4, 0.2, 1.0])

    # 2. Very Similar items (small difference)
    compare_metrics("Test 2: Very Similar Items", 
                    [1.0, 0.4, 0.2, 1.0], 
                    [1.0, 0.45, 0.25, 1.0])

    # 3. Moderately Different items
    compare_metrics("Test 3: Moderately Different Items", 
                    [1.0, 0.2, 0.1, 0.0], 
                    [0.0, 0.6, 0.5, 1.0])

    # 4. Completely Opposite / Orthogonal items
    compare_metrics("Test 4: Completely Opposite Items", 
                    [1.0, 1.0, 0.0, 0.0], 
                    [0.0, 0.0, 1.0, 1.0])
