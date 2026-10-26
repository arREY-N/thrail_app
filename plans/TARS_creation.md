# Thrail App Recommendation System (THARESYS) - Complete Creation & Architecture Log

## 1. Executive Summary & Architectural Overview

The **Thrail App Recommendation System (THARESYS)** is an intelligent, hybrid machine-learning recommendation engine engineered specifically for outdoor mountaineering and trail discovery. It bridges algorithmic feature similarity, collaborative peer behavior, and AI mountaineering coaching into a cohesive mobile and web experience.

### Core Objectives
1. **Personalized Safety & Physical Match:** Protect hikers by prioritizing physiological capability alignment (elevation gain, slope gradient, trail length) over aesthetic preferences.
2. **Cold-Start Resilience:** Seamlessly adapt from single-user scenarios (pure content matching) to large-scale multi-user communities using dynamic weighting.
3. **Full Algorithmic Transparency:** Provide superadmins with granular mathematical visibility into every score component (Gower, Euclidean, Cosine distances, dynamic alpha derivations).
4. **Zero Client-Side Secret Exposure:** Keep all generative AI inference and external API keys strictly isolated to the server/engine tier, ensuring the mobile client acts as a fast, secure consumer.

---

### High-Level System Architecture

```text
+-----------------------------------------------------------------------------------------+
|                                    React Native Client                                  |
|   - Trail of the Month Spotlight (Mobile & Web)                                         |
|   - Recommendation Details Screen (view.tsx)                                            |
|   - Superadmin Recommendation Hub (ConfigureEngineModal & UserDataset)                  |
+-----------------------------------------------------------------------------------------+
        |                                                                 ^
        | 1. Trigger Batch Run (CBF=GD, CF=GD, Month)                     | 5. Stream Results
        v                                                                 |    & Reasonings
+------------------------------------+                                    |
|       FastAPI Python Engine        |                                    |
|  - engine/app.py                   |                                    |
|  - engine/batch_runner.py          |                                    |
|  - engine/recommender.py           |                                    |
+------------------------------------+                                    |
        |                           |                                     |
        | 2. Fetch Profiles/Hikes   | 4. Batch Gemini Inference           |
        v                           v                                     |
+-------------------------------------------------------------+   +-------------------+
|                   Google Cloud Firestore                    |   |  Google Gemini AI |
|   /users/{userId}             --> User anchors              |   |    (Server-side)  |
|   /users/{userId}/hikes       --> Completed hike history    |   +-------------------+
|   /trails/{trailId}           --> Normalized 32-dim vectors |
|   /users/{userId}/recommendations/{YYYY-MM}                 |
+-------------------------------------------------------------+
```

---

## 2. Mathematical Foundations & Distance Engines

All distance functions in THARESYS produce scores strictly bounded in the range `[0.000, 1.000]`:
- **`0.000`** = Perfect Alignment / Minimum Distance (Maximum Recommendation Affinity).
- **`1.000`** = Complete Dissimilarity / Maximum Distance.

### 2.1. Formula 1: Gower's Distance (GD)
Gower's Distance is the default metric for THARESYS because it gracefully handles mixed data types (continuous physical measurements, categorical provinces, and binary amenity presence flags):

$$\text{dist}_{\text{GD}} = \frac{1}{N} \sum_{i=1}^{N} w_i \cdot |V_{A}[i] - V_{B}[i]|$$

Where:
- $V_A$ and $V_B$ are the 32-dimensional normalized feature vectors of the user anchor and trail.
- $w_i$ is the normalized feature weight ($\sum w_i = 1.0$).
- $N = 32$ total feature dimensions.

### 2.2. Formula 2: Normalized Euclidean Distance (ED)
Scales standard Euclidean geometric distance by the square root of dimensions to ensure strict $[0.0, 1.0]$ bounds:

$$\text{dist}_{\text{ED}} = \sqrt{ \frac{1}{N} \sum_{i=1}^{N} w_i \cdot (V_{A}[i] - V_{B}[i])^2 }$$

- Penalizes large single-attribute discrepancies heavily (e.g. an extreme elevation mismatch is penalized more severely than multiple small amenity differences).

### 2.3. Formula 3: Cosine Distance (CS)
Measures the angular divergence between vectors, reflecting proportional balance rather than absolute magnitude:

$$\text{cosine\_similarity} = \frac{V_A \cdot V_B}{\|V_A\|_2 \, \|V_B\|_2}$$

$$\text{dist}_{\text{CS}} = 1.0 - \text{cosine\_similarity}$$

---

## 3. Hybrid Blending Engine & Cold-Start Adaptation

### 3.1. Dynamic Alpha Weight ($\alpha$)
To eliminate the classic **Cold-Start Problem** when peer data is sparse, the balance between Content-Based Filtering (CBF) and Collaborative Filtering (CF) adjusts dynamically based on the number of profiled users in the database:

$$\alpha = 1.0 - \left( 0.5 \times \frac{\text{user\_count} - 1}{\text{steady\_state\_threshold} - 1} \right)$$

- **`steady_state_threshold`**: Calibrated to **50** users.
- Clamped strictly within `[0.500, 1.000]`:
  - $\text{user\_count} \le 1$: $\alpha = 1.000$ (100% CBF / 0% CF — Pure content matching).
  - $\text{user\_count} = 4$: $\alpha = 1.0 - (0.5 \times 3 / 49) = 0.9694$ (97% CBF / 3% CF).
  - $\text{user\_count} \ge 50$: $\alpha = 0.500$ (50% CBF / 50% CF — Steady-state community equilibrium).

### 3.2. Final Blended Recommendation Score ($R_{tu}$)

$$R_{tu} = (\alpha \times \text{CBF}) + ((1 - \alpha) \times \text{CF})$$

Where:
- $\text{CBF} = \text{distance}_{\text{CBF}}(\text{User\_Anchor}, \text{Trail\_Vector})$
- $\text{CF} = \frac{1}{|\text{Peers}|} \sum_{P \in \text{Peers}} \left( \text{distance}_{\text{CF}}(\text{User}, P) \times \text{distance}_{\text{CF}}(P, \text{Trail}) \right)$

#### Dual-Anchor Execution & Disjoint Partitioning:
1. **Distance Comparison:** Candidate trails are scored against both `Easy_Anchor_Vector` ($score_{easy}$) and `Difficult_Anchor_Vector` ($score_{diff}$).
2. **Disjoint Allocation:** The trail is assigned exclusively to the closer profile (lower distance):
   - $score_{easy} \le score_{diff} \rightarrow$ Assigned to **Easy**.
   - $score_{diff} < score_{easy} \rightarrow$ Assigned to **Difficult**.
3. **Safety-First & Challenge of the Month Fallback:** If all available trails exceed the user's comfortable capability ($score_{diff} < score_{easy}$ for all trails), the Easy list remains empty (`[]`) as is. The system will never force a difficult trail into the easy bucket. Instead, the spotlight card on the Home Screen dynamically transforms into **"Your Challenge of the Month"**, selecting the **nearest difficult trail to the user's easy anchor**, while `view.tsx` displays an explicit **Challenge Spotlight Notice** detailing physical demands and urging guided preparation.
4. **Peer Pool Isolation:** The active user is strictly excluded from `Peers` ($P \neq \text{User}$) to prevent self-distance ($0.0$) from artificially deflating collaborative averages.

---

## 4. 32-Dimensional Canonical Vector & 5-Pillar Weighting

All trails and user anchor profiles map onto an immutable 32-index vector space divided into **5 Pillar Categories** totaling strictly **100.00%**:

```text
[Indices 0-5]   1. Physical Difficulty   (50.00% Total - Hard Safety Constraints)
  [0] Classification (0.0 Minor, 1.0 Major)
  [1] Length (km normalized to [0, 1])
  [2] Peak Elevation (MASL normalized to [0, 1])
  [3] Elevation Gain (m normalized to [0, 1])
  [4] Slope Gradient (% gradient normalized to [0, 1])
  [5] Lasco / Rating (normalized to [0, 1])

[Indices 6-10]  2. Location / Province   (10.00% Total - Accessibility Preference)
  [6] Cavite, [7] Laguna, [8] Batangas, [9] Rizal, [10] Quezon

[Indices 11-14] 3. Terrain Type          (20.00% Total - Technical Difficulty)
  [11] Muddy, [12] Rocky Scrambles, [13] Grassland, [14] Exposed Ridges

[Indices 15-17] 4. Route Circuit Type    (15.00% Total - Trail Commitment)
  [15] Out-and-back, [16] Point-to-point Traverse, [17] Circular Loop

[Indices 18-31] 5. Scenery & Amenities   (5.00% Total - Comfort Tie-Breakers)
  Waterforms:  [18] Waterfalls, [19] Rivers, [20] Lakes (1.40% subtotal)
  Amenities:   [21] Shelter, [22] Resting Area, [23] Info Board, [24] Clean Water,
               [25] River Access, [26] Lake Access, [27] Waterfall Access,
               [28] Historical Landmark, [29] Guide Station, [30] Viewpoint,
               [31] Cellular Reception (3.60% subtotal)
```

### Weighting Principles
1. **Physical Exertion as Hard Safety Constraint (50%):** Physiological strain (gradient, ascent, distance) dictates whether a trail is safe for a hiker. Amenities must never cause a dangerous trail to match an inexperienced hiker.
2. **Footing (20%) & Circuit Commitment (15%) Over Location (10%):** Rocky scrambles and traverses (where turning back is difficult) dictate physical risk far more than provincial administrative boundaries.
3. **Amenities as Soft Tie-Breakers (5%):** Shelters and viewpoints provide convenience, not physical suitability.

---

## 5. Backend Engine Architecture (`engine/`)

The backend engine is a high-performance Python application built on FastAPI:

### 5.1. Engine Files & Components
- **`engine/app.py`**:
  - Exposes REST API endpoints:
    - `GET /`: Health check and system diagnostic.
    - `POST /api/admin/run-engine`: Triggers batch execution with custom formula selections (`cbf`, `cf`), target month (`YYYY-MM`), and custom feature weights.
- **`engine/batch_runner.py`**:
  - Iterates through all users in `/users`.
  - Extracts calibrated `easy` and `difficult` anchor vectors.
  - Queries active candidate trails from `/trails`.
  - Calculates CBF, CF, and dynamic $\alpha$ blended scores.
  - Generates top recommendation rankings.
  - Integrates Gemini AI reasoning synthesis and persists monthly results directly to `/users/{userId}/recommendations/{YYYY-MM}`.
- **`engine/recommender.py`**:
  - Vectorized mathematical implementation of Gower, Normalized Euclidean, and Cosine distance algorithms with NumPy.
- **`engine/gemini_service.py`**:
  - Server-side interface to Google Gemini AI.
  - Constructs structured prompts containing trail metrics vs. user baseline.
  - Returns structured JSON reasoning containing:
    - `summary`: High-level narrative explaining why the trail was crowned #1.
    - `physicalFit`: Analysis of cardiovascular strain, elevation, and length.
    - `terrainFit`: Alignment with preferred footing and route circuit.
    - `provinceFit`: Regional accessibility analysis.
    - `safetyTips`: Actionable mountaineering precautions tailored to the specific trail.
- **`engine/firebase_client.py`**:
  - Initializes `firebase-admin` with local `serviceAccountKey.json` or Cloud Secret Manager credentials.

---

## 6. Superadmin Transparency Hub & Management UI

Located in `src/app/(app)/(main)/superadmin/recommendation/index.tsx` and `src/recommendation/components/`:

### 6.1. Interactive Mathematical Accordion (`UserDataset.tsx`)
Enables superadmins to inspect any user's generated recommendation with full arithmetic transparency:
1. **Dynamic Derivation:** Shows $\alpha = 1.0 - (0.5 \times (N-1) / 49)$ and exact active formulas.
2. **CBF Breakdown Table:** Feature-by-feature side-by-side comparison between the user's anchor and candidate trail attributes with delta calculations.
3. **CF Breakdown Box:** Displays peer correlation pool status and cold-start indicators.
4. **Final Synthesis Equation:** Visualizes the explicit sum:
   $$\text{Score} = (\alpha \times \text{Raw\_CBF}) + ((1 - \alpha) \times \text{Raw\_CF})$$

### 6.2. 5-Pillar Engine Configuration Modal (`ConfigureEngineModal.tsx`)
- Radio selectors for independent CBF and CF formulas (`GD`, `ED`, `CS`).
- Sliders for the 5 pillar categories.
- Collapsible feature drawers allowing superadmins to toggle specific attributes off (setting their effective weight to $0.0$).
- **Strict 100.00% Validation Guard:** Prevents execution if weights do not sum to exactly 100.00%, displaying a persistent alert banner with the exact discrepancy.
- **Quick Actions:** "Reset Defaults", "Balance to 100%", and "Physical Only" presets.

---

## 7. Client-Side Architecture & Security Hardening

### 7.1. Zero Client-Side Gemini & Secret Key Isolation
To maintain bank-grade API security and prevent key leaks or client latency:
- **All external Gemini API calls and endpoints were completely removed from client-side code.**
- `geminiRecommendationService.ts` was refactored from an asynchronous API caller into a pure, synchronous **Reasoning Resolver** (`resolveRecommendationReasoning`).
- The mobile app purely reads precomputed AI reasoning from the Firestore monthly document (`recommendation.easy[0].reasoning`), with instantaneous local template fallbacks if offline.
- **Server-Side Secret Key Isolation:** `gemini_reasoning.py` in the Python engine strictly resolves `GEMINI_API_KEY` from environment variables, Cloud Secret Manager, or gitignored `engine/.env`. No hardcoded fallback keys exist in source control.

### 7.2. Data Models & Repository Layer
- **`src/core/models/Recommendation/interfaces/Recommendation.types.ts`**: Strict TypeScript interfaces for `IRecommendationDB`, `IRecommendedTrailItem`, `IAITrailReasoning`, and `IEngineConfig`.
- **`src/core/models/Recommendation/repositories/recommendationRepository.ts`**: Firestore queries for monthly recommendation records with cached offline support.

---

## 8. Client UI/UX Design Evolution (`view.tsx`)

The recommendation spotlight screen (`src/app/(app)/(main)/recommendation/view.tsx`) underwent systematic iterations to achieve premium aesthetics, clarity, and safety compliance:

### Iteration Timeline
1. **Banner Title Clipping Fix:**
   - Mountain title text in the hero banner was previously truncated on long names; resolved with multi-line wrapping and flex adjustments.
2. **Numerical Baseline Comparison Grid:**
   - Introduced a side-by-side numerical comparison comparing the user's calibrated physical baseline against candidate trail demands (Length, Elevation Gain, Gradient).
3. **Column Layout Refinement (4 Cols -> 3 Cols):**
   - Originally had 4 columns (`Metric`, `Your Profile`, `Trail Name`, `Profile Fit`). On mobile screens, this caused extreme text cramping.
   - Removed the redundant "Profile Fit" column, consolidating into a clean 3-column layout.
4. **1:2:2 Proportion & Centered Typography:**
   - Configured column flex ratios to **1 : 2 : 2** (`Metric` flex: 1, `Your Profile` flex: 2, `[Trail Name]` flex: 2) to accommodate long mountain names.
   - Centered all text across all columns for uniform geometric balance.
   - Removed icon glyphs from metric rows for pure, high-legibility typographic presentation.
5. **Aesthetic De-cluttering (Removal of Yellow Box & Amber Borders):**
   - Removed the harsh yellow container box (`aiBodyBox` background `#FFFDF5` and border `Palette.Amber100`) that enclosed the entire description.
   - Replaced all section and table dividers with clean, subtle grey lines (`Palette.Slate200`).
   - Converted safety tips box to neutral slate (`Palette.Slate50` with `Palette.Slate200` border).
6. **Strict Design & Regulatory Constraints:**
   - **Minimum Font Size:** Guaranteed `fontSize >= 12` across every label, value, and disclaimer.
   - **Terminology Rule:** Strictly standardized on **"Profile Match"** and **"Profile Similarity"** (never "compatibility").

---

## 9. Firestore Security Rules (`firestore.rules`)

```javascript
match /users/{userId}/recommendations/{recoId} {
    // Normal users can read their own recommendations; Superadmins can inspect any user
    allow read: 
        if request.auth != null 
        && (
            request.auth.uid == userId
            || ('role' in request.auth.token && request.auth.token.role in ['admin', 'superadmin'])
            || (
                exists(/databases/$(database)/documents/users/$(request.auth.uid))
                && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('role', '') in ['admin', 'superadmin']
            )
        );
    
    // Only Superadmin accounts or backend admin credentials can write recommendations
    allow create, update, delete:
        if request.auth != null 
        && (
            ('role' in request.auth.token && request.auth.token.role == 'superadmin')
            || (
                exists(/databases/$(database)/documents/users/$(request.auth.uid))
                && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('role', '') == 'superadmin'
            )
        );
}
```

---

## 10. Operational & Deployment Guide

### Local Development
```powershell
# 1. Start Python engine in engine directory
cd engine
.\venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload

# 2. Run Expo application
npx expo start
```

### Production Deployment (Google Cloud Run)
```powershell
# Deploy containerized FastAPI backend to Cloud Run
gcloud run deploy tars-engine `
  --source . `
  --region asia-southeast1 `
  --platform managed `
  --allow-unauthenticated `
  --set-env-vars FIREBASE_PROJECT_ID=thrail
```

---

## 11. Key Component & File Registry

| File Path | Role & Description |
| :--- | :--- |
| `engine/app.py` | FastAPI application exposing batch execution and health endpoints. |
| `engine/batch_runner.py` | Core batch execution orchestrator with Gemini reasoning integration. |
| `engine/recommender.py` | Vectorized mathematical distance calculations (GD, ED, CS). |
| `engine/gemini_service.py` | Server-side Gemini AI recommendation synthesis engine. |
| `src/core/models/Recommendation/` | TypeScript interfaces, repositories, and reactive hooks. |
| `src/features/Recommendation/services/geminiRecommendationService.ts` | Synchronous client-side reasoning resolver (zero external calls). |
| `src/app/(app)/(main)/recommendation/view.tsx` | Client recommendation view with 3-col benchmark table and grey dividers. |
| `src/features/Home/components/TrailOfTheMonthCard.tsx` | Home tab spotlight card showcasing monthly #1 trail recommendation. |
| `src/app/(app)/(main)/superadmin/recommendation/index.tsx` | Superadmin recommendation hub screen. |
| `src/features/SuperAdmin/components/ConfigureEngineModal.tsx` | 5-pillar weights configuration modal with 100% sum validation. |
| `src/recommendation/components/UserDataset.tsx` | Superadmin user dataset with formula transparency accordion. |
| `firestore.rules` | Declarative Firestore access control rules for recommendations. |
