import os
import sys
import json
from typing import Dict, Any, List
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
        "lasco": t["difficulty"].get("lascoRating", 0),
        "gain": t["difficulty"].get("gain", 0),
        "slope": float(t["difficulty"].get("slope", 0))
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

ALPHAS = [
    ("1.0000", 1.0),
    ("0.7500", 0.75),
    ("0.5612", float(compute_alpha(44))),
    ("0.5000", 0.5),
]

TARGET_SETS = [
    ("Set 1", os.path.join(SEEDED_DIR, "set_1_users_mirrored.json")),
    ("Set 2", os.path.join(SEEDED_DIR, "set_2_users_mirrored.json")),
]

full_results = {}

for set_label, set_path in TARGET_SETS:
    with open(set_path, "r", encoding="utf-8") as f:
        users = json.load(f)
        
    full_results[set_label] = {}
    print(f"\n=================================================================")
    print(f"RUNNING MIRRORED EVALUATION FOR {set_label.upper()} ({len(users)} USERS)")
    print(f"=================================================================")
    
    # Pre-index pairs: twin_pair_id -> (healthy_user, medical_user)
    pairs = {}
    for u in users:
        t_id = u["twin_pair_id"]
        if t_id not in pairs:
            pairs[t_id] = {}
        if u["medical"] == "N":
            pairs[t_id]["healthy"] = u
        else:
            pairs[t_id]["medical"] = u
            
    # Protected users: beginner (stated E1 or actual E1) OR medical condition (M)
    protected_uids = set()
    for u in users:
        is_beginner = (u.get("stated_experience") == "E1" or u.get("actual_experience") == "E1")
        is_med = (u.get("medical") == "M" or u.get("medicalProfile", {}).get("hasCondition") is True)
        if is_beginner or is_med:
            protected_uids.add(u["id"])
            
    print(f"Total Twin Pairs: {len(pairs)} | Protected Cohorts: {len(protected_uids)}")

    for cfg_name, cbf, cf in CONFIGURATIONS:
        full_results[set_label][cfg_name] = {}
        for a_label, alpha_val in ALPHAS:
            res = run_batch_recommendations(
                cbf_engine=cbf,
                cf_engine=cf,
                candidate_trails=trails,
                users=users,
                commit_to_firestore=False,
                generate_ai_reasoning=False,
                update_profiles_from_reviews=False,
                alpha_override=alpha_val
            )
            recs = res.get("recommendations", {})
            
            # 1. Hardest-trail count (6/9 in either bucket for protected users)
            hardest_trail_count = 0
            # 2. Easy-bucket check (> 3/9 trail in Easy bucket for protected users)
            easy_bucket_violations = 0
            # 3. Empty-bucket rate
            empty_easy_count = 0
            
            for uid in users:
                u_id = uid["id"]
                u_rec = recs.get(u_id, {})
                easy_t = u_rec.get("easy", [])
                diff_t = u_rec.get("difficult", [])
                
                if len(easy_t) == 0:
                    empty_easy_count += 1
                    
                if u_id in protected_uids:
                    # check 6/9
                    all_assigned = easy_t + diff_t
                    has_6 = any(trail_map[t["id"]]["lasco"] == 6 for t in all_assigned if t["id"] in trail_map)
                    if has_6:
                        hardest_trail_count += 1
                        
                    # check > 3/9 in Easy
                    if any(trail_map[t["id"]]["lasco"] > 3 for t in easy_t if t["id"] in trail_map):
                        easy_bucket_violations += 1

            # 4. Medical vs Twin Comparison (Easy Bucket Only)
            med_lower = 0
            med_equal = 0
            med_higher = 0
            
            pair_diffs = []
            for p_id, p in pairs.items():
                h_id = p["healthy"]["id"]
                m_id = p["medical"]["id"]
                
                h_easy = recs.get(h_id, {}).get("easy", [])
                m_easy = recs.get(m_id, {}).get("easy", [])
                
                h_gain = sum(trail_map[t["id"]]["gain"] for t in h_easy) / len(h_easy) if h_easy else 0
                m_gain = sum(trail_map[t["id"]]["gain"] for t in m_easy) / len(m_easy) if m_easy else 0
                
                diff = m_gain - h_gain
                pair_diffs.append({
                    "pair": p_id,
                    "h_gain": h_gain,
                    "m_gain": m_gain,
                    "diff": diff
                })
                
                if diff < -0.01:
                    med_lower += 1
                elif diff > 0.01:
                    med_higher += 1
                else:
                    med_equal += 1

            full_results[set_label][cfg_name][a_label] = {
                "med_lower": med_lower,
                "med_equal": med_equal,
                "med_higher": med_higher,
                "hardest_trail_count": hardest_trail_count,
                "easy_bucket_violations": easy_bucket_violations,
                "empty_easy_count": empty_easy_count,
                "total_pairs": len(pairs),
                "total_protected": len(protected_uids),
                "pair_diffs": pair_diffs
            }
            
            print(f"  {cfg_name:<20} | a={a_label} | Easy Downshift: {med_lower:>2}L / {med_equal:>2}E / {med_higher:>2}H | 6/9 Trail: {hardest_trail_count:>2}/{len(protected_uids)} | Easy>3: {easy_bucket_violations:>2}/{len(protected_uids)}")

# Save to output file
out_path = os.path.join(ROOT, "scripts", "simulation", "output", "sets_1_and_2_mirrored_evaluation_results.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(full_results, f, indent=2)

print(f"\n[DONE] Full results saved to: {out_path}")
