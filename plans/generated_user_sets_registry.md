# THARESYS Synthetic User Sets & Cohort Blueprint Registry

> **Document Status:** Complete Dataset Registry  
> **Generation Script:** [`engine/seed_user_sets.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/seed_user_sets.py)  
> **Mirrored Generation Script:** [`engine/generate_mirrored_user_set.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/generate_mirrored_user_set.py)  
> **Validation Suite:** [`engine/verify_user_sets.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/verify_user_sets.py)  
> **Dataset Root:** [`engine/data/seeded_user_sets/`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets)  
> **Total Seeded Profiles:** 220 users across 5 sets (44 users per set) + 44 mirrored benchmark twins.

---

## 1. Executive Summary & Population Architecture

To evaluate the **THARESYS Hybrid Recommendation Engine** across all 4 experimental pillars (Variety, Constraint Compliance, Anchor Separation, and Score Discrimination), the user base is synthesized using a calibrated **44-Cohort Blueprint Catalog**.

The 44 cohorts are mathematically divided into two primary behavioral and physiological divisions:
1. **Normal Concordant Cohorts (24 Users):** Where self-reported intake experience matches ground truth physical capacity ($S = A$). Formed by a complete factorial design of 4 experience tiers $\times$ 2 medical states $\times$ 3 regional province preference clusters.
2. **Aberrant Mismatch Cohorts (20 Users):** Where self-reported intake experience diverges from ground truth ($S \ne A$), capturing real-world cognitive distortions (Dunning-Kruger hubris and imposter sandbagging). Formed by 10 calibrated mismatch pairs $\times$ 2 medical states.

Additionally, for engine downshift evaluations (Pillar 2), a **Mirrored User Set** of 44 twin hikers is derived directly from the 22 healthy base archetypes to measure engine downshift without generator bias.

---

## 2. Generation Group 1: Normal Concordant Cohorts (24 Users)

### Rationale
In real-world trail systems, the majority of active hikers report their fitness and experience with reasonable accuracy. However, their physical capacities, medical conditions, and regional preferences vary systematically:
- **Experience Tiers ($E1$ to $E4$):** Beginners require short, gentle trails with modest elevation gain, whereas experts seek long, steep, high-elevation alpine routes.
- **Medical Vulnerability ($N$ vs. $M$):** Medically vulnerable hikers (e.g., cardiovascular or joint conditions) possess roughly 20% lower continuous physical endurance and need stricter exertion safety barriers.
- **Geographic Preferences ($P1, P2, P3$):** Hikers cluster their trail preferences around accessible regional zones (Rizal, Laguna/Batangas, Cavite).

### Generation Steps
1. **Factorial Space:** Generate all combinations of $4 \text{ Tiers } (E1, E2, E3, E4) \times 2 \text{ Medical States } (N, M) \times 3 \text{ Province Clusters } (P1, P2, P3) = 24 \text{ blueprints}$.
2. **Deterministic PRNG:** Initialize `np.random.default_rng(base_seed + c_idx * 37)` where `base_seed = 7000 + (set_index * 111)`.
3. **Physical Exertion Bounds:** Draw unscaled physical metrics (`length`, `elevation`, `gain`, `slope`, `easy`) from the corresponding tier interval:
   - $E1$: Easy $[0.10, 0.22]$, Difficult $[0.45, 0.65]$
   - $E2$: Easy $[0.14, 0.28]$, Difficult $[0.50, 0.70]$
   - $E3$: Easy $[0.24, 0.38]$, Difficult $[0.65, 0.82]$
   - $E4$: Easy $[0.34, 0.48]$, Difficult $[0.78, 0.95]$
4. **Medical Twin Downscaling:** For medical cohorts ($M$), apply a strict $0.80\times$ downscale factor to physical continuous features (indices 1..5) and terrain features (indices 11..14).
5. **Monotonicity Enforcement:** Enforce $P_{\text{diff}}[k] \ge P_{\text{easy}}[k] + 0.05$ across all continuous physical metrics ($k \in \{1..5\}$).
6. **Ground Truth Assignment:** Set ground truth identical to the true physical capabilities ($S = A$).

### Normal Concordant Cohorts Table (Set 1 Reference)

| Index | User ID | Cohort Blueprint | Experience Tier | Medical Status | Preferred Province | Length (Easy / Diff) | Elevation (Easy / Diff) | Gain (Easy / Diff) | Slope (Easy / Diff) |
| :---: | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :---: | :---: |
| **U01** | `s1_E1-N-P1` | `E1-N-P1` | E1 (Novice) | None (N) | Rizal | 0.0971 / 0.5293 | 0.1533 / 0.4722 | 0.1195 / 0.4075 | 0.0800 / 0.5090 |
| **U02** | `s1_E1-N-P2` | `E1-N-P2` | E1 (Novice) | None (N) | Batangas, Laguna | 0.1685 / 0.4513 | 0.1442 / 0.4956 | 0.1218 / 0.4831 | 0.0842 / 0.4148 |
| **U03** | `s1_E1-N-P3` | `E1-N-P3` | E1 (Novice) | None (N) | Cavite | 0.1225 / 0.5991 | 0.1209 / 0.5928 | 0.1532 / 0.5231 | 0.1067 / 0.5449 |
| **U04** | `s1_E1-M-P1` | `E1-M-P1` | E1 (Novice) | Diagnosed (M) | Rizal | 0.0777 / 0.4235 | 0.1227 / 0.3778 | 0.0956 / 0.3260 | 0.0640 / 0.4072 |
| **U05** | `s1_E1-M-P2` | `E1-M-P2` | E1 (Novice) | Diagnosed (M) | Batangas, Laguna | 0.1348 / 0.3610 | 0.1153 / 0.3965 | 0.0974 / 0.3865 | 0.0674 / 0.3319 |
| **U06** | `s1_E1-M-P3` | `E1-M-P3` | E1 (Novice) | Diagnosed (M) | Cavite | 0.0980 / 0.4793 | 0.0967 / 0.4742 | 0.1226 / 0.4185 | 0.0853 / 0.4359 |
| **U07** | `s1_E2-N-P1` | `E2-N-P1` | E2 (Gentle) | None (N) | Rizal | 0.1450 / 0.5162 | 0.1414 / 0.5720 | 0.2159 / 0.5076 | 0.1352 / 0.5577 |
| **U08** | `s1_E2-N-P2` | `E2-N-P2` | E2 (Gentle) | None (N) | Batangas, Laguna | 0.1128 / 0.4866 | 0.1538 / 0.6343 | 0.1030 / 0.5743 | 0.1926 / 0.6359 |
| **U09** | `s1_E2-N-P3` | `E2-N-P3` | E2 (Gentle) | None (N) | Cavite | 0.1361 / 0.6038 | 0.1800 / 0.5446 | 0.1852 / 0.5346 | 0.1259 / 0.5248 |
| **U10** | `s1_E2-M-P1` | `E2-M-P1` | E2 (Gentle) | Diagnosed (M) | Rizal | 0.1160 / 0.4129 | 0.1132 / 0.4576 | 0.1727 / 0.4061 | 0.1081 / 0.4462 |
| **U11** | `s1_E2-M-P2` | `E2-M-P2` | E2 (Gentle) | Diagnosed (M) | Batangas, Laguna | 0.0902 / 0.3893 | 0.1230 / 0.5075 | 0.0824 / 0.4595 | 0.1541 / 0.5087 |
| **U12** | `s1_E2-M-P3` | `E2-M-P3` | E2 (Gentle) | Diagnosed (M) | Cavite | 0.1089 / 0.4831 | 0.1440 / 0.4357 | 0.1482 / 0.4276 | 0.1007 / 0.4199 |
| **U13** | `s1_E3-N-P1` | `E3-N-P1` | E3 (Interm) | None (N) | Rizal | 0.3046 / 0.6855 | 0.1989 / 0.7520 | 0.2263 / 0.6017 | 0.2563 / 0.6255 |
| **U14** | `s1_E3-N-P2` | `E3-N-P2` | E3 (Interm) | None (N) | Batangas, Laguna | 0.2347 / 0.6273 | 0.2188 / 0.7694 | 0.2448 / 0.7024 | 0.2068 / 0.6223 |
| **U15** | `s1_E3-N-P3` | `E3-N-P3` | E3 (Interm) | None (N) | Cavite | 0.2782 / 0.7392 | 0.2849 / 0.7680 | 0.2271 / 0.6392 | 0.2040 / 0.6490 |
| **U16** | `s1_E3-M-P1` | `E3-M-P1` | E3 (Interm) | Diagnosed (M) | Rizal | 0.2437 / 0.5484 | 0.1591 / 0.6016 | 0.1811 / 0.4813 | 0.2051 / 0.5004 |
| **U17** | `s1_E3-M-P2` | `E3-M-P2` | E3 (Interm) | Diagnosed (M) | Batangas, Laguna | 0.1877 / 0.5018 | 0.1750 / 0.6155 | 0.1958 / 0.5619 | 0.1654 / 0.4979 |
| **U18** | `s1_E3-M-P3` | `E3-M-P3` | E3 (Interm) | Diagnosed (M) | Cavite | 0.2225 / 0.5913 | 0.2279 / 0.6144 | 0.1817 / 0.5113 | 0.1632 / 0.5192 |
| **U19** | `s1_E4-N-P1` | `E4-N-P1` | E4 (Expert) | None (N) | Rizal | 0.3724 / 0.8514 | 0.3244 / 0.8371 | 0.3267 / 0.7971 | 0.3819 / 0.8759 |
| **U20** | `s1_E4-N-P2` | `E4-N-P2` | E4 (Expert) | None (N) | Batangas, Laguna | 0.3587 / 0.8066 | 0.3769 / 0.7453 | 0.4084 / 0.8333 | 0.3567 / 0.7742 |
| **U21** | `s1_E4-N-P3` | `E4-N-P3` | E4 (Expert) | None (N) | Cavite | 0.4217 / 0.7315 | 0.3264 / 0.7918 | 0.4279 / 0.7326 | 0.3125 / 0.8600 |
| **U22** | `s1_E4-M-P1` | `E4-M-P1` | E4 (Expert) | Diagnosed (M) | Rizal | 0.2979 / 0.6811 | 0.2595 / 0.6697 | 0.2614 / 0.6377 | 0.3055 / 0.7007 |
| **U23** | `s1_E4-M-P2` | `E4-M-P2` | E4 (Expert) | Diagnosed (M) | Batangas, Laguna | 0.2870 / 0.6453 | 0.3015 / 0.5962 | 0.3267 / 0.6667 | 0.2854 / 0.6194 |
| **U24** | `s1_E4-M-P3` | `E4-M-P3` | E4 (Expert) | Diagnosed (M) | Cavite | 0.3374 / 0.5852 | 0.2611 / 0.6335 | 0.3423 / 0.5861 | 0.2500 / 0.6880 |

---

## 3. Generation Group 2: Aberrant Mismatch Cohorts (20 Users)

### Rationale
In questionnaire-driven outdoor systems, user self-reports suffer from cognitive bias:
- **Dunning-Kruger / Hubris Bias (Overestimation):** Inexperienced hikers overestimate their capabilities, registering as $E3$ or $E4$ while possessing $E1$ or $E2$ endurance. This is a critical safety issue: recommending difficult alpine trails to overconfident novices leads to injury or emergency rescue. All 6 possible overestimation pairings are tested.
- **Imposter / Sandbagging Bias (Underestimation):** Conditioned endurance athletes register as $E1$ or $E2$, resulting in recommendations that under-challenge them. The system must recognize under-exertion and adapt their anchors upward.
- **Design Sizing:** 10 pairs $\times$ 2 medical states ($N, M$) = 20 cohorts. Province affinity is standardized to $P1$ (Rizal) to isolate physical and feedback adaptation metrics from geographic noise.

### Generation Steps
1. **Pair Definition:**
   - 6 Overestimated: $(4 \to 1), (4 \to 2), (4 \to 3), (3 \to 1), (3 \to 2), (2 \to 1)$
   - 4 Underestimated: $(1 \to 4), (1 \to 3), (1 \to 2), (2 \to 4)$
2. **Intake Profile Sampling:** Generate initial intake anchors ($P_{\text{easy}}, P_{\text{diff}}$) based on the user's **Stated Tier** ($S$), representing their inflated or deflated self-perception.
3. **Ground Truth Generation:** Sample a distinct `groundTruth` capability profile based on the user's **Actual Tier** ($A$). This ground truth profile dictates their simulated hike performance and post-hike review feedback.
4. **Medical Twin Pair Generation:** For each pair, generate both a Healthy variant ($N$, $1.0\times$) and a Medical variant ($M$, $0.80\times$ physical downscale).

### Aberrant Mismatch Cohorts Table (Set 1 Reference)

| Index | User ID | Cohort Blueprint | Stated $\to$ Actual (Mismatch Type) | Medical Status | Preferred Province | Length (Easy / Diff) | Elevation (Easy / Diff) | Gain (Easy / Diff) | Slope (Easy / Diff) |
| :---: | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :---: | :---: |
| **U25** | `s1_AB-4-1-N-P1` | `AB-4-1-N-P1` | E4 $\to$ E1 (Overestimated) | None (N) | Rizal | 0.3183 / 0.7918 | 0.3320 / 0.8726 | 0.3861 / 0.8709 | 0.4257 / 0.8733 |
| **U26** | `s1_AB-4-1-M-P1` | `AB-4-1-M-P1` | E4 $\to$ E1 (Overestimated) | Diagnosed (M) | Rizal | 0.2547 / 0.6335 | 0.2656 / 0.6981 | 0.3089 / 0.6967 | 0.3406 / 0.6986 |
| **U27** | `s1_AB-4-2-N-P1` | `AB-4-2-N-P1` | E4 $\to$ E2 (Overestimated) | None (N) | Rizal | 0.3879 / 0.8469 | 0.3710 / 0.8460 | 0.3720 / 0.7971 | 0.3704 / 0.8205 |
| **U28** | `s1_AB-4-2-M-P1` | `AB-4-2-M-P1` | E4 $\to$ E2 (Overestimated) | Diagnosed (M) | Rizal | 0.3103 / 0.6776 | 0.2968 / 0.6768 | 0.2976 / 0.6377 | 0.2963 / 0.6564 |
| **U29** | `s1_AB-4-3-N-P1` | `AB-4-3-N-P1` | E4 $\to$ E3 (Overestimated) | None (N) | Rizal | 0.3926 / 0.8256 | 0.3272 / 0.8314 | 0.3046 / 0.7648 | 0.3683 / 0.7348 |
| **U30** | `s1_AB-4-3-M-P1` | `AB-4-3-M-P1` | E4 $\to$ E3 (Overestimated) | Diagnosed (M) | Rizal | 0.3141 / 0.6604 | 0.2618 / 0.6651 | 0.2437 / 0.6119 | 0.2947 / 0.5878 |
| **U31** | `s1_AB-3-1-N-P1` | `AB-3-1-N-P1` | E3 $\to$ E1 (Overestimated) | None (N) | Rizal | 0.3226 / 0.6148 | 0.3159 / 0.6390 | 0.2408 / 0.7065 | 0.3275 / 0.6774 |
| **U32** | `s1_AB-3-1-M-P1` | `AB-3-1-M-P1` | E3 $\to$ E1 (Overestimated) | Diagnosed (M) | Rizal | 0.2580 / 0.4919 | 0.2527 / 0.5112 | 0.1926 / 0.5652 | 0.2620 / 0.5419 |
| **U33** | `s1_AB-3-2-N-P1` | `AB-3-2-N-P1` | E3 $\to$ E2 (Overestimated) | None (N) | Rizal | 0.2017 / 0.7209 | 0.2474 / 0.6586 | 0.2967 / 0.6452 | 0.2254 / 0.6568 |
| **U34** | `s1_AB-3-2-M-P1` | `AB-3-2-M-P1` | E3 $\to$ E2 (Overestimated) | Diagnosed (M) | Rizal | 0.1614 / 0.5767 | 0.1979 / 0.5269 | 0.2374 / 0.5162 | 0.1804 / 0.5254 |
| **U35** | `s1_AB-2-1-N-P1` | `AB-2-1-N-P1` | E2 $\to$ E1 (Overestimated) | None (N) | Rizal | 0.1941 / 0.5259 | 0.1176 / 0.4780 | 0.1605 / 0.5097 | 0.1238 / 0.4656 |
| **U36** | `s1_AB-2-1-M-P1` | `AB-2-1-M-P1` | E2 $\to$ E1 (Overestimated) | Diagnosed (M) | Rizal | 0.1553 / 0.4207 | 0.0941 / 0.3824 | 0.1284 / 0.4077 | 0.0990 / 0.3725 |
| **U37** | `s1_AB-1-4-N-P1` | `AB-1-4-N-P1` | E1 $\to$ E4 (Underestimated) | None (N) | Rizal | 0.1068 / 0.5254 | 0.1448 / 0.5306 | 0.1250 / 0.4341 | 0.1324 / 0.5260 |
| **U38** | `s1_AB-1-4-M-P1` | `AB-1-4-M-P1` | E1 $\to$ E4 (Underestimated) | Diagnosed (M) | Rizal | 0.0854 / 0.4203 | 0.1158 / 0.4245 | 0.1000 / 0.3473 | 0.1059 / 0.4208 |
| **U39** | `s1_AB-1-3-N-P1` | `AB-1-3-N-P1` | E1 $\to$ E3 (Underestimated) | None (N) | Rizal | 0.1563 / 0.4994 | 0.1125 / 0.4324 | 0.1514 / 0.4288 | 0.0995 / 0.5421 |
| **U40** | `s1_AB-1-3-M-P1` | `AB-1-3-M-P1` | E1 $\to$ E3 (Underestimated) | Diagnosed (M) | Rizal | 0.1251 / 0.3995 | 0.0900 / 0.3459 | 0.1211 / 0.3430 | 0.0796 / 0.4337 |
| **U41** | `s1_AB-1-2-N-P1` | `AB-1-2-N-P1` | E1 $\to$ E2 (Underestimated) | None (N) | Rizal | 0.0833 / 0.5072 | 0.1114 / 0.4635 | 0.1262 / 0.4777 | 0.0800 / 0.5227 |
| **U42** | `s1_AB-1-2-M-P1` | `AB-1-2-M-P1` | E1 $\to$ E2 (Underestimated) | Diagnosed (M) | Rizal | 0.0667 / 0.4058 | 0.0891 / 0.3708 | 0.1009 / 0.3821 | 0.0640 / 0.4182 |
| **U43** | `s1_AB-2-4-N-P1` | `AB-2-4-N-P1` | E2 $\to$ E4 (Underestimated) | None (N) | Rizal | 0.1666 / 0.5228 | 0.1328 / 0.4971 | 0.1347 / 0.6250 | 0.1588 / 0.5634 |
| **U44** | `s1_AB-2-4-M-P1` | `AB-2-4-M-P1` | E2 $\to$ E4 (Underestimated) | Diagnosed (M) | Rizal | 0.1332 / 0.4183 | 0.1063 / 0.3977 | 0.1077 / 0.5000 | 0.1270 / 0.4507 |

---

## 4. Generation Group 3: Mirrored Benchmark Twin Set (44 Users)

### Rationale
In **Pillar 2 (Constraint Alignment & Downshift Evaluation)**, the objective is to measure whether the engine's internal downshift algorithm and medical safety rails reduce recommended trail difficulty when a hiker has a diagnosed medical condition.
- If the dataset itself pre-downscales the medical user's anchors by $0.80\times$, an evaluation could mistake dataset differences for recommender engine downshifting.
- To eliminate this bias, a **Mirrored Twin Set** is created: 22 healthy base users are cloned with **100% identical vectors**, differing only by the `medical` flag (`"N"` vs. `"M"`) and `medicalProfile.hasCondition` (`false` vs. `true`).
- When both twins are fed into the recommendation engine, any difficulty difference in recommended trails is guaranteed to be 100% caused by the engine's dynamic downshifting logic.

### Generation Steps
1. **Source Selection:** Load the 44 users from `set_1_users.json` and extract the **22 healthy base users** (`medical == 'N'`).
2. **Clone Healthy Twin:** Copy the healthy user, assigning ID `cohortXX_healthy`, `medical = "N"`, and `medicalProfile.hasCondition = False`.
3. **Clone Medical Twin:** Create an exact clone, assigning ID `cohortXX_medical`, `medical = "M"`, and `medicalProfile.hasCondition = True`.
4. **Preserve Vectors Identically:** Retain identical physical continuous features, terrain affinities, province weights, route circularity, and metadata anchors.
5. **Field-by-Field Audit:** Verify that no other field differs between the twins before writing to [`set_1_users_mirrored.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets/set_1_users_mirrored.json).

### Mirrored Benchmark Twin Set Table

| Index | User ID | Twin Pair ID | Experience Tier | Medical State | Preferred Province | Length (Easy / Diff) | Elevation (Easy / Diff) | Gain (Easy / Diff) | Slope (Easy / Diff) |
| :---: | :--- | :---: | :---: | :---: | :--- | :---: | :---: | :---: | :---: |
| **M01** | `cohort01_healthy` | `cohort01` | E1 (Novice) | Healthy (N) | Rizal | 0.0971 / 0.5293 | 0.1533 / 0.4722 | 0.1195 / 0.4075 | 0.0800 / 0.5090 |
| **M02** | `cohort01_medical` | `cohort01` | E1 (Novice) | Medical (M) | Rizal | 0.0971 / 0.5293 | 0.1533 / 0.4722 | 0.1195 / 0.4075 | 0.0800 / 0.5090 |
| **M03** | `cohort02_healthy` | `cohort02` | E1 (Novice) | Healthy (N) | Batangas, Laguna | 0.1685 / 0.4513 | 0.1442 / 0.4956 | 0.1218 / 0.4831 | 0.0842 / 0.4148 |
| **M04** | `cohort02_medical` | `cohort02` | E1 (Novice) | Medical (M) | Batangas, Laguna | 0.1685 / 0.4513 | 0.1442 / 0.4956 | 0.1218 / 0.4831 | 0.0842 / 0.4148 |
| **M05** | `cohort03_healthy` | `cohort03` | E1 (Novice) | Healthy (N) | Cavite | 0.1225 / 0.5991 | 0.1209 / 0.5928 | 0.1532 / 0.5231 | 0.1067 / 0.5449 |
| **M06** | `cohort03_medical` | `cohort03` | E1 (Novice) | Medical (M) | Cavite | 0.1225 / 0.5991 | 0.1209 / 0.5928 | 0.1532 / 0.5231 | 0.1067 / 0.5449 |
| **M07** | `cohort04_healthy` | `cohort04` | E2 (Gentle) | Healthy (N) | Rizal | 0.1450 / 0.5162 | 0.1414 / 0.5720 | 0.2159 / 0.5076 | 0.1352 / 0.5577 |
| **M08** | `cohort04_medical` | `cohort04` | E2 (Gentle) | Medical (M) | Rizal | 0.1450 / 0.5162 | 0.1414 / 0.5720 | 0.2159 / 0.5076 | 0.1352 / 0.5577 |
| **M09** | `cohort05_healthy` | `cohort05` | E2 (Gentle) | Healthy (N) | Batangas, Laguna | 0.1128 / 0.4866 | 0.1538 / 0.6343 | 0.1030 / 0.5743 | 0.1926 / 0.6359 |
| **M10** | `cohort05_medical` | `cohort05` | E2 (Gentle) | Medical (M) | Batangas, Laguna | 0.1128 / 0.4866 | 0.1538 / 0.6343 | 0.1030 / 0.5743 | 0.1926 / 0.6359 |
| **M11** | `cohort06_healthy` | `cohort06` | E2 (Gentle) | Healthy (N) | Cavite | 0.1361 / 0.6038 | 0.1800 / 0.5446 | 0.1852 / 0.5346 | 0.1259 / 0.5248 |
| **M12** | `cohort06_medical` | `cohort06` | E2 (Gentle) | Medical (M) | Cavite | 0.1361 / 0.6038 | 0.1800 / 0.5446 | 0.1852 / 0.5346 | 0.1259 / 0.5248 |
| **M13** | `cohort07_healthy` | `cohort07` | E3 (Interm) | Healthy (N) | Rizal | 0.3046 / 0.6855 | 0.1989 / 0.7520 | 0.2263 / 0.6017 | 0.2563 / 0.6255 |
| **M14** | `cohort07_medical` | `cohort07` | E3 (Interm) | Medical (M) | Rizal | 0.3046 / 0.6855 | 0.1989 / 0.7520 | 0.2263 / 0.6017 | 0.2563 / 0.6255 |
| **M15** | `cohort08_healthy` | `cohort08` | E3 (Interm) | Healthy (N) | Batangas, Laguna | 0.2347 / 0.6273 | 0.2188 / 0.7694 | 0.2448 / 0.7024 | 0.2068 / 0.6223 |
| **M16** | `cohort08_medical` | `cohort08` | E3 (Interm) | Medical (M) | Batangas, Laguna | 0.2347 / 0.6273 | 0.2188 / 0.7694 | 0.2448 / 0.7024 | 0.2068 / 0.6223 |
| **M17** | `cohort09_healthy` | `cohort09` | E3 (Interm) | Healthy (N) | Cavite | 0.2782 / 0.7392 | 0.2849 / 0.7680 | 0.2271 / 0.6392 | 0.2040 / 0.6490 |
| **M18** | `cohort09_medical` | `cohort09` | E3 (Interm) | Medical (M) | Cavite | 0.2782 / 0.7392 | 0.2849 / 0.7680 | 0.2271 / 0.6392 | 0.2040 / 0.6490 |
| **M19** | `cohort10_healthy` | `cohort10` | E4 (Expert) | Healthy (N) | Rizal | 0.3724 / 0.8514 | 0.3244 / 0.8371 | 0.3267 / 0.7971 | 0.3819 / 0.8759 |
| **M20** | `cohort10_medical` | `cohort10` | E4 (Expert) | Medical (M) | Rizal | 0.3724 / 0.8514 | 0.3244 / 0.8371 | 0.3267 / 0.7971 | 0.3819 / 0.8759 |
| **M21** | `cohort11_healthy` | `cohort11` | E4 (Expert) | Healthy (N) | Batangas, Laguna | 0.3587 / 0.8066 | 0.3769 / 0.7453 | 0.4084 / 0.8333 | 0.3567 / 0.7742 |
| **M22** | `cohort11_medical` | `cohort11` | E4 (Expert) | Medical (M) | Batangas, Laguna | 0.3587 / 0.8066 | 0.3769 / 0.7453 | 0.4084 / 0.8333 | 0.3567 / 0.7742 |
| **M23** | `cohort12_healthy` | `cohort12` | E4 (Expert) | Healthy (N) | Cavite | 0.4217 / 0.7315 | 0.3264 / 0.7918 | 0.4279 / 0.7326 | 0.3125 / 0.8600 |
| **M24** | `cohort12_medical` | `cohort12` | E4 (Expert) | Medical (M) | Cavite | 0.4217 / 0.7315 | 0.3264 / 0.7918 | 0.4279 / 0.7326 | 0.3125 / 0.8600 |
| **M25** | `cohort13_healthy` | `cohort13` | E4 (Intake) | Healthy (N) | Rizal | 0.3183 / 0.7918 | 0.3320 / 0.8726 | 0.3861 / 0.8709 | 0.4257 / 0.8733 |
| **M26** | `cohort13_medical` | `cohort13` | E4 (Intake) | Medical (M) | Rizal | 0.3183 / 0.7918 | 0.3320 / 0.8726 | 0.3861 / 0.8709 | 0.4257 / 0.8733 |
| **M27** | `cohort14_healthy` | `cohort14` | E4 (Intake) | Healthy (N) | Rizal | 0.3879 / 0.8469 | 0.3710 / 0.8460 | 0.3720 / 0.7971 | 0.3704 / 0.8205 |
| **M28** | `cohort14_medical` | `cohort14` | E4 (Intake) | Medical (M) | Rizal | 0.3879 / 0.8469 | 0.3710 / 0.8460 | 0.3720 / 0.7971 | 0.3704 / 0.8205 |
| **M29** | `cohort15_healthy` | `cohort15` | E4 (Intake) | Healthy (N) | Rizal | 0.3926 / 0.8256 | 0.3272 / 0.8314 | 0.3046 / 0.7648 | 0.3683 / 0.7348 |
| **M30** | `cohort15_medical` | `cohort15` | E4 (Intake) | Medical (M) | Rizal | 0.3926 / 0.8256 | 0.3272 / 0.8314 | 0.3046 / 0.7648 | 0.3683 / 0.7348 |
| **M31** | `cohort16_healthy` | `cohort16` | E3 (Intake) | Healthy (N) | Rizal | 0.3226 / 0.6148 | 0.3159 / 0.6390 | 0.2408 / 0.7065 | 0.3275 / 0.6774 |
| **M32** | `cohort16_medical` | `cohort16` | E3 (Intake) | Medical (M) | Rizal | 0.3226 / 0.6148 | 0.3159 / 0.6390 | 0.2408 / 0.7065 | 0.3275 / 0.6774 |
| **M33** | `cohort17_healthy` | `cohort17` | E3 (Intake) | Healthy (N) | Rizal | 0.2017 / 0.7209 | 0.2474 / 0.6586 | 0.2967 / 0.6452 | 0.2254 / 0.6568 |
| **M34** | `cohort17_medical` | `cohort17` | E3 (Intake) | Medical (M) | Rizal | 0.2017 / 0.7209 | 0.2474 / 0.6586 | 0.2967 / 0.6452 | 0.2254 / 0.6568 |
| **M35** | `cohort18_healthy` | `cohort18` | E2 (Intake) | Healthy (N) | Rizal | 0.1941 / 0.5259 | 0.1176 / 0.4780 | 0.1605 / 0.5097 | 0.1238 / 0.4656 |
| **M36** | `cohort18_medical` | `cohort18` | E2 (Intake) | Medical (M) | Rizal | 0.1941 / 0.5259 | 0.1176 / 0.4780 | 0.1605 / 0.5097 | 0.1238 / 0.4656 |
| **M37** | `cohort19_healthy` | `cohort19` | E1 (Intake) | Healthy (N) | Rizal | 0.1068 / 0.5254 | 0.1448 / 0.5306 | 0.1250 / 0.4341 | 0.1324 / 0.5260 |
| **M38** | `cohort19_medical` | `cohort19` | E1 (Intake) | Medical (M) | Rizal | 0.1068 / 0.5254 | 0.1448 / 0.5306 | 0.1250 / 0.4341 | 0.1324 / 0.5260 |
| **M39** | `cohort20_healthy` | `cohort20` | E1 (Intake) | Healthy (N) | Rizal | 0.1563 / 0.4994 | 0.1125 / 0.4324 | 0.1514 / 0.4288 | 0.0995 / 0.5421 |
| **M40** | `cohort20_medical` | `cohort20` | E1 (Intake) | Medical (M) | Rizal | 0.1563 / 0.4994 | 0.1125 / 0.4324 | 0.1514 / 0.4288 | 0.0995 / 0.5421 |
| **M41** | `cohort21_healthy` | `cohort21` | E1 (Intake) | Healthy (N) | Rizal | 0.0833 / 0.5072 | 0.1114 / 0.4635 | 0.1262 / 0.4777 | 0.0800 / 0.5227 |
| **M42** | `cohort21_medical` | `cohort21` | E1 (Intake) | Medical (M) | Rizal | 0.0833 / 0.5072 | 0.1114 / 0.4635 | 0.1262 / 0.4777 | 0.0800 / 0.5227 |
| **M43** | `cohort22_healthy` | `cohort22` | E2 (Intake) | Healthy (N) | Rizal | 0.1666 / 0.5228 | 0.1328 / 0.4971 | 0.1347 / 0.6250 | 0.1588 / 0.5634 |
| **M44** | `cohort22_medical` | `cohort22` | E2 (Intake) | Medical (M) | Rizal | 0.1666 / 0.5228 | 0.1328 / 0.4971 | 0.1347 / 0.6250 | 0.1588 / 0.5634 |

---

## 5. Generation Group 4: Inter-Set Replication Across 5 Distinct Sets

### Rationale
To demonstrate that recommendation engine performance is robust and not an artifact of one specific random seed draw, 5 independent user sets (`set_1` to `set_5`) were generated from the same 44 blueprints:
- **Sample Variance:** Evaluates whether collaborative filtering neighborhoods remain consistent even when individual peer vectors experience natural sampling variance.
- **Zero Collision Guarantee:** Every set must have non-zero distance from every other set, with no overlapping vectors.

### Generation Steps
1. **Stratified Set Jitter:** Apply an inter-set offset based on the set index $s \in \{1..5\}$:
   $$\text{Jitter}(s) = (s - 3) \times 0.025 \quad (\text{yielding } -0.05, -0.025, 0.0, +0.025, +0.05)$$
2. **Terrain Cycling:** Primary terrain affinities rotate across the sets ($(\text{set\_index} + \text{stated\_tier}) \pmod 4$) to simulate different regional preferences.
3. **Dirichlet Route Sampling:** Dirichlet parameters for circularity are shifted by $0.1 \times s$.
4. **Dissimilarity Verification:** Run [`engine/verify_user_sets.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/verify_user_sets.py) to measure pairwise Gower Distance (GD) across all 10 set pairs ($\binom{5}{2} = 10$).

### Multi-Set Overview & Dissimilarity Verification Table


| Dataset File | Cohorts | Archetype Composition | Sample User IDs | Inter-Set Dissimilarity vs. Set 1 (Mean GD) | Verification Status |
| :--- | :---: | :--- | :--- | :---: | :---: |
| [`set_1_users.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets/set_1_users.json) | 44 | 24 Normal + 20 Aberrant | `s1_E1-N-P1`, `s1_AB-4-1-N-P1` | Baseline ($0.0000$) | **100% Passed** |
| [`set_2_users.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets/set_2_users.json) | 44 | 24 Normal + 20 Aberrant | `s2_E1-N-P1`, `s2_AB-4-1-N-P1` | **0.0849** (8.49% difference) | **100% Passed** |
| [`set_3_users.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets/set_3_users.json) | 44 | 24 Normal + 20 Aberrant | `s3_E1-N-P1`, `s3_AB-4-1-N-P1` | **0.0864** (8.64% difference) | **100% Passed** |
| [`set_4_users.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets/set_4_users.json) | 44 | 24 Normal + 20 Aberrant | `s4_E1-N-P1`, `s4_AB-4-1-N-P1` | **0.0886** (8.86% difference) | **100% Passed** |
| [`set_5_users.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets/set_5_users.json) | 44 | 24 Normal + 20 Aberrant | `s5_E1-N-P1`, `s5_AB-4-1-N-P1` | **0.0873** (8.73% difference) | **100% Passed** |


---

### 5.1. Set 1 User Population (44 Users)

> **Source File:** [`engine/data/seeded_user_sets/set_1_users.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets/set_1_users.json)  
> **Seed Base:** `7000 + 1 * 111` = `7111`  
> **Stratified Jitter Offset:** `-0.050`

| Index | User ID | Cohort Blueprint | Archetype / Group | Stated $\to$ Actual | Medical Status | Preferred Province | Length (Easy / Diff) | Elevation (Easy / Diff) | Gain (Easy / Diff) | Slope (Easy / Diff) |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- | :---: | :---: | :---: | :---: |
| **U01** | `s1_E1-N-P1` | `E1-N-P1` | Normal | E1 | Healthy (N) | Rizal | 0.0971 / 0.5293 | 0.1533 / 0.4722 | 0.1195 / 0.4075 | 0.0800 / 0.5090 |
| **U02** | `s1_E1-N-P2` | `E1-N-P2` | Normal | E1 | Healthy (N) | Batangas, Laguna | 0.1685 / 0.4513 | 0.1442 / 0.4956 | 0.1218 / 0.4831 | 0.0842 / 0.4148 |
| **U03** | `s1_E1-N-P3` | `E1-N-P3` | Normal | E1 | Healthy (N) | Cavite | 0.1225 / 0.5991 | 0.1209 / 0.5928 | 0.1532 / 0.5231 | 0.1067 / 0.5449 |
| **U04** | `s1_E1-M-P1` | `E1-M-P1` | Normal | E1 | Medical (M) | Rizal | 0.0777 / 0.4235 | 0.1227 / 0.3778 | 0.0956 / 0.3260 | 0.0640 / 0.4072 |
| **U05** | `s1_E1-M-P2` | `E1-M-P2` | Normal | E1 | Medical (M) | Batangas, Laguna | 0.1348 / 0.3610 | 0.1153 / 0.3965 | 0.0974 / 0.3865 | 0.0674 / 0.3319 |
| **U06** | `s1_E1-M-P3` | `E1-M-P3` | Normal | E1 | Medical (M) | Cavite | 0.0980 / 0.4793 | 0.0967 / 0.4742 | 0.1226 / 0.4185 | 0.0853 / 0.4359 |
| **U07** | `s1_E2-N-P1` | `E2-N-P1` | Normal | E2 | Healthy (N) | Rizal | 0.1450 / 0.5162 | 0.1414 / 0.5720 | 0.2159 / 0.5076 | 0.1352 / 0.5577 |
| **U08** | `s1_E2-N-P2` | `E2-N-P2` | Normal | E2 | Healthy (N) | Batangas, Laguna | 0.1128 / 0.4866 | 0.1538 / 0.6343 | 0.1030 / 0.5743 | 0.1926 / 0.6359 |
| **U09** | `s1_E2-N-P3` | `E2-N-P3` | Normal | E2 | Healthy (N) | Cavite | 0.1361 / 0.6038 | 0.1800 / 0.5446 | 0.1852 / 0.5346 | 0.1259 / 0.5248 |
| **U10** | `s1_E2-M-P1` | `E2-M-P1` | Normal | E2 | Medical (M) | Rizal | 0.1160 / 0.4129 | 0.1132 / 0.4576 | 0.1727 / 0.4061 | 0.1081 / 0.4462 |
| **U11** | `s1_E2-M-P2` | `E2-M-P2` | Normal | E2 | Medical (M) | Batangas, Laguna | 0.0902 / 0.3893 | 0.1230 / 0.5075 | 0.0824 / 0.4595 | 0.1541 / 0.5087 |
| **U12** | `s1_E2-M-P3` | `E2-M-P3` | Normal | E2 | Medical (M) | Cavite | 0.1089 / 0.4831 | 0.1440 / 0.4357 | 0.1482 / 0.4276 | 0.1007 / 0.4199 |
| **U13** | `s1_E3-N-P1` | `E3-N-P1` | Normal | E3 | Healthy (N) | Rizal | 0.3046 / 0.6855 | 0.1989 / 0.7520 | 0.2263 / 0.6017 | 0.2563 / 0.6255 |
| **U14** | `s1_E3-N-P2` | `E3-N-P2` | Normal | E3 | Healthy (N) | Batangas, Laguna | 0.2347 / 0.6273 | 0.2188 / 0.7694 | 0.2448 / 0.7024 | 0.2068 / 0.6223 |
| **U15** | `s1_E3-N-P3` | `E3-N-P3` | Normal | E3 | Healthy (N) | Cavite | 0.2782 / 0.7392 | 0.2849 / 0.7680 | 0.2271 / 0.6392 | 0.2040 / 0.6490 |
| **U16** | `s1_E3-M-P1` | `E3-M-P1` | Normal | E3 | Medical (M) | Rizal | 0.2437 / 0.5484 | 0.1591 / 0.6016 | 0.1811 / 0.4813 | 0.2051 / 0.5004 |
| **U17** | `s1_E3-M-P2` | `E3-M-P2` | Normal | E3 | Medical (M) | Batangas, Laguna | 0.1877 / 0.5018 | 0.1750 / 0.6155 | 0.1958 / 0.5619 | 0.1654 / 0.4979 |
| **U18** | `s1_E3-M-P3` | `E3-M-P3` | Normal | E3 | Medical (M) | Cavite | 0.2225 / 0.5913 | 0.2279 / 0.6144 | 0.1817 / 0.5113 | 0.1632 / 0.5192 |
| **U19** | `s1_E4-N-P1` | `E4-N-P1` | Normal | E4 | Healthy (N) | Rizal | 0.3724 / 0.8514 | 0.3244 / 0.8371 | 0.3267 / 0.7971 | 0.3819 / 0.8759 |
| **U20** | `s1_E4-N-P2` | `E4-N-P2` | Normal | E4 | Healthy (N) | Batangas, Laguna | 0.3587 / 0.8066 | 0.3769 / 0.7453 | 0.4084 / 0.8333 | 0.3567 / 0.7742 |
| **U21** | `s1_E4-N-P3` | `E4-N-P3` | Normal | E4 | Healthy (N) | Cavite | 0.4217 / 0.7315 | 0.3264 / 0.7918 | 0.4279 / 0.7326 | 0.3125 / 0.8600 |
| **U22** | `s1_E4-M-P1` | `E4-M-P1` | Normal | E4 | Medical (M) | Rizal | 0.2979 / 0.6811 | 0.2595 / 0.6697 | 0.2614 / 0.6377 | 0.3055 / 0.7007 |
| **U23** | `s1_E4-M-P2` | `E4-M-P2` | Normal | E4 | Medical (M) | Batangas, Laguna | 0.2870 / 0.6453 | 0.3015 / 0.5962 | 0.3267 / 0.6667 | 0.2854 / 0.6194 |
| **U24** | `s1_E4-M-P3` | `E4-M-P3` | Normal | E4 | Medical (M) | Cavite | 0.3374 / 0.5852 | 0.2611 / 0.6335 | 0.3423 / 0.5861 | 0.2500 / 0.6880 |
| **U25** | `s1_AB-4-1-N-P1` | `AB-4-1-N-P1` | Aberrant | E4 $\to$ E1 | Healthy (N) | Rizal | 0.3183 / 0.7918 | 0.3320 / 0.8726 | 0.3861 / 0.8709 | 0.4257 / 0.8733 |
| **U26** | `s1_AB-4-1-M-P1` | `AB-4-1-M-P1` | Aberrant | E4 $\to$ E1 | Medical (M) | Rizal | 0.2547 / 0.6335 | 0.2656 / 0.6981 | 0.3089 / 0.6967 | 0.3406 / 0.6986 |
| **U27** | `s1_AB-4-2-N-P1` | `AB-4-2-N-P1` | Aberrant | E4 $\to$ E2 | Healthy (N) | Rizal | 0.3879 / 0.8469 | 0.3710 / 0.8460 | 0.3720 / 0.7971 | 0.3704 / 0.8205 |
| **U28** | `s1_AB-4-2-M-P1` | `AB-4-2-M-P1` | Aberrant | E4 $\to$ E2 | Medical (M) | Rizal | 0.3103 / 0.6776 | 0.2968 / 0.6768 | 0.2976 / 0.6377 | 0.2963 / 0.6564 |
| **U29** | `s1_AB-4-3-N-P1` | `AB-4-3-N-P1` | Aberrant | E4 $\to$ E3 | Healthy (N) | Rizal | 0.3926 / 0.8256 | 0.3272 / 0.8314 | 0.3046 / 0.7648 | 0.3683 / 0.7348 |
| **U30** | `s1_AB-4-3-M-P1` | `AB-4-3-M-P1` | Aberrant | E4 $\to$ E3 | Medical (M) | Rizal | 0.3141 / 0.6604 | 0.2618 / 0.6651 | 0.2437 / 0.6119 | 0.2947 / 0.5878 |
| **U31** | `s1_AB-3-1-N-P1` | `AB-3-1-N-P1` | Aberrant | E3 $\to$ E1 | Healthy (N) | Rizal | 0.3226 / 0.6148 | 0.3159 / 0.6390 | 0.2408 / 0.7065 | 0.3275 / 0.6774 |
| **U32** | `s1_AB-3-1-M-P1` | `AB-3-1-M-P1` | Aberrant | E3 $\to$ E1 | Medical (M) | Rizal | 0.2580 / 0.4919 | 0.2527 / 0.5112 | 0.1926 / 0.5652 | 0.2620 / 0.5419 |
| **U33** | `s1_AB-3-2-N-P1` | `AB-3-2-N-P1` | Aberrant | E3 $\to$ E2 | Healthy (N) | Rizal | 0.2017 / 0.7209 | 0.2474 / 0.6586 | 0.2967 / 0.6452 | 0.2254 / 0.6568 |
| **U34** | `s1_AB-3-2-M-P1` | `AB-3-2-M-P1` | Aberrant | E3 $\to$ E2 | Medical (M) | Rizal | 0.1614 / 0.5767 | 0.1979 / 0.5269 | 0.2374 / 0.5162 | 0.1804 / 0.5254 |
| **U35** | `s1_AB-2-1-N-P1` | `AB-2-1-N-P1` | Aberrant | E2 $\to$ E1 | Healthy (N) | Rizal | 0.1941 / 0.5259 | 0.1176 / 0.4780 | 0.1605 / 0.5097 | 0.1238 / 0.4656 |
| **U36** | `s1_AB-2-1-M-P1` | `AB-2-1-M-P1` | Aberrant | E2 $\to$ E1 | Medical (M) | Rizal | 0.1553 / 0.4207 | 0.0941 / 0.3824 | 0.1284 / 0.4077 | 0.0990 / 0.3725 |
| **U37** | `s1_AB-1-4-N-P1` | `AB-1-4-N-P1` | Aberrant | E1 $\to$ E4 | Healthy (N) | Rizal | 0.1068 / 0.5254 | 0.1448 / 0.5306 | 0.1250 / 0.4341 | 0.1324 / 0.5260 |
| **U38** | `s1_AB-1-4-M-P1` | `AB-1-4-M-P1` | Aberrant | E1 $\to$ E4 | Medical (M) | Rizal | 0.0854 / 0.4203 | 0.1158 / 0.4245 | 0.1000 / 0.3473 | 0.1059 / 0.4208 |
| **U39** | `s1_AB-1-3-N-P1` | `AB-1-3-N-P1` | Aberrant | E1 $\to$ E3 | Healthy (N) | Rizal | 0.1563 / 0.4994 | 0.1125 / 0.4324 | 0.1514 / 0.4288 | 0.0995 / 0.5421 |
| **U40** | `s1_AB-1-3-M-P1` | `AB-1-3-M-P1` | Aberrant | E1 $\to$ E3 | Medical (M) | Rizal | 0.1251 / 0.3995 | 0.0900 / 0.3459 | 0.1211 / 0.3430 | 0.0796 / 0.4337 |
| **U41** | `s1_AB-1-2-N-P1` | `AB-1-2-N-P1` | Aberrant | E1 $\to$ E2 | Healthy (N) | Rizal | 0.0833 / 0.5072 | 0.1114 / 0.4635 | 0.1262 / 0.4777 | 0.0800 / 0.5227 |
| **U42** | `s1_AB-1-2-M-P1` | `AB-1-2-M-P1` | Aberrant | E1 $\to$ E2 | Medical (M) | Rizal | 0.0667 / 0.4058 | 0.0891 / 0.3708 | 0.1009 / 0.3821 | 0.0640 / 0.4182 |
| **U43** | `s1_AB-2-4-N-P1` | `AB-2-4-N-P1` | Aberrant | E2 $\to$ E4 | Healthy (N) | Rizal | 0.1666 / 0.5228 | 0.1328 / 0.4971 | 0.1347 / 0.6250 | 0.1588 / 0.5634 |
| **U44** | `s1_AB-2-4-M-P1` | `AB-2-4-M-P1` | Aberrant | E2 $\to$ E4 | Medical (M) | Rizal | 0.1332 / 0.4183 | 0.1063 / 0.3977 | 0.1077 / 0.5000 | 0.1270 / 0.4507 |


---

### 5.2. Set 2 User Population (44 Users)

> **Source File:** [`engine/data/seeded_user_sets/set_2_users.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets/set_2_users.json)  
> **Seed Base:** `7000 + 2 * 111` = `7222`  
> **Stratified Jitter Offset:** `-0.025`

| Index | User ID | Cohort Blueprint | Archetype / Group | Stated $\to$ Actual | Medical Status | Preferred Province | Length (Easy / Diff) | Elevation (Easy / Diff) | Gain (Easy / Diff) | Slope (Easy / Diff) |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- | :---: | :---: | :---: | :---: |
| **U01** | `s2_E1-N-P1` | `E1-N-P1` | Normal | E1 | Healthy (N) | Rizal | 0.1412 / 0.6197 | 0.1271 / 0.5994 | 0.1234 / 0.4333 | 0.1602 / 0.4917 |
| **U02** | `s2_E1-N-P2` | `E1-N-P2` | Normal | E1 | Healthy (N) | Batangas, Laguna | 0.1816 / 0.4498 | 0.1546 / 0.4692 | 0.0857 / 0.5488 | 0.1661 / 0.4402 |
| **U03** | `s2_E1-N-P3` | `E1-N-P3` | Normal | E1 | Healthy (N) | Cavite | 0.1591 / 0.4702 | 0.0800 / 0.5033 | 0.0895 / 0.4388 | 0.0913 / 0.5538 |
| **U04** | `s2_E1-M-P1` | `E1-M-P1` | Normal | E1 | Medical (M) | Rizal | 0.1129 / 0.4957 | 0.1017 / 0.4795 | 0.0987 / 0.3466 | 0.1282 / 0.3934 |
| **U05** | `s2_E1-M-P2` | `E1-M-P2` | Normal | E1 | Medical (M) | Batangas, Laguna | 0.1453 / 0.3599 | 0.1236 / 0.3754 | 0.0686 / 0.4390 | 0.1328 / 0.3522 |
| **U06** | `s2_E1-M-P3` | `E1-M-P3` | Normal | E1 | Medical (M) | Cavite | 0.1273 / 0.3762 | 0.0640 / 0.4027 | 0.0716 / 0.3511 | 0.0730 / 0.4430 |
| **U07** | `s2_E2-N-P1` | `E2-N-P1` | Normal | E2 | Healthy (N) | Rizal | 0.2139 / 0.6288 | 0.1176 / 0.4764 | 0.1527 / 0.6096 | 0.2260 / 0.5010 |
| **U08** | `s2_E2-N-P2` | `E2-N-P2` | Normal | E2 | Healthy (N) | Batangas, Laguna | 0.1245 / 0.5709 | 0.2504 / 0.6029 | 0.1954 / 0.5287 | 0.1540 / 0.6475 |
| **U09** | `s2_E2-N-P3` | `E2-N-P3` | Normal | E2 | Healthy (N) | Cavite | 0.2199 / 0.5229 | 0.1731 / 0.6420 | 0.1238 / 0.6540 | 0.2068 / 0.5453 |
| **U10** | `s2_E2-M-P1` | `E2-M-P1` | Normal | E2 | Medical (M) | Rizal | 0.1711 / 0.5030 | 0.0941 / 0.3811 | 0.1222 / 0.4877 | 0.1808 / 0.4008 |
| **U11** | `s2_E2-M-P2` | `E2-M-P2` | Normal | E2 | Medical (M) | Batangas, Laguna | 0.0996 / 0.4567 | 0.2003 / 0.4823 | 0.1563 / 0.4230 | 0.1232 / 0.5180 |
| **U12** | `s2_E2-M-P3` | `E2-M-P3` | Normal | E2 | Medical (M) | Cavite | 0.1759 / 0.4183 | 0.1385 / 0.5136 | 0.0990 / 0.5232 | 0.1655 / 0.4362 |
| **U13** | `s2_E3-N-P1` | `E3-N-P1` | Normal | E3 | Healthy (N) | Rizal | 0.3001 / 0.7489 | 0.2813 / 0.6739 | 0.2574 / 0.7164 | 0.2456 / 0.7738 |
| **U14** | `s2_E3-N-P2` | `E3-N-P2` | Normal | E3 | Healthy (N) | Batangas, Laguna | 0.3401 / 0.7641 | 0.2418 / 0.7176 | 0.3421 / 0.7844 | 0.2732 / 0.6793 |
| **U15** | `s2_E3-N-P3` | `E3-N-P3` | Normal | E3 | Healthy (N) | Cavite | 0.3187 / 0.7611 | 0.3001 / 0.7194 | 0.2951 / 0.7240 | 0.2351 / 0.6337 |
| **U16** | `s2_E3-M-P1` | `E3-M-P1` | Normal | E3 | Medical (M) | Rizal | 0.2401 / 0.5991 | 0.2250 / 0.5391 | 0.2059 / 0.5731 | 0.1965 / 0.6190 |
| **U17** | `s2_E3-M-P2` | `E3-M-P2` | Normal | E3 | Medical (M) | Batangas, Laguna | 0.2721 / 0.6113 | 0.1935 / 0.5740 | 0.2736 / 0.6275 | 0.2186 / 0.5435 |
| **U18** | `s2_E3-M-P3` | `E3-M-P3` | Normal | E3 | Medical (M) | Cavite | 0.2550 / 0.6089 | 0.2401 / 0.5755 | 0.2361 / 0.5792 | 0.1881 / 0.5070 |
| **U19** | `s2_E4-N-P1` | `E4-N-P1` | Normal | E4 | Healthy (N) | Rizal | 0.3753 / 0.8386 | 0.3842 / 0.8531 | 0.3655 / 0.7602 | 0.4514 / 0.7858 |
| **U20** | `s2_E4-N-P2` | `E4-N-P2` | Normal | E4 | Healthy (N) | Batangas, Laguna | 0.4250 / 0.8671 | 0.4155 / 0.8392 | 0.3243 / 0.7884 | 0.4361 / 0.8559 |
| **U21** | `s2_E4-N-P3` | `E4-N-P3` | Normal | E4 | Healthy (N) | Cavite | 0.4394 / 0.8369 | 0.4188 / 0.8885 | 0.3204 / 0.7854 | 0.3922 / 0.8994 |
| **U22** | `s2_E4-M-P1` | `E4-M-P1` | Normal | E4 | Medical (M) | Rizal | 0.3003 / 0.6709 | 0.3073 / 0.6825 | 0.2924 / 0.6082 | 0.3611 / 0.6286 |
| **U23** | `s2_E4-M-P2` | `E4-M-P2` | Normal | E4 | Medical (M) | Batangas, Laguna | 0.3400 / 0.6937 | 0.3324 / 0.6714 | 0.2595 / 0.6307 | 0.3489 / 0.6848 |
| **U24** | `s2_E4-M-P3` | `E4-M-P3` | Normal | E4 | Medical (M) | Cavite | 0.3515 / 0.6695 | 0.3350 / 0.7108 | 0.2563 / 0.6283 | 0.3137 / 0.7196 |
| **U25** | `s2_AB-4-1-N-P1` | `AB-4-1-N-P1` | Aberrant | E4 $\to$ E1 | Healthy (N) | Rizal | 0.3609 / 0.8451 | 0.3469 / 0.8431 | 0.4279 / 0.8046 | 0.3454 / 0.8368 |
| **U26** | `s2_AB-4-1-M-P1` | `AB-4-1-M-P1` | Aberrant | E4 $\to$ E1 | Medical (M) | Rizal | 0.2887 / 0.6761 | 0.2775 / 0.6745 | 0.3423 / 0.6437 | 0.2763 / 0.6695 |
| **U27** | `s2_AB-4-2-N-P1` | `AB-4-2-N-P1` | Aberrant | E4 $\to$ E2 | Healthy (N) | Rizal | 0.3563 / 0.8039 | 0.3320 / 0.8111 | 0.3374 / 0.9055 | 0.3619 / 0.8352 |
| **U28** | `s2_AB-4-2-M-P1` | `AB-4-2-M-P1` | Aberrant | E4 $\to$ E2 | Medical (M) | Rizal | 0.2851 / 0.6432 | 0.2656 / 0.6488 | 0.2699 / 0.7244 | 0.2895 / 0.6682 |
| **U29** | `s2_AB-4-3-N-P1` | `AB-4-3-N-P1` | Aberrant | E4 $\to$ E3 | Healthy (N) | Rizal | 0.3568 / 0.8930 | 0.3618 / 0.8170 | 0.3583 / 0.9079 | 0.4268 / 0.8733 |
| **U30** | `s2_AB-4-3-M-P1` | `AB-4-3-M-P1` | Aberrant | E4 $\to$ E3 | Medical (M) | Rizal | 0.2854 / 0.7144 | 0.2895 / 0.6536 | 0.2866 / 0.7263 | 0.3414 / 0.6987 |
| **U31** | `s2_AB-3-1-N-P1` | `AB-3-1-N-P1` | Aberrant | E3 $\to$ E1 | Healthy (N) | Rizal | 0.2353 / 0.6930 | 0.3471 / 0.7098 | 0.2213 / 0.7724 | 0.3180 / 0.7236 |
| **U32** | `s2_AB-3-1-M-P1` | `AB-3-1-M-P1` | Aberrant | E3 $\to$ E1 | Medical (M) | Rizal | 0.1882 / 0.5544 | 0.2777 / 0.5678 | 0.1771 / 0.6180 | 0.2544 / 0.5789 |
| **U33** | `s2_AB-3-2-N-P1` | `AB-3-2-N-P1` | Aberrant | E3 $\to$ E2 | Healthy (N) | Rizal | 0.2564 / 0.6822 | 0.2725 / 0.7368 | 0.3137 / 0.7755 | 0.2502 / 0.7116 |
| **U34** | `s2_AB-3-2-M-P1` | `AB-3-2-M-P1` | Aberrant | E3 $\to$ E2 | Medical (M) | Rizal | 0.2051 / 0.5458 | 0.2180 / 0.5894 | 0.2510 / 0.6204 | 0.2001 / 0.5693 |
| **U35** | `s2_AB-2-1-N-P1` | `AB-2-1-N-P1` | Aberrant | E2 $\to$ E1 | Healthy (N) | Rizal | 0.1741 / 0.5299 | 0.2368 / 0.6193 | 0.1863 / 0.4993 | 0.2134 / 0.5153 |
| **U36** | `s2_AB-2-1-M-P1` | `AB-2-1-M-P1` | Aberrant | E2 $\to$ E1 | Medical (M) | Rizal | 0.1393 / 0.4239 | 0.1894 / 0.4955 | 0.1490 / 0.3995 | 0.1707 / 0.4122 |
| **U37** | `s2_AB-1-4-N-P1` | `AB-1-4-N-P1` | Aberrant | E1 $\to$ E4 | Healthy (N) | Rizal | 0.1864 / 0.4471 | 0.1910 / 0.4751 | 0.1770 / 0.4991 | 0.1444 / 0.5933 |
| **U38** | `s2_AB-1-4-M-P1` | `AB-1-4-M-P1` | Aberrant | E1 $\to$ E4 | Medical (M) | Rizal | 0.1491 / 0.3577 | 0.1528 / 0.3801 | 0.1416 / 0.3993 | 0.1155 / 0.4747 |
| **U39** | `s2_AB-1-3-N-P1` | `AB-1-3-N-P1` | Aberrant | E1 $\to$ E3 | Healthy (N) | Rizal | 0.1566 / 0.5845 | 0.0968 / 0.5685 | 0.1159 / 0.5361 | 0.1768 / 0.4514 |
| **U40** | `s2_AB-1-3-M-P1` | `AB-1-3-M-P1` | Aberrant | E1 $\to$ E3 | Medical (M) | Rizal | 0.1253 / 0.4676 | 0.0775 / 0.4548 | 0.0928 / 0.4289 | 0.1415 / 0.3612 |
| **U41** | `s2_AB-1-2-N-P1` | `AB-1-2-N-P1` | Aberrant | E1 $\to$ E2 | Healthy (N) | Rizal | 0.1767 / 0.4456 | 0.1573 / 0.5288 | 0.1793 / 0.4715 | 0.1027 / 0.5369 |
| **U42** | `s2_AB-1-2-M-P1` | `AB-1-2-M-P1` | Aberrant | E1 $\to$ E2 | Medical (M) | Rizal | 0.1413 / 0.3564 | 0.1258 / 0.4230 | 0.1434 / 0.3772 | 0.0822 / 0.4295 |
| **U43** | `s2_AB-2-4-N-P1` | `AB-2-4-N-P1` | Aberrant | E2 $\to$ E4 | Healthy (N) | Rizal | 0.1460 / 0.5797 | 0.2466 / 0.5896 | 0.1508 / 0.5173 | 0.2287 / 0.5446 |
| **U44** | `s2_AB-2-4-M-P1` | `AB-2-4-M-P1` | Aberrant | E2 $\to$ E4 | Medical (M) | Rizal | 0.1168 / 0.4638 | 0.1973 / 0.4717 | 0.1207 / 0.4138 | 0.1829 / 0.4357 |


---

### 5.3. Set 3 User Population (44 Users)

> **Source File:** [`engine/data/seeded_user_sets/set_3_users.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets/set_3_users.json)  
> **Seed Base:** `7000 + 3 * 111` = `7333`  
> **Stratified Jitter Offset:** `+0.000`

| Index | User ID | Cohort Blueprint | Archetype / Group | Stated $\to$ Actual | Medical Status | Preferred Province | Length (Easy / Diff) | Elevation (Easy / Diff) | Gain (Easy / Diff) | Slope (Easy / Diff) |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- | :---: | :---: | :---: | :---: |
| **U01** | `s3_E1-N-P1` | `E1-N-P1` | Normal | E1 | Healthy (N) | Rizal | 0.1471 / 0.5162 | 0.1441 / 0.5720 | 0.2079 / 0.5076 | 0.1387 / 0.5577 |
| **U02** | `s3_E1-N-P2` | `E1-N-P2` | Normal | E1 | Healthy (N) | Batangas, Laguna | 0.1196 / 0.4866 | 0.1547 / 0.6343 | 0.1112 / 0.5743 | 0.1879 / 0.6359 |
| **U03** | `s3_E1-N-P3` | `E1-N-P3` | Normal | E1 | Healthy (N) | Cavite | 0.1395 / 0.6038 | 0.1771 / 0.5446 | 0.1816 / 0.5346 | 0.1307 / 0.5248 |
| **U04** | `s3_E1-M-P1` | `E1-M-P1` | Normal | E1 | Medical (M) | Rizal | 0.1177 / 0.4129 | 0.1153 / 0.4576 | 0.1663 / 0.4061 | 0.1110 / 0.4462 |
| **U05** | `s3_E1-M-P2` | `E1-M-P2` | Normal | E1 | Medical (M) | Batangas, Laguna | 0.0956 / 0.3893 | 0.1238 / 0.5075 | 0.0889 / 0.4595 | 0.1503 / 0.5087 |
| **U06** | `s3_E1-M-P3` | `E1-M-P3` | Normal | E1 | Medical (M) | Cavite | 0.1116 / 0.4831 | 0.1417 / 0.4357 | 0.1453 / 0.4276 | 0.1046 / 0.4199 |
| **U07** | `s3_E2-N-P1` | `E2-N-P1` | Normal | E2 | Healthy (N) | Rizal | 0.2546 / 0.6006 | 0.1489 / 0.6788 | 0.1763 / 0.5020 | 0.2063 / 0.5300 |
| **U08** | `s3_E2-N-P2` | `E2-N-P2` | Normal | E2 | Healthy (N) | Batangas, Laguna | 0.1847 / 0.5321 | 0.1688 / 0.6993 | 0.1948 / 0.6204 | 0.1568 / 0.5263 |
| **U09** | `s3_E2-N-P3` | `E2-N-P3` | Normal | E2 | Healthy (N) | Cavite | 0.2282 / 0.6637 | 0.2349 / 0.6976 | 0.1771 / 0.5461 | 0.1540 / 0.5576 |
| **U10** | `s3_E2-M-P1` | `E2-M-P1` | Normal | E2 | Medical (M) | Rizal | 0.2037 / 0.4805 | 0.1191 / 0.5431 | 0.1411 / 0.4016 | 0.1651 / 0.4240 |
| **U11** | `s3_E2-M-P2` | `E2-M-P2` | Normal | E2 | Medical (M) | Batangas, Laguna | 0.1477 / 0.4256 | 0.1350 / 0.5594 | 0.1558 / 0.4964 | 0.1254 / 0.4210 |
| **U12** | `s3_E2-M-P3` | `E2-M-P3` | Normal | E2 | Medical (M) | Cavite | 0.1825 / 0.5310 | 0.1879 / 0.5581 | 0.1417 / 0.4368 | 0.1232 / 0.4461 |
| **U13** | `s3_E3-N-P1` | `E3-N-P1` | Normal | E3 | Healthy (N) | Rizal | 0.3224 / 0.7714 | 0.2744 / 0.7571 | 0.2767 / 0.7171 | 0.3319 / 0.7959 |
| **U14** | `s3_E3-N-P2` | `E3-N-P2` | Normal | E3 | Healthy (N) | Batangas, Laguna | 0.3087 / 0.7266 | 0.3269 / 0.6653 | 0.3584 / 0.7533 | 0.3067 / 0.6942 |
| **U15** | `s3_E3-N-P3` | `E3-N-P3` | Normal | E3 | Healthy (N) | Cavite | 0.3717 / 0.6515 | 0.2764 / 0.7118 | 0.3779 / 0.6526 | 0.2625 / 0.7800 |
| **U16** | `s3_E3-M-P1` | `E3-M-P1` | Normal | E3 | Medical (M) | Rizal | 0.2579 / 0.6171 | 0.2195 / 0.6057 | 0.2214 / 0.5737 | 0.2655 / 0.6367 |
| **U17** | `s3_E3-M-P2` | `E3-M-P2` | Normal | E3 | Medical (M) | Batangas, Laguna | 0.2470 / 0.5813 | 0.2615 / 0.5322 | 0.2867 / 0.6027 | 0.2454 / 0.5554 |
| **U18** | `s3_E3-M-P3` | `E3-M-P3` | Normal | E3 | Medical (M) | Cavite | 0.2974 / 0.5212 | 0.2211 / 0.5695 | 0.3023 / 0.5221 | 0.2100 / 0.6240 |
| **U19** | `s3_E4-N-P1` | `E4-N-P1` | Normal | E4 | Healthy (N) | Rizal | 0.3683 / 0.8418 | 0.3820 / 0.9226 | 0.4361 / 0.9209 | 0.4757 / 0.9233 |
| **U20** | `s3_E4-N-P2` | `E4-N-P2` | Normal | E4 | Healthy (N) | Batangas, Laguna | 0.4072 / 0.8978 | 0.4392 / 0.9287 | 0.3449 / 0.7868 | 0.3644 / 0.8527 |
| **U21** | `s3_E4-N-P3` | `E4-N-P3` | Normal | E4 | Healthy (N) | Cavite | 0.4379 / 0.8969 | 0.4210 / 0.8960 | 0.4220 / 0.8471 | 0.4204 / 0.8705 |
| **U22** | `s3_E4-M-P1` | `E4-M-P1` | Normal | E4 | Medical (M) | Rizal | 0.2947 / 0.6735 | 0.3056 / 0.7381 | 0.3489 / 0.7367 | 0.3806 / 0.7386 |
| **U23** | `s3_E4-M-P2` | `E4-M-P2` | Normal | E4 | Medical (M) | Batangas, Laguna | 0.3257 / 0.7183 | 0.3514 / 0.7430 | 0.2759 / 0.6294 | 0.2915 / 0.6822 |
| **U24** | `s3_E4-M-P3` | `E4-M-P3` | Normal | E4 | Medical (M) | Cavite | 0.3503 / 0.7176 | 0.3368 / 0.7168 | 0.3376 / 0.6777 | 0.3363 / 0.6964 |
| **U25** | `s3_AB-4-1-N-P1` | `AB-4-1-N-P1` | Aberrant | E4 $\to$ E1 | Healthy (N) | Rizal | 0.4726 / 0.7948 | 0.4659 / 0.8190 | 0.3908 / 0.8865 | 0.4775 / 0.8574 |
| **U26** | `s3_AB-4-1-M-P1` | `AB-4-1-M-P1` | Aberrant | E4 $\to$ E1 | Medical (M) | Rizal | 0.3780 / 0.6359 | 0.3727 / 0.6552 | 0.3126 / 0.7092 | 0.3820 / 0.6859 |
| **U27** | `s3_AB-4-2-N-P1` | `AB-4-2-N-P1` | Aberrant | E4 $\to$ E2 | Healthy (N) | Rizal | 0.3517 / 0.9009 | 0.3974 / 0.8386 | 0.4467 / 0.8252 | 0.3754 / 0.8368 |
| **U28** | `s3_AB-4-2-M-P1` | `AB-4-2-M-P1` | Aberrant | E4 $\to$ E2 | Medical (M) | Rizal | 0.2814 / 0.7207 | 0.3179 / 0.6709 | 0.3574 / 0.6602 | 0.3004 / 0.6694 |
| **U29** | `s3_AB-4-3-N-P1` | `AB-4-3-N-P1` | Aberrant | E4 $\to$ E3 | Healthy (N) | Rizal | 0.4441 / 0.8445 | 0.3676 / 0.8038 | 0.4105 / 0.8307 | 0.3738 / 0.7932 |
| **U30** | `s3_AB-4-3-M-P1` | `AB-4-3-M-P1` | Aberrant | E4 $\to$ E3 | Medical (M) | Rizal | 0.3553 / 0.6756 | 0.2941 / 0.6431 | 0.3284 / 0.6646 | 0.2990 / 0.6346 |
| **U31** | `s3_AB-3-1-N-P1` | `AB-3-1-N-P1` | Aberrant | E3 $\to$ E1 | Healthy (N) | Rizal | 0.3063 / 0.7566 | 0.3505 / 0.7610 | 0.3275 / 0.6790 | 0.3361 / 0.7571 |
| **U32** | `s3_AB-3-1-M-P1` | `AB-3-1-M-P1` | Aberrant | E3 $\to$ E1 | Medical (M) | Rizal | 0.2450 / 0.6053 | 0.2804 / 0.6088 | 0.2620 / 0.5432 | 0.2689 / 0.6057 |
| **U33** | `s3_AB-3-2-N-P1` | `AB-3-2-N-P1` | Aberrant | E3 $\to$ E2 | Healthy (N) | Rizal | 0.3640 / 0.7345 | 0.3129 / 0.6775 | 0.3583 / 0.6745 | 0.2977 / 0.7708 |
| **U34** | `s3_AB-3-2-M-P1` | `AB-3-2-M-P1` | Aberrant | E3 $\to$ E2 | Medical (M) | Rizal | 0.2912 / 0.5876 | 0.2503 / 0.5420 | 0.2867 / 0.5396 | 0.2382 / 0.6166 |
| **U35** | `s3_AB-2-1-N-P1` | `AB-2-1-N-P1` | Aberrant | E2 $\to$ E1 | Healthy (N) | Rizal | 0.1789 / 0.6072 | 0.2116 / 0.5635 | 0.2289 / 0.5777 | 0.1481 / 0.6227 |
| **U36** | `s3_AB-2-1-M-P1` | `AB-2-1-M-P1` | Aberrant | E2 $\to$ E1 | Medical (M) | Rizal | 0.1431 / 0.4858 | 0.1693 / 0.4508 | 0.1831 / 0.4621 | 0.1185 / 0.4982 |
| **U37** | `s3_AB-1-4-N-P1` | `AB-1-4-N-P1` | Aberrant | E1 $\to$ E4 | Healthy (N) | Rizal | 0.1656 / 0.5228 | 0.1367 / 0.4971 | 0.1383 / 0.6250 | 0.1590 / 0.5634 |
| **U38** | `s3_AB-1-4-M-P1` | `AB-1-4-M-P1` | Aberrant | E1 $\to$ E4 | Medical (M) | Rizal | 0.1325 / 0.4183 | 0.1094 / 0.3977 | 0.1106 / 0.5000 | 0.1272 / 0.4507 |
| **U39** | `s3_AB-1-3-N-P1` | `AB-1-3-N-P1` | Aberrant | E1 $\to$ E3 | Healthy (N) | Rizal | 0.1899 / 0.4671 | 0.1992 / 0.5410 | 0.1054 / 0.6474 | 0.2150 / 0.5221 |
| **U40** | `s3_AB-1-3-M-P1` | `AB-1-3-M-P1` | Aberrant | E1 $\to$ E3 | Medical (M) | Rizal | 0.1519 / 0.3737 | 0.1594 / 0.4328 | 0.0843 / 0.5179 | 0.1720 / 0.4176 |
| **U41** | `s3_AB-1-2-N-P1` | `AB-1-2-N-P1` | Aberrant | E1 $\to$ E2 | Healthy (N) | Rizal | 0.1051 / 0.6409 | 0.1767 / 0.5709 | 0.1993 / 0.5615 | 0.1879 / 0.4775 |
| **U42** | `s3_AB-1-2-M-P1` | `AB-1-2-M-P1` | Aberrant | E1 $\to$ E2 | Medical (M) | Rizal | 0.0841 / 0.5127 | 0.1414 / 0.4567 | 0.1595 / 0.4492 | 0.1503 / 0.3820 |
| **U43** | `s3_AB-2-4-N-P1` | `AB-2-4-N-P1` | Aberrant | E2 $\to$ E4 | Healthy (N) | Rizal | 0.2768 / 0.6216 | 0.1522 / 0.6811 | 0.2217 / 0.6282 | 0.1865 / 0.6547 |
| **U44** | `s3_AB-2-4-M-P1` | `AB-2-4-M-P1` | Aberrant | E2 $\to$ E4 | Medical (M) | Rizal | 0.2215 / 0.4973 | 0.1217 / 0.5448 | 0.1773 / 0.5026 | 0.1492 / 0.5237 |


---

## 6. Audit & Compliance Rules

Every user vector in all sets satisfies the following constraints verified by [`engine/verify_user_sets.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/verify_user_sets.py):
1. **Dimension:** Exactly 32 floating-point values for `profile.easy` and 32 values for `profile.difficult`.
2. **Range Bounds:** Clamped strictly within $[0.0, 1.0]$ with 0 null or NaN elements.
3. **Monotonicity Gap:** $P_{\text{diff}}[k] \ge P_{\text{easy}}[k] + 0.05$ across all continuous physical metrics ($k \in \{1..5\}$).
4. **Medical Downscale Ratio:** Exactly $0.80\times$ on physical continuous metrics and technical terrain metrics for medical cohorts in seeded sets.
5. **Zero Vector Collisions:** Across all 220 profiles, minimum pairwise distance between corresponding cohorts exceeds $0.051$ Gower Distance.

