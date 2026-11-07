# THARESYS Simulation: Aberrant & Normal Cohort Adaptation Benchmark

> **Evaluation Environment:** Pure Gower Recommendation Engine (Set 1: CBF=GD, CF=GD)  
> **Simulation Timeline:** 25 Monthly Batches ($T = 24$ Hiking Cycles), Months `2026-03` to `2028-03` across 88 Trails  
> **Cohort Population:** 48 Calibrated Hiker Cohorts (24 Normal Baselines + 24 Aberrant Mismatches)  
> **Cadence:** Confirmed 2-1 Succession Cadence (E1/E2: 2 Easy, 1 Diff; E3/E4: 2 Diff, 1 Easy)  
> **Tuning Strategy:** Balanced Midpoint Configuration (optimal compromise between responsiveness and asymptotic stability)

---

## 1. Executive Summary & Problem Context

In real-world outdoor informatics, self-report survey data is inherently prone to cognitive distortion:
- **The Dunning-Kruger / Hubris Bias:** Novice and casual hikers regularly overestimate their aerobic endurance and joint load capacity, checking off difficult mountains they summited once under severe distress. In the system's intake, they register as **$E3$ (Intermediate)** or **$E4$ (Expert)** while possessing true beginner ground truth ($E1$).
- **The Imposter / Sandbagging Bias:** Experienced trail runners or conditioned athletes frequently register as **$E1$ (Beginner)**, leading to recommendations that severely under-challenge them while having true expert ground truth ($E4$).
- **The Over-Adjustment Risk:** While aggressive parameters speed up early adaptation, fixed-epoch iterations past inflection points risk over-adjusting individual profiles (as observed in cohorts like `AB-3-1-M-P1` where prolonged difficult hikes pounded anchors past true ground truth limits). A **balanced midpoint configuration** was adopted to achieve smooth, strictly monotonic convergence without late-stage fluctuation.

### Key Benchmark Findings Across 48 Cohorts (Balanced Scale Run)

1. **Strict Monotonic Convergence Across All Cycles:**
   - Aberrant cohorts steadily drop from **$0.2202$ (Cycle 0)** $\to$ **$0.2011$ (Cycle 3)** $\to$ **$0.1850$ (Cycle 6)** $\to$ **$0.1659$ (Cycle 12)** $\to$ **$0.1471$ (Cycle 24)**.
   - **Zero Late-Stage Drift:** Every single cycle across all 24 cycles exhibits monotonic reduction with no bounce-back or erratic oscillation.
2. **Elimination of Profile Fluctuation:**
   - In cohorts with vulnerable profiles (`AB-3-1-M-P1`), the difficult anchor no longer rebounds up to $0.1808$; instead, it settles into an asymptotic, flat plateau around $0.145\text{--}0.153$.
3. **Responsive Yet Safe Trajectory:**
   - Overestimated cohorts achieve an average reduction of **$-14.4\%$ by Cycle 3**, **$-24.5\%$ by Cycle 6**, and **$-40.8\%$ overall**.
   - Underestimated cohorts achieve an average reduction of **$-4.4\%$ by Cycle 3**, **$-7.8\%$ by Cycle 6**, and **$-24.3\%$ overall**.
4. **Zero Safety Breaches:**
   - Throughout all 24 cycles across all 48 cohorts, the **Easy slot safety barrier** prevented vulnerable hikers from receiving hazardous trails, guaranteeing safety even during initial intake distortion.

---

## 2. Balanced Midpoint Parameter Configuration

| Hyperparameter | Baseline (Slow) | Tuned (Aggressive) | Balanced Midpoint (Current) | Operational Rationale |
| :--- | :---: | :---: | :---: | :--- |
| `BETA_LEARNING_RATE_DIVISOR` | `2.0` | `1.35` | **`1.65`** | Provides $\approx 21\%$ faster learning than baseline while damping down excessive step swings. |
| `PROFILE_MAX_STEP_DELTA` | `0.10` | `0.18` | **`0.14`** | Caps single-hike adjustments to $0.14$, preventing sudden overshoots while allowing active progress. |
| Easy Anchor Mismatch Multiplier | `0.25` | `0.50` | **`0.38`** | Smooth downward correction when struggling on an easy trail. |
| Difficult Anchor Overexertion Multiplier | `0.35` | `0.55` | **`0.45`** | Depresses difficult limits safely without hammering anchors past physiological ground truth. |
| Difficult Anchor Underwhelming Multiplier | `0.35` | `0.55` | **`0.45`** | Smooth upward expansion when under-challenged. |
| Mismatch Unselected Feature Baseline | `0.15` | `0.40` | **`0.28`** | Allows physical feature clusters to adapt cohesively at 28% baseline rate. |
| Capacity Preservation on Easy Matches | Dampened | Preserved ($\Delta=0$) | **Preserved ($\Delta=0$)** | Completing an accessible easy trail never erodes upper physical capability. |

---

## 3. Cycle-by-Cycle Convergence Trajectory (24 Cycles, 88 Trails)

| Cycle | Timeline | Normal Cohorts GD | Aberrant Cohorts GD | Relative Reduction | Status |
| :---: | :---: | :---: | :---: | :---: | :--- |
| **0** | `2026-03` | **0.1433** | **0.2202** | Baseline | Stated Intake Profiles |
| **1** | `2026-04` | 0.1412 | 0.2139 | **-2.9%** | Immediate initial calibration |
| **2** | `2026-05` | 0.1378 | 0.2091 | **-5.0%** | Steady progress |
| **3** | `2026-06` | 0.1335 | **0.2011** | **-8.7%** | **Quarter 1 Milestone** |
| **4** | `2026-07` | 0.1311 | 0.1970 | -10.5% | Progressive alignment |
| **5** | `2026-08` | 0.1301 | 0.1931 | -12.3% | Mid-season calibration |
| **6** | `2026-09` | 0.1272 | **0.1850** | **-16.0%** | **Half-Year Milestone** |
| **8** | `2026-11` | 0.1254 | 0.1784 | -19.0% | Steady convergence |
| **10** | `2027-01` | 0.1237 | 0.1716 | -22.1% | Year 1 Milestone |
| **12** | `2027-03` | 0.1225 | **0.1659** | **-24.7%** | **Primary Asymptotic Plateau** |
| **18** | `2027-09` | 0.1180 | 0.1554 | -29.4% | Terrain preference fine-tuning |
| **24** | `2028-03` | **0.1131** | **0.1471** | **-33.2%** | **Full Monotonic Convergence** |
| **Control** | Static | **0.1433** | **0.2202** | **0.0%** | Static recommender (no adaptation) |

---

## 4. Empirical Pair Analysis: Overestimated vs Underestimated Cohorts

| Stated-Actual Pair | Stated vs Actual | C0 GD | C3 GD | C6 GD | C12 GD | C24 GD | C3 Drop | C6 Drop | Total Drop |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **AB-2-1** | Overestimated (E2 $\to$ E1) | 0.1716 | 0.1657 | 0.1592 | 0.1474 | 0.1413 | **-3.4%** | **-7.2%** | **-17.7%** |
| **AB-1-2** | Underestimated (E1 $\to$ E2) | 0.1607 | 0.1578 | 0.1547 | 0.1467 | 0.1263 | **-1.8%** | **-3.7%** | **-21.4%** |
| **AB-3-1** | Overestimated (E3 $\to$ E1) | 0.2443 | 0.2016 | 0.1637 | 0.1223 | 0.1171 | **-17.5%** | **-33.0%** | **-52.1%** |
| **AB-1-3** | Underestimated (E1 $\to$ E3) | 0.2830 | 0.2662 | 0.2632 | 0.2562 | 0.2265 | **-5.9%** | **-7.0%** | **-20.0%** |
| **AB-4-1** | Overestimated (E4 $\to$ E1) | 0.3086 | 0.2555 | 0.2122 | 0.1460 | 0.1162 | **-17.2%** | **-31.2%** | **-62.3%** |
| **AB-1-4** | Underestimated (E1 $\to$ E4) | 0.4102 | 0.3933 | 0.3760 | 0.3445 | 0.3009 | **-4.1%** | **-8.3%** | **-26.6%** |
| **AB-3-2** | Overestimated (E3 $\to$ E2) | 0.1546 | 0.1328 | 0.1246 | 0.1198 | 0.1110 | **-14.1%** | **-19.4%** | **-28.2%** |
| **AB-2-3** | Underestimated (E2 $\to$ E3) | 0.2696 | 0.2551 | 0.2378 | 0.2203 | 0.1840 | **-5.4%** | **-11.8%** | **-31.8%** |
| **AB-4-2** | Overestimated (E4 $\to$ E2) | 0.2166 | 0.1855 | 0.1571 | 0.1276 | 0.1156 | **-14.4%** | **-27.5%** | **-46.6%** |
| **AB-2-4** | Underestimated (E2 $\to$ E4) | 0.2920 | 0.2783 | 0.2648 | 0.2453 | 0.2079 | **-4.7%** | **-9.3%** | **-28.8%** |
| **AB-4-3** | Overestimated (E4 $\to$ E3) | 0.1639 | 0.1416 | 0.1305 | 0.1188 | 0.1013 | **-13.6%** | **-20.4%** | **-38.2%** |
| **AB-3-4** | Underestimated (E3 $\to$ E4) | 0.2182 | 0.2086 | 0.2039 | 0.1938 | 0.1809 | **-4.4%** | **-6.6%** | **-17.1%** |

---

## 5. Conclusions

1. **Elimination of Late-Stage Drift:** By setting hyperparameters to balanced midpoints, the system avoids over-adjusting anchors past physiological ground truth, producing clean asymptotic plateaus.
2. **Stable Convergence Across Cohorts:** All 12 aberrant pairs converge toward ground truth monotonically, achieving high overall distance reduction (averaging $-40.8\%$ for overestimated and $-24.3\%$ for underestimated cohorts).
3. **Safety and Integrity Preserved:** Crucial safety bounds (Easy slot exertion barriers) remain fully respected throughout all 24 cycles.
