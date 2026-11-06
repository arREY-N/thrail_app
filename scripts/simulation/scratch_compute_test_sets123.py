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

trail_map = {
    t["id"]: {
        "name": t["general"]["name"],
        "gain": t["difficulty"].get("gain", 0),
        "length": t["difficulty"].get("length", 0),
        "slope": float(t["difficulty"].get("slope", 0))
    }
    for t in trails
}

alpha = compute_alpha(44)

# Datasets to evaluate:
# 1. Test (Original Twin Set: set_1_users.json)
# 2. Set 1 Mirrored (set_1_users_mirrored.json)
# 3. Set 2 Mirrored (set_2_users_mirrored.json)
# 4. Set 3 Mirrored (set_3_users_mirrored.json)
datasets = [
    ("Test (Original)", os.path.join(SEEDED_DIR, "set_1_users.json")),
    ("Set 1 (Mirrored)", os.path.join(SEEDED_DIR, "set_1_users_mirrored.json")),
    ("Set 2 (Mirrored)", os.path.join(SEEDED_DIR, "set_2_users_mirrored.json")),
    ("Set 3 (Mirrored)", os.path.join(SEEDED_DIR, "set_3_users_mirrored.json")),
]

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

results = {}

for d_label, d_path in datasets:
    with open(d_path, "r", encoding="utf-8") as f:
        users = json.load(f)
    results[d_label] = {}
    
    for cfg_name, cbf, cf in CONFIGURATIONS:
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
        
        g_pass, l_pass, s_pass, all3_pass = 0, 0, 0, 0
        for u in users:
            uid = u["id"]
            u_rec = recs.get(uid, {})
            et = u_rec.get("easy", [])
            dt = u_rec.get("difficult", [])
            if not et or not dt: continue
            
            eg = sum(trail_map[t["id"]]["gain"] for t in et) / len(et)
            dg = sum(trail_map[t["id"]]["gain"] for t in dt) / len(dt)
            el = sum(trail_map[t["id"]]["length"] for t in et) / len(et)
            dl = sum(trail_map[t["id"]]["length"] for t in dt) / len(dt)
            es = sum(trail_map[t["id"]]["slope"] for t in et) / len(et)
            ds = sum(trail_map[t["id"]]["slope"] for t in dt) / len(dt)
            
            ok_g = (eg < dg)
            ok_l = (el < dl)
            ok_s = (es < ds)
            if ok_g: g_pass += 1
            if ok_l: l_pass += 1
            if ok_s: s_pass += 1
            if ok_g and ok_l and ok_s: all3_pass += 1
            
        results[d_label][cfg_name] = {
            "gain": g_pass,
            "len": l_pass,
            "slope": s_pass,
            "all3": all3_pass,
            "total": len(users)
        }

with open(os.path.join(ROOT, "scripts", "simulation", "output", "test_set1_set2_set3_monotonicity.json"), "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)

print("Done. Output saved.")

