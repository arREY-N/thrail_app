# Thrail App Recommendation System (TARS) Microservice Guide

This directory houses the official **Thrail App Recommendation System (TARS)** microservice. TARS is a dynamic hybrid recommendation system that utilizes **Gower's Distance Similarity Engine** for mixed data types, **Dynamic Alpha Tuning ($\alpha$)** for cold-start progression, **Incremental Profile Recalibration** via GPS telemetry, **User-User Collaborative Filtering**, and **Upper-Triangular Symmetric Matrix Optimizations**.

---

## 1. Project Directory Structure

All files relating to this microservice are located in the [recommendation_engine/](file:///d:/thrail_app/recommendation_engine) folder:
*   [gower_engine.py](file:///d:/thrail_app/recommendation_engine/gower_engine.py) - Gower's Distance Similarity Engine handling mixed attributes (numerical, ordinal, nominal) and symmetric matrix optimizations.
*   [recommender.py](file:///d:/thrail_app/recommendation_engine/recommender.py) - Core TARS hybrid engine (base user profiles, dynamic $\alpha$ tuning, profile error correction, collaborative scoring, and safety threshold filters).
*   [app.py](file:///d:/thrail_app/recommendation_engine/app.py) - FastAPI service exposing POST `/api/recommend`, POST `/api/profile/update`, and POST `/api/gower/similarity`.
*   [test_client.py](file:///d:/thrail_app/recommendation_engine/test_client.py) - API test client script running sample tests, top-3 mountain breakdowns, and batch evaluation across 50 users.
*   `tests/`
    *   [test_tars_recommender.py](file:///d:/thrail_app/recommendation_engine/tests/test_tars_recommender.py) - Comprehensive automated test suite for TARS Modules 1 through 5.
*   `data/`
    *   [trails_mock.csv](file:///d:/thrail_app/recommendation_engine/data/trails_mock.csv) - Mock database containing 10 candidate trails across CALABARZON.
    *   [user_ratings_mock.csv](file:///d:/thrail_app/recommendation_engine/data/user_ratings_mock.csv) - Mock review history and telemetry logs for 50 active users (`user_001` to `user_050`).
*   [recommendation_scratchpad.ipynb](file:///d:/thrail_app/recommendation_engine/recommendation_scratchpad.ipynb) - Jupyter Notebook for testing custom formulas, normalizations, and optimization performance.
*   [requirements.txt](file:///d:/thrail_app/recommendation_engine/requirements.txt) - Python dependencies list.

---

## 2. Environment Setup (One-Time Setup)

Ensure you have Python 3.8+ installed, then execute:

### Step 1: Create a virtual environment
```powershell
# Navigate to the recommendation_engine directory
cd recommendation_engine

# Create the virtual environment
python -m venv venv
```

### Step 2: Activate the environment
*   **Windows Powershell:**
    ```powershell
    .\venv\Scripts\Activate.ps1
    ```
*   **Windows Command Prompt (cmd):**
    ```cmd
    .\venv\Scripts\activate.bat
    ```
*   **macOS/Linux Bash:**
    ```bash
    source venv/bin/activate
    ```

### Step 3: Install dependencies
```bash
pip install -r requirements.txt
```

---

## 3. How to Deactivate the Virtual Environment

When you are finished working in the Python environment, you can deactivate it in **any terminal shell** (PowerShell, CMD, or Bash) by running:

```bash
deactivate
```

This restores your terminal prompt back to your global system Python environment.

---

## 4. Running Automated Unit Tests

To run the automated unit test suite verifying Gower math, $\alpha$-decay, profile recalibration, and symmetric matrix optimizations:

```powershell
# Make sure you are inside recommendation_engine directory with venv active
python -m unittest tests/test_tars_recommender.py
```

---

## 5. Running the FastAPI Microservice

To launch the FastAPI server:

```powershell
# Run using Python directly
python app.py

# Or using Uvicorn CLI
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload --no-use-colors
```

*   The server runs locally at `http://localhost:8000`.
*   Interactive OpenAPI documentation is accessible at `http://localhost:8000/docs`.

---

## 6. Testing the API Client

With the server running in one terminal window, open a **second terminal** and run:

```powershell
python test_client.py
```

### What `test_client.py` Outputs:
1. **Sample API Test (`POST /api/recommend`)**: Evaluates a single user request.
2. **Top 3 Mountain Breakdown**: Displays top recommended mountains, match scores, and match reasons for 5 sample user profiles.
3. **50-User Batch Evaluation**: Executes recommendation queries across all 50 users (`user_001` to `user_050`) and outputs a score diversity summary table.

### Sample API Response Schema (`POST /api/recommend`):

```json
{
  "user_id": "user_001",
  "recommendations": [
    {
      "trail_id": "trail_002",
      "trail_name": "Mt. Batulao",
      "match_score": 0.8549,
      "cbf_score": 0.8549,
      "cf_score": 0.8549,
      "reason": "Balanced hybrid recommendation matching your preferences and past performance."
    },
    {
      "trail_id": "trail_005",
      "trail_name": "Mt. Pico de Loro",
      "match_score": 0.7992,
      "cbf_score": 0.7992,
      "cf_score": 0.7992,
      "reason": "Balanced hybrid recommendation matching your preferences and past performance."
    }
  ],
  "alpha_used": 0.5,
  "completed_hikes": 3,
  "warning": null
}
```

---

## 7. Mathematical & Architectural Specifications Summary

1. **Gower's Distance Similarity Engine (Module 1)**:
   - Numerical Attributes: $S_j = 1 - \frac{|A_j - B_j|}{\text{Range}_j}$
   - Ordinal Attributes (LASCO 1–9): $S_j = 1 - |\text{norm}(A_j) - \text{norm}(B_j)|$
   - Nominal Attributes: $S_j = 1$ if match else $0$.
2. **Dynamic $\alpha$ Calibration (Module 2)**:
   - $0$ hikes: $\alpha = 1.0$ (Cold-Start CBF)
   - $1–2$ hikes: $\alpha = 0.75$
   - $3+$ hikes: $\alpha = 0.50$ (Balanced Hybrid)
3. **Incremental Profile Recalibration (Module 2.3)**:
   - Recalibrates user capacity vector via Exponential Moving Average ($\eta = 0.25$) and perceived difficulty shift factor ($\delta$).
4. **Upper Triangular Matrix Optimization (Module 4)**:
   - $S(A,B) = S(B,A)$ mirroring and $S(A,A) = 1.0$ self-similarity bypass, reducing matrix operations by **$>50\%$**.

---

## 8. Prototyping in the Jupyter Notebook

Open [recommendation_scratchpad.ipynb](file:///d:/thrail_app/recommendation_engine/recommendation_scratchpad.ipynb) inside VS Code to run interactive prototyping cells for Gower distance calculations, profile updates, and matrix optimization benchmarks.
