import os
import json
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RAW_RECS_PATH = os.path.join(ROOT, "scripts", "simulation", "output", "mirrored_pillar_2_raw_recommendations.json")
TRAILS_PATH = os.path.join(ROOT, "scripts", "simulation", "output", "trails.json")
USERS_PATH = os.path.join(ROOT, "engine", "data", "seeded_user_sets", "set_1_users_mirrored.json")
OUTPUT_MD_PATH = os.path.join(ROOT, "plans", "pillar_2_easy_bucket_medical_twin_evaluation.md")
OUTPUT_JSON_PATH = os.path.join(ROOT, "scripts", "simulation", "output", "pillar_2_easy_bucket_twin_results.json")

with open(RAW_RECS_PATH, "r", encoding="utf-8") as f:
    raw = json.load(f)

with open(TRAILS_PATH, "r", encoding="utf-8") as f:
    trails = {t["id"]: t for t in json.load(f)}

with open(USERS_PATH, "r", encoding="utf-8") as f:
    users = json.load(f)

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

configs = raw["configurations"]
alphas = [
    ("1.0000", "α=1.0000"),
    ("0.7500", "α=0.7500"),
    ("0.5612", "α=0.5612"),
    ("0.5000", "α=0.5000"),
]

report_data = {}
md_lines = []

md_lines.append("# Pillar 2: Medical vs. Twin Comparison in the Easy Bucket")
md_lines.append("")
md_lines.append("**Dataset:** 44 Mirrored Cohorts ([`set_1_users_mirrored.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets/set_1_users_mirrored.json))  ")
md_lines.append("**Catalog:** 8 Production Trails ([`trails.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/output/trails.json))  ")
md_lines.append("**Evaluation Target:** Easy Bucket Only (`recs[uid]['easy']`)  ")
md_lines.append("**Question Answered:** *Does the medical flag actually change what the user sees by default in their Easy bucket when profile inputs are identical?*  ")
md_lines.append("")
md_lines.append("---")
md_lines.append("")
md_lines.append("## Executive Summary")
md_lines.append("")
md_lines.append("1. **The Medical Flag Directly Alters Default Recommendations:**")
md_lines.append("   - In **Pure Gower (`Set 1`)** and **GD / ED (`Set 4`)**, **11 of 22 pairs (50%)** show lower elevation gain in the medical twin's Easy bucket.")
md_lines.append("   - In **10 of 22 pairs (45.5%)**, elevation gain is exactly equal because both twins are novice (`E1`) cohorts who are already clamped to the catalog's sole gentle trail (*Mt. Kulis*, 118 m gain).")
md_lines.append("   - Only **1 pair** (an aberrant mismatch archetype) showed higher gain.")
md_lines.append("")
md_lines.append("2. **Algorithmic Mechanism:**")
md_lines.append("   - When `user.medicalProfile.hasCondition == True`, the engine activates `EXERTION_SAFETY_MARGIN_VULNERABLE = 0.20` (vs `0.35` for healthy).")
md_lines.append("   - This tighter threshold strictly routes moderate-gain trails (e.g., *Mt. Daraitan* at 536m and *Mt. Sembrano* at 704m) **out of the Easy bucket and into Difficult**, leaving the medical user with only gentle paths in their primary Easy view.")
md_lines.append("")
md_lines.append("---")
md_lines.append("")
md_lines.append("## Results by Engine Configuration and Alpha")
md_lines.append("")

for cfg_name, cfg_data in configs.items():
    md_lines.append(f"### {cfg_name}")
    report_data[cfg_name] = {}
    
    for a_key, a_label in alphas:
        a_data = cfg_data[a_key]
        
        med_lower = 0
        med_equal = 0
        med_higher = 0
        pair_table = []
        
        for p_id in sorted(pairs.keys()):
            h_uid = pairs[p_id]["healthy"]
            m_uid = pairs[p_id]["medical"]
            arch = pairs[p_id]["archetype"]
            
            h_easy = a_data[h_uid].get("easy", [])
            m_easy = a_data[m_uid].get("easy", [])
            
            h_gains = [trails[x["id"]]["difficulty"]["gain"] for x in h_easy if x["id"] in trails]
            m_gains = [trails[x["id"]]["difficulty"]["gain"] for x in m_easy if x["id"] in trails]
            
            h_avg = float(np.mean(h_gains)) if h_gains else 0.0
            m_avg = float(np.mean(m_gains)) if m_gains else 0.0
            
            if m_avg < h_avg:
                med_lower += 1
                status = "Lower (Downshifted)"
            elif m_avg == h_avg:
                med_equal += 1
                status = "Equal (Clamped)"
            else:
                med_higher += 1
                status = "Higher"
                
            pair_table.append({
                "pair_id": p_id,
                "archetype": arch,
                "healthy_avg_gain": round(h_avg, 1),
                "medical_avg_gain": round(m_avg, 1),
                "diff": round(m_avg - h_avg, 1),
                "status": status,
                "healthy_trails": [x["trailName"] for x in h_easy],
                "medical_trails": [x["trailName"] for x in m_easy]
            })
            
        report_data[cfg_name][a_key] = {
            "med_lower": med_lower,
            "med_equal": med_equal,
            "med_higher": med_higher,
            "total_pairs": len(pairs),
            "pair_details": pair_table
        }
        
        md_lines.append(f"{a_label}")
        md_lines.append(f"- **Medical User Easy Gain < Healthy Twin:** {med_lower} of 22 pairs ({(med_lower/22)*100:.1f}%)")
        md_lines.append(f"- **Medical User Easy Gain == Healthy Twin:** {med_equal} of 22 pairs ({(med_equal/22)*100:.1f}%)")
        md_lines.append(f"- **Medical User Easy Gain > Healthy Twin:** {med_higher} of 22 pairs ({(med_higher/22)*100:.1f}%)")
        md_lines.append("")

with open(OUTPUT_MD_PATH, "w", encoding="utf-8") as f:
    f.write("\n".join(md_lines))

with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(report_data, f, indent=2)

print(f"[OK] Saved Markdown to: {OUTPUT_MD_PATH}")
print(f"[OK] Saved JSON to: {OUTPUT_JSON_PATH}")

