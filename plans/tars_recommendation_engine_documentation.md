# Thrail App Recommendation System (THARESYS) - Comprehensive Documentation

## 1. Executive Summary & System Architecture

The **Thrail App Recommendation System (THARESYS)** is a hybrid machine-learning-driven recommendation engine tailored for outdoor hiking trails. It synthesizes two primary paradigms:
1. **Content-Based Filtering (CBF):** Measures mathematical distance between candidate trail feature vectors and the user's calibrated physical/environmental anchor profiles (**Easy Anchor** and **Difficult Anchor**).
2. **Collaborative Filtering (CF):** Multiplies similarity across peer hikers who reviewed or completed trails, capturing community behavior.

These two components are blended through a **Dynamic Alpha Weight** that smoothly transitions the system from **Cold-Start Mode** (100% CBF when community data is sparse) to **Steady-State Mode** (50% CBF / 50% CF when sufficient active users exist).

### High-Level Architectural Flow

```text
+---------------------------------------------------------------------------------+
|                               React Native Client                               |
|   (Superadmin Hub / User Profile Modal / Recommendation Dataset UI)            |
+---------------------------------------------------------------------------------+
          |                                                       ^
          | 1. Trigger Batch Run (CBF=GD, CF=GD, Month)           | 4. Fetch & Display
          v                                                       |    Recommendations
+-----------------------------+                                   |
|    FastAPI Python Backend   |                                   |
|     (engine/app.py)         |                                   |
+-----------------------------+                                   |
          |                                                       |
          | 2. Fetch Profiles & Hikes                             |
          v                                                       |
+---------------------------------------------------------------------------------+
|                            Google Cloud Firestore                               |
|   /users/{userId}             --> User anchors & preferences                   |
|   /users/{userId}/hikes       --> Completed hike history                        |
|   /trails/{trailId}           --> Normalized 28-feature vectors                |
|   /users/{userId}/recommendations/{YYYY-MM} --> Monthly recommendation outputs  |
+---------------------------------------------------------------------------------+
          ^
          | 3. Batch Runner computes R_tu scores & writes results
          |
+-----------------------------+
|    THARESYS Batch Runner Engine |
|  (engine/batch_runner.py)   |
+-----------------------------+
```

---

## 2. Mathematical Formulations & Distance Engines

All formulas in THARESYS output values strictly bounded in the range `[0.000, 1.000]`.
- `0.000` = Exact Match / Minimum Distance (Maximum Recommendation Affinity).
- `1.000` = Complete Dissimilarity / Maximum Distance.

All mathematical expressions use standard arithmetic notation (`*`, `/`, `+`, `-`, `avg()`).

### 2.1. Formula 1: Gower's Distance (GD)
Used for multi-attribute vectors with heterogeneous scales and binary presence indicators:
```text
dist_GD = sum( |Vector_A[i] - Vector_B[i]| ) / 28
```
- For each of the 28 normalized feature dimensions, the absolute difference `|Vector_A[i] - Vector_B[i]|` is computed.
- The arithmetic mean across all 28 dimensions yields the final Gower distance.

### 2.2. Formula 2: Normalized Euclidean Distance (ED)
Standard Euclidean distance scaled by `sqrt(28)` to ensure the metric stays within `[0.0, 1.0]`:
```text
dist_ED = sqrt( sum( (Vector_A[i] - Vector_B[i])^2 ) / 28 )
```
- Calculates the mean squared difference across all 28 dimensions and takes the square root.

### 2.3. Formula 3: Cosine Distance (CS)
Calculates the angular divergence between vectors, converting similarity into distance:
```text
cosine_similarity = dot(Vector_A, Vector_B) / ( norm(Vector_A) * norm(Vector_B) )
dist_CS = 1.0 - cosine_similarity
```
- If either vector has zero magnitude, distance is defined as `1.0` (or `0.0` if both are empty).

---

## 3. Hybrid Blending Engine & Formula Combinations

### 3.1. Dynamic Alpha Weight (alpha)
To solve the **Cold-Start Problem** when user density is low, alpha decays linearly as the count of profiled users grows:
```text
alpha = 1.0 - (0.5 * (user_count - 1) / (steady_state_threshold - 1))
```
- `user_count`: Number of active users with saved profiles in Firestore.
- `steady_state_threshold`: Fixed threshold set to `50` users.
- Clamped strictly to `[0.500, 1.000]`:
  - `user_count <= 1`: `alpha = 1.000` (100% CBF / 0% CF).
  - `user_count = 4`: `alpha = 1.0 - (0.5 * 3 / 49) = 0.9694` (97% CBF / 3% CF).
  - `user_count >= 50`: `alpha = 0.500` (50% CBF / 50% CF - Steady State).

### 3.2. Hybrid Scoring Formula (R_tu)
For a candidate trail T and user A:
```text
Score (R_tu) = (alpha * CBF) + ((1 - alpha) * CF)
```

Where:
```text
CBF = distance_CBF(User_Anchor_Vector, Trail_Vector)
CF  = (1 / |Peers|) * sum( distance_CF(User_A_Vector, Peer_B_Vector) * distance_CF(Peer_B_Vector, Trail_Vector) )
```

- **Dual-Anchor Generation & Disjoint Partitioning:** 
  1. The candidate trail is scored against both `Easy_Anchor_Vector` ($score_{easy}$) and `Difficult_Anchor_Vector` ($score_{diff}$).
  2. **Zero Overlap Allocation:** The trail is assigned exclusively to whichever profile it is closer to:
     - If $score_{easy} \le score_{diff}$: Assigned exclusively to the **Easy** recommendation list.
     - If $score_{diff} < score_{easy}$: Assigned exclusively to the **Difficult** recommendation list.
  3. **No Artificial Forcing & Challenge of the Month Fallback:** 
     - If no trails are closer to the Easy anchor (e.g. for a user whose current fitness capability is exceeded by available trails), the Easy list remains empty (`[]`) as is. The engine will never force a difficult trail into the easy bucket just to populate it.
     - In this scenario, the Home Screen spotlight card dynamically transforms into **"Your Challenge of the Month"**, selecting the **nearest difficult trail to the user's easy anchor** (the difficult trail with the lowest $score_{easy}$).
     - The Recommendation Details screen (`view.tsx`) displays an explicit **Challenge Spotlight Notice** clarifying that no trails were predicted as easy, explaining the physical demands, and emphasizing guided preparation.
- **Peer Pool Isolation:** When computing CF, the current user is strictly excluded from `Peers` (`Peer_B.id != User_A.id`) so self-distance ($dist = 0$) does not distort collaborative averages.

### 3.3. Configurable Formula Combinations
Superadmins can independently assign any metric (`GD`, `ED`, or `CS`) to CBF and CF:

| CBF Formula | CF Formula | Key Characteristics |
| :--- | :--- | :--- |
| **GD (Gower)** | **GD (Gower)** | **Default & Recommended.** Robust against sparse categorical vectors (amenities/provinces). |
| **GD (Gower)** | **ED (Euclidean)** | Balances robust multi-attribute feature matching with geometric peer clustering. |
| **GD (Gower)** | **CS (Cosine)** | Balances absolute feature proximity with angular peer alignment. |
| **ED (Euclidean)**| **GD (Gower)** | Penalizes large single-feature mismatches in physical terrain while smoothing peer distance. |
| **ED (Euclidean)**| **ED (Euclidean)**| Strict geometric Euclidean distance across both content and collaborative spaces. |
| **ED (Euclidean)**| **CS (Cosine)** | Geometric trail matching blended with directional peer taste orientation. |
| **CS (Cosine)** | **GD (Gower)** | Proportional feature balance in trails blended with robust peer comparison. |
| **CS (Cosine)** | **ED (Euclidean)**| Proportional trail alignment blended with geometric peer clustering. |
| **CS (Cosine)** | **CS (Cosine)** | Pure vector orientation similarity across both content and collaborative spaces. |

---

## 4. 32-Dimensional Canonical Feature Vector & Importance Weights Matrix

Both User Anchors and Trail Profiles are flattened into a deterministic 1D array of 32 floats:

```text
Index 0-5   (6) Physical Exertion (Default: Class 8.00%, Metrics 8.40% ea = 50.00% Total):
  [0] Classification (0.0 Minor, 1.0 Major)
  [1] Length (km normalized to [0, 1])
  [2] Elevation (MASL normalized to [0, 1])
  [3] Elevation Gain (m normalized to [0, 1])
  [4] Slope (% gradient normalized to [0, 1])
  [5] Lasco / Easy rating (normalized to [0, 1])

Index 6-10  (5) Province Affinity (Default: 2.00% each = 10.00% Total):
  [6] Cavite, [7] Laguna, [8] Batangas, [9] Rizal, [10] Quezon

Index 11-14 (4) Terrain Factors (Default: 5.00% each = 20.00% Total):
  [11] Muddy, [12] Rocky, [13] Grassland, [14] Ridges

Index 15-17 (3) Route Type (Default: 5.00% each = 15.00% Total):
  [15] Out-and-back, [16] Traverse, [17] Circular

Index 18-20 (3) Waterforms (Default: 0.45-0.50% each = 1.40% Total):
  [18] Waterfalls, [19] Rivers, [20] Lakes

Index 21-31 (11) Tourism Amenities (Default: 0.30-0.40% each = 3.60% Total):
  [21] Shelter, [22] Resting Area, [23] Info Board, [24] Clean Water,
  [25] River Access, [26] Lake Access, [27] Waterfall Access,
  [28] Monument / Historical, [29] Guide Community Station,
  [30] Viewpoint, [31] Cellular Reception
  (Combined Scenery & Amenities = 5.00% Total)
```

### 4.1. Feature Weighting Rationale & Post-Hike Profile Updates
- **Physical Exertion as Hard Constraint (50.00%):** Physical capabilities (elevation, gradient, length) represent physiological limits and trail safety. Setting Physical Exertion to 50% ensures trails demanding extreme stamina will not be falsely matched to beginners due to amenities.
- **Terrain Type (20.00%) & Route Type (15.00%) Over Location (10.00%):** Technical footing (rock scrambles, ridges, mud) and trail circuit commitment (traverses cannot turn back like out-and-backs) dictate physical hike difficulty and safety far more than administrative provincial borders.
- **Scenery & Amenities as Lowest Priority Tie-Breakers (5.00%):** Amenities (resting areas, drinking water) and waterforms represent soft comfort conveniences. A trail with resting areas is pleasant, but the presence of a bench does not change the physical danger of a mountain.
- **Protection for Profile Updates:** After a hiker logs completed hikes, their physical stamina anchor increases based on completed trail gradients, while amenity preferences remain stable rather than artificially overfitting to commercialized trails.
- **Superadmin Live 5-Pillar Matrix:** Superadmins can customize each category's weight and expand feature drawers to toggle inclusion (set to 0.0 if unchecked) prior to running batch recommendations.

---

## 5. Firestore Document Structures & Security Rules

### 5.1. Collection Schema

#### User Document (`/users/{userId}`)
```json
{
  "id": "user123",
  "firstname": "John",
  "lastname": "Doe",
  "email": "john@example.com",
  "role": "user",
  "preferences": {
    "experience": "intermediate",
    "province": ["rizal", "batangas"]
  },
  "medicalProfile": {
    "hasCondition": false
  },
  "profile": {
    "easy": {
      "features": {
        "classification": 0.0,
        "length": 0.200,
        "elevation": 0.180,
        "gain": 0.190,
        "slope": 0.220,
        "easy": 0.200,
        "province": { "rizal": 0.85, "cavite": 0.15 },
        "terrain": { "rocky": 0.20 }
      }
    },
    "difficult": {
      "features": {
        "classification": 1.0,
        "length": 0.650,
        "elevation": 0.700
      }
    }
  }
}
```

#### User Completed Hikes (`/users/{userId}/hikes/{hikeId}`)
```json
{
  "id": "hike_01",
  "status": "completed",
  "completedAt": "2026-09-15T08:30:00Z",
  "trail": {
    "id": "trail_daraitan",
    "name": "Mt. Daraitan"
  }
}
```

#### Monthly Recommendation Subcollection (`/users/{userId}/recommendations/{YYYY-MM}`)
```json
{
  "id": "2026-10",
  "createdAt": "2026-10-22T00:23:00.000Z",
  "updatedAt": "2026-10-22T00:23:00.000Z",
  "engineConfig": {
    "cbf": "GD",
    "cf": "GD",
    "alpha": 0.9694,
    "userCount": 4
  },
  "profile": {
    "easy": { "features": { } },
    "difficult": { "features": { } }
  },
  "easy": [
    {
      "id": "trail_batolusong",
      "trailName": "Mt. Batolusong",
      "category": "easy",
      "haveHiked": false,
      "score": 0.2145,
      "cbfScore": 0.2145,
      "cfScore": 0.0000
    }
  ],
  "difficult": [
    {
      "id": "trail_daraitan",
      "trailName": "Mt. Daraitan",
      "category": "difficult",
      "haveHiked": true,
      "score": 0.3421,
      "cbfScore": 0.3421,
      "cfScore": 0.0000
    }
  ]
}
```

### 5.2. Firestore Security Rules (`firestore.rules`)
To ensure that Superadmins can inspect recommendations generated for all users while normal hikers can only read their own:

```javascript
match /users/{userId}/recommendations/{recoId} {
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

## 6. Client-Side Data Models & Services

### 6.1. TypeScript Interface Models (`src/core/models/Recommendation/interfaces/Recommendation.types.ts`)
```typescript
export interface IEngineConfig {
    cbf: 'GD' | 'ED' | 'CS' | string;
    cf: 'GD' | 'ED' | 'CS' | string;
    alpha: number;
    userCount?: number;
}

export interface IRecommendedTrailItem {
    id: string;
    trailName: string;
    category: 'easy' | 'difficult';
    haveHiked: boolean;
    score: number;
    cbfScore?: number;
    cfScore?: number;
}

export interface IRecommendationDB {
    id: string; // YYYY-MM
    createdAt: string;
    updatedAt: string;
    engineConfig: IEngineConfig;
    profile: {
        easy: any;
        difficult: any;
    };
    easy: IRecommendedTrailItem[];
    difficult: IRecommendedTrailItem[];
}
```

### 6.2. Repository (`src/core/models/Recommendation/repositories/recommendationRepository.ts`)
```typescript
export const RecommendationRepo = {
    async fetchByMonth(userId: string, monthCode: string): Promise<IRecommendationDB | null> {
        const docRef = doc(db, 'users', userId, 'recommendations', monthCode);
        const snap = await getDoc(docRef);
        return snap.exists() ? (snap.data() as IRecommendationDB) : null;
    },

    async saveMonthly(userId: string, monthCode: string, data: IRecommendationDB): Promise<void> {
        const docRef = doc(db, 'users', userId, 'recommendations', monthCode);
        await setDoc(docRef, data, { merge: true });
    }
};
```

### 6.3. API Service (`src/features/SuperAdmin/services/tarsApiService.ts`)
Handles network routing between the Expo app (Android loopback `10.0.2.2:8000`, Web/iOS `localhost:8000`, or production Cloud Run URL):
```typescript
export const getTarsApiBaseUrl = (): string => {
    if (process.env.EXPO_PUBLIC_THARESYS_API_URL) {
        return process.env.EXPO_PUBLIC_THARESYS_API_URL.replace(/\/+$/, '');
    }
    if (process.env.EXPO_PUBLIC_TARS_API_URL) {
        return process.env.EXPO_PUBLIC_TARS_API_URL.replace(/\/+$/, '');
    }
    const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    return `http://${host}:8000`;
};

export const checkTarsHealth = async (): Promise<boolean> => {
    const res = await fetch(`${getTarsApiBaseUrl()}/`, { method: 'GET' });
    return res.ok;
};

export const triggerTarsBatchRun = async (payload: TarsBatchRequest): Promise<TarsBatchResponse> => {
    const res = await fetch(`${getTarsApiBaseUrl()}/api/admin/run-engine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    return await res.json();
};
```

---

## 7. Superadmin Frontend & Mathematical Transparency UI

All recommendation inspection is housed inside the **User Profile Modal** in `src/recommendation/components/UserDataset.tsx`, eliminating context switching between separate screens.

### 7.1. Interactive Recommendation Accordion
Each recommendation card is interactive and expandable. When clicked, it renders:
1. **Formula Header:** `Score = (alpha * Raw_CBF) + ((1 - alpha) * Raw_CF)`.
2. **Metadata Strip:** Shows active CBF formula, CF formula, dynamic alpha, and derivation `1.0 - (0.5 * (users - 1) / 49)`.
3. **Content-Based Filtering (CBF) Box:**
   - Exact mathematical formula (`GD`, `ED`, or `CS`).
   - Feature-by-feature comparison table (Length, Elevation, Gain, Slope, Classification, Lasco/Easy) showing User Anchor value, Candidate Trail value, and absolute difference.
   - 28-feature aggregate distance: `Raw CBF Distance = 0.2314`.
   - Weighted CBF term: `alpha * Raw_CBF = 0.2243`.
4. **Collaborative Filtering (CF) Box:**
   - Exact peer correlation formula: `dist = (1 / |Peers|) * sum( dist(User_A, Peer_B) * dist(Peer_B, Trail_T) )`.
   - Cold-start notice: Indicates when user has 0 completed hike records, explaining why raw CF is `0.0000`.
   - Weighted CF term: `(1 - alpha) * Raw_CF = 0.0000`.
5. **Final Synthesis Summary:**
   - Concrete arithmetic addition: `0.2243 (CBF) + 0.0000 (CF) = 0.2243`.
   - Scale orientation: Explains that scores live in `[0.000, 1.000]`, where proximity to `0.000` indicates highest alignment.

### 7.2. Superadmin Engine Configuration Modal (`ConfigureEngineModal.tsx`)
The Superadmin Recommendation Hub provides full runtime control over recommendation engine batch execution through a streamlined **5 Pillar Category Grouping**:
1. **Formula Selectors:** Interactive radio selectors for both CBF and CF formulas (`GD`, `ED`, or `CS`).
2. **5 Pillar Category Architecture (Sum = 100.00%):**
   - **Physical Difficulty (`50.00%`):** Classification, Length, Elevation, Gain, Slope, Lasco Rating *(Primary safety constraint)*.
   - **Terrain Type (`20.00%`):** Muddy, Rocky Scrambles, Grassland, Exposed Ridges *(Technical difficulty & footing > Location)*.
   - **Route Type (`15.00%`):** Out-and-Back, Point-to-Point Traverse, Circular Loop *(Physical trail circuit & commitment level > Location)*.
   - **Location / Province (`10.00%`):** Cavite, Laguna, Batangas, Rizal, Quezon *(Geographic accessibility preference)*.
   - **Scenery & Amenities (`5.00%`):** Waterfalls, Rivers, Lakes + 11 Tourism Amenities *(Smallest category overall, comfort tie-breakers)*.
3. **Macro Weighting with Expandable Feature Drawers:**
   - Superadmins adjust the 5 high-level category weights directly.
   - Each category features a collapsible accordion drawer allowing fine-grained inclusion toggling of specific features (e.g. unchecking *Quezon* if routes are closed).
   - Toggling off any feature sets its effective weight to `0.0`, completely eliminating its contribution to vector distances.
4. **Strict 100.00% Weight Constraint & Validation:**
   - If a superadmin presses "Generate Recommendations" while the category sum does not equal exactly `100.00%`, execution is prevented.
   - A persistent error banner docks above the action buttons and a native alert dialog informs the superadmin of the exact percentage unallocated or over-allocated.
   - Real-time visual feedback: The "Live Weights Summary Strip" changes to warning amber/red and displays the exact difference.
5. **Quick Actions Toolbar:**
   - **"Balance to 100%":** Automatically distributes weights proportionally across all currently active categories to reach exactly 100.00%.
   - **"Reset Defaults":** Restores the 5 categories to their calibrated defaults (`50%`, `20%`, `15%`, `10%`, `5%`).
   - **"Physical Only":** Instantly disables non-physical features and allocates 100% solely to physical trail dimensions (Physical 55%, Terrain 25%, Route 20%).

---

## 8. How to Run the Python Engine Locally

### Step 1: Navigate to the Engine Directory
```powershell
cd c:\Users\LENOVO\Documents\dev\thrail_app\engine
```

### Step 2: Ensure Virtual Environment & Dependencies Are Installed
```powershell
# Create venv if not present
python -m venv venv

# Activate venv (PowerShell)
.\venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt
```

*Requirements include: `fastapi`, `uvicorn`, `numpy`, `firebase-admin`, `pydantic`.*

### Step 3: Firebase Admin Credentials
Ensure your `serviceAccountKey.json` downloaded from Firebase Console (**Project Settings -> Service Accounts -> Generate New Private Key**) is placed inside the `engine/` directory.

### Step 4: Start the FastAPI Server
```powershell
.\venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```
You should see:
```text
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### Step 5: Test Connection from App
1. Open the Thrail app in Android Emulator or Web.
2. Navigate to **Superadmin -> Recommendation Hub**.
3. Tap **Configure Engine** -> Verify modal status indicates server is connected.
4. Tap **Run Engine Now**.

---

## 9. Production & Live Hosting Deployment Guide

To deploy the Python Recommendation Engine online so the mobile app can reach it anywhere without running localhost:

### Recommended Option: Google Cloud Run (Fully Serverless & Integrates with Firebase)

Since Thrail already uses Google Cloud / Firebase for project `thrail`, **Google Cloud Run** provides seamless authentication, zero idle costs, automatic scaling, and SSL out of the box.

#### Step 1: Create a `Dockerfile` in `engine/`
```dockerfile
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=True \
    PORT=8080 \
    APP_HOME=/app

WORKDIR $APP_HOME

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . ./

CMD exec uvicorn app:app --host 0.0.0.0 --port ${PORT} --workers 1
```

#### Step 2: Secret Management for Firebase Credentials
Instead of baking `serviceAccountKey.json` into the Docker image:
1. Store the JSON contents inside **Google Cloud Secret Manager** as `FIREBASE_SERVICE_ACCOUNT`.
2. Update `engine/firebase_client.py` to parse credentials from the environment variable if present:
```python
import json
import os
import firebase_admin
from firebase_admin import credentials, firestore

creds_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
if creds_json:
    cred = credentials.Certificate(json.loads(creds_json))
    firebase_admin.initialize_app(cred, {"projectId": "thrail"})
```

#### Step 3: Build & Deploy via Google Cloud CLI
```powershell
# Set project to thrail
gcloud config set project thrail

# Deploy directly from source
gcloud run deploy tars-engine `
  --source . `
  --region asia-southeast1 `
  --platform managed `
  --allow-unauthenticated `
  --set-env-vars FIREBASE_PROJECT_ID=thrail
```
Cloud Run will output your live URL:
```text
Service [tars-engine] revision [tars-engine-00001] has been deployed and is serving 100 percent of traffic.
Service URL: https://tars-engine-xxxxxxxx-as.a.run.app
```

#### Step 4: Update Frontend Environment Variables
1. In `c:\Users\LENOVO\Documents\dev\thrail_app\.env.production`:
```bash
EXPO_PUBLIC_THARESYS_API_URL=https://tharesys-engine-xxxxxxxx-as.a.run.app
EXPO_PUBLIC_TARS_API_URL=https://tharesys-engine-xxxxxxxx-as.a.run.app
```
2. In EAS build configurations (`eas.json`), ensure `EXPO_PUBLIC_THARESYS_API_URL` (or legacy `EXPO_PUBLIC_TARS_API_URL`) is set as an environment variable or secret.

#### Step 5: Security Hardening (Production)
- **CORS:** Update `allow_origins` in `engine/app.py` from `["*"]` to your specific web production domain.
- **API Key / Token Verification:** Add a FastAPI dependency checking a shared header (e.g. `X-Admin-Api-Key` or validating Firebase Auth ID tokens via `firebase_admin.auth.verify_id_token()`).
