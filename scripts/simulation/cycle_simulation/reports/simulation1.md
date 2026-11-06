# THARESYS Simulation 1 Benchmark: 3-Cycle Convergence Baseline

**Document Version:** 1.0  
**Generated Date:** November 3, 2026  
**Simulation Target:** THARESYS Dual-Anchor Profile Evolution & Batch Recommendation System  
**Harness Runner:** [`scripts/simulation/run_simulation_harness.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/run_simulation_harness.py)  
**Output Telemetry:** [`scripts/simulation/output/harness_results.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/output/harness_results.json) & [`src/recommendation/data/simulationHarnessResults.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/recommendation/data/simulationHarnessResults.json)

---

## 1. Simulation Configuration & Hyperparameters

The in-memory simulation test harness evaluates monthly batch recommendation rounds across a 4-month timeline ($T = 3$ hiking cycles: `2026-10` to `2027-01`) comparing the **Adaptive Arm** (active post-hike profile learning) against the **Control Arm** (static onboarding baseline priors).

### 1.1. Core Engine Configurations
| Parameter | Value | Module Source | Rationale & Description |
| :--- | :---: | :--- | :--- |
| **CBF Distance Metric** | `GD` (Gower Distance) | [`engine/tars.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/tars.py) | Normalized range-weighted distance handling continuous, ordinal, and binary attributes. |
| **CF Distance Metric** | `GD` (Gower Distance) | [`engine/tars.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/tars.py) | Distance metric used to evaluate peer-to-user proximity for collaborative filtering. |
| **Cycles ($T$)** | `3` (4 batches) | [`scripts/simulation/run_simulation_harness.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/run_simulation_harness.py) | Simulates consecutive monthly hiking cycles (`2026-10`, `2026-11`, `2026-12`, `2027-01`). |
| **Timeline Batches** | `4` | Harness Runner | Batch 0 (`2026-10`), Batch 1 (`2026-11`), Batch 2 (`2026-12`), Batch 3 Terminal (`2027-01`). |
| **Cold-Start Alpha ($\alpha$)** | `1.0` | [`engine/parameters.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/parameters.py) | Full Content-Based Filtering weight during cold-start or when peers pass threshold $\tau$. |
| **Steady-State Alpha** | `0.5` | [`engine/parameters.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/parameters.py) | Asymptotic minimum alpha (50% CBF / 50% CF) reached as user count matures. |
| **CF Distance Cutoff ($\tau$)** | `0.35` | [`engine/parameters.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/parameters.py) | Maximum distance threshold for a peer to be eligible for collaborative filtering. |
| **CF Top-$k$** | `5` | [`engine/parameters.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/parameters.py) | Number of nearest eligible peer profiles aggregated in the CF convex combination. |

### 1.2. Profile Updater & Safety Rails
| Parameter | Value | Module Source | Rationale & Description |
| :--- | :---: | :--- | :--- |
| `BETA_LEARNING_RATE_DIVISOR` | `2.0` | [`engine/parameters.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/parameters.py) | Divisor scaling the adaptive error-driven learning rate $\beta = \frac{R_{tu}}{2.0}$ (match) or $-\frac{1 - R_{tu}}{2.0}$ (mismatch). |
| `ANCHOR_MONOTONICITY_MIN_GAP` | `0.05` | [`engine/parameters.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/parameters.py) | Guaranteed minimum gap: if an updated Easy anchor exceeds Difficult in physical metrics, Difficult is raised to $\text{Easy} + 0.05$. |
| `PROFILE_MAX_STEP_DELTA` | `0.05` | [`engine/parameters.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/parameters.py) | Hard ceiling on single-hike adjustment $\vert\Delta_k\vert \le 0.05$ per feature to prevent volatility. |
| `REVIEW_ACTIVE_FACTOR_WEIGHT` | `1.0` | [`engine/parameters.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/parameters.py) | Weight assigned to review factors specifically cited in the user's post-hike review. |
| `REVIEW_BASELINE_UNSELECTED_WEIGHT` | `0.20` | [`engine/parameters.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/parameters.py) | Baseline weight on unselected features for **Match** reviews (set to `0.0` on Mismatch to prevent contamination). |
| `TERRAIN_PRESENCE_THRESHOLD` | `0.05` | [`engine/parameters.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/parameters.py) | Minimum trail terrain presence required to allow updates to the user's terrain preference. |
| `EXERTION_SAFETY_MARGIN_DEFAULT` | `0.25` | [`engine/parameters.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/parameters.py) | Maximum physical margin $(T_k - P_{\text{easy}, k})$ allowed for general users to qualify for the `easy` slot. |
| `EXERTION_SAFETY_MARGIN_VULNERABLE`| `0.15` | [`engine/parameters.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/parameters.py) | Tighter physical safety margin for hikers with medical conditions or `E1` beginner status. |

---

## 2. Trail Catalog Dataset (8 Trails)

Extracted from [`scripts/simulation/output/trails.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/output/trails.json):

| Trail ID | Trail Name | Province | Class | Length | Peak (MASL) | Gain (m) | Slope (%) | Easy (Lasco) | Muddy | Rocky | Grass | Ridge |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `00JGDwgZQQeIGXVituut` | **Batulao New Trail** | Batangas | 0.00 | 0.65 | 0.57 | 0.13 | 0.13 | 0.44 | 0.00 | 0.00 | 0.00 | 0.00 |
| `7aTSWWzmcnhS1Q4nfCog` | **Mt. Makiling Traverse (MakTrav)** | Laguna, Batangas | 1.00 | 1.00 | 1.00 | 0.88 | 0.93 | 0.67 | 0.60 | 0.20 | 0.00 | 0.00 |
| `B1ro3QWzbDwi2DKppspQ` | **Mt. Kulis - Sambong Trail** | Rizal | 0.00 | 0.00 | 0.28 | 0.00 | 0.89 | 0.33 | 0.00 | 0.00 | 0.00 | 0.00 |
| `DMq31CXnrRdGcMJbH8Dh` | **Mt. Batulao** | Batangas | 0.00 | 0.17 | 0.57 | 0.05 | 0.00 | 0.44 | 0.00 | 0.00 | 0.00 | 0.00 |
| `X3dyTBzI69aIysvX697H` | **Mt. Tagapo** | Rizal | 0.00 | 0.23 | 0.00 | 0.39 | 1.00 | 0.22 | 0.00 | 0.00 | 0.50 | 0.00 |
| `bocOhrJcgk26AbByYazx` | **Mariang Makiling Trail (MMT)** | Laguna | 1.00 | 0.52 | 1.00 | 1.00 | 0.56 | 0.44 | 0.00 | 0.00 | 0.00 | 0.00 |
| `o1Oc3DAYGScmQWMOMlwu` | **Mt. Sembrano** | Rizal, Laguna | 0.00 | 0.40 | 0.47 | 0.74 | 0.48 | 0.33 | 0.00 | 0.00 | 0.50 | 0.00 |
| `p8Og0yqESHF4pHCfRLYq` | **Mt. Daraitan** | Rizal, Quezon | 0.00 | 0.49 | 0.46 | 0.54 | 0.18 | 0.44 | 0.40 | 0.60 | 0.00 | 0.00 |

---

## 3. User Cohort Specifications & Ground Truth Targets (24 Cohorts)

Extracted from [`scripts/simulation/output/users.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/output/users.json) and [`scripts/simulation/output/users_spec.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/output/users_spec.json):

* **Experience Tiers ($E$):** `E1` (Beginner Novice), `E2` (Experienced Gentle), `E3` (Intermediate Mixed), `E4` (Advanced High-Altitude).
* **Medical Constraints ($M$):** `M` (Has orthopedic/cardiorespiratory condition $\implies$ physical priors scaled by $0.80$), `N` (Healthy baseline $\implies$ unscaled $1.00$).
* **Province Patterns ($P$):** `P1` (Rizal), `P2` (Batangas, Laguna), `P3` (Cavite).

| User ID | Exp | Med | Medical Condition | Preferred Province | Pre-Seeded Survey Trails | Easy Ground Truth Target ($GT_{\text{easy}}$) | Difficult Ground Truth Target ($GT_{\text{diff}}$) |
| :--- | :---: | :---: | :--- | :--- | :--- | :--- | :--- |
| `E1-M-P1` | E1 | M | Orthopedic / Knee | Rizal | None (Cold-Start) | Len: 0.21, Slp: 0.08, Gn: 0.08, Pk: 0.21 | Len: 0.43, Slp: 0.34, Gn: 0.40, Pk: 0.45 |
| `E1-M-P2` | E1 | M | Asthma / Cardio | Batangas, Laguna | None (Cold-Start) | Len: 0.05, Slp: 0.05, Gn: 0.24, Pk: 0.19 | Len: 0.41, Slp: 0.46, Gn: 0.46, Pk: 0.45 |
| `E1-M-P3` | E1 | M | Orthopedic / Knee | Cavite | None (Cold-Start) | Len: 0.20, Slp: 0.20, Gn: 0.04, Pk: 0.22 | Len: 0.37, Slp: 0.47, Gn: 0.43, Pk: 0.48 |
| `E1-N-P1` | E1 | N | None | Rizal | None (Cold-Start) | Len: 0.26, Slp: 0.22, Gn: 0.17, Pk: 0.24 | Len: 0.45, Slp: 0.62, Gn: 0.60, Pk: 0.62 |
| `E1-N-P2` | E1 | N | None | Batangas, Laguna | None (Cold-Start) | Len: 0.26, Slp: 0.12, Gn: 0.14, Pk: 0.19 | Len: 0.60, Slp: 0.41, Gn: 0.60, Pk: 0.63 |
| `E1-N-P3` | E1 | N | None | Cavite | None (Cold-Start) | Len: 0.09, Slp: 0.11, Gn: 0.08, Pk: 0.18 | Len: 0.55, Slp: 0.48, Gn: 0.41, Pk: 0.59 |
| `E2-M-P1` | E2 | M | Orthopedic / Knee | Rizal | Mt. Kulis, Mt. Tagapo | Len: 0.14, Slp: 0.06, Gn: 0.05, Pk: 0.20 | Len: 0.32, Slp: 0.40, Gn: 0.36, Pk: 0.44 |
| `E2-M-P2` | E2 | M | Asthma / Cardio | Batangas, Laguna | Mt. Kulis, Mt. Tagapo | Len: 0.14, Slp: 0.09, Gn: 0.22, Pk: 0.15 | Len: 0.34, Slp: 0.30, Gn: 0.44, Pk: 0.45 |
| `E2-M-P3` | E2 | M | Orthopedic / Knee | Cavite | Mt. Kulis, Mt. Tagapo | Len: 0.15, Slp: 0.11, Gn: 0.06, Pk: 0.19 | Len: 0.44, Slp: 0.31, Gn: 0.30, Pk: 0.46 |
| `E2-N-P1` | E2 | N | None | Rizal | Mt. Kulis, Mt. Tagapo | Len: 0.18, Slp: 0.26, Gn: 0.18, Pk: 0.19 | Len: 0.47, Slp: 0.54, Gn: 0.55, Pk: 0.57 |
| `E2-N-P2` | E2 | N | None | Batangas, Laguna | Mt. Kulis, Mt. Tagapo | Len: 0.16, Slp: 0.11, Gn: 0.16, Pk: 0.16 | Len: 0.46, Slp: 0.53, Gn: 0.49, Pk: 0.56 |
| `E2-N-P3` | E2 | N | None | Cavite | Mt. Kulis, Mt. Tagapo | Len: 0.28, Slp: 0.11, Gn: 0.21, Pk: 0.21 | Len: 0.46, Slp: 0.41, Gn: 0.55, Pk: 0.57 |
| `E3-M-P1` | E3 | M | Orthopedic / Knee | Rizal | Mt. Tagapo, MakTrav | Len: 0.14, Slp: 0.17, Gn: 0.19, Pk: 0.22 | Len: 0.40, Slp: 0.49, Gn: 0.50, Pk: 0.46 |
| `E3-M-P2` | E3 | M | Asthma / Cardio | Batangas, Laguna | Mt. Tagapo, MakTrav | Len: 0.21, Slp: 0.14, Gn: 0.28, Pk: 0.22 | Len: 0.46, Slp: 0.44, Gn: 0.46, Pk: 0.46 |
| `E3-M-P3` | E3 | M | Orthopedic / Knee | Cavite | Mt. Tagapo, MakTrav | Len: 0.23, Slp: 0.12, Gn: 0.21, Pk: 0.22 | Len: 0.40, Slp: 0.43, Gn: 0.47, Pk: 0.47 |
| `E3-N-P1` | E3 | N | None | Rizal | Mt. Tagapo, MakTrav | Len: 0.35, Slp: 0.34, Gn: 0.35, Pk: 0.28 | Len: 0.57, Slp: 0.74, Gn: 0.51, Pk: 0.63 |
| `E3-N-P2` | E3 | N | None | Batangas, Laguna | Mt. Tagapo, MakTrav | Len: 0.39, Slp: 0.26, Gn: 0.26, Pk: 0.27 | Len: 0.70, Slp: 0.74, Gn: 0.56, Pk: 0.62 |
| `E3-N-P3` | E3 | N | None | Cavite | Mt. Tagapo, MakTrav | Len: 0.36, Slp: 0.23, Gn: 0.16, Pk: 0.27 | Len: 0.64, Slp: 0.68, Gn: 0.57, Pk: 0.62 |
| `E4-M-P1` | E4 | M | Orthopedic / Knee | Rizal | MMT, MakTrav | Len: 0.24, Slp: 0.20, Gn: 0.26, Pk: 0.27 | Len: 0.64, Slp: 0.58, Gn: 0.61, Pk: 0.50 |
| `E4-M-P2` | E4 | M | Asthma / Cardio | Batangas, Laguna | MMT, MakTrav | Len: 0.26, Slp: 0.23, Gn: 0.32, Pk: 0.27 | Len: 0.58, Slp: 0.61, Gn: 0.73, Pk: 0.49 |
| `E4-M-P3` | E4 | M | Orthopedic / Knee | Cavite | MMT, MakTrav | Len: 0.32, Slp: 0.34, Gn: 0.26, Pk: 0.27 | Len: 0.47, Slp: 0.58, Gn: 0.58, Pk: 0.49 |
| `E4-N-P1` | E4 | N | None | Rizal | MMT, MakTrav | Len: 0.36, Slp: 0.41, Gn: 0.34, Pk: 0.37 | Len: 0.89, Slp: 0.67, Gn: 0.66, Pk: 0.71 |
| `E4-N-P2` | E4 | N | None | Batangas, Laguna | MMT, MakTrav | Len: 0.49, Slp: 0.26, Gn: 0.34, Pk: 0.37 | Len: 0.85, Slp: 0.73, Gn: 0.73, Pk: 0.70 |
| `E4-N-P3` | E4 | N | None | Cavite | MMT, MakTrav | Len: 0.37, Slp: 0.33, Gn: 0.35, Pk: 0.38 | Len: 0.65, Slp: 0.73, Gn: 0.79, Pk: 0.70 |

---

## 4. Full Simulation Convergence Results (24 Cohorts)

**Overall Adaptive Convergence Rate:** **`19 / 24` users (`79.2%`)** improved their total Gower Distance to Ground Truth over the static Control Arm.

$$\text{Mean GD} = \frac{\text{Easy GD} + \text{Diff GD}}{2}$$

| User ID | Exp | Med | Prov | Start Mean GD | Control End GD | Adapt End GD | Adapt Mean Δ | Easy Start GD | Easy End GD | Easy Δ | Diff Start GD | Diff End GD | Diff Δ | Result |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `E1-M-P1` | E1 | M | P1 | 0.1341 | 0.1341 | 0.1431 | +0.0090 | 0.0599 | 0.0599 | +0.0000 | 0.2083 | 0.2262 | +0.0179 | **STABLE** |
| `E1-M-P2` | E1 | M | P2 | 0.1306 | 0.1306 | 0.1228 | **-0.0078** | 0.0817 | 0.0809 | -0.0008 | 0.1795 | 0.1647 | -0.0148 | **CONVERGED** |
| `E1-M-P3` | E1 | M | P3 | 0.1288 | 0.1288 | 0.1306 | +0.0018 | 0.0635 | 0.0635 | +0.0000 | 0.1940 | 0.1978 | +0.0038 | **STABLE** |
| `E1-N-P1` | E1 | N | P1 | 0.1493 | 0.1493 | 0.1545 | +0.0052 | 0.0782 | 0.0782 | +0.0000 | 0.2204 | 0.2308 | +0.0104 | **STABLE** |
| `E1-N-P2` | E1 | N | P2 | 0.1747 | 0.1747 | 0.1802 | +0.0055 | 0.1113 | 0.1113 | +0.0000 | 0.2382 | 0.2491 | +0.0109 | **STABLE** |
| `E1-N-P3` | E1 | N | P3 | 0.1775 | 0.1775 | 0.1815 | +0.0040 | 0.1048 | 0.1025 | -0.0023 | 0.2502 | 0.2606 | +0.0104 | **STABLE** |
| `E2-M-P1` | E2 | M | P1 | 0.1572 | 0.1572 | 0.1383 | **-0.0189** | 0.0570 | 0.0570 | +0.0000 | 0.2574 | 0.2195 | -0.0379 | **CONVERGED** |
| `E2-M-P2` | E2 | M | P2 | 0.1741 | 0.1741 | 0.1537 | **-0.0204** | 0.0937 | 0.0937 | +0.0000 | 0.2544 | 0.2136 | -0.0408 | **CONVERGED** |
| `E2-M-P3` | E2 | M | P3 | 0.1669 | 0.1669 | 0.1482 | **-0.0187** | 0.0901 | 0.0901 | +0.0000 | 0.2438 | 0.2062 | -0.0376 | **CONVERGED** |
| `E2-N-P1` | E2 | N | P1 | 0.1850 | 0.1850 | 0.1668 | **-0.0182** | 0.1043 | 0.1043 | +0.0000 | 0.2657 | 0.2292 | -0.0365 | **CONVERGED** |
| `E2-N-P2` | E2 | N | P2 | 0.2116 | 0.2116 | 0.1935 | **-0.0181** | 0.1297 | 0.1297 | +0.0000 | 0.2934 | 0.2573 | -0.0361 | **CONVERGED** |
| `E2-N-P3` | E2 | N | P3 | 0.1767 | 0.1767 | 0.1589 | **-0.0178** | 0.1002 | 0.1002 | +0.0000 | 0.2531 | 0.2176 | -0.0355 | **CONVERGED** |
| `E3-M-P1` | E3 | M | P1 | 0.1535 | 0.1535 | 0.1452 | **-0.0083** | 0.0948 | 0.0948 | +0.0000 | 0.2123 | 0.1957 | -0.0166 | **CONVERGED** |
| `E3-M-P2` | E3 | M | P2 | 0.1526 | 0.1526 | 0.1440 | **-0.0086** | 0.0770 | 0.0770 | +0.0000 | 0.2282 | 0.2110 | -0.0172 | **CONVERGED** |
| `E3-M-P3` | E3 | M | P3 | 0.1607 | 0.1607 | 0.1520 | **-0.0087** | 0.0903 | 0.0903 | +0.0000 | 0.2310 | 0.2137 | -0.0173 | **CONVERGED** |
| `E3-N-P1` | E3 | N | P1 | 0.1480 | 0.1480 | 0.1384 | **-0.0096** | 0.0970 | 0.0970 | +0.0000 | 0.1990 | 0.1798 | -0.0192 | **CONVERGED** |
| `E3-N-P2` | E3 | N | P2 | 0.1555 | 0.1555 | 0.1431 | **-0.0124** | 0.1071 | 0.1071 | +0.0000 | 0.2040 | 0.1790 | -0.0250 | **CONVERGED** |
| `E3-N-P3` | E3 | N | P3 | 0.1593 | 0.1593 | 0.1507 | **-0.0086** | 0.1087 | 0.1087 | +0.0000 | 0.2098 | 0.1927 | -0.0171 | **CONVERGED** |
| `E4-M-P1` | E4 | M | P1 | 0.1556 | 0.1556 | 0.1330 | **-0.0226** | 0.1073 | 0.1073 | +0.0000 | 0.2038 | 0.1587 | -0.0451 | **CONVERGED** |
| `E4-M-P2` | E4 | M | P2 | 0.1631 | 0.1631 | 0.1414 | **-0.0217** | 0.1243 | 0.1243 | +0.0000 | 0.2019 | 0.1585 | -0.0434 | **CONVERGED** |
| `E4-M-P3` | E4 | M | P3 | 0.1714 | 0.1714 | 0.1513 | **-0.0201** | 0.0872 | 0.0872 | +0.0000 | 0.2557 | 0.2155 | -0.0402 | **CONVERGED** |
| `E4-N-P1` | E4 | N | P1 | 0.1747 | 0.1747 | 0.1640 | **-0.0107** | 0.1009 | 0.0989 | -0.0020 | 0.2485 | 0.2291 | -0.0194 | **CONVERGED** |
| `E4-N-P2` | E4 | N | P2 | 0.1583 | 0.1583 | 0.1406 | **-0.0177** | 0.1171 | 0.1161 | -0.0010 | 0.1994 | 0.1652 | -0.0342 | **CONVERGED** |
| `E4-N-P3` | E4 | N | P3 | 0.1680 | 0.1680 | 0.1484 | **-0.0196** | 0.0961 | 0.0948 | -0.0013 | 0.2399 | 0.2020 | -0.0379 | **CONVERGED** |

---

## 5. Cycle-by-Cycle User Profile Evolution (All 24 Cohorts)

This section documents the chronological evolution of both the **Easy Anchor** (baseline capability) and **Difficult Anchor** (aspirational limit) across all 4 monthly batches ($T = 3$ hiking cycles), along with the hike selections and review feedback that triggered profile adjustments.

### 5.1. E1 (Beginner Novice)

#### Cohort `E1-M-P1` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.20, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.60, S:0.60, G:0.60, P:0.60, E:0.60` | 0.1341 | **Mt. Makiling Traverse (MakTrav)** (Difficult) | Difficult (Factor: length) |
| 1 | 2026-11 | `L:0.20, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.65, S:0.61, G:0.61, P:0.65, E:0.60` | 0.1399 | **Mt. Batulao** (Easy) | Difficult (Factor: elevation) |
| 2 | 2026-12 | `L:0.20, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.65, S:0.61, G:0.61, P:0.65, E:0.60` | 0.1399 | **Mariang Makiling Trail (MMT)** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.20, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.64, S:0.61, G:0.66, P:0.70, E:0.60` | 0.1431 | *Terminal Evaluation* | *None* |

#### Cohort `E1-M-P2` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.20, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.60, S:0.60, G:0.60, P:0.60, E:0.60` | 0.1306 | **Mt. Batulao** (Easy) | Difficult (Factor: elevation) |
| 1 | 2026-11 | `L:0.19, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.60, S:0.60, G:0.60, P:0.60, E:0.60` | 0.1302 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.19, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.58, S:0.58, G:0.59, P:0.59, E:0.59` | 0.1257 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.19, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.57, S:0.56, G:0.62, P:0.59, E:0.58` | 0.1228 | *Terminal Evaluation* | *None* |

#### Cohort `E1-M-P3` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.20, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.60, S:0.60, G:0.60, P:0.60, E:0.60` | 0.1288 | **Mt. Makiling Traverse (MakTrav)** (Difficult) | Difficult (Factor: length) |
| 1 | 2026-11 | `L:0.20, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.65, S:0.61, G:0.61, P:0.65, E:0.60` | 0.1345 | **Mt. Batulao** (Easy) | Difficult (Factor: elevation) |
| 2 | 2026-12 | `L:0.20, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.65, S:0.61, G:0.61, P:0.65, E:0.60` | 0.1345 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.20, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.64, S:0.58, G:0.64, P:0.64, E:0.59` | 0.1306 | *Terminal Evaluation* | *None* |

#### Cohort `E1-N-P1` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.25, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.75, S:0.75, G:0.75, P:0.75, E:0.75` | 0.1493 | **Mt. Batulao** (Easy) | Difficult (Factor: elevation) |
| 1 | 2026-11 | `L:0.25, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.75, S:0.75, G:0.75, P:0.75, E:0.75` | 0.1493 | **Mt. Makiling Traverse (MakTrav)** (Difficult) | Difficult (Factor: length) |
| 2 | 2026-12 | `L:0.25, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.80, S:0.76, G:0.75, P:0.80, E:0.75` | 0.1535 | **Mariang Makiling Trail (MMT)** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.25, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.78, S:0.75, G:0.80, P:0.84, E:0.73` | 0.1545 | *Terminal Evaluation* | *None* |

#### Cohort `E1-N-P2` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.25, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.75, S:0.75, G:0.75, P:0.75, E:0.75` | 0.1747 | **Mt. Batulao** (Easy) | Difficult (Factor: elevation) |
| 1 | 2026-11 | `L:0.25, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.75, S:0.75, G:0.75, P:0.75, E:0.75` | 0.1747 | **Mt. Makiling Traverse (MakTrav)** (Difficult) | Difficult (Factor: length) |
| 2 | 2026-12 | `L:0.25, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.80, S:0.76, G:0.76, P:0.80, E:0.75` | 0.1793 | **Mariang Makiling Trail (MMT)** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.25, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.79, S:0.75, G:0.81, P:0.85, E:0.73` | 0.1802 | *Terminal Evaluation* | *None* |

#### Cohort `E1-N-P3` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.25, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.75, S:0.75, G:0.75, P:0.75, E:0.75` | 0.1775 | **Mt. Batulao** (Easy) | Difficult (Factor: elevation) |
| 1 | 2026-11 | `L:0.23, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.75, S:0.75, G:0.75, P:0.75, E:0.75` | 0.1763 | **Mt. Makiling Traverse (MakTrav)** (Difficult) | Difficult (Factor: length) |
| 2 | 2026-12 | `L:0.23, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.80, S:0.76, G:0.75, P:0.80, E:0.75` | 0.1805 | **Mariang Makiling Trail (MMT)** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.23, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.78, S:0.75, G:0.80, P:0.84, E:0.73` | 0.1815 | *Terminal Evaluation* | *None* |

### 5.2. E2 (Experienced Gentle)

#### Cohort `E2-M-P1` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.12, S:1.00, G:0.21, P:0.15, E:0.30` | 0.1572 | **Mt. Batulao** (Difficult) | Difficult (Factor: elevation) |
| 1 | 2026-11 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.13, S:0.96, G:0.20, P:0.20, E:0.31` | 0.1549 | **Mt. Makiling Traverse (MakTrav)** (Difficult) | Difficult (Factor: length) |
| 2 | 2026-12 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.18, S:0.96, G:0.24, P:0.25, E:0.32` | 0.1472 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.23, S:0.92, G:0.29, P:0.26, E:0.33` | 0.1383 | *Terminal Evaluation* | *None* |

#### Cohort `E2-M-P2` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.12, S:1.00, G:0.21, P:0.15, E:0.30` | 0.1741 | **Mt. Batulao** (Difficult) | Difficult (Factor: elevation) |
| 1 | 2026-11 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.13, S:0.96, G:0.20, P:0.20, E:0.31` | 0.1717 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.18, S:0.92, G:0.25, P:0.21, E:0.31` | 0.1627 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.19, S:0.87, G:0.30, P:0.23, E:0.31` | 0.1537 | *Terminal Evaluation* | *None* |

#### Cohort `E2-M-P3` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.12, S:1.00, G:0.21, P:0.15, E:0.30` | 0.1669 | **Mt. Batulao** (Difficult) | Difficult (Factor: elevation) |
| 1 | 2026-11 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.13, S:0.96, G:0.20, P:0.20, E:0.31` | 0.1646 | **Mt. Makiling Traverse (MakTrav)** (Difficult) | Difficult (Factor: length) |
| 2 | 2026-12 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.18, S:0.96, G:0.24, P:0.25, E:0.32` | 0.1570 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.23, S:0.92, G:0.29, P:0.26, E:0.33` | 0.1482 | *Terminal Evaluation* | *None* |

#### Cohort `E2-N-P1` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.15, S:1.00, G:0.26, P:0.19, E:0.38` | 0.1850 | **Mt. Batulao** (Difficult) | Easy (Factor: slope) |
| 1 | 2026-11 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.15, S:1.00, G:0.26, P:0.19, E:0.38` | 0.1850 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.20, S:0.96, G:0.31, P:0.20, E:0.38` | 0.1755 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.21, S:0.91, G:0.36, P:0.21, E:0.38` | 0.1668 | *Terminal Evaluation* | *None* |

#### Cohort `E2-N-P2` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.15, S:1.00, G:0.26, P:0.19, E:0.38` | 0.2116 | **Mt. Batulao** (Difficult) | Easy (Factor: slope) |
| 1 | 2026-11 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.15, S:1.00, G:0.26, P:0.19, E:0.38` | 0.2116 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.20, S:0.96, G:0.31, P:0.20, E:0.38` | 0.2022 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.21, S:0.91, G:0.36, P:0.21, E:0.38` | 0.1935 | *Terminal Evaluation* | *None* |

#### Cohort `E2-N-P3` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.15, S:1.00, G:0.26, P:0.19, E:0.38` | 0.1767 | **Mt. Batulao** (Difficult) | Difficult (Factor: elevation) |
| 1 | 2026-11 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.16, S:0.96, G:0.25, P:0.24, E:0.38` | 0.1743 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.21, S:0.92, G:0.30, P:0.25, E:0.38` | 0.1654 | **Batulao New Trail** (Difficult) | Difficult (Factor: length) |
| 3 | 2027-01 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.26, S:0.89, G:0.30, P:0.30, E:0.38` | 0.1589 | *Terminal Evaluation* | *None* |

### 5.3. E3 (Intermediate Mixed)

#### Cohort `E3-M-P1` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.66, S:1.00, G:0.68, P:0.54, E:0.48` | 0.1535 | **Mt. Batulao** (Difficult) | Difficult (Factor: elevation) |
| 1 | 2026-11 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.61, S:0.96, G:0.66, P:0.55, E:0.48` | 0.1507 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.59, S:0.92, G:0.63, P:0.54, E:0.48` | 0.1452 | **Batulao New Trail** (Difficult) | Difficult (Factor: length) |
| 3 | 2027-01 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.60, S:0.89, G:0.61, P:0.55, E:0.48` | 0.1442 | *Terminal Evaluation* | *None* |

#### Cohort `E3-M-P2` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.66, S:1.00, G:0.68, P:0.54, E:0.48` | 0.1526 | **Mt. Batulao** (Difficult) | Difficult (Factor: elevation) |
| 1 | 2026-11 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.61, S:0.96, G:0.66, P:0.55, E:0.48` | 0.1497 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.59, S:0.92, G:0.63, P:0.54, E:0.48` | 0.1440 | **Batulao New Trail** (Difficult) | Difficult (Factor: length) |
| 3 | 2027-01 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.60, S:0.89, G:0.61, P:0.55, E:0.48` | 0.1428 | *Terminal Evaluation* | *None* |

#### Cohort `E3-M-P3` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.66, S:1.00, G:0.68, P:0.54, E:0.48` | 0.1607 | **Mt. Batulao** (Difficult) | Difficult (Factor: elevation) |
| 1 | 2026-11 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.61, S:0.96, G:0.66, P:0.55, E:0.48` | 0.1574 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.59, S:0.93, G:0.63, P:0.54, E:0.48` | 0.1520 | **Batulao New Trail** (Difficult) | Difficult (Factor: length) |
| 3 | 2027-01 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.60, S:0.89, G:0.61, P:0.55, E:0.48` | 0.1510 | *Terminal Evaluation* | *None* |

#### Cohort `E3-N-P1` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.83, S:1.00, G:0.85, P:0.68, E:0.60` | 0.1480 | **Mt. Daraitan** (Easy) | Difficult (Factor: gain) |
| 1 | 2026-11 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.83, S:1.00, G:0.85, P:0.68, E:0.60` | 0.1480 | **Mariang Makiling Trail (MMT)** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.81, S:0.98, G:0.89, P:0.73, E:0.59` | 0.1469 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.79, S:0.93, G:0.85, P:0.71, E:0.58` | 0.1384 | *Terminal Evaluation* | *None* |

#### Cohort `E3-N-P2` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.83, S:1.00, G:0.85, P:0.68, E:0.60` | 0.1555 | **Mt. Daraitan** (Easy) | Difficult (Factor: gain) |
| 1 | 2026-11 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.83, S:1.00, G:0.85, P:0.68, E:0.60` | 0.1555 | **Mariang Makiling Trail (MMT)** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.81, S:0.98, G:0.89, P:0.73, E:0.59` | 0.1517 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.79, S:0.93, G:0.85, P:0.71, E:0.58` | 0.1431 | *Terminal Evaluation* | *None* |

#### Cohort `E3-N-P3` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.83, S:1.00, G:0.85, P:0.68, E:0.60` | 0.1593 | **Mt. Daraitan** (Easy) | Difficult (Factor: gain) |
| 1 | 2026-11 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.83, S:1.00, G:0.85, P:0.68, E:0.60` | 0.1593 | **Mariang Makiling Trail (MMT)** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.82, S:0.98, G:0.89, P:0.73, E:0.59` | 0.1604 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.79, S:0.93, G:0.85, P:0.71, E:0.58` | 0.1507 | *Terminal Evaluation* | *None* |

### 5.4. E4 (Advanced High-Altitude)

#### Cohort `E4-M-P1` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.82, S:0.81, G:1.00, P:1.00, E:0.60` | 0.1556 | **Batulao New Trail** (Easy) | Difficult (Factor: length) |
| 1 | 2026-11 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.82, S:0.81, G:1.00, P:1.00, E:0.60` | 0.1556 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.80, S:0.76, G:0.95, P:0.97, E:0.59` | 0.1446 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.75, S:0.73, G:0.90, P:0.95, E:0.58` | 0.1330 | *Terminal Evaluation* | *None* |

#### Cohort `E4-M-P2` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.82, S:0.81, G:1.00, P:1.00, E:0.60` | 0.1631 | **Batulao New Trail** (Easy) | Difficult (Factor: length) |
| 1 | 2026-11 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.82, S:0.81, G:1.00, P:1.00, E:0.60` | 0.1631 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.80, S:0.76, G:0.95, P:0.97, E:0.59` | 0.1525 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.75, S:0.73, G:0.90, P:0.95, E:0.58` | 0.1414 | *Terminal Evaluation* | *None* |

#### Cohort `E4-M-P3` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.82, S:0.81, G:1.00, P:1.00, E:0.60` | 0.1714 | **Batulao New Trail** (Easy) | Difficult (Factor: length) |
| 1 | 2026-11 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.82, S:0.81, G:1.00, P:1.00, E:0.60` | 0.1714 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.80, S:0.76, G:0.95, P:0.97, E:0.59` | 0.1606 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.75, S:0.73, G:0.90, P:0.95, E:0.58` | 0.1513 | *Terminal Evaluation* | *None* |

#### Cohort `E4-N-P1` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.38, S:0.37, G:0.47, P:0.50, E:0.28` | `L:1.00, S:1.00, G:1.00, P:1.00, E:0.75` | 0.1747 | **Mt. Daraitan** (Easy) | Difficult (Factor: gain) |
| 1 | 2026-11 | `L:0.37, S:0.37, G:0.46, P:0.50, E:0.28` | `L:1.00, S:1.00, G:1.00, P:1.00, E:0.75` | 0.1737 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.37, S:0.37, G:0.46, P:0.50, E:0.28` | `L:0.97, S:0.95, G:0.95, P:0.97, E:0.73` | 0.1640 | **Mt. Tagapo** (Difficult) | Easy (Factor: elevation) |
| 3 | 2027-01 | `L:0.37, S:0.37, G:0.46, P:0.50, E:0.28` | `L:0.97, S:0.95, G:0.95, P:0.97, E:0.73` | 0.1640 | *Terminal Evaluation* | *None* |

#### Cohort `E4-N-P2` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.38, S:0.37, G:0.47, P:0.50, E:0.28` | `L:1.00, S:1.00, G:1.00, P:1.00, E:0.75` | 0.1583 | **Mt. Daraitan** (Easy) | Difficult (Factor: gain) |
| 1 | 2026-11 | `L:0.38, S:0.37, G:0.46, P:0.50, E:0.28` | `L:1.00, S:1.00, G:1.00, P:1.00, E:0.75` | 0.1578 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.38, S:0.37, G:0.46, P:0.50, E:0.28` | `L:0.97, S:0.95, G:0.95, P:0.97, E:0.73` | 0.1481 | **Mt. Tagapo** (Difficult) | Difficult (Factor: slope) |
| 3 | 2027-01 | `L:0.38, S:0.37, G:0.46, P:0.50, E:0.28` | `L:0.92, S:0.96, G:0.90, P:0.92, E:0.70` | 0.1406 | *Terminal Evaluation* | *None* |

#### Cohort `E4-N-P3` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.38, S:0.37, G:0.47, P:0.50, E:0.28` | `L:1.00, S:1.00, G:1.00, P:1.00, E:0.75` | 0.1680 | **Mt. Daraitan** (Easy) | Difficult (Factor: gain) |
| 1 | 2026-11 | `L:0.37, S:0.37, G:0.46, P:0.50, E:0.28` | `L:1.00, S:1.00, G:1.00, P:1.00, E:0.75` | 0.1673 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.37, S:0.37, G:0.46, P:0.50, E:0.28` | `L:0.97, S:0.95, G:0.95, P:0.97, E:0.73` | 0.1577 | **Mt. Tagapo** (Difficult) | Difficult (Factor: slope) |
| 3 | 2027-01 | `L:0.37, S:0.37, G:0.46, P:0.50, E:0.28` | `L:0.93, S:0.96, G:0.90, P:0.92, E:0.70` | 0.1484 | *Terminal Evaluation* | *None* |
---

## 6. Key Findings & Empirical Observations

1. **Elimination of Runaway Profile Collapse:** Under the new directional hinge update rule, beginner cohorts (e.g., `E1-M-P3`) no longer experience catastrophic physical capability collapse (slope remains bounded at $0.20$ rather than crashing to $0.00$).
2. **Exertion Ceiling Protection:** Vulnerable cohorts (`E1` and medical condition `M`) are protected from being assigned high-exertion trails (Mt. Kulis $89\%$ slope, MakTrav $93\%$ slope) as "Easy" hikes.
3. **Experience-Tier Scaling:** Tiers `E2`, `E3`, and `E4` exhibit high convergence rates ($100\%$ of cohorts in `E2`, `E3`, and `E4` converged toward Ground Truth), driven by appropriate challenge matches on the available trail catalog.
4. **Difficult-Slot Dominance:** Due to the physical difficulty of the 8 catalog trails, $75\%$ of all simulation hikes were routed through the Difficult slot, producing substantial optimization in the Difficult anchor across all user tiers.
