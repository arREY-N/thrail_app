# THARESYS Simulation 2 Benchmark: 5-Cycle Evolution & Strict Exhaustion Rehike Results

**Document Version:** 2.0  
**Generated Date:** November 3, 2026  
**Simulation Target:** THARESYS Dual-Anchor Profile Evolution & Batch Recommendation System  
**Harness Runner:** [`scripts/simulation/run_simulation_harness.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/run_simulation_harness.py)  
**Output Telemetry:** [`scripts/simulation/output/harness_results.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/output/harness_results.json) & [`src/recommendation/data/simulationHarnessResults.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/recommendation/data/simulationHarnessResults.json)

---

## 1. Simulation Configuration & Hyperparameters

The in-memory simulation test harness evaluates monthly batch recommendation rounds across a 6-month timeline ($T = 5$ hiking cycles: `2026-10` to `2027-03`) comparing the **Adaptive Arm** (active post-hike profile learning) against the **Control Arm** (static onboarding baseline priors).

### 1.1. Core Engine Configurations
| Parameter | Value | Module Source | Rationale & Description |
| :--- | :---: | :--- | :--- |
| **CBF Distance Metric** | `GD` (Gower Distance) | [`engine/tars.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/tars.py) | Normalized range-weighted distance handling continuous, ordinal, and binary attributes. |
| **CF Distance Metric** | `GD` (Gower Distance) | [`engine/tars.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/tars.py) | Distance metric used to evaluate peer-to-user proximity for collaborative filtering. |
| **Cycles ($T$)** | `5` (6 batches) | [`scripts/simulation/run_simulation_harness.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/run_simulation_harness.py) | Simulates consecutive monthly hiking cycles (`2026-10`, `2026-11`, `2026-12`, `2027-01`, `2027-02`, `2027-03`). |
| **Timeline Batches** | `6` | Harness Runner | Batch 0 (`2026-10`), Batch 1 (`2026-11`), Batch 2 (`2026-12`), Batch 3 (`2027-01`), Batch 4 (`2027-02`), Batch 5 Terminal (`2027-03`). |
| **Rehike Policy** | `Exhaustion Only` | Harness Runner | A rehike is allowed **if and only if** all unhiked candidate trails across both easy and difficult slots have been exhausted; least-recently hiked trails are prioritized on rehike. |
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

## 4. Full Simulation Convergence Results (24 Cohorts, 5 Cycles)

**Overall Adaptive Convergence Rate:** **`22 / 24` users (`91.7%`)** improved their total Gower Distance to Ground Truth over the static Control Arm (an increase from `79.2%` under 3 cycles).

$$\text{Mean GD} = \frac{\text{Easy GD} + \text{Diff GD}}{2}$$

| User ID | Exp | Med | Prov | Start Mean GD | Control End GD | Adapt End GD | Adapt Mean Δ | Easy Start GD | Easy End GD | Easy Δ | Diff Start GD | Diff End GD | Diff Δ | Result |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `E1-M-P1` | E1 | M | P1 | 0.1341 | 0.1341 | 0.1355 | **+0.0014** | 0.0599 | 0.0599 | +0.0000 | 0.2083 | 0.2111 | +0.0028 | **STABLE** |
| `E1-M-P2` | E1 | M | P2 | 0.1306 | 0.1306 | 0.1326 | **+0.0020** | 0.0817 | 0.0809 | -0.0008 | 0.1795 | 0.1842 | +0.0047 | **STABLE** |
| `E1-M-P3` | E1 | M | P3 | 0.1288 | 0.1288 | 0.1281 | **-0.0007** | 0.0635 | 0.0635 | +0.0000 | 0.1940 | 0.1928 | -0.0012 | **CONVERGED** |
| `E1-N-P1` | E1 | N | P1 | 0.1493 | 0.1493 | 0.1378 | **-0.0115** | 0.0782 | 0.0782 | +0.0000 | 0.2204 | 0.1973 | -0.0231 | **CONVERGED** |
| `E1-N-P2` | E1 | N | P2 | 0.1747 | 0.1747 | 0.1617 | **-0.0130** | 0.1113 | 0.1113 | +0.0000 | 0.2382 | 0.2121 | -0.0261 | **CONVERGED** |
| `E1-N-P3` | E1 | N | P3 | 0.1775 | 0.1775 | 0.1648 | **-0.0127** | 0.1048 | 0.1025 | -0.0023 | 0.2502 | 0.2272 | -0.0230 | **CONVERGED** |
| `E2-M-P1` | E2 | M | P1 | 0.1572 | 0.1572 | 0.1241 | **-0.0331** | 0.0570 | 0.0570 | +0.0000 | 0.2574 | 0.1912 | -0.0662 | **CONVERGED** |
| `E2-M-P2` | E2 | M | P2 | 0.1741 | 0.1741 | 0.1410 | **-0.0331** | 0.0937 | 0.0937 | +0.0000 | 0.2544 | 0.1883 | -0.0661 | **CONVERGED** |
| `E2-M-P3` | E2 | M | P3 | 0.1669 | 0.1669 | 0.1369 | **-0.0300** | 0.0901 | 0.0901 | +0.0000 | 0.2438 | 0.1837 | -0.0601 | **CONVERGED** |
| `E2-N-P1` | E2 | N | P1 | 0.1850 | 0.1850 | 0.1538 | **-0.0312** | 0.1043 | 0.1043 | +0.0000 | 0.2657 | 0.2034 | -0.0623 | **CONVERGED** |
| `E2-N-P2` | E2 | N | P2 | 0.2116 | 0.2116 | 0.1798 | **-0.0318** | 0.1297 | 0.1297 | +0.0000 | 0.2934 | 0.2299 | -0.0635 | **CONVERGED** |
| `E2-N-P3` | E2 | N | P3 | 0.1767 | 0.1767 | 0.1457 | **-0.0310** | 0.1002 | 0.1002 | +0.0000 | 0.2531 | 0.1911 | -0.0620 | **CONVERGED** |
| `E3-M-P1` | E3 | M | P1 | 0.1535 | 0.1535 | 0.1431 | **-0.0104** | 0.0948 | 0.0948 | +0.0000 | 0.2123 | 0.1915 | -0.0208 | **CONVERGED** |
| `E3-M-P2` | E3 | M | P2 | 0.1526 | 0.1526 | 0.1410 | **-0.0116** | 0.0770 | 0.0770 | +0.0000 | 0.2282 | 0.2050 | -0.0232 | **CONVERGED** |
| `E3-M-P3` | E3 | M | P3 | 0.1607 | 0.1607 | 0.1499 | **-0.0108** | 0.0903 | 0.0903 | +0.0000 | 0.2310 | 0.2096 | -0.0214 | **CONVERGED** |
| `E3-N-P1` | E3 | N | P1 | 0.1480 | 0.1480 | 0.1281 | **-0.0199** | 0.0970 | 0.0970 | +0.0000 | 0.1990 | 0.1593 | -0.0397 | **CONVERGED** |
| `E3-N-P2` | E3 | N | P2 | 0.1555 | 0.1555 | 0.1365 | **-0.0190** | 0.1071 | 0.1071 | +0.0000 | 0.2040 | 0.1658 | -0.0382 | **CONVERGED** |
| `E3-N-P3` | E3 | N | P3 | 0.1593 | 0.1593 | 0.1391 | **-0.0202** | 0.1087 | 0.1087 | +0.0000 | 0.2098 | 0.1696 | -0.0402 | **CONVERGED** |
| `E4-M-P1` | E4 | M | P1 | 0.1556 | 0.1556 | 0.1295 | **-0.0261** | 0.1073 | 0.1073 | +0.0000 | 0.2038 | 0.1516 | -0.0522 | **CONVERGED** |
| `E4-M-P2` | E4 | M | P2 | 0.1631 | 0.1631 | 0.1259 | **-0.0372** | 0.1243 | 0.1243 | +0.0000 | 0.2019 | 0.1275 | -0.0744 | **CONVERGED** |
| `E4-M-P3` | E4 | M | P3 | 0.1714 | 0.1714 | 0.1352 | **-0.0362** | 0.0872 | 0.0872 | +0.0000 | 0.2557 | 0.1832 | -0.0725 | **CONVERGED** |
| `E4-N-P1` | E4 | N | P1 | 0.1747 | 0.1747 | 0.1635 | **-0.0112** | 0.1009 | 0.0979 | -0.0030 | 0.2485 | 0.2291 | -0.0194 | **CONVERGED** |
| `E4-N-P2` | E4 | N | P2 | 0.1583 | 0.1583 | 0.1298 | **-0.0285** | 0.1171 | 0.1151 | -0.0020 | 0.1994 | 0.1445 | -0.0549 | **CONVERGED** |
| `E4-N-P3` | E4 | N | P3 | 0.1680 | 0.1680 | 0.1479 | **-0.0201** | 0.0961 | 0.0938 | -0.0023 | 0.2399 | 0.2020 | -0.0379 | **CONVERGED** |

---

## 5. Cycle-by-Cycle User Profile Evolution (All 24 Cohorts)

This section documents the chronological evolution of both the **Easy Anchor** (baseline capability) and **Difficult Anchor** (aspirational limit) across all 6 monthly batches ($T = 5$ hiking cycles), along with the hike selections and review feedback that triggered profile adjustments.

### 5.1. E1 (Beginner Novice)

#### Cohort `E1-M-P1` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.20, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.60, S:0.60, G:0.60, P:0.60, E:0.60` | 0.1341 | **Mt. Makiling Traverse (MakTrav)** (Difficult) | Difficult (Factor: length) |
| 1 | 2026-11 | `L:0.20, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.65, S:0.61, G:0.61, P:0.65, E:0.60` | 0.1399 | **Mt. Batulao** (Easy) | Difficult (Factor: elevation) |
| 2 | 2026-12 | `L:0.20, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.65, S:0.61, G:0.61, P:0.65, E:0.60` | 0.1399 | **Mariang Makiling Trail (MMT)** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.20, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.64, S:0.61, G:0.66, P:0.70, E:0.60` | 0.1431 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 4 | 2027-02 | `L:0.20, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.63, S:0.58, G:0.68, P:0.69, E:0.58` | 0.1386 | **Batulao New Trail** (Difficult) | Difficult (Factor: length) |
| 5 | 2027-03 | `L:0.20, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.64, S:0.56, G:0.65, P:0.66, E:0.58` | 0.1355 | *Terminal Evaluation* | *None* |

#### Cohort `E1-M-P2` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.20, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.60, S:0.60, G:0.60, P:0.60, E:0.60` | 0.1306 | **Mt. Batulao** (Easy) | Difficult (Factor: elevation) |
| 1 | 2026-11 | `L:0.19, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.60, S:0.60, G:0.60, P:0.60, E:0.60` | 0.1302 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.19, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.58, S:0.58, G:0.59, P:0.59, E:0.59` | 0.1257 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.19, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.57, S:0.56, G:0.62, P:0.59, E:0.58` | 0.1228 | **Mariang Makiling Trail (MMT)** (Difficult) | Difficult (Factor: gain) |
| 4 | 2027-02 | `L:0.19, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.57, S:0.56, G:0.67, P:0.64, E:0.58` | 0.1265 | **Mt. Makiling Traverse (MakTrav)** (Difficult) | Difficult (Factor: length) |
| 5 | 2027-03 | `L:0.19, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.62, S:0.58, G:0.68, P:0.69, E:0.58` | 0.1326 | *Terminal Evaluation* | *None* |

#### Cohort `E1-M-P3` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.20, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.60, S:0.60, G:0.60, P:0.60, E:0.60` | 0.1288 | **Mt. Makiling Traverse (MakTrav)** (Difficult) | Difficult (Factor: length) |
| 1 | 2026-11 | `L:0.20, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.65, S:0.61, G:0.61, P:0.65, E:0.60` | 0.1345 | **Mt. Batulao** (Easy) | Difficult (Factor: elevation) |
| 2 | 2026-12 | `L:0.20, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.65, S:0.61, G:0.61, P:0.65, E:0.60` | 0.1345 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.20, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.64, S:0.58, G:0.64, P:0.64, E:0.59` | 0.1306 | **Mariang Makiling Trail (MMT)** (Difficult) | Difficult (Factor: gain) |
| 4 | 2027-02 | `L:0.20, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.63, S:0.58, G:0.69, P:0.69, E:0.59` | 0.1341 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 5 | 2027-03 | `L:0.20, S:0.20, G:0.20, P:0.20, E:0.20` | `L:0.60, S:0.57, G:0.66, P:0.68, E:0.58` | 0.1281 | *Terminal Evaluation* | *None* |

#### Cohort `E1-N-P1` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.25, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.75, S:0.75, G:0.75, P:0.75, E:0.75` | 0.1493 | **Mt. Batulao** (Easy) | Difficult (Factor: elevation) |
| 1 | 2026-11 | `L:0.25, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.75, S:0.75, G:0.75, P:0.75, E:0.75` | 0.1493 | **Mt. Makiling Traverse (MakTrav)** (Difficult) | Difficult (Factor: length) |
| 2 | 2026-12 | `L:0.25, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.80, S:0.76, G:0.75, P:0.80, E:0.75` | 0.1535 | **Mariang Makiling Trail (MMT)** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.25, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.78, S:0.75, G:0.80, P:0.84, E:0.73` | 0.1545 | **Batulao New Trail** (Difficult) | Difficult (Factor: length) |
| 4 | 2027-02 | `L:0.25, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.75, S:0.72, G:0.77, P:0.79, E:0.72` | 0.1460 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 5 | 2027-03 | `L:0.25, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.74, S:0.67, G:0.76, P:0.78, E:0.70` | 0.1378 | *Terminal Evaluation* | *None* |

#### Cohort `E1-N-P2` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.25, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.75, S:0.75, G:0.75, P:0.75, E:0.75` | 0.1747 | **Mt. Batulao** (Easy) | Difficult (Factor: elevation) |
| 1 | 2026-11 | `L:0.25, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.75, S:0.75, G:0.75, P:0.75, E:0.75` | 0.1747 | **Mt. Makiling Traverse (MakTrav)** (Difficult) | Difficult (Factor: length) |
| 2 | 2026-12 | `L:0.25, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.80, S:0.76, G:0.76, P:0.80, E:0.75` | 0.1793 | **Mariang Makiling Trail (MMT)** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.25, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.79, S:0.75, G:0.81, P:0.85, E:0.73` | 0.1802 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 4 | 2027-02 | `L:0.25, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.77, S:0.70, G:0.79, P:0.83, E:0.71` | 0.1711 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 5 | 2027-03 | `L:0.25, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.72, S:0.67, G:0.74, P:0.81, E:0.70` | 0.1617 | *Terminal Evaluation* | *None* |

#### Cohort `E1-N-P3` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.25, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.75, S:0.75, G:0.75, P:0.75, E:0.75` | 0.1775 | **Mt. Batulao** (Easy) | Difficult (Factor: elevation) |
| 1 | 2026-11 | `L:0.23, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.75, S:0.75, G:0.75, P:0.75, E:0.75` | 0.1763 | **Mt. Makiling Traverse (MakTrav)** (Difficult) | Difficult (Factor: length) |
| 2 | 2026-12 | `L:0.23, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.80, S:0.76, G:0.75, P:0.80, E:0.75` | 0.1805 | **Mariang Makiling Trail (MMT)** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.23, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.78, S:0.75, G:0.80, P:0.84, E:0.73` | 0.1815 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 4 | 2027-02 | `L:0.23, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.77, S:0.70, G:0.79, P:0.82, E:0.71` | 0.1726 | **Batulao New Trail** (Difficult) | Difficult (Factor: length) |
| 5 | 2027-03 | `L:0.23, S:0.25, G:0.25, P:0.25, E:0.25` | `L:0.74, S:0.67, G:0.76, P:0.77, E:0.70` | 0.1648 | *Terminal Evaluation* | *None* |

### 5.2. E2 (Experienced Gentle)

#### Cohort `E2-M-P1` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.12, S:1.00, G:0.21, P:0.15, E:0.30` | 0.1572 | **Mt. Batulao** (Difficult) | Difficult (Factor: elevation) |
| 1 | 2026-11 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.13, S:0.96, G:0.20, P:0.20, E:0.31` | 0.1549 | **Mt. Makiling Traverse (MakTrav)** (Difficult) | Difficult (Factor: length) |
| 2 | 2026-12 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.18, S:0.96, G:0.24, P:0.25, E:0.32` | 0.1472 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.23, S:0.92, G:0.29, P:0.26, E:0.33` | 0.1383 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 4 | 2027-02 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.24, S:0.87, G:0.34, P:0.27, E:0.33` | 0.1297 | **Batulao New Trail** (Difficult) | Difficult (Factor: length) |
| 5 | 2027-03 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.29, S:0.83, G:0.33, P:0.32, E:0.34` | 0.1241 | *Terminal Evaluation* | *None* |

#### Cohort `E2-M-P2` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.12, S:1.00, G:0.21, P:0.15, E:0.30` | 0.1741 | **Mt. Batulao** (Difficult) | Difficult (Factor: elevation) |
| 1 | 2026-11 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.13, S:0.96, G:0.20, P:0.20, E:0.31` | 0.1717 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.18, S:0.92, G:0.25, P:0.21, E:0.31` | 0.1627 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.19, S:0.87, G:0.30, P:0.23, E:0.31` | 0.1537 | **Batulao New Trail** (Difficult) | Difficult (Factor: length) |
| 4 | 2027-02 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.24, S:0.84, G:0.29, P:0.28, E:0.32` | 0.1477 | **Mt. Makiling Traverse (MakTrav)** (Difficult) | Difficult (Factor: length) |
| 5 | 2027-03 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.29, S:0.84, G:0.32, P:0.33, E:0.34` | 0.1410 | *Terminal Evaluation* | *None* |

#### Cohort `E2-M-P3` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.12, S:1.00, G:0.21, P:0.15, E:0.30` | 0.1669 | **Mt. Batulao** (Difficult) | Difficult (Factor: elevation) |
| 1 | 2026-11 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.13, S:0.96, G:0.20, P:0.20, E:0.31` | 0.1646 | **Mt. Makiling Traverse (MakTrav)** (Difficult) | Difficult (Factor: length) |
| 2 | 2026-12 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.18, S:0.96, G:0.24, P:0.25, E:0.32` | 0.1570 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.23, S:0.92, G:0.29, P:0.26, E:0.33` | 0.1482 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 4 | 2027-02 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.24, S:0.87, G:0.34, P:0.27, E:0.33` | 0.1436 | **Batulao New Trail** (Difficult) | Difficult (Factor: length) |
| 5 | 2027-03 | `L:0.05, S:0.38, G:0.08, P:0.06, E:0.11` | `L:0.29, S:0.84, G:0.33, P:0.32, E:0.33` | 0.1369 | *Terminal Evaluation* | *None* |

#### Cohort `E2-N-P1` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.15, S:1.00, G:0.26, P:0.19, E:0.38` | 0.1850 | **Mt. Batulao** (Difficult) | Easy (Factor: slope) |
| 1 | 2026-11 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.15, S:1.00, G:0.26, P:0.19, E:0.38` | 0.1850 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.20, S:0.96, G:0.31, P:0.20, E:0.38` | 0.1755 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.21, S:0.91, G:0.36, P:0.21, E:0.38` | 0.1668 | **Batulao New Trail** (Difficult) | Difficult (Factor: length) |
| 4 | 2027-02 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.26, S:0.87, G:0.35, P:0.26, E:0.38` | 0.1602 | **Mt. Makiling Traverse (MakTrav)** (Difficult) | Difficult (Factor: length) |
| 5 | 2027-03 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.31, S:0.88, G:0.38, P:0.31, E:0.39` | 0.1538 | *Terminal Evaluation* | *None* |

#### Cohort `E2-N-P2` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.15, S:1.00, G:0.26, P:0.19, E:0.38` | 0.2116 | **Mt. Batulao** (Difficult) | Easy (Factor: slope) |
| 1 | 2026-11 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.15, S:1.00, G:0.26, P:0.19, E:0.38` | 0.2116 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.20, S:0.96, G:0.31, P:0.20, E:0.38` | 0.2022 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.21, S:0.91, G:0.36, P:0.21, E:0.38` | 0.1935 | **Batulao New Trail** (Difficult) | Difficult (Factor: length) |
| 4 | 2027-02 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.26, S:0.87, G:0.35, P:0.26, E:0.38` | 0.1870 | **Mariang Makiling Trail (MMT)** (Difficult) | Difficult (Factor: gain) |
| 5 | 2027-03 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.28, S:0.86, G:0.40, P:0.31, E:0.38` | 0.1798 | *Terminal Evaluation* | *None* |

#### Cohort `E2-N-P3` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.15, S:1.00, G:0.26, P:0.19, E:0.38` | 0.1767 | **Mt. Batulao** (Difficult) | Difficult (Factor: elevation) |
| 1 | 2026-11 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.16, S:0.96, G:0.25, P:0.24, E:0.38` | 0.1743 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.21, S:0.92, G:0.30, P:0.25, E:0.38` | 0.1654 | **Batulao New Trail** (Difficult) | Difficult (Factor: length) |
| 3 | 2027-01 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.26, S:0.89, G:0.30, P:0.30, E:0.38` | 0.1589 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 4 | 2027-02 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.26, S:0.84, G:0.35, P:0.31, E:0.38` | 0.1506 | **Mt. Makiling Traverse (MakTrav)** (Difficult) | Difficult (Factor: length) |
| 5 | 2027-03 | `L:0.06, S:0.47, G:0.10, P:0.07, E:0.14` | `L:0.31, S:0.84, G:0.37, P:0.36, E:0.40` | 0.1457 | *Terminal Evaluation* | *None* |

### 5.3. E3 (Intermediate Mixed)

#### Cohort `E3-M-P1` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.66, S:1.00, G:0.68, P:0.54, E:0.48` | 0.1535 | **Mt. Batulao** (Difficult) | Difficult (Factor: elevation) |
| 1 | 2026-11 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.61, S:0.96, G:0.66, P:0.55, E:0.48` | 0.1507 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.59, S:0.92, G:0.63, P:0.54, E:0.48` | 0.1452 | **Batulao New Trail** (Difficult) | Difficult (Factor: length) |
| 3 | 2027-01 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.60, S:0.89, G:0.61, P:0.55, E:0.48` | 0.1442 | **Mariang Makiling Trail (MMT)** (Difficult) | Difficult (Factor: gain) |
| 4 | 2027-02 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.60, S:0.87, G:0.66, P:0.60, E:0.47` | 0.1478 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 5 | 2027-03 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.59, S:0.82, G:0.68, P:0.59, E:0.47` | 0.1431 | *Terminal Evaluation* | *None* |

#### Cohort `E3-M-P2` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.66, S:1.00, G:0.68, P:0.54, E:0.48` | 0.1526 | **Mt. Batulao** (Difficult) | Difficult (Factor: elevation) |
| 1 | 2026-11 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.61, S:0.96, G:0.66, P:0.55, E:0.48` | 0.1497 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.59, S:0.92, G:0.63, P:0.54, E:0.48` | 0.1440 | **Batulao New Trail** (Difficult) | Difficult (Factor: length) |
| 3 | 2027-01 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.60, S:0.89, G:0.61, P:0.55, E:0.48` | 0.1428 | **Mariang Makiling Trail (MMT)** (Difficult) | Difficult (Factor: gain) |
| 4 | 2027-02 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.60, S:0.87, G:0.66, P:0.60, E:0.47` | 0.1464 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 5 | 2027-03 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.59, S:0.82, G:0.68, P:0.59, E:0.47` | 0.1410 | *Terminal Evaluation* | *None* |

#### Cohort `E3-M-P3` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.66, S:1.00, G:0.68, P:0.54, E:0.48` | 0.1607 | **Mt. Batulao** (Difficult) | Difficult (Factor: elevation) |
| 1 | 2026-11 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.61, S:0.96, G:0.66, P:0.55, E:0.48` | 0.1574 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.59, S:0.93, G:0.63, P:0.54, E:0.48` | 0.1520 | **Batulao New Trail** (Difficult) | Difficult (Factor: length) |
| 3 | 2027-01 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.60, S:0.89, G:0.61, P:0.55, E:0.48` | 0.1510 | **Mariang Makiling Trail (MMT)** (Difficult) | Difficult (Factor: gain) |
| 4 | 2027-02 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.60, S:0.88, G:0.66, P:0.60, E:0.47` | 0.1547 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 5 | 2027-03 | `L:0.25, S:0.39, G:0.25, P:0.20, E:0.18` | `L:0.59, S:0.83, G:0.68, P:0.59, E:0.47` | 0.1499 | *Terminal Evaluation* | *None* |

#### Cohort `E3-N-P1` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.83, S:1.00, G:0.85, P:0.68, E:0.60` | 0.1480 | **Mt. Daraitan** (Easy) | Difficult (Factor: gain) |
| 1 | 2026-11 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.83, S:1.00, G:0.85, P:0.68, E:0.60` | 0.1480 | **Mariang Makiling Trail (MMT)** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.81, S:0.98, G:0.89, P:0.73, E:0.59` | 0.1469 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.79, S:0.93, G:0.85, P:0.71, E:0.58` | 0.1384 | **Mt. Kulis - Sambong Trail** (Difficult) | Difficult (Factor: slope) |
| 4 | 2027-02 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.75, S:0.92, G:0.80, P:0.66, E:0.57` | 0.1281 | **Batulao New Trail** (Easy) | Difficult (Factor: length) |
| 5 | 2027-03 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.75, S:0.92, G:0.80, P:0.66, E:0.57` | 0.1281 | *Terminal Evaluation* | *None* |

#### Cohort `E3-N-P2` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.83, S:1.00, G:0.85, P:0.68, E:0.60` | 0.1555 | **Mt. Daraitan** (Easy) | Difficult (Factor: gain) |
| 1 | 2026-11 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.83, S:1.00, G:0.85, P:0.68, E:0.60` | 0.1555 | **Mariang Makiling Trail (MMT)** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.81, S:0.98, G:0.89, P:0.73, E:0.59` | 0.1517 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.79, S:0.93, G:0.85, P:0.71, E:0.58` | 0.1431 | **Mt. Kulis - Sambong Trail** (Difficult) | Difficult (Factor: slope) |
| 4 | 2027-02 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.75, S:0.92, G:0.80, P:0.66, E:0.57` | 0.1365 | **Batulao New Trail** (Easy) | Difficult (Factor: elevation) |
| 5 | 2027-03 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.75, S:0.92, G:0.80, P:0.66, E:0.57` | 0.1365 | *Terminal Evaluation* | *None* |

#### Cohort `E3-N-P3` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.83, S:1.00, G:0.85, P:0.68, E:0.60` | 0.1593 | **Mt. Daraitan** (Easy) | Difficult (Factor: gain) |
| 1 | 2026-11 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.83, S:1.00, G:0.85, P:0.68, E:0.60` | 0.1593 | **Mariang Makiling Trail (MMT)** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.82, S:0.98, G:0.89, P:0.73, E:0.59` | 0.1604 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.79, S:0.93, G:0.85, P:0.71, E:0.58` | 0.1507 | **Mt. Kulis - Sambong Trail** (Difficult) | Difficult (Factor: slope) |
| 4 | 2027-02 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.75, S:0.92, G:0.80, P:0.66, E:0.57` | 0.1391 | **Mt. Batulao** (Difficult) | Easy (Factor: slope) |
| 5 | 2027-03 | `L:0.31, S:0.48, G:0.32, P:0.25, E:0.22` | `L:0.75, S:0.92, G:0.80, P:0.66, E:0.57` | 0.1391 | *Terminal Evaluation* | *None* |

### 5.4. E4 (Advanced High-Altitude)

#### Cohort `E4-M-P1` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.82, S:0.81, G:1.00, P:1.00, E:0.60` | 0.1556 | **Batulao New Trail** (Easy) | Difficult (Factor: length) |
| 1 | 2026-11 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.82, S:0.81, G:1.00, P:1.00, E:0.60` | 0.1556 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.80, S:0.76, G:0.95, P:0.97, E:0.59` | 0.1446 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.75, S:0.73, G:0.90, P:0.95, E:0.58` | 0.1330 | **Mt. Tagapo** (Difficult) | Difficult (Factor: slope) |
| 4 | 2027-02 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.72, S:0.78, G:0.85, P:0.90, E:0.56` | 0.1295 | **Mt. Kulis - Sambong Trail** (Difficult) | Easy (Factor: length) |
| 5 | 2027-03 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.72, S:0.78, G:0.85, P:0.90, E:0.56` | 0.1295 | *Terminal Evaluation* | *None* |

#### Cohort `E4-M-P2` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.82, S:0.81, G:1.00, P:1.00, E:0.60` | 0.1631 | **Batulao New Trail** (Easy) | Difficult (Factor: length) |
| 1 | 2026-11 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.82, S:0.81, G:1.00, P:1.00, E:0.60` | 0.1631 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.80, S:0.76, G:0.95, P:0.97, E:0.59` | 0.1525 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.75, S:0.73, G:0.90, P:0.95, E:0.58` | 0.1414 | **Mt. Tagapo** (Difficult) | Difficult (Factor: slope) |
| 4 | 2027-02 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.72, S:0.78, G:0.85, P:0.90, E:0.56` | 0.1335 | **Mt. Kulis - Sambong Trail** (Difficult) | Difficult (Factor: slope) |
| 5 | 2027-03 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.68, S:0.81, G:0.80, P:0.85, E:0.55` | 0.1259 | *Terminal Evaluation* | *None* |

#### Cohort `E4-M-P3` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.82, S:0.81, G:1.00, P:1.00, E:0.60` | 0.1714 | **Batulao New Trail** (Easy) | Difficult (Factor: length) |
| 1 | 2026-11 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.82, S:0.81, G:1.00, P:1.00, E:0.60` | 0.1714 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.80, S:0.76, G:0.95, P:0.97, E:0.59` | 0.1606 | **Mt. Daraitan** (Difficult) | Difficult (Factor: gain) |
| 3 | 2027-01 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.75, S:0.73, G:0.90, P:0.95, E:0.58` | 0.1513 | **Mt. Tagapo** (Difficult) | Difficult (Factor: slope) |
| 4 | 2027-02 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.72, S:0.78, G:0.85, P:0.90, E:0.56` | 0.1439 | **Mt. Kulis - Sambong Trail** (Difficult) | Difficult (Factor: slope) |
| 5 | 2027-03 | `L:0.30, S:0.30, G:0.38, P:0.40, E:0.22` | `L:0.68, S:0.81, G:0.80, P:0.85, E:0.55` | 0.1352 | *Terminal Evaluation* | *None* |

#### Cohort `E4-N-P1` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.38, S:0.37, G:0.47, P:0.50, E:0.28` | `L:1.00, S:1.00, G:1.00, P:1.00, E:0.75` | 0.1747 | **Mt. Daraitan** (Easy) | Difficult (Factor: gain) |
| 1 | 2026-11 | `L:0.37, S:0.37, G:0.46, P:0.50, E:0.28` | `L:1.00, S:1.00, G:1.00, P:1.00, E:0.75` | 0.1737 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.37, S:0.37, G:0.46, P:0.50, E:0.28` | `L:0.97, S:0.95, G:0.95, P:0.97, E:0.73` | 0.1640 | **Mt. Tagapo** (Difficult) | Easy (Factor: elevation) |
| 3 | 2027-01 | `L:0.37, S:0.37, G:0.46, P:0.50, E:0.28` | `L:0.97, S:0.95, G:0.95, P:0.97, E:0.73` | 0.1640 | **Mt. Kulis - Sambong Trail** (Difficult) | Easy (Factor: length) |
| 4 | 2027-02 | `L:0.37, S:0.37, G:0.46, P:0.50, E:0.28` | `L:0.97, S:0.95, G:0.95, P:0.97, E:0.73` | 0.1640 | **Batulao New Trail** (Easy) | Difficult (Factor: length) |
| 5 | 2027-03 | `L:0.37, S:0.37, G:0.46, P:0.49, E:0.28` | `L:0.97, S:0.95, G:0.95, P:0.97, E:0.73` | 0.1635 | *Terminal Evaluation* | *None* |

#### Cohort `E4-N-P2` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.38, S:0.37, G:0.47, P:0.50, E:0.28` | `L:1.00, S:1.00, G:1.00, P:1.00, E:0.75` | 0.1583 | **Mt. Daraitan** (Easy) | Difficult (Factor: gain) |
| 1 | 2026-11 | `L:0.38, S:0.37, G:0.46, P:0.50, E:0.28` | `L:1.00, S:1.00, G:1.00, P:1.00, E:0.75` | 0.1578 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.38, S:0.37, G:0.46, P:0.50, E:0.28` | `L:0.97, S:0.95, G:0.95, P:0.97, E:0.73` | 0.1481 | **Mt. Tagapo** (Difficult) | Difficult (Factor: slope) |
| 3 | 2027-01 | `L:0.38, S:0.37, G:0.46, P:0.50, E:0.28` | `L:0.92, S:0.96, G:0.90, P:0.92, E:0.70` | 0.1406 | **Mt. Kulis - Sambong Trail** (Difficult) | Difficult (Factor: slope) |
| 4 | 2027-02 | `L:0.38, S:0.37, G:0.46, P:0.50, E:0.28` | `L:0.87, S:0.94, G:0.85, P:0.87, E:0.68` | 0.1303 | **Batulao New Trail** (Easy) | Difficult (Factor: length) |
| 5 | 2027-03 | `L:0.38, S:0.37, G:0.46, P:0.49, E:0.28` | `L:0.87, S:0.94, G:0.85, P:0.87, E:0.68` | 0.1298 | *Terminal Evaluation* | *None* |

#### Cohort `E4-N-P3` Profile Trajectory

| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| 0 | 2026-10 | `L:0.38, S:0.37, G:0.47, P:0.50, E:0.28` | `L:1.00, S:1.00, G:1.00, P:1.00, E:0.75` | 0.1680 | **Mt. Daraitan** (Easy) | Difficult (Factor: gain) |
| 1 | 2026-11 | `L:0.37, S:0.37, G:0.46, P:0.50, E:0.28` | `L:1.00, S:1.00, G:1.00, P:1.00, E:0.75` | 0.1673 | **Mt. Sembrano** (Difficult) | Difficult (Factor: gain) |
| 2 | 2026-12 | `L:0.37, S:0.37, G:0.46, P:0.50, E:0.28` | `L:0.97, S:0.95, G:0.95, P:0.97, E:0.73` | 0.1577 | **Mt. Tagapo** (Difficult) | Difficult (Factor: slope) |
| 3 | 2027-01 | `L:0.37, S:0.37, G:0.46, P:0.50, E:0.28` | `L:0.93, S:0.96, G:0.90, P:0.92, E:0.70` | 0.1484 | **Mt. Kulis - Sambong Trail** (Difficult) | Easy (Factor: gain) |
| 4 | 2027-02 | `L:0.37, S:0.37, G:0.46, P:0.50, E:0.28` | `L:0.93, S:0.96, G:0.90, P:0.92, E:0.70` | 0.1484 | **Batulao New Trail** (Easy) | Difficult (Factor: length) |
| 5 | 2027-03 | `L:0.37, S:0.37, G:0.46, P:0.49, E:0.28` | `L:0.93, S:0.96, G:0.90, P:0.92, E:0.70` | 0.1479 | *Terminal Evaluation* | *None* |
---

## 6. Comparative Analysis: 3 Cycles vs. 5 Cycles

| Metric | 3 Cycles ($T = 3$) | 5 Cycles ($T = 5$) | Impact of Extended Cycles |
| :--- | :---: | :---: | :--- |
| **Overall Convergence Rate** | `19 / 24` (`79.2%`) | **`22 / 24` (`91.7%`)** | **+12.5% absolute gain** in user cohorts converging to ground truth. |
| **Beginner Healthy (`E1-N`)** | `0 / 3` converged (`STABLE`) | **`3 / 3` converged (`100%`)** | Cold-start uncertainty resolved; 5 hikes provide sufficient feedback to converge. |
| **Beginner Medical (`E1-M`)** | `1 / 3` converged | **`2 / 3` converged** | `E1-M-P3` flipped from `+0.0018` to **`-0.0007`** (converged). |
| **Experienced Tiers (`E2`, `E3`, `E4`)** | `18 / 18` (`100%`) | **`18 / 18` (`100%`)** | Maintained 100% convergence while deepening distance reductions. |
| **Mean GD Reduction (`E2`)** | `-0.0187` avg | **`-0.0317` avg** | **+69.5% deeper convergence** toward ground truth targets. |
| **Mean GD Reduction (`E4`)** | `-0.0187` avg | **`-0.0265` avg** | **+41.7% deeper convergence** toward ground truth targets. |

---

## 7. Key Findings & Empirical Observations

1. **Cold-Start Resolution for Novice Hikers:** Under 3 cycles, healthy beginners (`E1-N`) were classified as `STABLE` because 3 review iterations were insufficient to fully shift uninformative prior weights. Extending to 5 cycles enabled 100% of `E1-N` cohorts to achieve significant positive convergence (mean $\Delta \approx -0.0124$).
2. **Deepening Convergence Without Divergence:** Rather than oscillating or overshooting, user anchors monotonically approached their latent Ground Truth targets. The directional hinge update rule with $|\Delta_k| \le 0.05$ step capping ensured smooth, bounded asymptotic convergence.
3. **Strict Rehike Policy Preserves Exploration:** Requiring the system to exhaust all unhiked candidate trails across both Easy and Difficult slots before permitting a rehike ensured that users explored the maximum diversity of the catalog (all 5 hikes were unique trails for all cohorts).
4. **Vulnerable Safety Bounds Persist:** The 2 non-converging cohorts (`E1-M-P1` and `E1-M-P2`) remained bounded in a tight, harmless `STABLE` band ($+0.0014$ and $+0.0020$). The exertion safety ceiling successfully prevented high-risk trails (e.g., MakTrav, Mt. Kulis) from corrupting the Easy anchor profile.
