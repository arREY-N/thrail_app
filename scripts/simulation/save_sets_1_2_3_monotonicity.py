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
        "slope": float(t["difficulty"].get("slope", 0)),
        "lasco": t["difficulty"].get("lascoRating", 0)
    }
    for t in trails
}

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

SETS_TO_RUN = [
    ("Set 1", "set_1_users.json"),
    ("Set 2", "set_2_users.json"),
    ("Set 3", "set_3_users.json"),
]

alpha = compute_alpha(44)
all_results = {}

for set_label, set_file in SETS_TO_RUN:
    set_path = os.path.join(SEEDED_DIR, set_file)
    with open(set_path, "r", encoding="utf-8") as f:
        users = json.load(f)
    
    all_results[set_label] = {
        "metadata": {
            "source_file": set_file,
            "num_users": len(users),
            "alpha": alpha
        },
        "configurations": {}
    }
    
    print(f"Running monotonicity check for {set_label}...")
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
        
        gain_pass, len_pass, slope_pass, all3_pass = 0, 0, 0, 0
        user_telemetry = []
        
        for u in users:
            uid = u["id"]
            u_rec = recs.get(uid, {})
            easy_t = u_rec.get("easy", [])
            diff_t = u_rec.get("difficult", [])
            
            eg = sum(trail_map[t["id"]]["gain"] for t in easy_t) / len(easy_t) if easy_t else 0
            dg = sum(trail_map[t["id"]]["gain"] for t in diff_t) / len(diff_t) if diff_t else 0
            
            el = sum(trail_map[t["id"]]["length"] for t in easy_t) / len(easy_t) if easy_t else 0
            dl = sum(trail_map[t["id"]]["length"] for t in diff_t) / len(diff_t) if diff_t else 0
            
            es = sum(trail_map[t["id"]]["slope"] for t in easy_t) / len(easy_t) if easy_t else 0
            ds = sum(trail_map[t["id"]]["slope"] for t in diff_t) / len(diff_t) if diff_t else 0
            
            ok_g = (eg < dg)
            ok_l = (el < dl)
            ok_s = (es < ds)
            ok_all3 = (ok_g and ok_l and ok_s)
            
            if ok_g: gain_pass += 1
            if ok_l: len_pass += 1
            if ok_s: slope_pass += 1
            if ok_all3: all3_pass += 1
            
            user_telemetry.append({
                "uid": uid,
                "easy_gain": round(eg, 1),
                "diff_gain": round(dg, 1),
                "easy_len": round(el, 2),
                "diff_len": round(dl, 2),
                "easy_slope": round(es, 2),
                "diff_slope": round(ds, 2),
                "gain_monotonic": ok_g,
                "len_monotonic": ok_l,
                "slope_monotonic": ok_s,
                "all3_monotonic": ok_all3
            })
            
        all_results[set_label]["configurations"][cfg_name] = {
            "summary": {
                "all3_pass": all3_pass,
                "gain_pass": gain_pass,
                "len_pass": len_pass,
                "slope_pass": slope_pass,
                "total": len(users),
                "all3_percentage": round((all3_pass / len(users)) * 100, 1)
            },
            "users": user_telemetry
        }

output_path = os.path.join(ROOT, "scripts", "simulation", "output", "sets_1_2_3_monotonicity_results.json")
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(all_results, f, indent=2)

print(f"\n[DONE] Saved comprehensive monotonicity dataset to: {output_path}")

