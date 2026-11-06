# THARESYS 40-Trail Generation Report

Generated on: 2026-11-03  
Config SHA-256: `Computed dynamically in config.py`

---

## 1. Catalog Composition

- **Total Trails:** 40
- **Real Trails:** 8 (Mt. Batulao New, Mt. Makiling Traverse, Mt. Kulis, Mt. Batulao Old, Mt. Tagapo, Mariang Makiling Trail, Mt. Sembrano, Mt. Daraitan)
- **Synthetic Trails:** 32 (8 Easy, 8 Moderate, 8 Hard, 8 Very Hard)

---

## 2. Per-Tier Physical Ranges (Seed 42)

| Tier | Trail Count | Length (km) | Elevation (MASL) | Gain (m) | Slope (%) | Lasco Rating | Classification |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Easy** | 8 | 2.32 – 4.71 | 314 – 608 | 88 – 280 | 3.24 – 6.44 | 1 – 3 | Minor (0.0) |
| **Moderate** | 8 | 5.21 – 8.84 | 610 – 958 | 260 – 685 | 5.12 – 9.75 | 3 – 5 | Minor (0.0) |
| **Hard** | 8 | 9.38 – 13.62 | 980 – 1520 | 835 – 1390 | 8.85 – 13.72 | 5 – 7 | Major (1.0) |
| **Very Hard** | 8 | 14.10 – 19.04 | 1550 – 2325 | 1380 – 2124 | 10.60 – 14.00 | 7 – 9 | Major (1.0) |

---

## 3. Geographic & Route Quotas (Synthetic Trails)

- **Provinces:**
  - Cavite: 8 appearances
  - Laguna: 8 appearances
  - Batangas: 8 appearances
  - Rizal: 8 appearances
  - Quezon: 8 appearances
  *(Every CALABARZON province represented $\ge 4$ times; 8 multi-province trails span adjacent provincial boundaries)*

- **Route Types:**
  - `out_and_back`: 16 trails (50%)
  - `traverse`: 8 trails (25%, $\ge 6$)
  - `circular`: 8 trails (25%, $\ge 6$)

---

## 4. Distance, Diversity & Coverage Comparison

| Metric | Real 8 Trails | 40-Trail Catalog (Seed 42) | Robustness Catalog (Seed 7) |
| :--- | :---: | :---: | :---: |
| **Min Pairwise Distance (Euclidean)** | 0.3120 | 0.3120 | 0.2535 |
| **Standard Deviation (Spread)** | 0.0785 | **0.0848** | **0.0853** |
| **Distance Range** | [0.31, 0.65] | [0.31, 0.82] | [0.25, 0.82] |
| **Min Composite Difficulty** | 0.210 | **0.072** *(wider)* | **0.032** *(wider)* |
| **Max Composite Difficulty** | 0.615 | **0.938** *(wider)* | **0.945** *(wider)* |

---

## 5. Simulation Fit Under Disjoint Partitioning

Under `batch_runner.py`'s disjoint Easy/Difficult anchor partitioning with absolute exertion safety ceiling enforcement:
- **Min Unhiked Easy Trails across all 24 cohorts:** 11 (threshold $\ge 5$)
- **Min Unhiked Difficult Trails across all 24 cohorts:** 18 (threshold $\ge 5$)
- **Min Unhiked Trails in Target Anchor:** 11 (threshold $\ge 10$)

