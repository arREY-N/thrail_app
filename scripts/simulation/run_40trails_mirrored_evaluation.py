import os
import sys
import json
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

CATALOG_PATH = os.path.join(ROOT, "scripts", "simulation", "trail_simulation", "inputs", "catalog_seed42.json")
USERS_PATH = os.path.join(ROOT, "engine", "data", "seeded_user_sets", "set_1_users_mirrored.json")
OUTPUT_RAW_PATH = os.path.join(ROOT, "scripts", "simulation", "output", "mirrored_pillar_2_40trails_raw_recs.json")
OUTPUT_RESULTS_PATH = os.path.join(ROOT, "scripts", "simulation", "output", "mirrored_pillar_2_40trails_results.json")

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
    (1.0, "1.0000", "α=1.0000"),
    (0.75, "0.7500", "α=0.7500"),
    (0.5612244898, "0.5612", "α=0.5612"),
    (0.50, "0.5000", "α=0.5000")
]

with open(USERS_PATH, "r", encoding="utf-8") as f:
    users = json.load(f)

with open(CATALOG_PATH, "r", encoding="utf-8") as f:
    catalog_data = json.load(f)
    trails_list = catalog_data["trails"]
    trail_by_id = {t["id"]: t for t in trails_list}

def is_protected(u):
    is_med = bool(u.get("medicalProfile", {}).get("hasCondition", False)) or u.get("medical") == "M"
    is_beg = u.get("actual_experience") == "E1" or u.get("stated_experience") == "E1"
    return is_beg or is_med

protected_uids = [u["id"] for u in users if is_protected(u)]
total_protected = len(protected_uids)
total_users = len(users)

pairs = {}
for u in users:
    twin_id = u["twin_pair_id"]
    if twin_id not in pairs:
        pairs[twin_id] = {}
    if u["medical"] == "N":
        pairs[twin_id]["healthy"] = u["id"]
        pairs[twin_id]["archetype"] = u.get("base_cohort_code", "")
    else:
        pairs[twin_id]["medical"] = u["id"]

total_pairs = len(pairs)

# Identify 6/9 and >= 6/9 trail IDs
exact_6_ids = {t["id"] for t in trails_list if t.get("difficulty", {}).get("lascoRating") == 6}
ge_6_ids = {t["id"] for t in trails_list if t.get("difficulty", {}).get("lascoRating", 0) >= 6}

print(f"Loaded {total_users} users, {len(trails_list)} trails.")
print(f"Protected cohorts: {total_protected}, Twin pairs: {total_pairs}")
print(f"Trails with rating == 6: {len(exact_6_ids)}, Trails with rating >= 6: {len(ge_6_ids)}")

full_recs_storage = {
    "metadata": {
        "catalog": "catalog_seed42.json (32 synthetic + 8 real = 40 trails)",
        "users": "set_1_users_mirrored.json (44 mirrored cohorts)",
    },
    "configurations": {}
}

evaluation_summary = {}

for cfg_label, cbf, cf in CONFIGURATIONS:
    print(f"\nProcessing {cfg_label}...")
    full_recs_storage["configurations"][cfg_label] = {}
    evaluation_summary[cfg_label] = {}
    
    for alpha_val, alpha_str, alpha_label in ALPHAS:
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
        full_recs_storage["configurations"][cfg_label][alpha_str] = recs
        
        # 1. Hardest-trail count (protected users who receive 6/9 trail in either bucket in top slots)
        hardest_exact6_count = 0
        hardest_ge6_count = 0
        for uid in protected_uids:
            u_rec = recs[uid]
            top_slots = u_rec.get("easy", [])[:3] + u_rec.get("difficult", [])[:2]
            if any(x["id"] in exact_6_ids for x in top_slots):
                hardest_exact6_count += 1
            if any(x["id"] in ge_6_ids for x in top_slots):
                hardest_ge6_count += 1
                
        # 2. Easy-bucket check (count protected users whose Easy bucket contains any trail > 3/9. Empty bucket passes)
        easy_bucket_failed_count = 0
        for uid in protected_uids:
            easy_b = recs[uid].get("easy", [])
            if len(easy_b) > 0:
                if any(trail_by_id[x["id"]]["difficulty"]["lascoRating"] > 3 for x in easy_b):
                    easy_bucket_failed_count += 1
                    
        # 3. Empty-bucket rate (count users whose Easy bucket is empty, out of 44 users)
        empty_easy_count = sum(1 for u in users if len(recs[u["id"]].get("easy", [])) == 0)
        
        # 4. Medical vs. twin (average gain across everything received, and top 5)
        med_lower_all = 0
        med_equal_all = 0
        med_higher_all = 0
        
        med_lower_top5 = 0
        med_equal_top5 = 0
        med_higher_top5 = 0
        
        med_lower_easy = 0
        med_equal_easy = 0
        med_higher_easy = 0
        
        for p_id in sorted(pairs.keys()):
            h_rec = recs[pairs[p_id]["healthy"]]
            m_rec = recs[pairs[p_id]["medical"]]
            
            # Everything received
            h_all = h_rec.get("easy", []) + h_rec.get("difficult", [])
            m_all = m_rec.get("easy", []) + m_rec.get("difficult", [])
            h_all_gain = float(np.mean([trail_by_id[x["id"]]["difficulty"]["gain"] for x in h_all])) if h_all else 0.0
            m_all_gain = float(np.mean([trail_by_id[x["id"]]["difficulty"]["gain"] for x in m_all])) if m_all else 0.0
            
            if m_all_gain < h_all_gain:
                med_lower_all += 1
            elif m_all_gain == h_all_gain:
                med_equal_all += 1
            else:
                med_higher_all += 1
                
            # Top 5
            h_top5 = h_rec.get("easy", [])[:3] + h_rec.get("difficult", [])[:2]
            m_top5 = m_rec.get("easy", [])[:3] + m_rec.get("difficult", [])[:2]
            h_t5_gain = float(np.mean([trail_by_id[x["id"]]["difficulty"]["gain"] for x in h_top5])) if h_top5 else 0.0
            m_t5_gain = float(np.mean([trail_by_id[x["id"]]["difficulty"]["gain"] for x in m_top5])) if m_top5 else 0.0
            
            if m_t5_gain < h_t5_gain:
                med_lower_top5 += 1
            elif m_t5_gain == h_t5_gain:
                med_equal_top5 += 1
            else:
                med_higher_top5 += 1
                
            # Easy bucket only
            h_easy = h_rec.get("easy", [])
            m_easy = m_rec.get("easy", [])
            h_ez_gain = float(np.mean([trail_by_id[x["id"]]["difficulty"]["gain"] for x in h_easy])) if h_easy else 0.0
            m_ez_gain = float(np.mean([trail_by_id[x["id"]]["difficulty"]["gain"] for x in m_easy])) if m_easy else 0.0
            
            if m_ez_gain < h_ez_gain:
                med_lower_easy += 1
            elif m_ez_gain == h_ez_gain:
                med_equal_easy += 1
            else:
                med_higher_easy += 1
                
        evaluation_summary[cfg_label][alpha_str] = {
            "hardest_exact6_count": hardest_exact6_count,
            "hardest_ge6_count": hardest_ge6_count,
            "easy_bucket_failed_count": easy_bucket_failed_count,
            "empty_easy_count": empty_easy_count,
            "med_lower_all": med_lower_all,
            "med_equal_all": med_equal_all,
            "med_higher_all": med_higher_all,
            "med_lower_top5": med_lower_top5,
            "med_equal_top5": med_equal_top5,
            "med_higher_top5": med_higher_top5,
            "med_lower_easy": med_lower_easy,
            "med_equal_easy": med_equal_easy,
            "med_higher_easy": med_higher_easy,
            "total_protected": total_protected,
            "total_users": total_users,
            "total_pairs": total_pairs
        }
        print(f"  alpha={alpha_str}: Hardest(6/9)={hardest_exact6_count}/{total_protected}, Easy>3/9={easy_bucket_failed_count}/{total_protected}, EmptyEasy={empty_easy_count}/{total_users}, Med<Healthy(all)={med_lower_all}/{total_pairs}, Med<Healthy(easy)={med_lower_easy}/{total_pairs}")

with open(OUTPUT_RAW_PATH, "w", encoding="utf-8") as f:
    json.dump(full_recs_storage, f, indent=2)

with open(OUTPUT_RESULTS_PATH, "w", encoding="utf-8") as f:
    json.dump(evaluation_summary, f, indent=2)

print("\n[OK] Successfully completed 40-trail simulation and evaluation!")

