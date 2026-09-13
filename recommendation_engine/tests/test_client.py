"""
@file test_client.py
@description Client test script that dispatches simulated user payloads to verify FastAPI recommendation 
             endpoints for TARS 2.0 (23 benchmark configurations, Two-Anchor Profiles P_e/P_d, and BCF profile updates).
"""

import urllib.request
import json
import sys

BASE_URL = "http://localhost:8000"
HEADERS = {
    "Content-Type": "application/json",
    "X-API-Key": "thrail-rec-engine-secret-key-placeholder"
}

def send_post(endpoint: str, payload: dict, verbose: bool = True) -> dict:
    url = f"{BASE_URL}{endpoint}"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=HEADERS, method="POST")

    if verbose:
        print(f"\n---> Sending request to {url}...")
    try:
        with urllib.request.urlopen(req) as response:
            response_body = response.read().decode("utf-8")
            res_json = json.loads(response_body)
            if verbose:
                print(f"Status Code: {response.status} (X-Request-ID: {response.headers.get('X-Request-ID')})")
                print("Response Body:")
                print(json.dumps(res_json, indent=2))
            return res_json
    except urllib.error.HTTPError as e:
        print(f"\n[HTTP Error {e.code}]")
        print(e.read().decode("utf-8"))
        sys.exit(1)
    except Exception as e:
        print(f"\n[Connection Error] {str(e)}")
        print("Is the FastAPI server running on http://localhost:8000?")
        sys.exit(1)

def send_get(endpoint: str) -> dict:
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, headers=HEADERS, method="GET")
    print(f"\n---> Sending GET request to {url}...")
    try:
        with urllib.request.urlopen(req) as response:
            res_json = json.loads(response.read().decode("utf-8"))
            print(f"Status Code: {response.status}")
            print(json.dumps(res_json, indent=2))
            return res_json
    except Exception as e:
        print(f"[Error] {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    print("==================================================")
    print("  TARS 2.0 FASTAPI MICROSERVICE API CLIENT TEST   ")
    print("==================================================")

    # 1. Test GET /api/configs
    print("\n--- TEST 1: GET /api/configs ---")
    send_get("/api/configs")

    # 2. Test POST /api/recommend
    recommend_payload = {
        "user_id": "user_001",
        "preferences": {
            "experience": "Beginner",
            "hike_length": ["1-3 Hour(s)", "Half-Day"],
            "hiked": True,
            "location": ["Mt. Batulao (Batangas)"],
            "province": ["Batangas", "Rizal"],
            "tourism_1": True,
            "tourism_2": True
        },
        "active_user_count": 25,
        "config_name": "HYBRID_GOWER",
        "top_k": 3
    }
    print("\n--- TEST 2: POST /api/recommend (Hybrid Gower) ---")
    send_post("/api/recommend", recommend_payload)

    # 3. Test POST /api/recommend with Strategy Swap
    recommend_payload["config_name"] = "HYBRID_TRIPLE_ENSEMBLE"
    print("\n--- TEST 3: POST /api/recommend (Triple Hybrid Ensemble) ---")
    send_post("/api/recommend", recommend_payload)

    # 4. Test POST /api/profile/update
    update_payload = {
        "user_id": "user_001",
        "p_old_easy": [0.0] * 17,
        "p_old_difficult": [0.35] * 17,
        "hiked_trails": [
            {"province": "Rizal", "difficulty_lascoRating": 4, "difficulty_hours": 4.5, "difficulty_length": 8.0, "difficulty_gain": 600.0}
        ],
        "r_tu_scores": [0.25],
        "actual_difficulties": ["easy"]
    }
    print("\n--- TEST 4: POST /api/profile/update (BCF Update) ---")
    send_post("/api/profile/update", update_payload)
