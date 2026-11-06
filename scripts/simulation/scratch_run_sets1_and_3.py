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

TARGET_SETS = [("Set 1", "set_1_users.json"), ("Set 3", "set_3_users.json")]
alpha = compute_alpha(44)

summary_results = {}

for set_label, set_file in TARGET_SETS:
    set_path = os.path.join(SEEDED_DIR, set_file)
    with open(set_path, "r", encoding="utf-8") as f:
        users = json.load(f)
    
    summary_results[set_label] = {}
    print(f"\n=======================================================")
    print(f"RUNNING {set_label.upper()} ({len(users)} USERS) ACROSS ALL 9 CONFIGS")
    print(f"=======================================================")
    
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
        
        gain_pass = 0
        len_pass = 0
        slope_pass = 0
        lasco_pass = 0
        all3_pass = 0
        inversions = []
        
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
            
            er = sum(trail_map[t["id"]]["lasco"] for t in easy_t) / len(easy_t)
            dr = sum(trail_map[t["id"]]["lasco"] for t in diff_t) / len(diff_t)
            
            ok_g = (eg < dg)
            ok_l = (el < dl)
            ok_s = (es < ds)
            ok_r = (er < dr)
            
            if ok_g: gain_pass += 1
            if ok_l: len_pass += 1
            if ok_s: slope_pass += 1
            if ok_r: lasco_pass += 1
            if ok_g and ok_l and ok_s:
                all3_pass += 1
            else:
                inversions.append({
                    "uid": uid,
                    "gain_inv": not ok_g,
                    "len_inv": not ok_l,
                    "slope_inv": not ok_s,
                    "eg": round(eg, 1), "dg": round(dg, 1),
                    "el": round(el, 2), "dl": round(dl, 2),
                    "es": round(es, 2), "ds": round(ds, 2),
                    "easy_names": [trail_map[t["id"]]["name"] for t in easy_t],
                    "diff_names": [trail_map[t["id"]]["name"] for t in diff_t]
                })
                
        summary_results[set_label][cfg_name] = {
            "all3": all3_pass,
            "gain": gain_pass,
            "length": len_pass,
            "slope": slope_pass,
            "lasco": lasco_pass,
            "total": len(users),
            "inversions": inversions
        }
        
        print(f"{cfg_name:<25} | All 3: {all3_pass:>2}/{len(users)} | Gain: {gain_pass:>2}/{len(users)} | Len: {len_pass:>2}/{len(users)} | Slope: {slope_pass:>2}/{len(users)} | Inversions: {len(inversions)}")

print("\n" + "="*90)
print("SIDE-BY-SIDE SUMMARY: SET 1 vs SET 3 (ALL 3 NUMERICAL FEATURES LOWER)")
print("="*90)
print(f"{'Configuration':<25} | {'Set 1 (All 3)':<15} | {'Set 3 (All 3)':<15} | {'Combined (88 users)':<20}")
print("-" * 90)
for cfg_name, _, _ in CONFIGURATIONS:
    s1 = summary_results["Set 1"][cfg_name]["all3"]
    s3 = summary_results["Set 3"][cfg_name]["all3"]
    comb = s1 + s3
    pct = (comb / 88.0) * 100
    print(f"{cfg_name:<25} | {s1:>2}/44 ({s1/44*100:5.1f}%)   | {s3:>2}/44 ({s3/44*100:5.1f}%)   | {comb:>2}/88 ({pct:5.1f}%)")

# Save detailed json for persistence
output_json_path = os.path.join(ROOT, "scripts", "simulation", "output", "sets_1_and_3_all9configs_results.json")
with open(output_json_path, "w", encoding="utf-8") as f:
    json.dump(summary_results, f, indent=2)
print(f"\nDetailed results saved to {output_json_path}")

