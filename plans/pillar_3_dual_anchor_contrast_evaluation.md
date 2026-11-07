# Pillar 3 Evaluation Record: Dual-Anchor Contrast (Easy vs. Difficult Separation)

**Document Version:** 1.0 (Exact Unrounded Alpha for 24 Cohorts)  
**Evaluation Target:** 4-Pillar Quality Framework — Pillar 3 (Dual-Anchor Contrast)  
**Execution Script:** [`scripts/simulation/evaluate_pillar_3_contrast.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/evaluate_pillar_3_contrast.py)  
**Output Telemetry:** [`scripts/simulation/output/pillar_3_contrast_results.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/output/pillar_3_contrast_results.json)  
**Catalog Dataset:** 8 Original Production Trails ([`scripts/simulation/output/trails.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/output/trails.json))  
**Cohort Dataset:** 24 Calibrated User Profiles ([`scripts/simulation/output/users.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/output/users.json))  
**Date of Execution:** November 4, 2026  

---

## 1. Test Setup

### 1.1. Objective
Pillar 3 evaluates **Dual-Anchor Contrast (Easy vs. Difficult Separation)**: *For the same user, does the engine produce high contrast between the Easy Anchor (recovery, leisure, comfort baseline) and the Difficult Anchor (aspirational growth, peak challenge)?*

### 1.2. The Evaluation Metrics
1. **Disjoint Partitioning Compliance (Zero Overlap):**
   A trail must never appear in both the Easy and Difficult recommendation lists for the same user:
   $$\text{Overlap} = | \text{Recs}_{\text{easy}} \cap \text{Recs}_{\text{diff}} | = 0$$
   **Target:** $100\%$ Disjointness ($0$ overlapping items).
2. **32-Dimensional Vector Distance Separation:**
   Euclidean distance between the centroid feature vector of the user's Top-3 Easy recommendations ($\vec{\mu}_{\text{easy}}$) and Top-2 Difficult recommendations ($\vec{\mu}_{\text{diff}}$):
   $$D_{\text{anchor}} = \lVert \vec{\mu}_{\text{diff}} - \vec{\mu}_{\text{easy}} \rVert_2$$
3. **Physical Metric Challenge Gaps ($\Delta$):**
   Difference between the average physical demands of Difficult recommendations vs. Easy recommendations:
   * **Elevation Gain Gap:** $\Delta_{\text{gain}} = \text{Gain}(\vec{\mu}_{\text{diff}}) - \text{Gain}(\vec{\mu}_{\text{easy}})$
   * **Slope Gradient Gap:** $\Delta_{\text{slope}} = \text{Slope}(\vec{\mu}_{\text{diff}}) - \text{Slope}(\vec{\mu}_{\text{easy}})$
   * **Trail Distance Gap:** $\Delta_{\text{length}} = \text{Length}(\vec{\mu}_{\text{diff}}) - \text{Length}(\vec{\mu}_{\text{easy}})$
   * **Lasco Rating Gap:** $\Delta_{\text{lasco}} = \text{Lasco}(\vec{\mu}_{\text{diff}}) - \text{Lasco}(\vec{\mu}_{\text{easy}})$

### 1.3. Alpha Regimes Evaluated
* **Operational Active Dynamic Alpha ($\alpha_{24} = 0.765306$):** The exact unrounded dynamic alpha computed for 24 registered users:
  $$\alpha = 1.0 - \left( 0.5 \times \frac{24 - 1}{50 - 1} \right) = \frac{37.5}{49} = 0.7653061224\dots$$
* **Cold-Start Boundary Reference ($\alpha = 1.000000$):** 100% Content-Based Filtering.
* **Steady-State Boundary Reference ($\alpha = 0.500000$):** 50% CBF / 50% Collaborative Filtering.

---

## 2. Benchmark Results & Data Tables

### 2.1. Operational Dynamic Regime: $\alpha = 0.765306$ (Exact 24 Cohorts)

| Rank | Configuration | CBF | CF | 32-D Vector Separation ($D_{\text{anchor}}$) | Elevation Gain Gap ($\Delta_{\text{gain}}$) | Slope Gradient Gap ($\Delta_{\text{slope}}$) | Trail Length Gap ($\Delta_{\text{length}}$) | Disjoint Overlap Violations | Overall Verdict |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | **Set 4: GD / ED** | `GD` | `ED` | **2.7860** | **+0.6463 (+64.6%)** | **+0.4572 (+45.7%)** | **+0.4287 (+42.9%)** | **0 (100% Disjoint)** | **EXCELLENT (Pass)** |
| **2** | **Set 2: Pure Euclidean** | `ED` | `ED` | **2.7413** | **+0.6168 (+61.7%)** | **+0.4884 (+48.8%)** | **+0.4201 (+42.0%)** | **0 (100% Disjoint)** | **EXCELLENT (Pass)** |
| **3** | **Set 1: Pure Gower** | `GD` | `GD` | **2.8022** | **+0.6026 (+60.3%)** | **+0.4489 (+44.9%)** | **+0.4310 (+43.1%)** | **0 (100% Disjoint)** | **EXCELLENT (Default Winner)** |
| **4** | **Set 6: ED / GD** | `ED` | `GD` | **2.7195** | **+0.5860 (+58.6%)** | **+0.5055 (+50.6%)** | **+0.4034 (+40.3%)** | **0 (100% Disjoint)** | **STRONG (Pass)** |
| **5** | **Set 5: GD / CS** | `GD` | `CS` | **2.8449** | **+0.4790 (+47.9%)** | **+0.4331 (+43.3%)** | **+0.4053 (+40.5%)** | **0 (100% Disjoint)** | **MODERATE (Pass)** |
| **6** | **Set 7: ED / CS** | `ED` | `CS` | **2.8653** | **+0.4133 (+41.3%)** | **+0.4325 (+43.3%)** | **+0.3690 (+36.9%)** | **0 (100% Disjoint)** | **MODERATE (Pass)** |
| **7** | **Set 9: CS / ED** | `CS` | `ED` | **2.3815** | **+0.2518 (+25.2%)** | **+0.3050 (+30.5%)** | **+0.2707 (+27.1%)** | **0 (100% Disjoint)** | **POOR (Weak Contrast)** |
| **8** | **Set 8: CS / GD** | `CS` | `GD` | **2.3620** | **+0.2409 (+24.1%)** | **+0.3015 (+30.2%)** | **+0.2656 (+26.6%)** | **0 (100% Disjoint)** | **POOR (Weak Contrast)** |
| **9** | **Set 3: Pure Cosine** | `CS` | `CS` | **2.3049** | **+0.0148 (+1.5%)** | **+0.2393 (+23.9%)** | **+0.3463 (+34.6%)** | **0 (100% Disjoint)** | **CRITICAL FAIL (No Contrast)** |

---

### 2.2. Boundary Sensitivity Analysis

#### Cold-Start Baseline ($\alpha = 1.000000$)
| Configuration | 32-D Distance | Gain Gap ($\Delta_{\text{gain}}$) | Slope Gap ($\Delta_{\text{slope}}$) | Length Gap ($\Delta_{\text{length}}$) | Disjoint Violations |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Set 1: Pure Gower (GD/GD)** | **2.8160** | **+0.5997** | **+0.4394** | **+0.4185** | **0** |
| **Set 2: Pure Euclidean (ED/ED)** | **2.7631** | **+0.6475** | **+0.4712** | **+0.4367** | **0** |
| **Set 4: GD / ED** | **2.8160** | **+0.5997** | **+0.4394** | **+0.4185** | **0** |
| **Set 5: GD / CS** | **2.8160** | **+0.5997** | **+0.4394** | **+0.4185** | **0** |
| **Set 6: ED / GD** | **2.7631** | **+0.6475** | **+0.4712** | **+0.4367** | **0** |
| **Set 7: ED / CS** | **2.7631** | **+0.6475** | **+0.4712** | **+0.4367** | **0** |
| **Set 3: Pure Cosine (CS/CS)** | **2.3353** | **+0.0644** | **+0.2529** | **+0.3360** | **0** |
| **Set 8: CS / GD** | **2.3353** | **+0.0644** | **+0.2529** | **+0.3360** | **0** |
| **Set 9: CS / ED** | **2.3353** | **+0.0644** | **+0.2529** | **+0.3360** | **0** |

#### Steady-State Boundary ($\alpha = 0.500000$)
| Configuration | 32-D Distance | Gain Gap ($\Delta_{\text{gain}}$) | Slope Gap ($\Delta_{\text{slope}}$) | Length Gap ($\Delta_{\text{length}}$) | Disjoint Violations |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Set 1: Pure Gower (GD/GD)** | **2.7240** | **+0.5785** | **+0.4940** | **+0.3869** | **0** |
| **Set 2: Pure Euclidean (ED/ED)** | **2.7413** | **+0.6168** | **+0.4884** | **+0.4201** | **0** |
| **Set 4: GD / ED** | **2.7550** | **+0.6694** | **+0.4754** | **+0.4356** | **0** |
| **Set 6: ED / GD** | **2.7195** | **+0.5860** | **+0.5055** | **+0.4034** | **0** |
| **Set 5: GD / CS** | **2.6651** | **+0.3815** | **+0.3922** | **+0.3306** | **0** |
| **Set 7: ED / CS** | **2.9044** | **+0.3994** | **+0.4232** | **+0.3423** | **0** |
| **Set 8: CS / GD** | **2.9044** | **+0.3994** | **+0.4232** | **+0.3423** | **0** |
| **Set 9: CS / ED** | **2.9044** | **+0.3994** | **+0.4232** | **+0.3423** | **0** |
| **Set 3: Pure Cosine (CS/CS)** | **2.0224** | **+0.0433** | **+0.3226** | **+0.3509** | **0** |

---

## 3. Key Findings & Engineering Conclusions

1. **Flawless Disjoint Partitioning ($100\%$ Compliance):**
   Across all 9 engine configurations, all 24 cohorts, and all 3 alpha phases, **$0$ overlap violations occurred**. The dual-anchor partitioning logic in [`engine/batch_runner.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/batch_runner.py) guarantees that a trail is assigned exclusively to either the Easy slot or the Difficult slot, never both.
2. **Pure Gower (Set 1) & Pure Euclidean (Set 2) Create Wide Physical Contrast:**
   - Under Set 1, Difficult recommendations feature **`+60.26%` higher elevation climb**, **`+44.89%` steeper slope**, and **`+43.10%` longer distance** than Easy recommendations.
   - Under Set 2, Difficult recommendations feature **`+61.68%` higher elevation climb** and **`+48.84%` steeper slope**.
   - This provides the hiker with a distinct dual-purpose experience: accessible leisure/recovery on one side, and genuine aspirational challenge on the other.
3. **Pure Cosine (Set 3) Experiences Total Vertical Contrast Collapse:**
   - The Elevation Gain gap in Pure Cosine collapsed to just **`+0.0148` (+1.5%)** under the exact dynamic alpha.
   - Because Cosine distance ignores physical vector magnitude, it considers steep mountain climbs like MakTrav to be equally suitable for both the Easy and Difficult anchors, destroying the purpose of dual-anchor personalization.
4. **Pillar 3 Verdict:** **PASS** for Set 1 (Pure Gower), Set 2 (Pure Euclidean), and Set 4 (GD/ED); **CRITICAL FAIL** for Pure Cosine (Set 3).

