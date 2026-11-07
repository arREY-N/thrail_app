import os
import sys
import json
from unittest.mock import MagicMock

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ENGINE_DIR = os.path.join(ROOT, "engine")
sys.path.insert(0, ENGINE_DIR)

sys.modules["firebase_admin"] = MagicMock()
sys.modules["firebase_admin.credentials"] = MagicMock()
sys.modules["firebase_admin.firestore"] = MagicMock()

import firebase_client
firebase_client.initialize_firebase = lambda: None

from batch_runner import run_batch_recommendations

MIRRORED_USERS_PATH = os.path.join(ENGINE_DIR, "data", "seeded_user_sets", "set_1_users_mirrored.json")
TRAILS_PATH = os.path.join(ROOT, "scripts", "simulation", "output", "trails.json")
OUTPUT_RAW_PATH = os.path.join(ROOT, "scripts", "simulation", "output", "mirrored_pillar_2_raw_recommendations.json")

CONFIGURATIONS = [
    ("Set 1: Pure Gower", "GD", "GD"),
    ("Set 2: Pure Euclidean", "ED", "ED"),
    ("Set 3: Pure Cosine", "CS", "CS"),
    ("Set 4: GD / ED", "GD", "ED"),
    ("Set 5: GD / CS", "GD", "CS"),
    ("Set 6: ED / GD", "ED", "GD"),
    ("Set 7: ED / CS", "ED", "CS"),
    ("Set 8: CS / GD", "CS", "GD"),
    ("Set 9: CS / ED", "CS", "ED"),
]

ALPHAS = [
    (1.0, "1.0000"),
    (0.75, "0.7500"),
    (0.5612244898, "0.5612"),
    (0.50, "0.5000")
]

with open(MIRRORED_USERS_PATH, "r", encoding="utf-8") as f:
    users = json.load(f)

with open(TRAILS_PATH, "r", encoding="utf-8") as f:
    trails_list = json.load(f)

all_recs_storage = {
    "metadata": {
        "dataset": "set_1_users_mirrored.json",
        "num_users": len(users),
        "num_trails": len(trails_list),
        "alphas": [a[0] for a in ALPHAS]
    },
    "configurations": {}
}

print(f"Starting raw recommendation export for {len(CONFIGURATIONS)} configs x {len(ALPHAS)} alphas...")

for cfg_label, cbf, cf in CONFIGURATIONS:
    all_recs_storage["configurations"][cfg_label] = {}
    for alpha_val, alpha_str in ALPHAS:
        print(f"  Exporting {cfg_label} @ alpha={alpha_str}...")
        res = run_batch_recommendations(
            cbf_engine=cbf,
            cf_engine=cf,
            candidate_trails=trails_list,
            users=users,
            commit_to_firestore=False,
            generate_ai_reasoning=False,
            update_profiles_from_reviews=False,
            alpha_override=alpha_val
        )
        recs = res.get("recommendations", {})
        all_recs_storage["configurations"][cfg_label][alpha_str] = recs

with open(OUTPUT_RAW_PATH, "w", encoding="utf-8") as f:
    json.dump(all_recs_storage, f, indent=2)

print(f"[OK] Full raw recommendations successfully saved to: {OUTPUT_RAW_PATH}")

