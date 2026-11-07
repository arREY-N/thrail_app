import os
import sys
import json
import itertools
import numpy as np
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
from tars import compute_alpha

HERE = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(HERE, "output")
DEFAULT_TRAILS_PATH = os.path.join(OUTPUT_DIR, "trails.json")
DEFAULT_USERS_PATH = os.path.join(ENGINE_DIR, "data", "seeded_user_sets", "set_1_users.json")

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

def jaccard_variety(s1, s2) -> float:
    inter = len(s1 & s2)
    union = len(s1 | s2)
    return float(1.0 - (inter / union)) if union > 0 else 0.0

def extract_top3_overall(recs_doc):
    all_items = []
    for x in recs_doc.get("easy", []):
        all_items.append((x["id"], x.get("score", 1.0)))
    for x in recs_doc.get("difficult", []):
        all_items.append((x["id"], x.get("score", 1.0)))
    all_items.sort(key=lambda it: it[1])
    return [it[0] for it in all_items[:3]]

with open(DEFAULT_USERS_PATH) as f:
    users = json.load(f)

with open(DEFAULT_TRAILS_PATH) as f:
    trails = json.load(f)

uids = sorted([u["id"] for u in users])
user_map = {u["id"]: u for u in users}
all_pairs = list(itertools.combinations(uids, 2))

e1_uids = [u["id"] for u in users if u.get("cohort_group") == "normal" and u.get("stated_experience") == "E1"]
e4_uids = [u["id"] for u in users if u.get("cohort_group") == "normal" and u.get("stated_experience") == "E4"]
polar_pairs = list(itertools.product(e1_uids, e4_uids))
cross_med_pairs = [(u1, u2) for u1, u2 in all_pairs if user_map[u1].get("medical") != user_map[u2].get("medical")]

alpha = compute_alpha(len(users))

print(f"{'Configuration':<22} | {'Top-3 Mean':<10} | {'Top-3 Polar (E1/E4)':<20} | {'Top-3 Cross-Med':<16}")
print("-" * 80)

for name, cbf, cf in CONFIGURATIONS:
    res = run_batch_recommendations(
        cbf_engine=cbf,
        cf_engine=cf,
        candidate_trails=trails,
        users=users,
        commit_to_firestore=False,
        generate_ai_reasoning=False,
        update_profiles_from_reviews=False,
        alpha_override=alpha
    )
    recs = res.get("recommendations", {})
    top3_map = {uid: set(extract_top3_overall(recs[uid])) for uid in uids}

    top3_mean = np.mean([jaccard_variety(top3_map[u1], top3_map[u2]) for u1, u2 in all_pairs])
    polar_top3 = np.mean([jaccard_variety(top3_map[u1], top3_map[u2]) for u1, u2 in polar_pairs])
    med_top3 = np.mean([jaccard_variety(top3_map[u1], top3_map[u2]) for u1, u2 in cross_med_pairs])

    print(f"{name:<22} | {top3_mean:.4f}     | {polar_top3:.4f}               | {med_top3:.4f}")
