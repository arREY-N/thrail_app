# Thrail App Recommendation System (THARESYS) - Python Engine

This directory contains the Python FastAPI microservice and batch processing engine for the **Thrail App Recommendation System (THARESYS)**.

---

## 1. Directory Structure

```text
engine/
├── app.py                  # FastAPI server exposing admin & recommendation endpoints
├── batch_runner.py         # Batch recommendation processor with profile updates & disjoint partitioning
├── tars.py                 # Core hybrid blending formula (R_tu) and dynamic alpha tuner
├── profile_utils.py        # 32-feature vector extraction, serialization, and factor weight resolvers
├── gemini_reasoning.py     # Server-side Gemini AI coach synthesis for Trail of the Month
├── firebase_client.py      # Firestore initialization, data fetchers, and persistence
├── formula/                # Standalone calculation engines
│   ├── gower_distance.py       # Formula 1: Gower's Distance (GD)
│   ├── euclidean_distance.py   # Formula 2: Normalized Euclidean Distance (ED)
│   ├── cosine_distance.py      # Formula 3: Cosine Distance (CS)
│   └── profile_updater.py      # Formula 4: Adaptive Profile Update & Monotonicity Guards
├── test_metrics.py         # Self-test script comparing the 3 distance engines
├── test_profile_updater.py # Unit tests for adaptive profile updater formula & monotonicity
├── test_batch_runner_update.py # Unit tests for monthly cycle, new profile handling, and factor weights
└── requirements.txt        # Python package dependencies
```

---

## 2. Recommendation Architecture & Partitioning

THARESYS uses a **Two-Anchor Recommendation Architecture**:
1. **Easy Profile ($P_e$):** Represents comfortable baseline physical capability (*"What can I hike safely today?"*).
2. **Difficult Profile ($P_d$):** Represents aspirational challenge boundaries (*"What hike will challenge my stamina?"*).

### The Closed Feedback Loop
The engine operates in a complete 3-stage continuous learning cycle:
1. **Profile Generation:** Formulates initial Easy and Difficult anchor vectors for a user based on onboarding survey responses, past hiked trails, and medical factors.
2. **Recommendation Generation:** Evaluates candidate trails against anchors using hybrid CBF + CF with dynamic alpha and disjoint partitioning, saving recommendations to `/recommendations/{userId}/months/{monthId}`.
3. **Adaptive Profile Update:** When hikers complete trails and submit reviews, the engine collects previous cycle feedbacks, applies error-driven profile learning, enforces physical monotonicity, and writes updated anchors back to `/users/{userId}`.

### Disjoint Partitioning (Zero Overlaps)
In [batch_runner.py](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/batch_runner.py):
1. Every candidate trail is scored against both $P_e$ (`easy_score`) and $P_d$ (`diff_score`).
2. **Relative Affinity Allocation:**
   - If `easy_score <= diff_score`: Assigned strictly to **Easy**.
   - If `diff_score < easy_score`: Assigned strictly to **Difficult**.
3. **Guaranteed Disjoint Sets:** A trail never appears in both categories for the same user.

### Account Filtering & New Profile Lifecycle
- **Filtering Rule:** Users are filtered strictly by the presence of a valid `profile` object containing `easy` or `difficult` anchor features. Incomplete or dummy accounts lacking the `profile` property are skipped.
- **Unblocked New Profiles:** Brand new profiles that have never had recommendations generated in a previous cycle (`prev_reco is None`) are **not skipped**. The runner proceeds smoothly with their baseline profile anchors, scoring trails and generating their initial recommendation list.
- **Fallback for Unrecommended Trails:** If a user reviews a trail that was not recommended in the prior cycle or has no prior recommendations document, the engine evaluates distance against the user's current anchors via Euclidean distance fallback to derive predicted category and score.

### Safety-First Empty Category & Challenge of the Month Fallback
- Physical safety is an absolute constraint in mountaineering.
- The 50% physical exertion weight heavily penalizes strenuous trails against an Easy profile.
- If all available trails in the database exceed a user's comfortable capability (`diff_score < easy_score` for all trails), the **Easy list remains empty (`[]`) as is**.
- Difficult trails are **never** artificially forced into the Easy category to pad list sizes.
- **Challenge of the Month Dynamic Transition:**
  - On the Home Screen, the spotlight card dynamically switches its title from **"Your Trail of the Month"** to **"Your Challenge of the Month"**.
  - The system automatically selects the **nearest difficult trail to the user's easy anchor** (the difficult trail with the lowest `easyScore` / distance to comfortable baseline).
  - In the Recommendation Details screen (`view.tsx`), the header dynamically switches to **"Challenge of the Month"** and displays a prominent **Challenge Spotlight Notice** informing the user that no trails are currently predicted to be easy for their profile, prompting caution and thorough preparation.
  - Gemini AI reasoning acknowledges this challenge context directly in its narrative summary and safety tips.

### AI Reasoning & Explanation Rules (`gemini_reasoning.py`)
- **Tone & Style:** Strictly straight to the point, direct, concise, and objective. Non-interactive without conversational greetings ("Hey hiker!"), rhetorical questions, or coach banter.
- **System Naming:** Strictly uses **"THARESYS"** only. Never expands to the full name ("Thrail App Recommendation System").
- **Terminology:** Strictly uses **"profile match"** or **"profile similarity"** (never "compatibility").
- **Quantitative Comparisons:** Grounded in direct numerical comparisons between the hiker's calibrated baselines (distance, elevation gain, gradient) and the trail's actual specs.

---

## 3. Adaptive Profile Update Formulation (`formula/profile_updater.py`)

When updating profile anchors from hike feedbacks, the governing update equation is:
```text
P^(t+1) = P^(t) + [gamma / (1 + gamma)] * sum( mu_i * W_i * (T_i - P^(t)) )
```
Where:
- `P^(t)`: Current 32-element profile vector.
- `T_i`: Normalized 32-element feature vector of completed trail `i`.
- `mu_i`: Error-driven direction factor:
  - If match (perceived difficulty aligns with predicted anchor): `mu_i = +(1.0 - score_i)`
  - If mismatch (perceived difficulty diverged): `mu_i = -(1.0 - score_i)`
- `W_i`: Contextual feature weight vector derived from hiker factor selections with **Feature Presence Gating** (terrains not present on trail are gated to 0.0).
- `gamma`: Dampening rate (`0.15`), guaranteeing stable and gradual profile evolution.

### Monotonicity Enforcement
Physical dimensions (Classification, Length, Elevation, Gain, Slope, LASCO rating) strictly enforce `P_easy[k] <= P_diff[k] - 0.05`. If learning causes inversion, anchors are adjusted to maintain safety separation.

---

## 4. The 32-Feature Canonical Registry & 5 Pillars

All user anchors and trails map to an identical 32-element float array (`[0.0, 1.0]`):

| Category | Dimensions | Default Weight | Purpose |
| :--- | :---: | :---: | :--- |
| **1. Physical Exertion** | 6 | **50.00%** | Hard safety constraint (Classification, Length, Elevation, Gain, Slope, LASCO rating) |
| **2. Terrains** | 4 | **20.00%** | Technical footing & difficulty impact (Muddy, Rocky, Grassland, Ridges) |
| **3. Route Type** | 3 | **15.00%** | Circuit structure & commitment (Out-and-back, Traverse, Circular) |
| **4. Provinces** | 5 | **10.00%** | Regional accessibility (Cavite, Laguna, Batangas, Rizal, Quezon) |
| **5. Scenery & Amenities** | 14 | **5.00%** | Soft comfort tie-breakers (Waterfalls, Rivers, Shelters, Water sources, Views) |

---

## 5. Running the Engine Locally & Testing

### Prerequisites
- Python 3.10+
- Activated virtual environment:

```bash
cd engine
pip install -r requirements.txt
```

### Self-Testing
Run distance engine benchmarks:
```bash
python test_metrics.py
```

Run adaptive profile updater unit tests:
```bash
python test_profile_updater.py
```

Run monthly batch cycle & new profile handling tests:
```bash
python test_batch_runner_update.py
```

Run all unit tests:
```bash
python -m unittest discover -s . -p "test_*.py"
```

### Start FastAPI Microservice
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```
- Interactive Swagger docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/`
- Admin Batch Run: `POST /api/admin/run-engine`
