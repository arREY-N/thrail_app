# Pillar 1 Evaluation Record: Inter-User Variety (Personalization Diversity)

**Document Version:** 2.0 (44 User Cohorts & 8 Real Production Trails)  
**Evaluation Target:** 4-Pillar Quality Framework — Pillar 1 (Inter-User Variety)  
**Execution Script:** [`scripts/simulation/evaluate_pillar_1_variety.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/evaluate_pillar_1_variety.py)  
**Output Telemetry:** [`scripts/simulation/output/pillar_1_variety_results.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/output/pillar_1_variety_results.json)  
**Catalog Dataset:** 8 Original Production Trails ([`scripts/simulation/output/trails.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/output/trails.json))  
**Cohort Dataset:** 44 Calibrated User Profiles ([`engine/data/seeded_user_sets/set_1_users.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets/set_1_users.json))  
**Total Pairwise Comparisons:** 946 cohort pairs per configuration ($\binom{44}{2} = 946$)  
**Date of Execution:** November 5, 2026  

---

## 1. Test Setup & Dynamic Alpha Protocol

### 1.1. Exact Unrounded Dynamic Alpha Calculation
In live production, THARESYS dynamically adjusts the hybrid weight $\alpha$ based on total registered users:

$$\alpha = \alpha_{\text{cold}} - \left( (\alpha_{\text{cold}} - \alpha_{\text{steady}}) \times \frac{N_{\text{users}} - 1}{N_{\text{threshold}} - 1} \right)$$

For $N = 44$ cohorts, $\alpha_{\text{cold}} = 1.0$, $\alpha_{\text{steady}} = 0.5$, and $N_{\text{threshold}} = 50$:

$$\alpha_{44} = 1.0 - \left( 0.5 \times \frac{44 - 1}{50 - 1} \right) = 1.0 - \left( 0.5 \times \frac{43}{49} \right) = 1.0 - \frac{21.5}{49} = \frac{27.5}{49} = \mathbf{0.5612244898\dots}$$

To preserve maximum fidelity to actual generation and eliminate rounding drift, the evaluation tests:
1. **Operational Dynamic Benchmark:** $\alpha = 0.5612244898$ (The exact unrounded dynamic alpha computed for 44 cohorts).
2. **Cold-Start Boundary Reference:** $\alpha = 1.000000$ ($N = 1$ user, 100% CBF).
3. **Transitional Benchmark:** $\alpha = 0.750000$ (75% CBF / 25% CF).
4. **Steady-State Boundary Reference:** $\alpha = 0.500000$ ($N \ge 50$ users, 50% CBF / 50% CF).

### 1.2. The Evaluation Metric (Jaccard Dissimilarity)
For any pair of user cohorts $A$ and $B$, Inter-User Variety is defined as:

$$\text{Variety}(A, B) = 1.0 - \frac{| \text{Recs}_A \cap \text{Recs}_B |}{| \text{Recs}_A \cup \text{Recs}_B |}$$

* **$\text{Variety} = 0.0$ ($0\%$):** Identical recommendation lists (Zero personalization; generic system).
* **$\text{Variety} = 1.0$ ($100\%$):** Completely disjoint recommendation sets (Total personalization contrast).

### 1.3. Catalog Constraints & Theoretical Ceilings
* **Candidate Pool:** 8 trails ($N_{\text{trails}} = 8$).
* **Primary Recommendation Size:** Top-5 trails ($k = 5$).
* **Pigeonhole Intersection Proof:**
  For any two 5-trail subsets $A, B \subseteq \{T_1, \dots, T_8\}$:
  $$|A \cup B| \le 8 \implies |A \cap B| = |A| + |B| - |A \cup B| \ge 10 - 8 = 2$$
  Any two users **must share at least 2 trails** regardless of formula.
  Therefore, the **maximum possible Top-5 variety is mathematically bounded at**:
  $$\text{Variety}_{\max} = 1.0 - \frac{2}{8} = 0.7500 \quad (75.0\%)$$
  *(When lists overlap by 3 trails, Variety is $1 - 3/7 = 0.5714$; when overlapping by 4 trails, Variety is $1 - 4/6 = 0.3333$)*.
* **Top-3 Resolution Metric:** Benchmarks unconstrained personalization where $0$ overlap is achievable ($100\%$ separation).

---

## 2. Pillar 1 Results Leaderboard

### 2.1. Operational Dynamic Regime: $\alpha = 0.561224$ (Exact 44 Cohorts, 946 Pairs)

| Rank | Configuration | CBF | CF | Top-5 Mean Variety | Top-5 Max Variety | Top-3 Mean Variety | Normal Polar (`E1` vs `E4`) | Cross-Medical (`M` vs `N`) | Cross-Province | Aberrant vs Normal | Target Pair (`E1-M-P1` vs `E4-N-P2`) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | **Set 4: GD / ED** | `GD` | `ED` | **0.3642** | **0.5714** | **0.4765** | **0.4405** | **0.3658** | **0.3563** | **0.3681** | Top5: 0.57, Top3: 0.50 |
| **2** | **Set 5: GD / CS** | `GD` | `CS` | **0.3626** | **0.5714** | **0.5649** | **0.4656** | **0.3742** | **0.3886** | **0.3719** | Top5: 0.33, Top3: 0.80 |
| **3** | **Set 8: CS / GD** | `CS` | `GD` | **0.3575** | **0.5714** | **0.5807** | **0.4696** | **0.3632** | **0.3794** | **0.3536** | Top5: 0.57, Top3: 0.50 |
| **4** | **Set 6: ED / GD** | `ED` | `GD` | **0.3561** | **0.5714** | **0.4946** | **0.4590** | **0.3612** | **0.3515** | **0.3599** | Top5: 0.57, Top3: 0.50 |
| **5** | **Set 2: Pure Euclidean** | `ED` | `ED` | **0.3530** | **0.5714** | **0.4906** | **0.4392** | **0.3600** | **0.3489** | **0.3632** | Top5: 0.57, Top3: 0.80 |
| **6** | **Set 7: ED / CS** | `ED` | `CS` | **0.3524** | **0.5714** | **0.5471** | **0.5185** | **0.3649** | **0.3803** | **0.3580** | Top5: 0.33, Top3: 0.50 |
| **7** | **Set 9: CS / ED** | `CS` | `ED` | **0.3521** | **0.5714** | **0.5653** | **0.4656** | **0.3491** | **0.3657** | **0.3482** | Top5: 0.33, Top3: 0.80 |
| **8** | **Set 1: Pure Gower** | `GD` | `GD` | **0.3348** | **0.5714** | **0.4656** | **0.4140** | **0.3421** | **0.3214** | **0.3409** | Top5: 0.57, Top3: 0.50 |
| **9** | **Set 3: Pure Cosine** | `CS` | `CS` | **0.3169** | **0.5714** | **0.4934** | **0.3690** | **0.3116** | **0.3277** | **0.3159** | Top5: 0.57, Top3: 0.80 |

---

### 2.2. Boundary & Transitional Sensitivity Analysis

#### Cold-Start Baseline ($\alpha = 1.000000$, 100% CBF)
| Configuration | Top-5 Mean | Top-5 Max | Top-3 Mean | Polar (`E1` vs `E4`) | Medical (`M` vs `N`) | Cross-Province | Aberrant vs Normal | Target Pair |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Set 1: Pure Gower (GD/GD)** | **0.3632** | **0.7500** | **0.5099** | **0.4140** | **0.3658** | **0.3515** | **0.3653** | Top5: 0.57, Top3: 0.50 |
| **Set 2: Pure Euclidean (ED/ED)** | **0.3819** | **0.7500** | **0.5099** | **0.4755** | **0.3949** | **0.3941** | **0.3940** | Top5: 0.57, Top3: 0.80 |
| **Set 3: Pure Cosine (CS/CS)** | **0.3296** | 0.5714 | **0.5255** | 0.3915 | 0.3257 | 0.3504 | 0.3254 | Top5: 0.33, Top3: 0.80 |
| **Set 4: GD / ED** | **0.3632** | **0.7500** | **0.5099** | **0.4140** | **0.3658** | **0.3515** | **0.3653** | Top5: 0.57, Top3: 0.50 |
| **Set 5: GD / CS** | **0.3632** | **0.7500** | **0.5099** | **0.4140** | **0.3658** | **0.3515** | **0.3653** | Top5: 0.57, Top3: 0.50 |
| **Set 6: ED / GD** | **0.3819** | **0.7500** | **0.5099** | **0.4755** | **0.3949** | **0.3941** | **0.3940** | Top5: 0.57, Top3: 0.80 |
| **Set 7: ED / CS** | **0.3819** | **0.7500** | **0.5099** | **0.4755** | **0.3949** | **0.3941** | **0.3940** | Top5: 0.57, Top3: 0.80 |
| **Set 8: CS / GD** | **0.3296** | 0.5714 | **0.5255** | 0.3915 | 0.3257 | 0.3504 | 0.3254 | Top5: 0.33, Top3: 0.80 |
| **Set 9: CS / ED** | **0.3296** | 0.5714 | **0.5255** | 0.3915 | 0.3257 | 0.3504 | 0.3254 | Top5: 0.33, Top3: 0.80 |

#### Transitional Benchmark ($\alpha = 0.750000$, 75% CBF / 25% CF)
| Configuration | Top-5 Mean | Top-5 Max | Top-3 Mean | Polar (`E1` vs `E4`) | Medical (`M` vs `N`) | Cross-Province | Aberrant vs Normal | Target Pair |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Set 1: Pure Gower (GD/GD)** | **0.3439** | **0.5714** | **0.4831** | **0.4140** | **0.3513** | **0.3331** | **0.3474** | Top5: 0.57, Top3: 0.50 |
| **Set 2: Pure Euclidean (ED/ED)** | **0.3603** | **0.5714** | **0.4988** | 0.4524 | 0.3689 | 0.3630 | 0.3670 | Top5: 0.57, Top3: 0.80 |
| **Set 3: Pure Cosine (CS/CS)** | 0.3280 | 0.5714 | 0.5034 | 0.3849 | 0.3229 | 0.3462 | 0.3257 | Top5: 0.57, Top3: 0.80 |
| **Set 4: GD / ED** | **0.3571** | **0.5714** | **0.4858** | **0.4405** | **0.3618** | **0.3504** | **0.3613** | Top5: 0.57, Top3: 0.50 |
| **Set 5: GD / CS** | **0.3710** | **0.5714** | **0.4964** | **0.4656** | **0.3882** | **0.3823** | **0.3727** | Top5: 0.57, Top3: 0.80 |
| **Set 6: ED / GD** | **0.3635** | **0.5714** | **0.5055** | **0.4590** | 0.3658 | **0.3664** | 0.3683 | Top5: 0.57, Top3: 0.50 |
| **Set 7: ED / CS** | **0.3782** | **0.5714** | **0.4474** | **0.5053** | **0.3917** | 0.3952 | 0.3931 | Top5: 0.57, Top3: 0.80 |
| **Set 8: CS / GD** | 0.3395 | 0.5714 | 0.5442 | 0.4524 | 0.3360 | 0.3445 | 0.3335 | Top5: 0.33, Top3: 0.80 |
| **Set 9: CS / ED** | 0.3429 | 0.5714 | 0.5433 | 0.4206 | 0.3386 | 0.3504 | 0.3379 | Top5: 0.33, Top3: 0.80 |

#### Steady-State Boundary ($\alpha = 0.500000$, 50% CBF / 50% CF)
| Configuration | Top-5 Mean | Top-5 Max | Top-3 Mean | Polar (`E1` vs `E4`) | Medical (`M` vs `N`) | Cross-Province | Aberrant vs Normal | Target Pair |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Set 1: Pure Gower (GD/GD)** | **0.3348** | **0.5714** | **0.4622** | **0.4140** | **0.3421** | **0.3214** | **0.3409** | Top5: 0.57, Top3: 0.50 |
| **Set 2: Pure Euclidean (ED/ED)** | **0.3491** | **0.5714** | **0.4862** | 0.4590 | 0.3540 | 0.3436 | 0.3549 | Top5: 0.33, Top3: 0.80 |
| **Set 3: Pure Cosine (CS/CS)** | 0.3007 | 0.5714 | 0.4900 | 0.3690 | 0.2958 | 0.3040 | 0.3015 | Top5: 0.57, Top3: 0.80 |
| **Set 4: GD / ED** | **0.3623** | **0.5714** | **0.4737** | **0.4524** | **0.3710** | **0.3500** | **0.3694** | Top5: 0.57, Top3: 0.50 |
| **Set 5: GD / CS** | 0.3552 | 0.5714 | 0.5688 | 0.4272 | 0.3682 | 0.3802 | 0.3659 | Top5: 0.33, Top3: 0.50 |
| **Set 6: ED / GD** | **0.3419** | **0.5714** | **0.4959** | **0.4325** | **0.3540** | **0.3342** | **0.3413** | Top5: 0.57, Top3: 0.50 |
| **Set 7: ED / CS** | 0.3607 | 0.5714 | 0.5502 | 0.5185 | 0.3691 | 0.3966 | 0.3692 | Top5: 0.33, Top3: 0.80 |
| **Set 8: CS / GD** | 0.3681 | 0.5714 | **0.5795** | 0.4537 | 0.3770 | 0.3979 | 0.3790 | Top5: 0.57, Top3: 0.50 |
| **Set 9: CS / ED** | 0.3561 | 0.5714 | 0.5730 | 0.4788 | 0.3554 | 0.3744 | 0.3540 | Top5: 0.33, Top3: 0.50 |

---

## 3. Key Findings & Engineering Conclusions

1. **Higher Variety Across the Catalog After Trail Calibration:**
   With Mt. Kulis accurately calibrated to minimal slope (4.2%) and elevation gain (118 m), novice and medically restricted cohorts consistently anchor to Mt. Kulis in their Top recommendations, while advanced cohorts gravitate toward Mt. Irid, Mt. Daraitan, and Mt. Batulao. This significantly widens differentiation across all user cohorts:
   - **Top-5 Mean Variety increased across all configurations** (e.g., Set 4 increased from $0.2916$ to **$0.3642$**; Set 1 increased from $0.2752$ to **$0.3348$**).
   - **Set 4 (GD / ED)** ranks **#1** in overall operational Top-5 variety ($0.3642$), with high polar separation ($0.4405$), and excellent cross-medical diversity ($0.3658$).

2. **Top-3 Unconstrained Personalization Resolution:**
   In the unconstrained Top-3 evaluation (where lists are not bounded by the Top-5 Pigeonhole constraint):
   - Average Top-3 variety reaches **$0.4656$ – $0.5807$** across the configurations.
   - For polar contrasts (e.g. `E1-M-P1` vs `E4-N-P2`), Top-3 variety reaches up to **$0.8000$** (80% dissimilarity, meaning cohorts share at most 1 trail out of 3).

3. **Cosine Distance Characteristics in Hybrid Intake:**
   - Although configurations with Cosine (Sets 5, 7, 8, 9) achieve higher mathematical dissimilarity in unconstrained Top-3 metrics (due to angle sensitivity on sparse feature profiles), they were proven in **Pillar 2** to violate physiological safety constraints (recommending steep elevation gains of 268 m to 358 m to novices and medically restricted hikers, yielding Dangerous verdicts).
   - In contrast, **Set 4 (GD / ED)**, **Set 6 (ED / GD)**, **Set 1 (Pure GD)**, and **Set 2 (Pure ED)** combine high personalization variety ($0.3348$ – $0.3642$) with strict physiological safety compliance (100% Medical Downshift, 0.0000 m gain for E1/Medical).

4. **Recommendation Status for Production:**
   - **Set 4 (GD CBF / ED CF):** Achieves the highest overall personalization variety ($0.3642$ Top-5 Mean) while maintaining full constraint alignment and 100% medical downshift protection in Pillar 2 ($93.46$ alignment score).
   - **Set 1 (Pure Gower):** Delivers clean physical feature grounding, with $0.4140$ polar separation and robust 100% medical safety downshifting.
   - **Set 6 (ED CBF / GD CF) & Set 2 (Pure Euclidean):** Follow closely with $0.3561$ and $0.3530$ Top-5 variety, providing stable alternatives.
