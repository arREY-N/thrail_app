# Thrail Recommendation Microservice: Developer Setup & Testing Guide

This directory houses the experimental **Hybrid Recommendation System** for Thrail. The system uses a content-based vector search (accelerated by **FAISS**) blended with user-item collaborative filtering (calculated via **Pearson Correlation**).

---

## 1. Project Directory Structure

All files relating to this service are located in the [recommendation_engine/](file:///d:/thrail_app/recommendation_engine) folder:
*   [app.py](file:///d:/thrail_app/recommendation_engine/app.py) - FastAPI server containing API routing, middleware, and request validations.
*   [recommender.py](file:///d:/thrail_app/recommendation_engine/recommender.py) - Core recommendation engine (feature extraction, FAISS index, collaborative scoring, and dynamic alpha calculations).
*   [requirements.txt](file:///d:/thrail_app/recommendation_engine/requirements.txt) - List of Python dependencies.
*   [test_client.py](file:///d:/thrail_app/recommendation_engine/test_client.py) - Mock client testing script.
*   `data/`
    *   [trails_mock.csv](file:///d:/thrail_app/recommendation_engine/data/trails_mock.csv) - Mock trails data mimicking Cloud Firestore schemas.
    *   [user_ratings_mock.csv](file:///d:/thrail_app/recommendation_engine/data/user_ratings_mock.csv) - Mock user review and rating history.
*   [recommendation_scratchpad.ipynb](file:///d:/thrail_app/recommendation_engine/recommendation_scratchpad.ipynb) - Jupyter Notebook for testing custom formulas and normalizations.

---

## 2. Environment Setup (One-Time Setup)

Ensure you have Python 3.8+ installed, then run the following commands:

### Step 1: Create a virtual environment
```powershell
# Navigate to the recommendation engine directory
cd recommendation_engine

# Create the virtual environment
python -m venv venv
```

### Step 2: Activate the environment
*   **Windows Powershell:**
    ```powershell
    .\venv\Scripts\Activate.ps1
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

## 3. Running the Server

To launch the FastAPI server, ensure your virtual environment is active, then run:

```powershell
# Make sure you are in the recommendation_engine directory
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

*   The `--reload` flag enables auto-reloading whenever code changes are saved.
*   The server will initialize the FAISS Index database using [trails_mock.csv](file:///d:/thrail_app/recommendation_engine/data/trails_mock.csv) on startup.

---

## 4. Testing the API

With the server running in one terminal, open a new terminal window and run the test client script to verify everything is working:

```powershell
# Navigate to recommendation_engine directory
cd recommendation_engine

# Run the test client
python test_client.py
```

### Expected Output
The script will send a POST request with a mock payload containing experience settings and location choices. The server should return an HTTP `200 OK` response along with a list of matched trails:

```json
{
  "user_id": "user_001",
  "recommendations": [
    {
      "trail_id": "trail_001",
      "trail_name": "Mt. Daraitan",
      "match_score": 0.7508,
      "reason": "Matches your target onboarding preferences for Rizal."
    },
    ...
  ],
  "warning": null
}
```

---

## 5. Security & Reliability Highlights

1.  **Authorization:** Requests require a valid `X-API-Key` header (defined as security dependency verification in [app.py](file:///d:/thrail_app/recommendation_engine/app.py)).
2.  **Request Tracking:** Custom middleware adds an `X-Request-ID` to logging and header outputs, facilitating request correlation and traceability in log search systems.
3.  **Fail-Safe Fallbacks:** If the FAISS search or user-item correlation fails, a global exception handler intercepts the failure and seamlessly returns safe onboarding defaults rather than returning HTTP 500 errors to the client.
