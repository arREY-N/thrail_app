# User Recommendation Profile Generation: Technical Documentation & Mathematical Specifications

This document provides a comprehensive record of the algorithmic design, mathematical formulas, normalization techniques, medical safety adaptations, and architectural decisions used to generate **Two-Anchor User Profiles** (`easy` and `difficult`) in the Thrail recommendation engine.

---

## 1. Core Architecture & Two-Anchor Philosophy

### 1.1 Why Two Anchors (Easy vs. Difficult)?
Traditional recommendation systems model a user as a single static vector representing their average behavior. In hiking, however, a single point fails to capture user intent:
- A hiker often desires an **accessible, relaxing hike** for recovery, leisure, or family outings.
- The same hiker also seeks an **aspirational challenge** for fitness, summit bagging, or personal growth.

To capture this duality, each hiker is modeled with two distinct vectors in the normalized 15-dimensional feature space:
1. **Easy Anchor**: Calibrated to represent comfortable, low-stress, accessible trail conditions.
2. **Difficult Anchor**: Calibrated to represent an achievable, intensified stretch challenge.

### 1.2 Contrast & Distance Separation
A core principle of this model is maintaining a wide separation spread (approx. `0.40` to `0.55`) in vector space between the easy and difficult anchors. If the two vectors were clustered too close together, cosine similarity matching would produce overlapping trail recommendations. A wide gap ensures high contrast between safe/recovery trails and demanding adventure trails.

---

## 2. Trail Feature Normalization (Min-Max Space)

All trail features are mapped onto a uniform `[0.0, 1.0]` scale using global dataset bounds calculated dynamically across the active trail catalog.

### 2.1 Physical Metrics Formulas

#### 1. Lasco Rating / Easy Rating
- **Raw Metric**: Scale of 1 to 9 (e.g. 2/9, 4/9, 7/9).
- **Formula**:
  ```
  normalized_lasco = raw_lasco / 9.0
  ```
- **Reasoning**: Lasco ratings are fixed bounded integers from 1 to 9. Dividing by 9 provides a linear 0 to 1 representation without needing dynamic dataset bounds.

#### 2. Trail Length (km)
- **Raw Metric**: Distance in kilometers.
- **Formula**:
  ```
  normalized_length = (raw_length - min_length) / (max_length - min_length)
  ```
- **Bounds**: Derived dynamically from the catalog (e.g., min: 1.0 km, max: 24.0 km).

#### 3. Peak Elevation (MASL)
- **Raw Metric**: Peak summit elevation in meters above sea level.
- **Formula**:
  ```
  normalized_elevation = (raw_elevation - min_elevation) / (max_elevation - min_elevation)
  ```
- **Bounds**: Derived dynamically from the catalog (e.g., min: 215 MASL, max: 2,188 MASL).

#### 4. Elevation Gain (m)
- **Raw Metric**: Net climbing ascent. If explicit gain is missing from metadata, it is derived from peak elevation and starting trailhead elevation:
  ```
  raw_gain = peak_elevation - start_elevation
  ```
- **Formula**:
  ```
  normalized_gain = (raw_gain - min_gain) / (max_gain - min_gain)
  ```

#### 5. Trail Slope / Gradient (%)
- **Raw Metric**: Estimated average steepness percentage:
  ```
  raw_slope = (raw_gain / (raw_length * 1000)) * 100
  ```
- **Formula**:
  ```
  normalized_slope = (raw_slope - min_slope) / (max_slope - min_slope)
  ```
- **Reasoning**: Combining vertical gain with total horizontal distance measures the true physical steepness of the trail.

### 2.2 Categorical & Environmental Features

#### 1. Classification (Minor vs. Major)
- **Minor Trails**: `0.0` (day hikes, sub-1000m, non-technical).
- **Major Trails**: `1.0` (multi-day, high-altitude, technical scrambles).

#### 2. Geographic Provinces
- Modeled across 5 Calabarzon provinces: **Cavite, Laguna, Batangas, Rizal, Quezon**.
- Binary indicator `1.0` if the trail is in the province, `0.0` otherwise.

#### 3. Terrain Types
- Evaluated across 4 terrain dimensions: **Muddy, Rocky, Grassland, Ridges**.
- Resolved by scanning trail difficulty keywords and trail quality tags (`1.0` if present, `0.0` if absent).

#### 4. Circularity
- **Out-and-Back, Traverse, Circular**: Categorical one-hot indicator.

#### 5. Tourism Amenities
- 11 amenity features (e.g. shelter, resting stations, clean water, viewpoints, network connection).
- Normalized to `[0.0, 1.0]` based on density or presence.

---

## 3. Beginner Profile Generation (`CreateBeginnerProfile`)

For hikers who have not logged historical hikes or whose survey responses do not match existing database trails, the engine initializes profiles using calibrated baseline priors.

### 3.1 Base Parameters & Medical Safety
- **Standard Easy Base**: `0.250`
- **Standard Difficult Base**: `0.750`
- **Tourism Easy Base**: `0.200`
- **Tourism Difficult Base**: `0.400`
- **Medical Condition Factor**: `0.80x` (20% downshift)

```
appliedFactor = hasMedicalCondition(user) ? 0.80 : 1.00
easyBase = 0.250 * appliedFactor
difficultBase = 0.750 * appliedFactor
```

### 3.2 Feature Matrix for Beginners

| Feature | Easy Anchor Value | Difficult Anchor Value | Algorithmic Reasoning |
| :--- | :--- | :--- | :--- |
| **Classification** | `0.0` (Minor) | `1.0` (Major) | Beginners must always start on minor trails; difficult anchor opens major trails. |
| **Physical Exertion** (Length, Peak, Gain, Slope, Lasco) | `easyBase` (`0.250` or `0.200` med) | `difficultBase` (`0.750` or `0.600` med) | `0.250` matches short, low-effort walks (~2/9 Lasco); `0.750` sets an ambitious challenge (~7/9 Lasco). |
| **Terrain Features** (Muddy, Rocky, Grassland, Ridges) | `easyBase` (`0.250` or `0.200` med) | `difficultBase` (`0.750` or `0.600` med) | Easy avoids scrambles and exposed ridges; difficult encourages technical variety. |
| **Circularity & Waterforms** | `easyBase` (`0.250` or `0.200` med) | `difficultBase` (`0.750` or `0.600` med) | Prior baseline for vector completeness. |
| **Tourism Amenities** | `0.200` | `0.400` | Non-zero baseline prevents missing-value anomalies during similarity computation. |

### 3.3 Province Preference: Comfort vs. Exploration Heuristic
For beginner profiles, province weighting utilizes a deliberate **Comfort vs. Exploration** allocation:
- **Easy Anchor (Comfort Zone)**:
  - If province was selected in survey: **`0.850`** (High affinity).
  - If province was not selected: **`0.150`** (Low baseline).
- **Difficult Anchor (Exploration Mode)**:
  - If province was selected in survey: **`0.150`** (Deprioritized).
  - If province was not selected: **`0.850`** (Elevated to incentivize regional discovery).

---

## 4. Experienced Profile Generation (`CreateExperiencedProfile`)

For experienced hikers who selected trails during onboarding, the engine derives their profile empirically from their demonstrated hiking history.

### 4.1 Step 1: Matching Survey Locations (`MatchSurveyTrails`)
The system performs fuzzy, case-insensitive matching between `user.preferences.location` and the trail database:
- Compares input strings against `trail.id`, `trail.general.name`, `trail.general.address`, and `trail.general.mountain` array.
- Filters out duplicate matches to create an exact cohort of matched trail documents.
- If 0 matches are found, the engine automatically falls back to `CreateBeginnerProfile`.

### 4.2 Step 2: Batch Centroid Vector (`BatchTrailProfile`)
For each matched trail, its normalized profile vector is retrieved or computed. The system calculates the centroid (arithmetic mean) across all matched trails:

```
For each feature:
  avgVector[feature] = Sum(trail[feature] for trail in matched) / Count(matched)
```

This centroid vector represents the hiker's true historical baseline.

### 4.3 Step 3: Dual Anchor Scaling Factors
To construct the two anchors, the historical centroid is scaled using asymmetric multipliers:

#### 1. Easy Anchor Multiplier (`0.50x`)
```
easyFactor = 0.50 * appliedFactor
easyValue = clamp(avgVector[feature] * easyFactor, 0.0, 1.0)
```
- **Reasoning**: Multiplying by `0.50x` cuts the hiker's average physical exertion in half. For an experienced hiker accustomed to 8 km trails with 500 m climb, this targets relaxing 4 km, 250 m hikes where they are guaranteed comfort and confidence.

#### 2. Difficult Anchor Multiplier (`1.35x`)
```
difficultFactor = 1.35 * appliedFactor
difficultValue = clamp(avgVector[feature] * difficultFactor, 0.0, 1.0)
```
- **Reasoning**: Multiplying by `1.35x` increases the physical challenge by 35% above their average past accomplishment. This demands noticeable extra stamina and climbing power without presenting an unrealistic, dangerous leap in difficulty.

---

## 5. Medical Condition Personalization Layer

### 5.1 Rationale
A hiker reporting asthma, cardiovascular conditions, joint problems, or hypertension has a lower physical tolerance and higher vulnerability to exhaustion, high altitude, and steep ascents compared to peers of identical hiking history.

### 5.2 Implementation
- **Detection Function**: `HasMedicalCondition(user)` evaluates whether `medicalProfile.hasCondition === true` or non-empty medical details are recorded.
- **Multiplier**: `MEDICAL_CONDITION_FACTOR = 0.80` (a 20% downshift).
- **Targeted Application**:
  - Applied exclusively to **physical exertion and technical features**: Length, Peak, Gain, Slope, Lasco Rating, and Terrains.
  - **Not** applied to geographic provinces (location affinity is independent of physical health).
- **Mathematical Impact**:
  - **Beginner Profiles**:
    - Easy Base: `0.250 * 0.80 = 0.200`
    - Difficult Base: `0.750 * 0.80 = 0.600`
  - **Experienced Profiles**:
    - Easy Scaling: `0.50 * 0.80 = 0.40x` of historical average.
    - Difficult Scaling: `1.35 * 0.80 = 1.08x` of historical average.

---

## 6. Province & Geographic Logic: Direct Preservation vs. Exploration

### 6.1 Direct Geographic Preservation (For Observed Provinces)
When an experienced hiker has logged trails in a province (e.g. 2 of 3 trails in Batangas):
```
avgVector.province.batangas = 2 / 3 = 0.667
easyProfile.province.batangas = 0.667
difficultProfile.province.batangas = 0.667
```
- **Reasoning**: Provinces describe **where** someone hikes, not **how hard** a hike is. Scaling by `0.50x` would falsely imply that a hiker only wants to be in Batangas half as much when taking an easy hike. Empirical location affinity is preserved identically across both anchors.

### 6.2 Exploration Smoothing (For Unobserved Provinces)
If a province was never logged in the hiker's matched trails (`avgVector === 0.0`):
- Rather than assigning a dead-zone `0.000`, the system softens to their **survey preferences prior**:
  - **Survey Preferred**: Easy = `0.850` (comfort zone) / Difficult = `0.150` (downweight).
  - **Survey Unselected**: Easy = `0.150` (baseline) / Difficult = `0.850` (regional discovery incentive).

---

## 7. Unobserved Feature Smoothing (Bayesian Priors)

### 7.1 The Zero-Observation Problem
In real-world surveys, hikers typically list only 1 to 3 past trails. A sample of 2 trails cannot cover all 4 terrain types or all 3 circuit types. 
- If an unobserved terrain (e.g., ridges) remained `0.000` in both anchors, cosine similarity would treat ridges as forbidden/disliked, creating dead zones.
- Furthermore, having `0.000` on both Easy and Difficult provides zero discriminative contrast.

### 7.2 The Softening Solution
Whenever `avgVector[feature] === 0.0`:
- **Easy Anchor**: Softens to `easyBase` (`0.250`, or `0.200` with medical downshift).
- **Difficult Anchor**: Softens to `difficultBase` (`0.750`, or `0.600` with medical downshift).

This allows the recommender to suggest technical terrain like ridges or rocky trails on challenging hikes, while keeping easy hikes gentle and safe.

---

## 8. Summary Formula Reference Table

| Feature Category | Beginner (No History) | Experienced: Observed (`> 0`) | Experienced: Unobserved (`=== 0`) |
| :--- | :--- | :--- | :--- |
| **Classification** | Easy: `0`<br>Difficult: `1` | Easy: `0`<br>Difficult: `1` | Easy: `0`<br>Difficult: `1` |
| **Lasco / Easy Rating** | Easy: `0.25 * med`<br>Difficult: `0.75 * med` | Easy: `avg * 0.50 * med`<br>Difficult: `clamp(avg * 1.35 * med)` | N/A (Trails always have Lasco) |
| **Metrics (Length, Peak, Gain, Slope)** | Easy: `0.25 * med`<br>Difficult: `0.75 * med` | Easy: `avg * 0.50 * med`<br>Difficult: `clamp(avg * 1.35 * med)` | N/A (Trails always have metrics) |
| **Terrains (Muddy, Rocky, Grass, Ridge)** | Easy: `0.25 * med`<br>Difficult: `0.75 * med` | Easy: `avg * 0.50 * med`<br>Difficult: `clamp(avg * 1.35 * med)` | Easy: `0.25 * med`<br>Difficult: `0.75 * med` |
| **Provinces (Survey Preferred)** | Easy: `0.850`<br>Difficult: `0.150` | Easy: `avg`<br>Difficult: `avg` | Easy: `0.850`<br>Difficult: `0.150` |
| **Provinces (Survey Unselected)** | Easy: `0.150`<br>Difficult: `0.850` | Easy: `avg`<br>Difficult: `avg` | Easy: `0.150`<br>Difficult: `0.850` |
| **Circularity & Waterforms** | Easy: `0.25 * med`<br>Difficult: `0.75 * med` | Easy: `avg * 0.50 * med`<br>Difficult: `clamp(avg * 1.35 * med)` | Easy: `0.25 * med`<br>Difficult: `0.75 * med` |
| **Tourism Amenities** | Easy: `0.200`<br>Difficult: `0.400` | Easy: `avg * 0.50`<br>Difficult: `clamp(avg * 1.35)` | Easy: `0.200`<br>Difficult: `0.400` |

*(Note: `med` represents the `0.80x` medical condition factor when active, otherwise `1.00`).*

---

## 9. Centralized Hyperparameters Configuration

All multipliers, baselines, and preference weights have been decoupled from computational logic and centralized in:
`src/recommendation/constants/RecommendationFactors.ts`

Tuning engineers can adjust the engine's behavior, sensitivity, and difficulty contrast simply by modifying this single configuration file without altering formulas in `CreateProfile.ts` or UI logic in `UserDataset.tsx`.
