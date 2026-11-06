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
SEEDED_DIR = os.path.join(ENGINE_DIR, "data", "seeded_user_sets")

with open(TRAILS_PATH, "r", encoding="utf-8") as f:
    trails = json.load(f)

trail_map = {t["id"]: t["difficulty"]["gain"] for t in trails}

with open(os.path.join(SEEDED_DIR, "set_3_users_mirrored.json"), "r", encoding="utf-8") as f:
    users = json.load(f)

pairs = {}
for u in users:
    t_id = u["twin_pair_id"]
    if t_id not in pairs:
        pairs[t_id] = {}
    if u["medical"] == "N":
        pairs[t_id]["healthy"] = u
    else:
        pairs[t_id]["medical"] = u

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

set3_leh = {}
for cfg_name, cbf, cf in CONFIGURATIONS:
    set3_leh[cfg_name] = {}
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
        for p_id, p in pairs.items():
            h_easy = recs[p["healthy"]["id"]].get("easy", [])
            m_easy = recs[p["medical"]["id"]].get("easy", [])
            hg = sum(trail_map[t["id"]] for t in h_easy) / len(h_easy) if h_easy else 0
            mg = sum(trail_map[t["id"]] for t in m_easy) / len(m_easy) if m_easy else 0
            diff = mg - hg
            if diff < -0.01: lower += 1
            elif diff > 0.01: higher += 1
            else: equal += 1
        set3_leh[cfg_name][a_label] = {"lower": lower, "equal": equal, "higher": higher}

with open(os.path.join(ROOT, "scripts", "simulation", "output", "set_3_mirrored_leh.json"), "w", encoding="utf-8") as f:
    json.dump(set3_leh, f, indent=2)

print("Set 3 mirrored L/E/H calculation completed.")

