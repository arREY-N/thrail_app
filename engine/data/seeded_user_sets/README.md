# THARESYS Seeded User Sets (44 Cohorts × 5 Distinct Populations)

> **Location:** [`engine/data/seeded_user_sets/`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets)  
> **Generation Script:** [`engine/seed_user_sets.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/seed_user_sets.py)  
> **Validation Suite:** [`engine/verify_user_sets.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/verify_user_sets.py)  
> **Verification Audit:** [`verification_report.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets/verification_report.json)  
> **Configuration Source:** [`engine/documents/configuration.md`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/documents/configuration.md) & [`engine/parameters.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/parameters.py)

---

## 1. Overview & Purpose

This directory contains **5 distinct, calibrated user sets** generated from the canonical **44 cohort archetypes**, yielding a total of **220 unique user documents** (44 users per set). 

These datasets are specifically engineered to evaluate the **THARESYS Recommendation Engine** under diverse peer environments, verifying:
1. **Disjoint Partitioning & Dynamic Alpha Blending:** Content-Based Filtering (CBF) + Collaborative Filtering (CF) peer neighborhood aggregation under varying peer densities.
2. **Exertion Safety Rails:** Strict routing of hazardous trails away from beginner or medically vulnerable cohorts.
3. **Adaptive Profile Learning (Beta):** Multi-cycle convergence trajectory from stated intake profiles toward ground truth capacity.
4. **Inter-Set Robustness:** Ensuring engine behavior remains stable across different sample populations of the same hiker personas.

---

## 2. Dataset Files Summary

| File | Cohort Count | Archetype Composition | User ID Format | Verification Status |
| :--- | :---: | :--- | :---: | :---: |
| [`set_1_users.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets/set_1_users.json) | 44 | 24 Normal + 20 Aberrant | `s1_E1-M-P1` ... `s1_AB-4-3-N-P1` | **100% Passed** |
| [`set_2_users.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets/set_2_users.json) | 44 | 24 Normal + 20 Aberrant | `s2_E1-M-P1` ... `s2_AB-4-3-N-P1` | **100% Passed** |
| [`set_3_users.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets/set_3_users.json) | 44 | 24 Normal + 20 Aberrant | `s3_E1-M-P1` ... `s3_AB-4-3-N-P1` | **100% Passed** |
| [`set_4_users.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets/set_4_users.json) | 44 | 24 Normal + 20 Aberrant | `s4_E1-M-P1` ... `s4_AB-4-3-N-P1` | **100% Passed** |
| [`set_5_users.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets/set_5_users.json) | 44 | 24 Normal + 20 Aberrant | `s5_E1-M-P1` ... `s5_AB-4-3-N-P1` | **100% Passed** |
| [`seeded_user_sets_summary.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets/seeded_user_sets_summary.json) | — | Index metadata and sample identifiers | JSON Summary | Active |
| [`verification_report.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets/verification_report.json) | — | Full mathematical dissimilarity & audit telemetry | JSON Report | **Zero Collisions** |

---

## 3. Cohort Composition (44 Blueprints per Set)

Each set replicates the complete spectrum of hiker experience, medical constraints, and self-report cognitive bias:

### 3.1. Normal Concordant Cohorts (24 Cohorts)
Stated intake tier exactly matches true physical ground truth capability:
* **4 Experience Tiers:** `E1` (Novice), `E2` (Easy / Gentle), `E3` (Intermediate), `E4` (Expert).
* **2 Medical Conditions:** `N` (Healthy / No Condition) and `M` (Diagnosed Condition / Downscaled).
* **3 Province Affinity Patterns:**
  * `P1`: Rizal (`["Rizal"]`)
  * `P2`: Batangas & Laguna (`["Batangas", "Laguna"]`)
  * `P3`: Cavite (`["Cavite"]`)
* **Total:** $4 \times 2 \times 3 = \mathbf{24\text{ Normal Cohorts}}$.

### 3.2. Aberrant Mismatch Cohorts (20 Cohorts)
Simulates intake distortions (Dunning-Kruger hubris or imposter sandbagging). The app intake profile reflects stated tier ($S$), while actual ground truth reflects true physiological capacity ($A$):
* **6 Overestimated Pairs ($S > A$):**
  1. `AB-4-1`: Stated Expert ($E4$), True Novice ($E1$) — *Max Overestimation*
  2. `AB-4-2`: Stated Expert ($E4$), True Gentle ($E2$) — *High Overestimation*
  3. `AB-4-3`: Stated Expert ($E4$), True Intermediate ($E3$) — *Slight Overestimation*
  4. `AB-3-1`: Stated Intermediate ($E3$), True Novice ($E1$) — *High Overestimation*
  5. `AB-3-2`: Stated Intermediate ($E3$), True Gentle ($E2$) — *Slight Overestimation*
  6. `AB-2-1`: Stated Gentle ($E2$), True Novice ($E1$) — *Near-Tier Overestimation*
* **4 Underestimated Pairs ($S < A$):**
  1. `AB-1-4`: Stated Novice ($E1$), True Expert ($E4$) — *Max Underestimation*
  2. `AB-1-3`: Stated Novice ($E1$), True Intermediate ($E3$) — *High Underestimation*
  3. `AB-1-2`: Stated Novice ($E1$), True Gentle ($E2$) — *Near-Tier Underestimation*
  4. `AB-2-4`: Stated Gentle ($E2$), True Expert ($E4$) — *Moderate Underestimation*
* Each pair is instantiated with both `N` (Healthy) and `M` (Medical) on standardized `P1` province affinity:
* **Total:** $10 \times 2 = \mathbf{20\text{ Aberrant Cohorts}}$.

---

## 4. Generation Methodology & Mathematics

The generation algorithm in [`seed_user_sets.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/seed_user_sets.py) applies a 5-stage synthesis process:

### Stage 1: Deterministic Seed Isolation
To guarantee total reproducibility without cross-set correlation, each set and user operates on a dedicated pseudorandom stream:
$$\text{Seed}(s, c) = 7000 + 111 \times s + 37 \times c$$
Where $s \in \{1, \dots, 5\}$ is the set index and $c \in \{0, \dots, 43\}$ is the cohort blueprint index.

### Stage 2: Physical Exertion Calibration & Stratified Jitter (Indices 0..5)
Base physical metrics (`length`, `elevation`, `gain`, `slope`, `easy`) are drawn from calibrated empirical tier intervals:
* **$E1$ (Novice):** Easy $[0.10, 0.22]$, Difficult $[0.45, 0.65]$
* **$E2$ (Gentle):** Easy $[0.14, 0.28]$, Difficult $[0.50, 0.70]$
* **$E3$ (Intermediate):** Easy $[0.24, 0.38]$, Difficult $[0.65, 0.82]$
* **$E4$ (Expert):** Easy $[0.34, 0.48]$, Difficult $[0.78, 0.95]$

To ensure inter-set variation while maintaining archetype identity, a stratified jitter $\delta_s = (s - 3) \times 0.025$ is injected.

### Stage 3: Strict Monotonicity Enforcement
In mountaineering, a hiker's aspirational challenge limit must always exceed their comfortable baseline. For all core physical features (indices 0..5):
$$P_{\text{difficult}}[k] \ge P_{\text{easy}}[k] + \Delta_{\text{gap}}, \quad \text{where } \Delta_{\text{gap}} = 0.05 \text{ (from parameters.py)}$$

### Stage 4: Medical Twin Downscaling Rule
To simulate orthopedic/cardiovascular limitations accurately:
* Healthy Twin ($N$) establishes the baseline physical and terrain capability.
* Medical Twin ($M$) strictly scales physical features (indices 1..5) and technical terrain features (indices 11..14) by **$0.80\times$**:
$$P_{\text{medical}}[k] = \text{clamp}(P_{\text{healthy}}[k] \times 0.80, \, 0.04, \, 1.0)$$
* Route, regional provinces, waterforms, and amenities remain unpenalized, matching the app's intake model (`CreateProfile.ts`).

### Stage 5: Environmental & Route Preference Diversification (Indices 6..31)
* **Provinces (6..10):** Preferred provinces receive strong baseline affinity ($0.80\text{--}0.90$), while non-preferred provinces receive low affinity ($0.10\text{--}0.18$), jittered per set.
* **Terrains (11..14):** Primary terrain affinities rotate cyclically across sets to represent distinct technical footing comfort.
* **Route Structure (15..17):** Sampled via Dirichlet distribution ($\alpha = [1.2, 0.8, 1.0] + 0.1 \times s$).
* **Waterforms & Tourism (18..31):** Uniformly randomized within realistic outdoor leisure ranges.

---

## 5. Canonical 32-Feature Vector Alignment

All user profiles strictly produce two 32-element floating-point arrays (`profile.easy` and `profile.difficult`) matching [`flatten_profile_features`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/profile_utils.py#L76):

```
+-------------------------------------------------------------------------+
|                  Canonical 32-Dimensional Feature Order                 |
|                                                                         |
|  [0..5]   Physical Exertion (50%) : class, length, elev, gain, slope, easy |
|  [6..10]  Provinces (10%)         : cavite, laguna, batangas, rizal, quezon |
|  [11..14] Terrains (20%)          : muddy, rocky, grassland, ridges     |
|  [15..17] Route Structure (15%)   : out_and_back, traverse, circular    |
|  [18..20] Waterforms (1.4%)       : fall, river, lake                   |
|  [21..31] Tourism Amenities (3.6%): shelter, resting, info, water, etc. |
+-------------------------------------------------------------------------+
```

---

## 6. Automated Verification & Dissimilarity Telemetry

The validation suite ([`verify_user_sets.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/verify_user_sets.py)) audited all 220 profiles across all 10 possible set pairs ($\binom{5}{2} = 10$).

### 6.1. Audit Scorecard
* **Total Cohort Profiles Audited:** 220 / 220
* **Vector Dimension Violations:** **0** (All 32-D floats)
* **Bounds / NaN Violations:** **0** (All clamped in $[0.0, 1.0]$)
* **Physical Monotonicity Violations:** **0** ($P_{\text{diff}} \ge P_{\text{easy}} + 0.05$ across all users)
* **Medical Twin Physical Scaling:** Exactly **$0.80\times$** ratio verified.
* **Identical Profile Collisions:** **0** (100% Unique Sets)

### 6.2. Pairwise Set Dissimilarity Matrix (Gower Distance)

| Set Pair Comparison | Cohort Pairs Tested | Mean GD | Min GD | Max GD | Mean ED | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Set 1 vs Set 2** | 44 | **0.0849** | 0.0517 | 0.1177 | 0.1219 | Verified Different |
| **Set 1 vs Set 3** | 44 | **0.0864** | 0.0547 | 0.1098 | 0.1250 | Verified Different |
| **Set 1 vs Set 4** | 44 | **0.0886** | 0.0531 | 0.1188 | 0.1227 | Verified Different |
| **Set 1 vs Set 5** | 44 | **0.0873** | 0.0573 | 0.1210 | 0.1208 | Verified Different |
| **Set 2 vs Set 3** | 44 | **0.0861** | 0.0545 | 0.1152 | 0.1246 | Verified Different |
| **Set 2 vs Set 4** | 44 | **0.0878** | 0.0610 | 0.1208 | 0.1272 | Verified Different |
| **Set 2 vs Set 5** | 44 | **0.0883** | 0.0521 | 0.1121 | 0.1224 | Verified Different |
| **Set 3 vs Set 4** | 44 | **0.0835** | 0.0527 | 0.1158 | 0.1194 | Verified Different |
| **Set 3 vs Set 5** | 44 | **0.0847** | 0.0550 | 0.1126 | 0.1201 | Verified Different |
| **Set 4 vs Set 5** | 44 | **0.0855** | 0.0536 | 0.1107 | 0.1221 | Verified Different |

> [!NOTE]
> * **Zero Overlap:** The minimum inter-set Gower Distance between any corresponding cohort is $\mathbf{> 0.051}$, proving no identical vectors exist.
> * **Controlled Variance:** The average inter-set Gower Distance is tightly maintained around $\mathbf{\sim 0.086}$ ($\approx 8.6\%$), representing realistic individuality among hikers within the exact same cohort archetype.

---

## 7. How to Re-Run and Validate

From the repository root using the virtual environment:

```bash
# 1. Regenerate all 5 sets
.venv\Scripts\python.exe engine\seed_user_sets.py

# 2. Execute verification suite and generate telemetry report
.venv\Scripts\python.exe engine\verify_user_sets.py
```

