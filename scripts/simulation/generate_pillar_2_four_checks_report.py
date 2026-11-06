import os
import sys
import json
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RAW_RECS_PATH = os.path.join(ROOT, "scripts", "simulation", "output", "mirrored_pillar_2_raw_recommendations.json")
TRAILS_PATH = os.path.join(ROOT, "scripts", "simulation", "output", "trails.json")
USERS_PATH = os.path.join(ROOT, "engine", "data", "seeded_user_sets", "set_1_users_mirrored.json")
OUTPUT_MD_PATH = os.path.join(ROOT, "plans", "pillar_2_mirrored_evaluation_results.md")
OUTPUT_JSON_PATH = os.path.join(ROOT, "scripts", "simulation", "output", "mirrored_pillar_2_four_checks.json")

with open(RAW_RECS_PATH, "r", encoding="utf-8") as f:
    raw = json.load(f)

with open(TRAILS_PATH, "r", encoding="utf-8") as f:
    trails = {t["id"]: t for t in json.load(f)}

with open(USERS_PATH, "r", encoding="utf-8") as f:
    users = json.load(f)

user_map = {u["id"]: u for u in users}

def is_protected(u):
    is_med = bool(u.get("medicalProfile", {}).get("hasCondition", False)) or u.get("medical") == "M"
    is_beg = u.get("actual_experience") == "E1" or u.get("stated_experience") == "E1"
    return is_beg or is_med

protected_uids = [u["id"] for u in users if is_protected(u)]
total_protected = len(protected_uids)  # 31
total_users = len(users)  # 44

pairs = {}
for u in users:
    twin_id = u["twin_pair_id"]
    if twin_id not in pairs:
        pairs[twin_id] = {}
    if u["medical"] == "N":
        pairs[twin_id]["healthy"] = u["id"]
    else:
        pairs[twin_id]["medical"] = u["id"]

total_pairs = len(pairs)  # 22

configs = raw["configurations"]
alphas = [
    ("1.0000", "α=1.0000"),
    ("0.7500", "α=0.7500"),
    ("0.5612", "α=0.5612"),
    ("0.5000", "α=0.5000"),
]

mak_id = "7aTSWWzmcnhS1Q4nfCog"

results_json = {}
md_lines = []

md_lines.append("# Pillar 2: Safety & Constraint Verification on Mirrored Cohorts")
md_lines.append("")
md_lines.append("**Dataset:** 44 Mirrored Cohorts ([`set_1_users_mirrored.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets/set_1_users_mirrored.json))  ")
md_lines.append("**Catalog:** 8 Production Trails ([`trails.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/output/trails.json))  ")
md_lines.append("**Raw Recommendations Source:** [`mirrored_pillar_2_raw_recommendations.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/output/mirrored_pillar_2_raw_recommendations.json)  ")
md_lines.append("**Date:** November 5, 2026  ")
md_lines.append("")
md_lines.append("> **Limitation:** Differences between configs on 8 trails often come down to one trail swap, so don’t claim one config is better unless the counts clearly differ.")
md_lines.append("")
md_lines.append("---")
md_lines.append("")
md_lines.append("## Evaluation Protocol & Measures")
md_lines.append(f"1. **Hardest-Trail Count:** Count protected users ({total_protected} beginner and medical cohorts) who receive the 6/9 trail (*Mt. Makiling Traverse*) in either bucket's top recommended slots (`easy[:3]` or `diff[:2]`).")
md_lines.append("2. **Easy-Bucket Check:** Count protected users whose Easy bucket contains any trail above 3/9. An empty Easy bucket passes this check, because it is safe even if it is unhelpful.")
md_lines.append(f"3. **Empty-Bucket Rate:** Count users whose Easy bucket is empty, per config (out of {total_users} total users).")
md_lines.append(f"4. **Medical vs. Twin (Top-5):** For each of the {total_pairs} identical twin pairs, count how many medical users received an average elevation gain lower than their healthy twin across their Top-5 recommended trails.")
md_lines.append("")
md_lines.append("---")
md_lines.append("")

for cfg_name, cfg_data in configs.items():
    md_lines.append(f"### {cfg_name}")
    results_json[cfg_name] = {}
    
    for a_key, a_label in alphas:
        a_data = cfg_data[a_key]
        
        # 1. Hardest trail
        hardest_count = 0
        for uid in protected_uids:
            u_rec = a_data[uid]
            top_slots = u_rec.get("easy", [])[:3] + u_rec.get("difficult", [])[:2]
            if any(x["id"] == mak_id for x in top_slots):
                hardest_count += 1
                
        # 2. Easy bucket > 3/9
        easy_fail_count = 0
        for uid in protected_uids:
            u_rec = a_data[uid]
            easy_b = u_rec.get("easy", [])
            if len(easy_b) > 0:
                if any(trails[x["id"]]["difficulty"]["lascoRating"] > 3 for x in easy_b):
                    easy_fail_count += 1
                    
        # 3. Empty easy bucket
        empty_easy_count = sum(1 for u in users if len(a_data[u["id"]].get("easy", [])) == 0)
        
        # 4. Medical vs twin
        med_lower_count = 0
        for p_id, p_info in pairs.items():
            h_top5 = a_data[p_info["healthy"]].get("easy", [])[:3] + a_data[p_info["healthy"]].get("difficult", [])[:2]
            m_top5 = a_data[p_info["medical"]].get("easy", [])[:3] + a_data[p_info["medical"]].get("difficult", [])[:2]
            h_gain = np.mean([trails[x["id"]]["difficulty"]["gain"] for x in h_top5])
            m_gain = np.mean([trails[x["id"]]["difficulty"]["gain"] for x in m_top5])
            if m_gain < h_gain:
                med_lower_count += 1
                
        results_json[cfg_name][a_key] = {
            "hardest_trail_count": hardest_count,
            "easy_bucket_failed": easy_fail_count,
            "empty_easy_bucket_count": empty_easy_count,
            "medical_lower_than_twin_count": med_lower_count,
            "total_protected": total_protected,
            "total_users": total_users,
            "total_pairs": total_pairs
        }
        
        md_lines.append(f"{a_label}")
        md_lines.append(f"Hardest-Trail Count (6/9 in Either Bucket): {hardest_count} of {total_protected}")
        md_lines.append(f"Easy-Bucket Check (Contains > 3/9): {easy_fail_count} of {total_protected}")
        md_lines.append(f"Empty-Bucket Rate: {empty_easy_count} of {total_users}")
        md_lines.append(f"Medical vs. Twin (Lower Gain): {med_lower_count} of {total_pairs}")
        md_lines.append("")

with open(OUTPUT_MD_PATH, "w", encoding="utf-8") as f:
    f.write("\n".join(md_lines))

with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(results_json, f, indent=2)

print(f"[OK] Markdown report saved to: {OUTPUT_MD_PATH}")
print(f"[OK] JSON summary saved to: {OUTPUT_JSON_PATH}")

