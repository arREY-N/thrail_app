"""
Pillar 2: Raw Recommendation List Generator

Generates:
1. Full raw recommendations across all 9 configurations under the computed dynamic alpha (alpha = 0.5612244898).
2. JSON export to scripts/simulation/output/pillar_2_raw_recommendations.json.
3. Comprehensive markdown document to plans/pillar_2_raw_recommendation_list.md with full tables per configuration.
"""

import os
import sys
import json
from typing import Dict, Any, List, Set, Tuple
import numpy as np
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
USERS_PATH = os.path.join(ENGINE_DIR, "data", "seeded_user_sets", "set_1_users.json")
RAW_JSON_PATH = os.path.join(ROOT, "scripts", "simulation", "output", "pillar_2_raw_recommendations.json")
MD_OUTPUT_PATH = os.path.join(ROOT, "plans", "pillar_2_raw_recommendation_list.md")

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


def get_valid_provinces(user: Dict[str, Any]) -> Set[str]:
    pref_provinces = user.get("preferences", {}).get("province", [])
    valid_set = set()
    for p in pref_provinces:
        if p == "Cavite":
            valid_set.update(["Cavite", "Batangas", "Laguna", "Rizal"])
        elif p in ["Batangas", "Laguna"]:
            valid_set.update(["Batangas", "Laguna"])
        else:
            valid_set.add(p)
    return valid_set if valid_set else {"Rizal"}


def main():
    with open(TRAILS_PATH, "r", encoding="utf-8") as f:
        trails = json.load(f)
    with open(USERS_PATH, "r", encoding="utf-8") as f:
        users = json.load(f)

    trail_by_id = {t["id"]: t for t in trails}
    n_users = len(users)
    alpha = compute_alpha(n_users)

    print(f"Generating raw recommendation lists for {n_users} users across {len(CONFIGURATIONS)} configurations...")
    print(f"Dynamic Alpha: {alpha:.10f}\n")

    raw_data: Dict[str, Any] = {
        "metadata": {
            "title": "THARESYS Pillar 2: Raw Recommendation Lists",
            "num_users": n_users,
            "num_trails": len(trails),
            "dynamic_alpha": alpha,
            "configurations": [c[0] for c in CONFIGURATIONS]
        },
        "configurations": {}
    }

    # Markdown document content
    md = []
    md.append("# THARESYS Pillar 2: Raw Recommendation Lists & Constraint Verification")
    md.append("")
    md.append(f"**Document Version:** 2.1 (Full 44 User Cohorts & 8 Real Production Trails)  ")
    md.append(f"**Computed Dynamic Alpha:** `alpha_44 = {alpha:.10f}`  ")
    md.append(f"**Raw Data JSON Export:** [`scripts/simulation/output/pillar_2_raw_recommendations.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/output/pillar_2_raw_recommendations.json)  ")
    md.append(f"**Catalog Dataset:** 8 Original Production Trails ([`trails.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/output/trails.json))  ")
    md.append(f"**Cohort Dataset:** 44 Calibrated Profiles ([`set_1_users.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets/set_1_users.json))  ")
    md.append(f"**Date:** November 5, 2026  ")
    md.append("")
    md.append("---")
    md.append("")
    md.append("## 1. Candidate Trails Reference (8 Production Trails)")
    md.append("")
    md.append("| # | Trail Name | Province | Lasco Rating | Elevation Gain (m) | Slope Gradient | Norm Gain | Norm Slope |")
    md.append("| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: |")
    for i, t in enumerate(trails, 1):
        g = t.get("general", {})
        d = t.get("difficulty", {})
        f = t.get("profile", {}).get("features", {})
        prov_str = ", ".join(g.get("province", []))
        md.append(f"| **T{i}** | **{g.get('name')}** | {prov_str} | {d.get('lascoRating')}/9 | {d.get('gain')} m | {d.get('slope')}% | {f.get('gain', 0):.4f} | {f.get('slope', 0):.4f} |")
    md.append("")
    md.append("---")
    md.append("")
    md.append("## 2. Cohort Index Reference (44 Users)")
    md.append("")
    md.append("| # | User ID | Group | Stated Tier | Actual Tier | Med Condition | Preferred Province(s) |")
    md.append("| :---: | :--- | :---: | :---: | :---: | :---: | :--- |")
    for i, u in enumerate(users, 1):
        p_str = ", ".join(u.get("preferences", {}).get("province", []))
        med_str = "Yes (M)" if u.get("medical") == "M" or bool(u.get("medicalProfile", {}).get("hasCondition")) else "No (N)"
        md.append(f"| **U{i}** | `{u['id']}` | `{u.get('cohort_group')}` | `{u.get('stated_experience')}` | `{u.get('actual_experience')}` | {med_str} | {p_str} |")
    md.append("")
    md.append("---")
    md.append("")
    md.append("## 3. Raw Recommendations by Configuration")
    md.append("")

    for cfg_idx, (name, cbf, cf) in enumerate(CONFIGURATIONS, 1):
        print(f"Processing {name} (CBF={cbf}, CF={cf})...")
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
        raw_data["configurations"][name] = {
            "cbf": cbf,
            "cf": cf,
            "recommendations": recs
        }

        md.append(f"### 3.{cfg_idx}. {name}")
        md.append(f"- **CBF Engine:** `{cbf}` | **CF Engine:** `{cf}` | **Dynamic Alpha:** `{alpha:.6f}`")
        md.append("")
        md.append("| # | User ID | Stated / Med | Easy Slot Trail | Easy $R_{tu}$ | Difficult Slot (Top 2) | Top 3 Overall ($R_{tu}$ Rank) | Prov Match (Top 1 / Top 3) | Physical Margin Status |")
        md.append("| :---: | :--- | :---: | :--- | :---: | :--- | :--- | :---: | :---: |")

        for u_idx, u in enumerate(users, 1):
            uid = u["id"]
            u_rec = recs.get(uid, {})
            valid_provs = get_valid_provinces(u)

            # Easy slot
            easy_items = u_rec.get("easy", [])
            if easy_items:
                easy_str = f"{easy_items[0]['trailName']}"
                easy_score_str = f"{easy_items[0].get('score', 0):.4f}"
            else:
                easy_str = "None"
                easy_score_str = "N/A"

            # Difficult slot top 2
            diff_items = u_rec.get("difficult", [])
            diff_top2 = [f"{it['trailName']} ({it.get('score', 0):.4f})" for it in diff_items[:2]]
            diff_str = "<br>".join(diff_top2) if diff_top2 else "None"

            # Top 3 overall
            all_u_items = [(x["id"], x.get("score", 1.0), x.get("trailName", x["id"])) for x in easy_items] + \
                          [(x["id"], x.get("score", 1.0), x.get("trailName", x["id"])) for x in diff_items]
            all_u_items.sort(key=lambda it: it[1])
            top3 = all_u_items[:3]
            top3_str = "<br>".join([f"**{i+1}.** {it[2]} (`{it[1]:.4f}`)" for i, it in enumerate(top3)])

            # Province match
            top1_item = easy_items[0] if easy_items else (diff_items[0] if diff_items else None)
            t1_match = False
            if top1_item:
                td = trail_by_id[top1_item["id"]]
                t1_match = any(p in valid_provs for p in td["general"]["province"])
            
            top3_match_cnt = 0
            for tid, _, _ in top3:
                td = trail_by_id[tid]
                if any(p in valid_provs for p in td["general"]["province"]):
                    top3_match_cnt += 1
            prov_match_str = f"{'Yes' if t1_match else 'No'} / {top3_match_cnt}/3"

            # Margin violation check
            margin_status = "Safe (Pass)"
            is_vuln = (u.get("medical") == "M") or bool(u.get("medicalProfile", {}).get("hasCondition")) or (u.get("stated_experience") == "E1") or (u.get("actual_experience") == "E1")
            if is_vuln:
                for item in easy_items:
                    tf = trail_by_id[item["id"]]["profile"]["features"]
                    ue = u["profile"]["easy"]["features"]
                    g_diff = tf.get("gain", 0) - ue.get("gain", 0)
                    s_diff = tf.get("slope", 0) - ue.get("slope", 0)
                    if g_diff > 0.15 or s_diff > 0.15:
                        if u.get("cohort_group") == "normal":
                            margin_status = f"Normal Flag ($\Delta_g={g_diff:.2f}$)"
                        else:
                            margin_status = f"Aberrant Flag ($\Delta_g={g_diff:.2f}$)"

            stated_med = f"{u.get('stated_experience')} / {u.get('medical')}"
            md.append(f"| **U{u_idx}** | `{uid}` | {stated_med} | {easy_str} | `{easy_score_str}` | {diff_str} | {top3_str} | {prov_match_str} | {margin_status} |")

        md.append("")
        md.append("---")
        md.append("")

    # Save outputs
    os.makedirs(os.path.dirname(RAW_JSON_PATH), exist_ok=True)
    with open(RAW_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(raw_data, f, indent=2)
    print(f"[OK] Raw JSON saved to: {RAW_JSON_PATH}")

    os.makedirs(os.path.dirname(MD_OUTPUT_PATH), exist_ok=True)
    with open(MD_OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(md))
    print(f"[OK] Raw recommendations markdown saved to: {MD_OUTPUT_PATH}")


if __name__ == "__main__":
    main()

