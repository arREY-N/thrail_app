# Thrail App Recommendation System (THARESYS) - Python Engine

This directory contains the Python FastAPI microservice and batch processing engine for the **Thrail App Recommendation System (THARESYS)**.

---

## 1. Directory Structure

```text
engine/
├── app.py                  # FastAPI server exposing admin & recommendation endpoints
├── batch_runner.py         # Batch recommendation processor with disjoint partitioning
├── tars.py                 # Core hybrid blending formula (R_tu) and dynamic alpha tuner
├── profile_utils.py        # 32-feature vector extraction, serialization, and weight matrix
├── gemini_reasoning.py     # Server-side Gemini AI coach synthesis for Trail of the Month
├── firebase_client.py      # Firestore initialization, data fetchers, and persistence
├── formula/                # Standalone distance engines
│   ├── gower_distance.py       # Formula 1: Gower's Distance (GD)
│   ├── euclidean_distance.py   # Formula 2: Normalized Euclidean Distance (ED)
│   └── cosine_distance.py      # Formula 3: Cosine Distance (CS)
├── test_metrics.py         # Self-test script comparing the 3 distance engines
└── requirements.txt        # Python package dependencies
```

---

## 2. Recommendation Architecture & Partitioning

THARESYS uses a **Two-Anchor Recommendation Architecture**:
1. **Easy Profile ($P_e$):** Represents comfortable baseline physical capability (*"What can I hike safely today?"*).
2. **Difficult Profile ($P_d$):** Represents aspirational challenge boundaries (*"What hike will challenge my stamina?"*).

### Disjoint Partitioning (Zero Overlaps)
In [batch_runner.py](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/batch_runner.py):
1. Every candidate trail is scored against both $P_e$ (`easy_score`) and $P_d$ (`diff_score`).
2. **Relative Affinity Allocation:**
   - If `easy_score <= diff_score`: Assigned strictly to **Easy**.
   - If `diff_score < easy_score`: Assigned strictly to **Difficult**.
3. **Guaranteed Disjoint Sets:** A trail never appears in both categories for the same user.

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

### UI Testing & Challenge Preview Mock
To preview how the UI behaves when a user has no easy trails:
- Sample Document: [sampleRecommendation.ts](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/models/Recommendation/mocks/sampleRecommendation.ts)
- Toggle Flag: `USE_SAMPLE_CHALLENGE_MOCK = true` in [recommendationRepository.ts](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/models/Recommendation/repositories/recommendationRepository.ts).
- This feeds the sample document with `easy: []` and Mt. Daraitan as the featured Challenge of the Month. Set to `false` to resume reading live Firestore data.

---

## 3. The 32-Feature Canonical Registry & 5 Pillars

All user anchors and trails map to an identical 32-element float array (`[0.0, 1.0]`):

| Category | Dimensions | Default Weight | Purpose |
| :--- | :---: | :---: | :--- |
| **1. Physical Exertion** | 6 | **50.00%** | Hard safety constraint (Classification, Length, Elevation, Gain, Slope, LASCO rating) |
| **2. Terrains** | 4 | **20.00%** | Technical footing & difficulty impact (Muddy, Rocky, Grassland, Ridges) |
| **3. Route Type** | 3 | **15.00%** | Circuit structure & commitment (Out-and-back, Traverse, Circular) |
| **4. Provinces** | 5 | **10.00%** | Regional accessibility (Cavite, Laguna, Batangas, Rizal, Quezon) |
| **5. Scenery & Amenities** | 14 | **5.00%** | Soft comfort tie-breakers (Waterfalls, Rivers, Shelters, Water sources, Views) |

---

## 4. Running the Engine Locally

### Prerequisites
- Python 3.10+
- Activated virtual environment or installed requirements:

```bash
cd engine
pip install -r requirements.txt
```

### Self-Testing
Test the distance formulas side-by-side:
```bash
python test_metrics.py
```

Run a mock batch recommendation cycle:
```bash
python batch_runner.py
```

### Start FastAPI Microservice
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```
- Interactive Swagger docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/`
- Admin Batch Run: `POST /api/admin/run-engine`
