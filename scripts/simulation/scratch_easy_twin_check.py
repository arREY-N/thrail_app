import json
import numpy as np

with open("scripts/simulation/output/mirrored_pillar_2_raw_recommendations.json") as f:
    raw = json.load(f)

with open("scripts/simulation/output/trails.json") as f:
    trails = {t["id"]: t for t in json.load(f)}

with open("engine/data/seeded_user_sets/set_1_users_mirrored.json") as f:
    users = json.load(f)

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

print(f"{'Configuration':<22} | {'Alpha':<7} | {'Med < Healthy':<14} | {'Med == Healthy':<15} | {'Med > Healthy':<14} | {'Notes'}")
print("-" * 95)

results = {}

for cfg_name, cfg_data in configs.items():
    results[cfg_name] = {}
    for a in alphas:
        a_data = cfg_data[a]
        
        med_lower = 0
        med_equal = 0
        med_higher = 0
        details = []
        
        for p_id in sorted(pairs.keys()):
            h_uid = pairs[p_id]["healthy"]
            m_uid = pairs[p_id]["medical"]
            
            h_easy = a_data[h_uid].get("easy", [])
            m_easy = a_data[m_uid].get("easy", [])
            
            h_gains = [trails[x["id"]]["difficulty"]["gain"] for x in h_easy if x["id"] in trails]
            m_gains = [trails[x["id"]]["difficulty"]["gain"] for x in m_easy if x["id"] in trails]
            
            h_avg = float(np.mean(h_gains)) if h_gains else 0.0
            m_avg = float(np.mean(m_gains)) if m_gains else 0.0
            
            h_trails = [x["trailName"] for x in h_easy]
            m_trails = [x["trailName"] for x in m_easy]
            
            if m_avg < h_avg:
                med_lower += 1
                details.append((p_id, "lower", h_avg, m_avg, h_trails, m_trails))
            elif m_avg == h_avg:
                med_equal += 1
            else:
                med_higher += 1
                details.append((p_id, "higher", h_avg, m_avg, h_trails, m_trails))
                
        results[cfg_name][a] = {
            "med_lower": med_lower,
            "med_equal": med_equal,
            "med_higher": med_higher,
            "total_pairs": len(pairs),
            "details": details
        }
        print(f"{cfg_name[:22]:<22} | {a:<7} | {med_lower} of 22       | {med_equal} of 22        | {med_higher} of 22        |")

