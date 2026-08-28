"""
@file gower_engine.py
@description Gower's Distance Similarity Engine handling mixed data types.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional

class GowerSimilarityEngine:
    @staticmethod
    def compute_numerical_similarity(val_a: float, val_b: float, val_range: float) -> float:
        if val_range == 0:
            return 1.0
        diff = abs(val_a - val_b)
        sim = 1.0 - (diff / val_range)
        return float(np.clip(sim, 0.0, 1.0))

    @staticmethod
    def compute_ordinal_similarity(val_a: float, val_b: float, min_val: float = 1.0, max_val: float = 9.0) -> float:
        val_range = max_val - min_val
        if val_range == 0:
            return 1.0
        diff = abs(val_a - val_b)
        sim = 1.0 - (diff / val_range)
        return float(np.clip(sim, 0.0, 1.0))

    @staticmethod
    def compute_nominal_similarity(val_a: Any, val_b: Any) -> float:
        return 1.0 if str(val_a).strip().lower() == str(val_b).strip().lower() else 0.0
