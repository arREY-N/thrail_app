# Pillar 2 Evaluation Record: Constraint Alignment (Difficulty & Physiological Safety)

**Document Version:** 3.1 (Purely Empirical Scoring: 50% Medical Downshift + 50% Polar Gain Gap)  
**Evaluation Target:** 4-Pillar Quality Framework — Pillar 2 (Constraint Alignment)  
**Execution Script:** [`scripts/simulation/evaluate_pillar_2_constraints.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/evaluate_pillar_2_constraints.py)  
**Output Telemetry:** [`scripts/simulation/output/pillar_2_constraint_results.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/output/pillar_2_constraint_results.json)  
**Raw Recommendation Lists Document:** [`plans/pillar_2_raw_recommendation_list.md`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/plans/pillar_2_raw_recommendation_list.md)  
**Raw Telemetry JSON Export:** [`scripts/simulation/output/pillar_2_raw_recommendations.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/output/pillar_2_raw_recommendations.json)  
**Catalog Dataset:** 8 Synced Production Trails ([`scripts/simulation/output/trails.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/output/trails.json), `SHA-256: dbba371aeff9...`)  
**Cohort Dataset:** 44 Calibrated User Profiles ([`engine/data/seeded_user_sets/set_1_users.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets/set_1_users.json))  
**Dynamic Alpha Specification:** Computed dynamically for 44 available users ($\alpha_{44} = 0.5612244898$)  
**Date of Execution:** November 5, 2026  

---

## 1. Test Setup & Dynamic Alpha Protocol

### 1.1. Exact Dynamic Alpha Calculation for 44 Available Users
In production, THARESYS dynamically balances Content-Based Filtering (CBF) and Collaborative Filtering (CF) via a continuous linear ramp based on total registered and profiled users ($N_{\text{users}}$):

$$\alpha = \alpha_{\text{cold}} - \left( (\alpha_{\text{cold}} - \alpha_{\text{steady}}) \times \frac{N_{\text{users}} - 1}{N_{\text{threshold}} - 1} \right)$$

Given:
* $\alpha_{\text{cold}} = 1.0$ (Cold start default, pure CBF)
* $\alpha_{\text{steady}} = 0.5$ (Steady state asymptotic minimum, 50% CBF / 50% CF)
* $N_{\text{threshold}} = 50$ (Maturity threshold)
* $N_{\text{users}} = 44$ (Exact number of active cohort profiles)

$$\alpha_{44} = 1.0 - \left( 0.5 \times \frac{44 - 1}{50 - 1} \right) = 1.0 - \left( 0.5 \times \frac{43}{49} \right) = 1.0 - \frac{21.5}{49} = \frac{27.5}{49} = \mathbf{0.5612244898\dots}$$

In adherence to the execution protocol, **all 9 configurations were evaluated exclusively under this computed dynamic alpha** ($\alpha = 0.5612244898$).

### 1.2. Purely Empirical Scoring Formulation
Arbitrary baseline scores have been eliminated. The **Composite Alignment Score** is computed purely from the empirical physical safety and contrast measurements:

$$\text{Composite Alignment Score} = \left(0.50 \times \text{Medical Downshift \%}\right) + \left(0.50 \times (\text{Polar Gain Gap} \times 100)\right)$$

Where:
* **Medical Downshift % ($50\%$ weight):** Reflects the reduction in vertical climb demand for hikers reporting medical conditions vs. healthy peers:
  $$\text{Medical Downshift} = \left(\frac{\text{Healthy Gain} - \text{Medical Gain}}{\text{Healthy Gain}}\right) \times 100\%$$
* **Polar Gain Gap ($50\%$ weight):** Reflects the vertical separation established between high-altitude experts and beginner novices:
  $$\text{Polar Gain Gap} = \text{Expert (E4) Gain} - \text{Novice (E1) Gain}$$

---

## 2. Pillar 2 Results Leaderboard (Purely Empirical Scoring)

### Operational Dynamic Regime: $\alpha = 0.5612244898$ (44 Users, 8 Trails)

| Rank | Configuration | CBF | CF | Polar Gain Gap | Medical Downshift | Composite Alignment Score | Safety Verdict |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | **Pure GD** | `GD` | `GD` | **+0.2460** (24.60%) | **100.0%** | **62.30** | **EXCELLENT (Pass)** |
| **2** | **GD-ED** | `GD` | `ED` | **+0.2460** (24.60%) | **100.0%** | **62.30** | **EXCELLENT (Pass)** |
| **3** | **ED-GD** | `ED` | `GD` | **+0.2460** (24.60%) | **100.0%** | **62.30** | **EXCELLENT (Pass)** |
| **4** | **Pure ED** | `ED` | `ED` | **+0.2460** (24.60%) | **100.0%** | **62.30** | **EXCELLENT (Pass)** |
| **5** | **GD-CS** | `GD` | `CS` | **+0.2681** (26.81%) | **86.83%** | **56.82** | **MODERATE (Pass)** |
| **6** | **ED-CS** | `ED` | `CS` | **+0.2681** (26.81%) | **84.84%** | **55.83** | **MODERATE (Pass)** |
| **7** | **CS-ED** | `CS` | `ED` | **+0.2681** (26.81%) | **84.25%** | **55.53** | **DANGEROUS (Fail)** |
| **8** | **CS-GD** | `CS` | `GD` | **+0.3587** (35.87%) | **73.67%** | **54.77** | **DANGEROUS (Fail)** |
| **9** | **Pure CS** | `CS` | `CS` | **+0.0443** (4.43%) | **71.65%** | **38.04** | **DANGEROUS (Fail)** |

---

## 3. Underlying Raw Physical Measures Reference

For complete verification, the table below provides the raw mean normalized elevation gains from which the Polar Gain Gap and Medical Downshift are calculated:

| Configuration | Novice (E1) Gain | Expert (E4) Gain | Medical (M) Gain | Healthy (N) Gain |
| :--- | :---: | :---: | :---: | :---: |
| **Pure GD** | 0.0000 | 0.2460 | 0.0000 | 0.0918 |
| **GD-ED** | 0.0000 | 0.2460 | 0.0000 | 0.1165 |
| **ED-GD** | 0.0000 | 0.2460 | 0.0000 | 0.0918 |
| **Pure ED** | 0.0000 | 0.2460 | 0.0000 | 0.0918 |
| **GD-CS** | 0.0000 | 0.2681 | 0.0307 | 0.2333 |
| **ED-CS** | 0.0000 | 0.2681 | 0.0307 | 0.2026 |
| **CS-ED** | 0.0000 | 0.2681 | 0.0368 | 0.2333 |
| **CS-GD** | 0.0000 | 0.3587 | 0.0614 | 0.2333 |
| **Pure CS** | 0.0000 | 0.0443 | 0.0488 | 0.1722 |

---

## 4. Key Takeaways & Synthesis

1. **Unbiased Mathematical Ranking:**
   * Removing arbitrary base tier constants makes the composite score 100% empirical.
   * **Pure GD, GD-ED, ED-GD, and Pure ED** share the top score of **`62.30`**, driven by a perfect **`100.0%` medical downshift** and a clean **`+0.2460` polar gap**.
2. **Pure Cosine's Critical Weakness:**
   * **Pure CS** ranks lowest at **`38.04`** because its polar gap collapses to **`+0.0443`** (4.43%), failing to differentiate novice capacity from expert capacity.
