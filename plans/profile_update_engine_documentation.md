# THARESYS Adaptive Profile Update Engine - Architecture & Implementation Plan

## 1. Executive Summary & Objective

The **Adaptive Profile Update Engine** enables the Thrail App Recommendation System (THARESYS) to dynamically evolve a hiker's mathematical profile anchors based on real-world hike experiences.

Instead of keeping user profiles static after onboarding, the engine applies an **error-driven adaptive learning update** when a hiker logs completed hikes. 

### Core Capabilities:
1. **Error-Driven Adjustment:** Adjusts profile features proportionally to the recommendation distance (`R_tu`), applying larger corrective steps when the engine's prediction diverges from user feedback, and finer adjustments when prediction was already accurate.
2. **Dual-Anchor Partitioning:** Routes each completed hike directly to the specific anchor profile (`easy` or `difficult`) where the trail was predicted/categorized, preserving the distinct dual-anchor contrast.
3. **Decoupled Architecture:** Encapsulates the core vector arithmetic independently of the data collection mechanism, allowing match/mismatch definitions and weight vector derivations to be customized or swapped later.
4. **Boundary & Monotonicity Guards:** Enforces strict `[0.0, 1.0]` feature domain boundaries and guarantees that the `easy` anchor cannot outscale the `difficult` anchor in physical demands.

---

## 2. Mathematical Formulations

All computations use standard arithmetic notation (`*`, `/`, `+`, `-`, `avg()`). No LaTeX notation is used.

### 2.1. Feature Vectors & Notations

Let:
* `P_easy`: Current 32-dimensional user Easy anchor profile vector `[0.0, 1.0]`.
* `P_diff`: Current 32-dimensional user Difficult anchor profile vector `[0.0, 1.0]`.
* `T_i`: 32-dimensional normalized feature vector of hiked trail `i` `[0.0, 1.0]`.
* `R_tu_i`: Computed recommendation distance score between the candidate profile and trail `i`, bounded in `[0.0, 1.0]`, where `0.0` is an exact match and `1.0` is complete dissimilarity.
* `match_i`: Boolean feedback flag (`true` = match, `false` = mismatch) for trail `i`.
* `W`: 32-dimensional feature weight vector representing factor importance/focus.
* `N`: Total number of hikes assigned to the target anchor.

### 2.2. Error-Driven Learning Factor (beta)

For each hiked trail `i`, the scalar learning factor `beta_i` is defined by:
```text
If match_i == true:
    beta_i = R_tu_i / 2

If match_i == false:
    beta_i = -(1.0 - R_tu_i) / 2
```

#### Analytical Properties of beta:
* **High-Confidence Match (Small Error):** If `R_tu_i = 0.10` (engine predicted a near-perfect match) and `match_i = true`:
  ```text
  beta_i = 0.10 / 2 = +0.05
  ```
  The profile already matches the trail closely, so only a modest calibration (+5%) is applied.
* **Surprise Match (High Error):** If `R_tu_i = 0.80` (engine predicted poor affinity) but `match_i = true`:
  ```text
  beta_i = 0.80 / 2 = +0.40
  ```
  The engine significantly underestimated the user's capability or taste, triggering a substantial positive shift (+40%) towards that trail's features.
* **Unexpected Mismatch (High Error):** If `R_tu_i = 0.10` (engine predicted an ideal match) but `match_i = false`:
  ```text
  beta_i = -(1.0 - 0.10) / 2 = -0.45
  ```
  The engine misidentified a poor trail as suitable; the formula aggressively shifts the profile (-45%) away from those trail attributes.
* **Expected Mismatch (Small Error):** If `R_tu_i = 0.90` (engine predicted strong dissimilarity) and `match_i = false`:
  ```text
  beta_i = -(1.0 - 0.90) / 2 = -0.05
  ```
  The engine already predicted dissimilarity, applying only a minor negative nudge (-5%).

---

### 2.3. Feature Difference & Direction of Update

To ensure that positive matches pull the profile **towards** the trail, the difference vector is computed as `Trail - Profile`:
```text
Diff_i = T_i - P
```

The step delta for trail `i` is:
```text
Delta_i = beta_i * Diff_i
```

* When `beta_i > 0` (match), `Delta_i` moves `P` closer to `T_i`.
### 2.3. Feature Difference & Hike-Specific Weighted Delta

For each hiked trail `i`:
1. Vector difference (moving towards trail on match):
```text
Diff_i = T_i - P
```
2. Unweighted step delta:
```text
Raw_Delta_i = beta_i * Diff_i
```
3. Application of Hike-Specific Factor Weights:
Each hike review allows the hiker to highlight distinct factors (e.g. slope on a steep trail, technical footing on a rocky ridge). Therefore, each hike `i` has its own weight vector `W_i`:
```text
Weighted_Delta_i = W_i * Raw_Delta_i = W_i * (beta_i * (T_i - P))
```
* Factors highlighted for trail `i` receive full amplification (`W_i[k] = 1.0`).
* Non-selected factors retain lower baseline scaling (`W_i[k] = 0.20`) or zero, ensuring only pertinent factors drive the adaptation.

---

### 2.4. Batched Averaging of Weighted Deltas

When a user has completed `N` hikes belonging to an anchor:
```text
Avg_Delta = (Weighted_Delta_1 + Weighted_Delta_2 + ... + Weighted_Delta_N) / N
```

Each dimension `k` (from `0` to `31`) is calculated as:
```text
Avg_Delta[k] = sum(Weighted_Delta_i[k] for i in 1..N) / N
```

---

### 2.5. Profile Update & Bounding

The new profile vector is updated by adding the batched average weighted delta and strictly clamping to `[0.0, 1.0]`:
```text
P_new[k] = clamp(P[k] + Avg_Delta[k], 0.0, 1.0)
```

Where:
```text
clamp(val, min_val, max_val) = max(min_val, min(max_val, val))
```

---

## 3. Dual-Anchor Routing Logic

In THARESYS, every user maintains two distinct anchor profiles:
1. `easy`: Recovery, leisure, and comfortable exertion baseline.
2. `difficult`: Peak stamina, technical terrain, and aspirational challenge ceiling.

### 3.1. Partitioning Rule

Because trail recommendations are automatically generated upon user sign-up and updated in monthly batches, every candidate trail in the user's hiking sphere has an established predicted category assignment (`easy` or `difficult`) in the user's recommendation record (`/users/{userId}/recommendations/{YYYY-MM}`).

When updating profiles from a batch of completed hikes:
1. For each hiked trail `T_i`, look up its assigned category in the user's recommendation record:
   * If categorized as `easy`: Assign hike to the **Easy Batch** (`Batch_easy`).
   * If categorized as `difficult`: Assign hike to the **Difficult Batch** (`Batch_diff`).

2. Execute the core update on the server engine independently for each anchor:
   * `P_easy_new = update_profile_core(P_easy, Batch_easy, W_easy_per_hike)`
   * `P_diff_new = update_profile_core(P_diff, Batch_diff, W_diff_per_hike)`

```text
               +----------------------------------+
               |        Hiked Trail Batch         |
               +----------------------------------+
                                |
               +----------------------------------+
               | Look Up Pre-Generated Category   |
               |     (easy vs. difficult)         |
               +----------------------------------+
                     /                      \
                    /                        \
    [Assigned to Easy]              [Assigned to Difficult]
           v                                    v
+-----------------------+            +-----------------------+
| Compute Delta_easy_i  |            | Compute Delta_diff_i  |
| Apply W_i per hike    |            | Apply W_i per hike    |
| Average across batch  |            | Average across batch  |
| Clamp to [0.0, 1.0]   |            | Clamp to [0.0, 1.0]   |
+-----------------------+            +-----------------------+
           v                                    v
+-----------------------+            +-----------------------+
|      P_easy_new       |            |      P_diff_new       |
+-----------------------+            +-----------------------+
                    \                          /
                     v                        v
               +------------------------------------+
               | Monotonicity & Anchor Safety Check |
               |     (P_easy[k] <= P_diff[k])       |
               +------------------------------------+
```

### 3.2. Anchor Monotonicity & Safety Guard

To prevent anchor crossing (where an updated `easy` profile becomes harder than the `difficult` profile), a safety post-check is applied across physical capability indices (`0` to `5`: classification, length, elevation, gain, slope, lasco rating):
```text
For each physical index k in [0..5]:
    If P_easy_new[k] > P_diff_new[k]:
        // Maintain a minimum separation gap of 0.05
        P_diff_new[k] = clamp(P_easy_new[k] + 0.05, 0.0, 1.0)
```

---

## 4. Concrete Numerical Walkthrough

Let us verify the complete mathematical pipeline with a 2-dimensional test vector:
* Dimension 0: Physical Exertion (e.g., Slope)
* Dimension 1: Technical Terrain (e.g., Rocky Scrambles)

### Setup:
* User Initial Easy Profile: `P = [0.10, 0.20]`
* Trail 1: `T1 = [0.30, 0.35]`, `R_tu = 0.40`, Result: `Match` (Handled terrain well)
  * Hike 1 Selected Factors: Hiker focused primarily on **Terrain**: `W1 = [0.50, 1.00]`
* Trail 2: `T2 = [0.50, 0.20]`, `R_tu = 0.20`, Result: `Mismatch` (Trail was too steep)
  * Hike 2 Selected Factors: Hiker focused primarily on **Slope**: `W2 = [1.00, 0.20]`

---

### Step 1: Compute Betas
* For Trail 1 (Match):
  ```text
  beta1 = 0.40 / 2 = +0.20
  ```
* For Trail 2 (Mismatch):
  ```text
  beta2 = -(1.0 - 0.20) / 2 = -0.80 / 2 = -0.40
  ```

---

### Step 2: Feature Differences (`Trail - Profile`)
* For Trail 1:
  ```text
  Diff1 = T1 - P = [0.30 - 0.10, 0.35 - 0.20] = [0.20, 0.15]
  ```
* For Trail 2:
  ```text
  Diff2 = T2 - P = [0.50 - 0.10, 0.20 - 0.20] = [0.40, 0.00]
  ```

---

### Step 3: Compute Per-Hike Weighted Deltas (Weights Applied BEFORE Averaging)
* For Trail 1:
  ```text
  Raw_Delta1 = beta1 * Diff1 = 0.20 * [0.20, 0.15] = [0.040, 0.030]
  Weighted_Delta1 = W1 * Raw_Delta1
                  = [0.50 * 0.040, 1.00 * 0.030]
                  = [0.020, 0.030]
  ```
* For Trail 2:
  ```text
  Raw_Delta2 = beta2 * Diff2 = -0.40 * [0.40, 0.00] = [-0.160, 0.000]
  Weighted_Delta2 = W2 * Raw_Delta2
                  = [1.00 * (-0.160), 0.20 * 0.000]
                  = [-0.160, 0.000]
  ```

---

### Step 4: Batched Average of Weighted Deltas Across N = 2 Hikes
```text
Avg_Delta[0] = (0.020 + (-0.160)) / 2 = -0.140 / 2 = -0.070
Avg_Delta[1] = (0.030 +   0.000 ) / 2 =  0.030 / 2 =  0.015

Avg_Delta = [-0.070, 0.015]
```

---

### Step 5: Update Profile with Bounds Clamping
```text
P_new_raw[0] = P[0] + Avg_Delta[0] = 0.10 + (-0.070) = 0.030
P_new_raw[1] = P[1] + Avg_Delta[1] = 0.20 + 0.015   = 0.215

P_new[0] = clamp(0.030, 0.0, 1.0) = 0.0300
P_new[1] = clamp(0.215, 0.0, 1.0) = 0.2150

Final Updated Profile = [0.0300, 0.2150]
```
* Physical slope decreased from `0.10` to `0.03` due to the strong slope-weighted mismatch on Trail 2.
* Terrain affinity increased from `0.20` to `0.215` due to the terrain-focused positive match on Trail 1.

---

### 5.0. Monthly Batch Update Lifecycle (Hike -> Review -> Monthly Batch Update)

The profile update is executed once a month during the recommendation engine batch run:

1. **Throughout the Month (Hike & Review):**
   * The hiker completes a trail and fills out the 2-step review form in the mobile app.
   * The user selects either **Easy** or **Difficult** and selects conversational factor chips (e.g., *"The trail is not too steep"*).
   * The review is saved directly to Firestore (`/reviews`).
   * The user may hike and review again multiple times during the month.
   * User profile anchor vectors are **NOT** updated immediately at review submission time.

2. **At the Start of the Month (Batch Runner Execution):**
   * The recommendation batch runner (`engine/batch_runner.py`) runs for the new active month (e.g., `2026-11`).
   * For each profiled user, the runner:
     1. Fetches all reviews submitted by the user during the previous month (`2026-10`).
     2. Correlates each reviewed trail with the user's previous monthly recommendation document (`/users/{uid}/recommendations/{prev_month}`) to determine `target_anchor` (`easy` vs `difficult`) and recommendation distance `R_tu`. If unrecommended, Euclidean distance against current anchors is used.
     3. Parses conversational factor chips into feature weights with **Feature Presence Gating**.
     4. Groups hikes by `target_anchor` and computes the batched average delta:
        `Avg_Delta = (1 / M) * sum(W_i * (beta_i * (Trail_i - Profile)))`
     5. Applies the deltas, clamps values to `[0.0, 1.0]`, and enforces anchor monotonicity (`P_easy <= P_diff` for physical metrics).
     6. Saves the updated profile to `/users/{uid}` in Firestore.
     7. Uses the newly updated anchor profiles to compute the active month's recommendations.

### 5.1. Module Layout
```text
engine/ (Server Side - All Computations)
├── formula/
│   └── profile_updater.py       <-- Pure vector math & batch calculations (Python)
├── profile_utils.py             <-- Serialization, Dual-Anchor Partitioning & Monotonicity
└── app.py                       <-- REST endpoints for profile update jobs

src/ (Client App - Data Collection & Dashboard Presentation Only)
├── core/models/Recommendation/
│   └── interfaces/              <-- TypeScript interfaces for dashboard display & API types
└── recommendation/components/   <-- Superadmin inspection & visualization UI
```

### 5.2. Dashboard Presentation & API Data Contracts (TypeScript)

The TypeScript interfaces below define the client-side data contracts used to display user anchors on the dashboard and package survey responses for submission to the engine:

```typescript
export interface IHikeUpdateInput {
    trailId: string;
    trailFeatures: number[];   // 32-dimensional normalized float vector [0, 1]
    recommendationScore: number; // R_tu in [0, 1]
    isMatch: boolean;          // true = match, false = mismatch
    targetAnchor: 'easy' | 'difficult'; // looked up from user's recommendation record
}

export interface IProfileUpdateBatchRequest {
    userId: string;
    currentEasyProfile: number[];
    currentDifficultProfile: number[];
    hikes: IHikeUpdateInput[];
    weightVector?: number[];   // 32-dimensional float vector, defaults to uniform 1.0
}

export interface IProfileUpdateBatchResult {
    userId: string;
    updatedEasyProfile: number[];
    updatedDifficultProfile: number[];
    easyHikesCount: number;
    difficultHikesCount: number;
    updatedAt: string;
}
```

### 5.3. Server Core Functional Signatures (`engine/formula/profile_updater.py`)

All arithmetic execution is encapsulated in Python:

```python
def update_profile_vector(
    current_profile: np.ndarray,      # shape (32,)
    trail_vectors: np.ndarray,        # shape (N, 32)
    scores: np.ndarray,               # shape (N,)
    matches: np.ndarray,              # shape (N,) bool
    weights: Optional[np.ndarray] = None  # shape (32,), defaults to 1.0
) -> np.ndarray:                      # shape (32,)
    """
    Executes the core error-driven adaptive update on a single anchor profile:
    1. Computes Diff_i = Trail_i - current_profile
    2. Computes beta_i based on match status and R_tu score
    3. Calculates Delta_i = beta_i * Diff_i
    4. Computes Avg_Delta across the N hikes
    5. Applies weights element-wise and clamps output strictly to [0.0, 1.0]
    """
    ...

def process_dual_anchor_update(
    current_easy: np.ndarray,
    current_diff: np.ndarray,
    hike_records: List[Dict[str, Any]],
    weights: Optional[np.ndarray] = None
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Partitions hikes by their pre-generated recommendation category,
    applies update_profile_vector to each anchor independently,
    and enforces the monotonicity constraint (P_easy[k] <= P_diff[k]).
    """
    ...
```

### 5.4. Post-Hike Review Survey & Feature Presence Gating

The client review screen (`WriteReviewScreen.tsx`) captures post-hike feedback via a streamlined 2-step decision flow:

1. **2-Card Difficulty Evaluation:**
   * Replaces ambiguous 5-point face scales with two binary choices:
     * **Easy:** *Gentle & comfortable pace*
     * **Difficult:** *Strenuous & challenging climb*
   * Maps directly against the trail's predicted category (`easy` or `difficult`) to determine `isMatch`:
     * Match (`isMatch = true`, `beta > 0`): User experience matched engine prediction -> Boosts selected factors.
     * Mismatch (`isMatch = false`, `beta < 0`): User experience diverged from prediction -> Debuffs selected factors.

2. **Contextual Factor Chips (Displayed on Same Screen):**
   * Dynamic prompt immediately appears below the cards upon selection:
     * If Easy: *"What made the trail easy?"*
     * If Difficult: *"What made the trail difficult?"*
   * 5 focused difficulty attributes mapped to user-friendly conversational text, stored directly in the database while legacy options are retained in code for backward compatibility:
     * **Slope** (Engine key: `slope`):
       * Easy: *"The trail is not too steep"*
       * Difficult: *"The trail is too steep"*
       * Legacy DB compatibility: recognizes `'Trail slope'`
     * **Length** (Engine key: `length`):
       * Easy: *"The length is just right"*
       * Difficult: *"The trail is too long"*
       * Legacy DB compatibility: recognizes `'Trail length'`
     * **Elevation gain** (Engine key: `gain`):
       * Easy: *"Not too much uphill climb"*
       * Difficult: *"Too much uphill climbing"*
       * Legacy DB compatibility: recognizes `'Elevation gain'`
     * **Altitude** (Engine key: `elevation`):
       * Easy: *"Comfortable altitude & breathing"*
       * Difficult: *"High altitude made it exhausting"*
       * Legacy DB compatibility: recognizes `'Altitude'`
     * **Terrain / Footing** (Engine key: `['muddy', 'rocky', 'grassland', 'ridges']`):
       * Easy: *"Easy and stable footing"*
       * Difficult: *"Rough, slippery, or rocky ground"*
       * Legacy DB compatibility: recognizes `'Terrain / Footing'`

3. **Feature Presence Gating:**
   * When the user selects `Terrain / Footing`, only terrain dimensions that **actually exist on that trail** (`Trail[t] > 0.05`) receive active weight (`1.0`).
   * Terrains absent from the trail (`Trail[t] <= 0.05`, e.g. 0.0 ridges on a flat muddy forest path) receive weight `0.0`.
   * This guarantees that absent terrains never inadvertently alter or degrade the user's existing profile.

---

## 6. Edge Cases & Boundary Handling

| Edge Case | Condition | Handled Behavior |
| :--- | :--- | :--- |
| **Empty Batch** | `N = 0` for an anchor | Returns unchanged current profile vector without modification. |
| **Zero Difference** | `Trail == Profile` | `Diff = 0.0`; profile remains anchored at that value. |
| **Extreme Underflow** | `P + Delta < 0.0` | Clamped strictly to `0.0000`. |
| **Extreme Overflow** | `P + Delta > 1.0` | Clamped strictly to `1.0000`. |
| **All Matches / All Mismatches** | Uniform feedback | Gracefully scales either towards or away from the average trail centroid. |
| **Anchor Inversion** | `P_easy[k] > P_diff[k]` | Monotonicity check raises `P_diff[k]` or caps `P_easy[k]` with safety separation `0.05`. |

---

## 7. Implementation Roadmap & Status

```text
[Phase 1] Architecture Plan Review & Approval (Completed)
    |
[Phase 2] Server Core Math Implementation (Completed):
    ├── Module: engine/formula/profile_updater.py (update_profile_vector, enforce_anchor_monotonicity)
    └── Test Suite: engine/test_profile_updater.py (Ran & Passed: 6 unit tests)
    |
[Phase 3] Dual-Anchor Partitioning & Monotonicity Guards (Completed):
    ├── Module: engine/profile_utils.py (process_dual_anchor_profile_update, resolve_review_factor_weights)
    └── Expose REST endpoint POST /api/user/update-profile in engine/app.py
    |
[Phase 4] App-Side Presentation Data Contracts (Completed):
    ├── Review factor phrases in src/recommendation/utilities/FactorWeightsMapper.ts
    └── Normalized review & hike types in src/recommendation/utilities/normalization.ts
    |
[Phase 5] Standalone Verification & Integration Test Suite (Completed):
    ├── engine/test_batch_runner_update.py (Ran & Passed: 3 tests)
    └── Validated monthly feedback cycle, factor weights, and unblocked new user lifecycle
    |
[Phase 6] Full UI & Admin Orchestration Integration (Completed):
    ├── Superadmin User Recommendation modal: [userId].tsx
    ├── User Profile Info tab: UserProfileInfoSection.tsx (with Reset to Initial Formulation)
    ├── Hiking Records tab: UserHikingRecordsSection.tsx
    ├── Profile Update tab: UserProfileUpdateSection.tsx (with Simulation, Save Updated Profile, Reset to Initial)
    └── Recommendations tab: UserRecommendationsSection.tsx (with disjoint category sets)
```

---

## 8. Batch Runner Integration & Production Operations

### 8.1. Monthly Feedback Cycle in `engine/batch_runner.py`
At the beginning of each recommendation generation cycle (e.g. active month `2026-11`):
1. **Previous Month Review Harvesting:** The engine queries completed hikes reviewed during `prev_month` (`2026-10`).
2. **Review Factor Parsing:** Converts conversational review feedback options (e.g. *"The trail is not too steep"*, *"Rough, slippery ground"*) into 32-element factor weights with terrain presence gating.
3. **Partitioning & Update:** Hikes are partitioned into Easy and Difficult batches based on their predicted category in the previous month's recommendations (or Euclidean distance against current anchors if unrecommended). `process_dual_anchor_profile_update` runs, enforces monotonicity, and saves the updated profiles to `/users/{userId}`.
4. **Immediate Recommendation Generation:** The updated anchors are immediately used in Step 4b to compute the new month's CBF and CF candidate recommendations.

### 8.2. Account Filtering & New Profile Protection
- **Strict Profile Property Check:** The batch runner filters users strictly by the presence of a valid `profile` object. Dummy or uninitialized accounts lacking the `profile` property are skipped.
- **Unblocked New Profiles:** If an active profile is new and has no previous recommendation list (`prev_reco is None`), the batch runner **does not skip** the user. It logs an informational status and proceeds with their baseline profile anchors, ensuring new users successfully receive their initial monthly recommendations.

### 8.3. Admin Simulation, Save, & Reset Controls
- **Save Updated Profile:** Allows superadmins to preview the simulated update vector and commit the changes directly to Firestore with one click.
- **Reset to Initial Profile:** Allows superadmins to discard drift or testing adjustments and revert the user's anchors back to their initial survey and preferences formulation via `GenerateUserProfile`.
- **UI Design System:** All modal tabs adhere to a flat, unboxed container styling, minimum font size of 12, explicit "Recommendation Score" labels, and clear "Predicted vs Actual" difficulty badges.
