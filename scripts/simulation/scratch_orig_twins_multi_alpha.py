import os
import sys
import json
from unittest.mock import MagicMock

sys.modules["firebase_admin"] = MagicMock()
sys.modules["firebase_admin.credentials"] = MagicMock()
sys.modules["firebase_admin.firestore"] = MagicMock()

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ENGINE_DIR = os.path.join(ROOT, "engine")
sys.path.insert(0, ENGINE_DIR)

import firebase_client
firebase_client.initialize_firebase = lambda: None

from batch_runner import run_batch_recommendations
from tars import compute_alpha

TRAILS_PATH = os.path.join(ROOT, "scripts", "simulation", "output", "trails.json")
ORIG_USERS_PATH = os.path.join(ENGINE_DIR, "data", "seeded_user_sets", "set_1_users.json")

with open(TRAILS_PATH, "r", encoding="utf-8") as f:
    trails = json.load(f)

trail_map = {t["id"]: t["difficulty"]["gain"] for t in trails}

with open(ORIG_USERS_PATH, "r", encoding="utf-8") as f:
    users = json.load(f)

pairs = {}
for u in users:
    uid = u["id"]
    if "-N-" in uid:
        base = uid.replace("-N-", "-")
        if base not in pairs: pairs[base] = {}
        pairs[base]["H"] = u
    elif "-M-" in uid:
        base = uid.replace("-M-", "-")
        if base not in pairs: pairs[base] = {}
        pairs[base]["M"] = u

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
    ("1.0000", 1.0),
    ("0.7500", 0.75),
    ("0.5612", float(compute_alpha(44))),
    ("0.5000", 0.5),
]

orig_results = {}
for cfg_name, cbf, cf in CONFIGURATIONS:
    orig_results[cfg_name] = {}
    for a_label, a_val in ALPHAS:
        res = run_batch_recommendations(
            cbf_engine=cbf,
            cf_engine=cf,
            candidate_trails=trails,
            users=users,
            commit_to_firestore=False,
            generate_ai_reasoning=False,
            update_profiles_from_reviews=False,
            alpha_override=a_val
        )
        recs = res["recommendations"]
        lower, equal, higher = 0, 0, 0
        for base, p in pairs.items():
            hg = sum(trail_map[t["id"]] for t in recs[p["H"]["id"]]["easy"]) / len(recs[p["H"]["id"]]["easy"])
            mg = sum(trail_map[t["id"]] for t in recs[p["M"]["id"]]["easy"]) / len(recs[p["M"]["id"]]["easy"])
            diff = mg - hg
            if diff < -0.01: lower += 1
            elif diff > 0.01: higher += 1
            else: equal += 1
        orig_results[cfg_name][a_label] = {"lower": lower, "equal": equal, "higher": higher}

with open(os.path.join(ROOT, "scripts", "simulation", "output", "original_twin_set_easy_downshifts.json"), "w", encoding="utf-8") as f:
    json.dump(orig_results, f, indent=2)

print("Original twin set multi-alpha evaluation completed.")

