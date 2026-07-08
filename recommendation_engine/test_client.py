import urllib.request
import json
import sys

"""
@file test_client.py
@description Client test script that dispatches a simulated user profile payload 
             to verify FastAPI recommendation output and authentication.
@param {str} url - FastAPI local endpoint destination.
@param {dict} headers - Custom headers containing JSON content-type and X-API-Key credentials.
@param {dict} payload - Mock database parameters matching RecommendRequest model definitions.
"""

url = "http://localhost:8000/api/recommend"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "thrail-rec-engine-secret-key-placeholder"
}

# Payload matching the schema contract in app.py
payload = {
    "user_id": "user_001",
    "preferences": {
        "experience": "Beginner",
        "hike_length": ["1-3 Hour(s)", "Half-Day"],
        "hiked": True,
        "location": ["Mt. Batulao (Batangas)"],
        "province": ["Batangas", "Rizal"]
    },
    "history": [],
    "gps_summary": {
        "distance": 8200.0,
        "duration": 16200.0,
        "elevation": 610.0
    },
    "alpha": 0.5,
    "top_k": 3
}

data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(url, data=data, headers=headers, method="POST")

print(f"Sending test request to {url}...")
try:
    with urllib.request.urlopen(req) as response:
        response_body = response.read().decode("utf-8")
        print("\n=== Success ===")
        print("Status Code:", response.status)
        print("Response headers: X-Request-ID =", response.headers.get("X-Request-ID"))
        print("\nResponse Body:")
        print(json.dumps(json.loads(response_body), indent=2))
except urllib.error.HTTPError as e:
    print("\n=== HTTP Error ===")
    print("Status Code:", e.code)
    print(e.read().decode("utf-8"))
    sys.exit(1)
except Exception as e:
    print("\n=== Connection Error ===")
    print("Error connecting to server:", str(e))
    print("Is the FastAPI server running on port 8000?")
    sys.exit(1)
