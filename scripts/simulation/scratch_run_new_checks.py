import json
import numpy as np

with open("scripts/simulation/output/mirrored_pillar_2_raw_recommendations.json") as f:
    raw = json.load(f)

with open("scripts/simulation/output/trails.json") as f:
    trails = {t["id"]: t for t in json.load(f)}

with open("engine/data/seeded_user_sets/set_1_users_mirrored.json") as f:
    users = json.load(f)

user_map = {u["id"]: u for u in users}

def is_protected(u):
    is_med = bool(u.get("medicalProfile", {}).get("hasCondition", False)) or u.get("medical") == "M"
    is_beg = u.get("actual_experience") == "E1" or u.get("stated_experience") == "E1"
    return is_beg or is_med

protected_uids = [u["id"] for u in users if is_protected(u)]

pairs = {}
for u in users:
    twin_id = u["twin_pair_id"]
    if twin_id not in pairs:
        pairs[twin_id] = {}
    if u["medical"] == "N":
        pairs[twin_id]["healthy"] = u["id"]
    else:
        pairs[twin_id]["medical"] = u["id"]

configs = raw["configurations"]
alphas = ["1.0000", "0.7500", "0.5612", "0.5000"]

mak_id = "7aTSWWzmcnhS1Q4nfCog"

print(f"{'Config':<20} | {'Alpha':<7} | {'Hardest (6/9)':<14} | {'Easy > 3/9':<12} | {'Empty Easy':<11} | {'Med < Twin (Top5)':<18} | {'Med < Twin (All)':<18}")
print("-" * 115)

for cfg_name, cfg_data in configs.items():
    for a in alphas:
        a_data = cfg_data[a]
        
        # 1. Hardest-trail count: protected users receiving 6/9 in either bucket (in top slots easy[:3] or diff[:2])
        hardest_count = 0
        for uid in protected_uids:
            u_rec = a_data[uid]
            top_slots = u_rec.get("easy", [])[:3] + u_rec.get("difficult", [])[:2]
            if any(x["id"] == mak_id for x in top_slots):
                hardest_count += 1
                
        # 2. Easy-bucket check: count protected users whose Easy bucket contains any trail > 3/9. Empty bucket passes (0 > 3/9).
        easy_fail_count = 0
        for uid in protected_uids:
            u_rec = a_data[uid]
            easy_b = u_rec.get("easy", [])
            # If empty -> passes (safe)
            if len(easy_b) > 0:
                if any(trails[x["id"]]["difficulty"]["lascoRating"] > 3 for x in easy_b):
                    easy_fail_count += 1
                    
        # 3. Empty-bucket rate: count users whose Easy bucket is empty, per config (out of 44, or out of 31 protected)
        empty_easy_all = sum(1 for u in users if len(a_data[u["id"]].get("easy", [])) == 0)
        empty_easy_prot = sum(1 for uid in protected_uids if len(a_data[uid].get("easy", [])) == 0)
        
        # 4. Medical vs. twin: For each of the 22 pairs, check whether medical user's avg gain < healthy twin's
        med_lower_top5 = 0
        med_lower_all = 0
        for p_id, p_info in pairs.items():
            h_rec = a_data[p_info["healthy"]]
            m_rec = a_data[p_info["medical"]]
            
            # Top 5
            h_top5 = h_rec.get("easy", [])[:3] + h_rec.get("difficult", [])[:2]
            m_top5 = m_rec.get("easy", [])[:3] + m_rec.get("difficult", [])[:2]
            h_gain_top5 = np.mean([trails[x["id"]]["difficulty"]["gain"] for x in h_top5])
            m_gain_top5 = np.mean([trails[x["id"]]["difficulty"]["gain"] for x in m_top5])
            if m_gain_top5 < h_gain_top5:
                med_lower_top5 += 1
                
            # All received
            h_all = h_rec.get("easy", []) + h_rec.get("difficult", [])
            m_all = m_rec.get("easy", []) + m_rec.get("difficult", [])
            h_gain_all = np.mean([trails[x["id"]]["difficulty"]["gain"] for x in h_all])
            m_gain_all = np.mean([trails[x["id"]]["difficulty"]["gain"] for x in m_all])
            if m_gain_all < h_gain_all:
                med_lower_all += 1
                
        print(f"{cfg_name[:20]:<20} | {a:<7} | {hardest_count:<14} | {easy_fail_count:<12} | {empty_easy_all:<11} | {med_lower_top5:<18} | {med_lower_all:<18}")
