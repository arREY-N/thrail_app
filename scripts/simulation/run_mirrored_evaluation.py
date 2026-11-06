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

MIRRORED_USERS_PATH = os.path.join(ENGINE_DIR, "data", "seeded_user_sets", "set_1_users_mirrored.json")
TRAILS_PATH = os.path.join(ROOT, "scripts", "simulation", "output", "trails.json")

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
    (1.0, "alpha = 1.00 (Cold-Start CBF)"),
    (0.75, "alpha = 0.75 (Transitional)"),
    (0.5612244898, "alpha = 0.5612 (Dynamic 44-Users)"),
    (0.50, "alpha = 0.50 (Steady-State)")
]

with open(MIRRORED_USERS_PATH, "r", encoding="utf-8") as f:
    users = json.load(f)

with open(TRAILS_PATH, "r", encoding="utf-8") as f:
    trails_list = json.load(f)
    trail_by_id = {t["id"]: t for t in trails_list}

user_by_id = {u["id"]: u for u in users}

# Identify 22 pairs
pairs = {}
for u in users:
    twin_id = u["twin_pair_id"]
    if twin_id not in pairs:
        pairs[twin_id] = {}
    if u["medical"] == "N":
        pairs[twin_id]["healthy"] = u["id"]
    else:
        pairs[twin_id]["medical"] = u["id"]

# Beginner or Medical users:
# Beginner = actual_experience == 'E1' or stated_experience == 'E1'
# Medical = medicalProfile.hasCondition == True
def is_beginner_or_med(u):
    is_med = bool(u.get("medicalProfile", {}).get("hasCondition", False)) or u.get("medical") == "M"
    is_beg = u.get("actual_experience") == "E1" or u.get("stated_experience") == "E1"
    return is_beg or is_med

vulnerable_uids = [u["id"] for u in users if is_beginner_or_med(u)]
print(f"Total users: {len(users)}, Total pairs: {len(pairs)}, Vulnerable (Beginner or Med) users: {len(vulnerable_uids)}")

def evaluate_recs_for_config_alpha(cbf, cf, alpha_val):
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
    
    # Rule 1: Easy slots (top 3) for beginner and medical users: all 3 must be 3/9 or easier (lasco <= 3).
    # If fewer than 3 in easy list, check all available in easy list, or if dual-anchor top 3 easy.
    rule1_broken_users = []
    
    # Rule 2: Difficult slots (top 2) for beginner and medical users: neither may be the 6/9 trail (lasco >= 6). Everything up to 4/9 is allowed.
    rule2_broken_users = []
    
    # Rule 3: Medical vs. identical healthy copy: the medical user's average gain must be at least 20% lower.
    rule3_failed_pairs = []
    pair_downshifts = []
    
    user_avg_gains = {}
    
    for uid, u in user_by_id.items():
        urec = recs.get(uid, {})
        easy_items = urec.get("easy", [])
        diff_items = urec.get("difficult", [])
        
        # Calculate user average recommended gain across all top recommendations (easy + diff, or top 5 dual-anchor)
        # Standard dual-anchor top 5:
        top5_items = easy_items[:3] + diff_items[:max(0, 5 - len(easy_items[:3]))]
        if len(top5_items) < 5:
            top5_items += [x for x in diff_items if x not in top5_items][:5 - len(top5_items)]
            
        gains = [trail_by_id[item["id"]]["difficulty"]["gain"] for item in top5_items if item["id"] in trail_by_id]
        user_avg_gains[uid] = float(np.mean(gains)) if gains else 0.0
        
        if uid in vulnerable_uids:
            # Check Rule 1: Top 3 easy slots must be <= 3/9
            # Easy slots are easy_items[:3]
            easy_slots = easy_items[:3]
            r1_bad = False
            for item in easy_slots:
                tid = item["id"]
                rating = trail_by_id[tid]["difficulty"].get("lascoRating", 0)
                if rating > 3:
                    r1_bad = True
                    break
            if r1_bad:
                rule1_broken_users.append(uid)
                
            # Check Rule 2: Top 2 difficult slots cannot be 6/9 (must be <= 4/9)
            diff_slots = diff_items[:2]
            r2_bad = False
            for item in diff_slots:
                tid = item["id"]
                rating = trail_by_id[tid]["difficulty"].get("lascoRating", 0)
                if rating >= 6:
                    r2_bad = True
                    break
            if r2_bad:
                rule2_broken_users.append(uid)

    # Check Rule 3 across 22 pairs
    for p_id, p_info in sorted(pairs.items()):
        h_uid = p_info["healthy"]
        m_uid = p_info["medical"]
        h_gain = user_avg_gains[h_uid]
        m_gain = user_avg_gains[m_uid]
        
        # Downshift = (h_gain - m_gain) / h_gain
        if h_gain > 0:
            downshift = (h_gain - m_gain) / h_gain
        else:
            downshift = 0.0 if m_gain > 0 else 1.0  # both 0 means 100% compliant
            
        pair_downshifts.append(downshift)
        if downshift < 0.20:
            rule3_failed_pairs.append((p_id, h_uid, m_uid, h_gain, m_gain, downshift))

    all_broken_users = set(rule1_broken_users) | set(rule2_broken_users)
    
    return {
        "rule1_broken": len(rule1_broken_users),
        "rule1_broken_users": rule1_broken_users,
        "rule2_broken": len(rule2_broken_users),
        "rule2_broken_users": rule2_broken_users,
        "rule3_failed": len(rule3_failed_pairs),
        "rule3_failed_pairs": rule3_failed_pairs,
        "mean_downshift": float(np.mean(pair_downshifts)),
        "any_rule_broken_users": len(all_broken_users),
        "total_vulnerable": len(vulnerable_uids),
        "total_pairs": len(pairs),
        "total_users": len(users)
    }

# Run all configs and alphas
full_results = {}
for cfg_label, cbf, cf in CONFIGURATIONS:
    full_results[cfg_label] = {}
    for alpha_val, alpha_label in ALPHAS:
        full_results[cfg_label][alpha_val] = evaluate_recs_for_config_alpha(cbf, cf, alpha_val)

with open(os.path.join(ROOT, "scripts", "simulation", "output", "mirrored_pillar_2_results.json"), "w", encoding="utf-8") as f:
    json.dump(full_results, f, indent=2)

print("[OK] Finished simulation for all 9 configurations and 4 alphas.")
