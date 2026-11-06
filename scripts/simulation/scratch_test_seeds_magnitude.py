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

user_sets = [f"set_{i}_users.json" for i in range(1, 6)]
configs = [
    ("Pure Gower (GD/GD)", "GD", "GD"),
    ("Pure Cosine (CS/CS)", "CS", "CS"),
    ("Pure Euclidean (ED/ED)", "ED", "ED"),
    ("Hybrid (GD/ED)", "GD", "ED")
]

alpha = compute_alpha(44)
print(f"Loaded {len(trails)} trails. Dynamic Alpha: {alpha:.6f}\n")

results = {}

for set_file in user_sets:
    set_name = set_file.split(".")[0]
    set_path = os.path.join(SEEDED_DIR, set_file)
    with open(set_path, "r", encoding="utf-8") as f:
        users = json.load(f)
    
    print(f"=== Testing {set_name} ({len(users)} users) ===")
    results[set_name] = {}
    
    for cfg_label, cbf, cf in configs:
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
        
        gain_pass = 0
        len_pass = 0
        slope_pass = 0
        all3_pass = 0
        
        inversion_users = []
        
        for u in users:
            uid = u["id"]
            u_rec = recs.get(uid, {})
            easy_t = u_rec.get("easy", [])
            diff_t = u_rec.get("difficult", [])
            
            if not easy_t or not diff_t:
                continue
                
            eg = sum(trail_map[t["id"]]["gain"] for t in easy_t) / len(easy_t)
            dg = sum(trail_map[t["id"]]["gain"] for t in diff_t) / len(diff_t)
            
            el = sum(trail_map[t["id"]]["length"] for t in easy_t) / len(easy_t)
            dl = sum(trail_map[t["id"]]["length"] for t in diff_t) / len(diff_t)
            
            es = sum(trail_map[t["id"]]["slope"] for t in easy_t) / len(easy_t)
            ds = sum(trail_map[t["id"]]["slope"] for t in diff_t) / len(diff_t)
            
            ok_g = (eg < dg)
            ok_l = (el < dl)
            ok_s = (es < ds)
            
            if ok_g: gain_pass += 1
            if ok_l: len_pass += 1
            if ok_s: slope_pass += 1
            if ok_g and ok_l and ok_s:
                all3_pass += 1
            else:
                inversion_users.append({
                    "uid": uid,
                    "stated": u.get("stated_experience"),
                    "med": u.get("medical"),
                    "gain_inversion": not ok_g,
                    "len_inversion": not ok_l,
                    "slope_inversion": not ok_s,
                    "eg": eg, "dg": dg,
                    "el": el, "dl": dl,
                    "es": es, "ds": ds
                })
                
        results[set_name][cfg_label] = {
            "all3": all3_pass,
            "gain": gain_pass,
            "length": len_pass,
            "slope": slope_pass,
            "total": len(users),
            "inversions": inversion_users
        }
        
        print(f"  {cfg_label:<22} | All 3: {all3_pass:>2}/{len(users)} | Gain: {gain_pass:>2}/{len(users)} | Len: {len_pass:>2}/{len(users)} | Slope: {slope_pass:>2}/{len(users)}")

print("\n" + "="*80)
print("AGGREGATE SUMMARY ACROSS ALL 220 USERS (5 SEEDED SETS):")
print("="*80)
for cfg_label, _, _ in configs:
    tot_all3 = sum(results[s][cfg_label]["all3"] for s in results)
    tot_gain = sum(results[s][cfg_label]["gain"] for s in results)
    tot_len = sum(results[s][cfg_label]["length"] for s in results)
    tot_slope = sum(results[s][cfg_label]["slope"] for s in results)
    tot_users = sum(results[s][cfg_label]["total"] for s in results)
    
    print(f"{cfg_label:<22} | All 3: {tot_all3:>3}/{tot_users} ({tot_all3/tot_users*100:5.1f}%) | Gain: {tot_gain:>3}/{tot_users} ({tot_gain/tot_users*100:5.1f}%) | Len: {tot_len:>3}/{tot_users} ({tot_len/tot_users*100:5.1f}%) | Slope: {tot_slope:>3}/{tot_users} ({tot_slope/tot_users*100:5.1f}%)")

