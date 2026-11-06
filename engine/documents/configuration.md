# Tuned Engine Parameter Set (THARESYS Recommendation Engine)

> **Document Status:** Active Configuration  
> **Label:** **Tuned Engine Parameter Set (Balanced Midpoint Configuration)**  
> **Source Files:** [`engine/parameters.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/parameters.py), [`engine/formula/profile_updater.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/formula/profile_updater.py), [`engine/profile_utils.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/profile_utils.py), [`engine/batch_runner.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/batch_runner.py)  
> **Design Objective:** Optimal balance between responsive adaptation (achieving noticeable calibration within 3 to 6 hikes) and long-term asymptotic stability (eliminating late-stage over-adjustment and catalog-induced drift).

---

## 1. Adaptive Profile Evolution (Beta) & Learning Hyperparameters

These parameters control the magnitude and bounds of user profile vector updates following completed hikes and reviews.

| Parameter Name | Tuned Value | Baseline Reference | Unit / Range | Description & Operational Rationale |
| :--- | :---: | :---: | :---: | :--- |
| `BETA_LEARNING_RATE_DIVISOR` | **`1.65`** | `2.0` | Scalar (> 0) | Learning rate divisor for beta. Computes `beta = R_tu / 1.65` (for matches) or `beta = -(1.0 - R_tu) / 1.65` (for mismatches). Provides approximately 21% faster learning than the 2.0 baseline while damping excessive oscillation. |
| `PROFILE_MAX_STEP_DELTA` | **`0.14`** | `0.10` | [0.0, 1.0] | Hard upper bound on the absolute single-hike adjustment allowed per feature dimension. Prevents erratic swings while accommodating active early progress. |
| `ANCHOR_MONOTONICITY_MIN_GAP` | **`0.05`** | `0.05` | [0.0, 1.0] | Minimum distance enforced between Easy and Difficult anchors across core physical metrics (indices 0..5): guarantees `Diff_k >= Easy_k + 0.05`. |
| `REVIEW_ACTIVE_FACTOR_WEIGHT` | **`1.00`** | `1.00` | [0.0, 1.0] | Feature weight applied to difficulty factors explicitly reported by the user in post-hike reviews (e.g. slope, length). |
| `REVIEW_BASELINE_UNSELECTED_WEIGHT`| **`0.22`** | `0.20` | [0.0, 1.0] | Default baseline weight applied to unselected physical exertion features during positive matches. |
| `TESTING_ATTRIBUTE_UNSELECTED_NUDGE`| **`0.10`** | `0.10` | [0.0, 1.0] | Gentle baseline weight for non-reported environmental/attribute features (indices 6..31) to prevent rigid zero-freezing. |
| `TESTING_EASY_MATCH_CEILING_NUDGE` | **`0.15`** | `0.10` | [0.0, 1.0] | Dampener used when updating positive easy matches, preventing profile stagnation while protecting established fitness baselines. |
| `TERRAIN_PRESENCE_THRESHOLD` | **`0.05`** | `0.05` | [0.0, 1.0] | Feature Presence Gating: Minimum terrain score required on a trail to update the hiker's terrain affinity vector. |

---

## 2. Directional Hinge Logic & Multipliers

Located in [`engine/formula/profile_updater.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/formula/profile_updater.py), these multipliers govern the directional pulling forces applied during positive matches and post-hike mismatches.

### 2.1 Easy Anchor Adjustments

| Condition | Multiplier / Formula | Description |
| :--- | :--- | :--- |
| **Easy Mismatch (T_k >= P_k)** | **`0.38`** <br> `Delta_k = -|beta_i| * max(0.04, P_k) * 0.38` | When a hiker struggles on a trail harder than their profile, their comfortable baseline is safely dampened downward. Midpoint between baseline (0.25) and aggressive (0.50). |
| **Easy Mismatch (T_k < P_k)** | **`1.10`** <br> `Delta_k = -|beta_i| * max(0.05, (P_k - T_k) * 1.10)` | Trail was easier than the user's profile, yet the hiker struggled: confirms profile was heavily overinflated; adjusts directly toward trail demands. |
| **Easy Match (T_k < P_k)** | **`0.00`** <br> `Delta_k = 0.0` | **Capacity Preservation Rule:** Comfortably completing an accessible easy trail below one's ceiling does *not* penalize or erode physical capacity. |
| **Easy Match (T_k >= P_k)** | `Delta_k = beta_i * (T_k - P_k)` | Standard upward expansion: hiker proves greater comfort ceiling on demanding easy trails. |

### 2.2 Difficult Anchor Adjustments

| Condition | Multiplier / Formula | Description |
| :--- | :--- | :--- |
| **Overexertion Mismatch** | **`0.45`** <br> `Delta_k = -|beta_i| * max(0.05, P_k) * 0.45` | Severe exhaustion: trail overpowered the hiker; dampens Difficult ceiling safely toward physiological reality without hammering anchors to zero. Midpoint between baseline (0.35) and aggressive (0.55). |
| **Underwhelming Mismatch** | **`0.45`** <br> `Delta_k = |beta_i| * max(0.05, 1.0 - P_k) * 0.45` | Under-challenged expert: trail lacked difficulty; expands Difficult anchor upward toward 1.0. Midpoint between baseline (0.35) and aggressive (0.55). |
| **Difficult Match (T_k < P_k)** | **`0.00`** <br> `Delta_k = 0.0` | **Ceiling Preservation Rule:** Completing a manageable trail never degrades the hiker's upper physical boundary. |
| **Difficult Match (T_k >= P_k)** | `Delta_k = beta_i * (T_k - P_k)` | Standard upward pull toward challenging summit milestones. |

---

## 3. Dual-Anchor Cross-Coupling & Mismatch Propagation

Located in [`engine/profile_utils.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/profile_utils.py) and [`engine/batch_runner.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/batch_runner.py):

1. **Underwhelming Difficult Mismatch Propagation:**
   - When a hiker reviews a Difficult trail as `"Easy"` or `"Just Right"` (`m_kind = "underwhelming"`), this proves the trail's physical demands fall squarely within their true Easy comfort zone.
   - **Cross-Coupling:** The trail vector is automatically appended to `easy_trails` as an Easy Match, pulling both the Difficult and Easy anchors upward in unison and preventing underestimated experts from getting trapped in beginner tiers.
2. **Overexertion Easy Mismatch Propagation:**
   - When a hiker reviews an Easy trail as `"Difficult"` or `"Exhausting"` (`isMatch = False`), this proves their upper physical limit was critically overestimated.
   - **Cross-Coupling:** The trail vector is automatically appended to `diff_trails` as an Overexertion Mismatch, dampening the Difficult ceiling to protect the user from dangerous recommendations.
3. **Cohesive Physical Feature Weighting on Mismatches:**
   - Primary reported review factor receives weight `1.0`.
   - All unselected physical metrics (indices 0..5: slope, length, elevation, gain, classification, rating) receive baseline weight **`0.28`** (`max(0.28, default_unselected_weight * 1.30)`).
   - Ensures the entire physical exertion cluster shifts cohesively rather than letting non-reported metrics lag behind.

---

## 4. Collaborative Filtering (CF) & Hybrid Weighting (Alpha)

Controls peer neighborhood discovery and blending between Content-Based Filtering (CBF) and Collaborative Filtering (CF).

| Parameter Name | Tuned Value | Unit / Scale | Description & Operational Rationale |
| :--- | :---: | :---: | :--- |
| `CF_DISTANCE_CUTOFF_TAU` | **`0.35`** | [0.0, 1.0] | Distance cutoff tau. A peer is eligible for CF aggregation only if `dist(User_a, Peer_b) <= 0.35`. Lower values require tighter peer similarity. |
| `CF_TOP_K` | **`5`** | Integer | Top-k closest eligible peers aggregated in collaborative scoring. |
| `DEFAULT_CBF_ENGINE` | **`"GD"`** | Distance Formula | Default metric for Content-Based Filtering: Gower Distance (`GD`). |
| `DEFAULT_CF_ENGINE` | **`"GD"`** | Distance Formula | Default metric for Collaborative Filtering: Gower Distance (`GD`). |
| `ALPHA_COLD_START` | **`1.00`** | [0.0, 1.0] | Initial CBF weight alpha for new users or when 0 peers pass the tau distance cutoff. |
| `ALPHA_STEADY_STATE` | **`0.50`** | [0.0, 1.0] | Asymptotic minimum CBF weight reached as peer population matures. CF weight = `1 - alpha`. |
| `ALPHA_STEADY_STATE_USER_THRESHOLD` | **`50`** | Integer | User count threshold required for alpha to transition toward steady state: `alpha(n) = max(0.5, 1.0 - 0.5 * (n / 50))`. |

---

## 5. Exertion Safety Barriers & Candidate Pool Routing

Located in [`engine/parameters.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/parameters.py) and [`engine/batch_runner.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/batch_runner.py):

| Parameter Name | Tuned Value | Unit / Scale | Description & Safety Policy |
| :--- | :---: | :---: | :--- |
| `EXERTION_SAFETY_MARGIN_DEFAULT` | **`0.35`** | Float | Maximum exertion excess on slope (index 4) and vertical gain (index 3) over the user's Easy anchor for a candidate trail to be admitted into the Easy slot. |
| `EXERTION_SAFETY_MARGIN_VULNERABLE` | **`0.25`** | Float | Stricter exertion barrier applied to vulnerable cohorts (hikers with diagnosed medical conditions or E1 beginner status). |
| **Disjoint Partitioning Policy** | — | — | Trails closer to the Easy anchor (`R_easy <= R_diff`) route to Easy recommendations *unless* they breach the exertion safety barrier, in which case they are strictly diverted to Difficult recommendations. |
| **Safety-First Pool Fallback** | — | — | If the Easy candidate pool is completely starved, the candidate trail with the lowest physical exertion (`min(slope + gain)`) is admitted to guarantee safe options. |

---

## 6. Canonical 32-Dimensional Feature Weight Allocation

The 32 dimensions of the THARESYS feature vector are distributed across 5 balanced pillars (total weight = 100.0%):

```
+-------------------------------------------------------------------------+
|                  Canonical 32-Dimensional Weight Registry               |
|                                                                         |
|  1. Physical Difficulty (50.0%)  : Indices 0..5 (Primary Capability)    |
|  2. Terrains (20.0%)             : Indices 11..14 (Technical Footing)   |
|  3. Route Trajectory (15.0%)     : Indices 15..17 (Circuit Structure)   |
|  4. Provinces (10.0%)            : Indices 6..10 (Regional Preference)  |
|  5. Scenery & Amenities (5.0%)   : Indices 18..31 (Environmental Ties)  |
+-------------------------------------------------------------------------+
```

### Complete Feature Dimension Table

| Index | Feature Key | Category | Weight | Description / Normalized Unit |
| :---: | :--- | :--- | :---: | :--- |
| **0** | `classification` | Physical Exertion | **8.00%** | Trail classification (0.0 = Minor, 1.0 = Major) |
| **1** | `length` | Physical Exertion | **8.40%** | Total trail length normalized against Calabarzon max |
| **2** | `elevation` | Physical Exertion | **8.40%** | Peak altitude in meters above sea level (MASL) |
| **3** | `gain` | Physical Exertion | **8.40%** | Total elevation gain in meters |
| **4** | `slope` | Physical Exertion | **8.40%** | Average gradient / slope percentage |
| **5** | `easy` | Physical Exertion | **8.40%** | PinoyMountaineer / Lasco difficulty scale (1 to 9) |
| **6** | `cavite` | Provinces | **2.00%** | Regional affinity: Cavite |
| **7** | `laguna` | Provinces | **2.00%** | Regional affinity: Laguna |
| **8** | `batangas` | Provinces | **2.00%** | Regional affinity: Batangas |
| **9** | `rizal` | Provinces | **2.00%** | Regional affinity: Rizal |
| **10** | `quezon` | Provinces | **2.00%** | Regional affinity: Quezon |
| **11** | `muddy` | Terrains | **5.00%** | Technical terrain presence: Muddy / slick conditions |
| **12** | `rocky` | Terrains | **5.00%** | Technical terrain presence: Loose rock / scree / boulders |
| **13** | `grassland` | Terrains | **5.00%** | Technical terrain presence: Exposed open grassland |
| **14** | `ridges` | Terrains | **5.00%** | Technical terrain presence: Sharp ridgeline traverses |
| **15** | `out_and_back` | Route Structure | **5.00%** | Trajectory: Out-and-back circuit |
| **16** | `traverse` | Route Structure | **5.00%** | Trajectory: Point-to-point traverse |
| **17** | `circular` | Route Structure | **5.00%** | Trajectory: Full circular loop |
| **18** | `fall` | Waterforms | **0.40%** | Landscape feature: Waterfalls |
| **19** | `river` | Waterforms | **0.40%** | Landscape feature: River crossings |
| **20** | `lake` | Waterforms | **0.40%** | Landscape feature: Lakes / crater lakes |
| **21** | `shelter` | Tourism / Amenities | **0.345%** | Trailhead amenity: Covered resting shelter |
| **22** | `resting` | Tourism / Amenities | **0.345%** | Trailhead amenity: Benches / resting stations |
| **23** | `information_board`| Tourism / Amenities| **0.345%** | Trailhead amenity: Map / educational signage |
| **24** | `clean_water` | Tourism / Amenities | **0.345%** | Trailhead amenity: Potable water source |
| **25** | `river_amenity` | Tourism / Amenities| **0.345%** | Scenic spot: Accessible river recreation |
| **26** | `lake_amenity` | Tourism / Amenities | **0.345%** | Scenic spot: Accessible lake viewpoint |
| **27** | `waterfall_amenity`| Tourism / Amenities| **0.345%** | Scenic spot: Designated waterfall photo-stop |
| **28** | `monument` | Tourism / Amenities | **0.345%** | Landmark: Historical monument / cross |
| **29** | `community` | Tourism / Amenities | **0.345%** | Community: Indigenous / local guide station |
| **30** | `viewpoint` | Tourism / Amenities | **0.345%** | Scenic spot: Panoramic peak viewpoint |
| **31** | `network_connection`| Tourism / Amenities| **0.345%** | Safety amenity: Cellular reception availability |

---

## 7. Summary of Empirical Behavior Under This Parameter Set

* **Responsive Adaptation (C0 to C6):** Achieves **-16.0%** aggregate distance reduction by Cycle 6 across aberrant cohorts (averaging **-24.5%** for overestimated and **-7.8%** for underestimated cohorts).
* **Smooth Asymptotic Convergence (C12 to C24):** On expanded catalogs (e.g. 88 trails), distance monotonically descends to **0.1471** (-33.2%) with zero bounce-back or erratic oscillation.
* **Catalog-Aware Diagnostic Utility:** When tested on small catalogs (8 trails), the parameters cleanly identify catalog exhaustion at C10 to C12, demonstrating where candidate density limitations begin to manifest without crashing or diverging.
