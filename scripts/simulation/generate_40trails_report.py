import os
import json

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RESULTS_JSON_PATH = os.path.join(ROOT, "scripts", "simulation", "output", "mirrored_pillar_2_40trails_results.json")
OUTPUT_MD_PATH = os.path.join(ROOT, "plans", "pillar_2_40trails_mirrored_evaluation_results.md")

with open(RESULTS_JSON_PATH, "r", encoding="utf-8") as f:
    results = json.load(f)

alphas = [
    ("1.0000", "α=1.0000"),
    ("0.7500", "α=0.7500"),
    ("0.5612", "α=0.5612"),
    ("0.5000", "α=0.5000"),
]

md_lines = []
md_lines.append("# Pillar 2: Safety & Constraint Verification on 40 Trails (32 Synthetic + 8 Real)")
md_lines.append("")
md_lines.append("**Dataset:** 44 Mirrored Cohorts ([`set_1_users_mirrored.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets/set_1_users_mirrored.json))  ")
md_lines.append("**Catalog:** 40 Trails combined ([`catalog_seed42.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/trail_simulation/inputs/catalog_seed42.json))  ")
md_lines.append("**Raw Output Telemetry:** [`mirrored_pillar_2_40trails_raw_recs.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/output/mirrored_pillar_2_40trails_raw_recs.json)  ")
md_lines.append("**Date:** November 5, 2026  ")
md_lines.append("")
md_lines.append("> Differences between configs on 8 trails often come down to one trail swap, so don’t claim one config is better unless the counts clearly differ. With 40 trails, separation between engines becomes substantially more pronounced.")
md_lines.append("")
md_lines.append("---")
md_lines.append("")

for idx, (cfg_name, cfg_data) in enumerate(results.items(), 1):
    md_lines.append(f"### Configuration {idx}: {cfg_name}")
    for a_key, a_label in alphas:
        r = cfg_data[a_key]
        md_lines.append(f"{a_label}")
        md_lines.append(f"Hardest-Trail Count (6/9 in Either Bucket): {r['hardest_exact6_count']} of 31")
        md_lines.append(f"Easy-Bucket Check (Contains > 3/9): {r['easy_bucket_failed_count']} of 31")
        md_lines.append(f"Empty-Bucket Rate: {r['empty_easy_count']} of 44")
        md_lines.append(f"Medical vs. Twin (Lower Gain - Easy Bucket): {r['med_lower_easy']} of 22")
        md_lines.append(f"Medical vs. Twin (Lower Gain - Top 5 Slots): {r['med_lower_top5']} of 22")
        md_lines.append(f"Medical vs. Twin (Lower Gain - All Received): {r['med_lower_all']} of 22")
        md_lines.append("")

with open(OUTPUT_MD_PATH, "w", encoding="utf-8") as f:
    f.write("\n".join(md_lines))

print(f"[OK] Report saved to: {OUTPUT_MD_PATH}")

