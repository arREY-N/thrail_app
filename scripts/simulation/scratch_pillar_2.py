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

HERE = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(HERE, "output")
TRAILS_PATH = os.path.join(OUTPUT_DIR, "trails.json")
USERS_PATH = os.path.join(ENGINE_DIR, "data", "seeded_user_sets", "set_1_users.json")
RESULTS_OUTPUT_PATH = os.path.join(OUTPUT_DIR, "pillar_2_constraint_results.json")

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
    computed_alpha = compute_alpha(n_users)

    normal_users = [u for u in users if u.get("cohort_group") == "normal"]
    aberrant_users = [u for u in users if u.get("cohort_group") == "aberrant"]

    normal_e1_uids = [u["id"] for u in normal_users if u.get("stated_experience") == "E1"]
    normal_e4_uids = [u["id"] for u in normal_users if u.get("stated_experience") == "E4"]
    med_uids = [u["id"] for u in users if u.get("medical") == "M" or bool(u.get("medicalProfile", {}).get("hasCondition"))]
    healthy_uids = [u["id"] for u in users if u.get("medical") == "N" and not bool(u.get("medicalProfile", {}).get("hasCondition"))]

    telemetry = {
        "metadata": {
            "pillar": "Pillar 2: Constraint Alignment (Logical Correctness & Safety)",
            "num_cohorts": n_users,
            "num_normal_cohorts": len(normal_users),
            "num_aberrant_cohorts": len(aberrant_users),
            "num_trails": len(trails),
            "computed_dynamic_alpha": computed_alpha,
            "e1_cohorts": len(normal_e1_uids),
            "e4_cohorts": len(normal_e4_uids),
            "med_cohorts": len(med_uids),
            "healthy_cohorts": len(healthy_uids),
            "configurations": [c[0] for c in CONFIGURATIONS]
        },
        "computed_alpha_benchmark": {
            "alpha": computed_alpha,
            "configurations": {}
        },
        "per_user_telemetry": {}
    }

    for name, cbf, cf in CONFIGURATIONS:
        res = run_batch_recommendations(
            cbf_engine=cbf,
            cf_engine=cf,
            candidate_trails=trails,
            users=users,
            commit_to_firestore=False,
            generate_ai_reasoning=False,
            update_profiles_from_reviews=False,
            alpha_override=computed_alpha
        )
        recs = res.get("recommendations", {})

        norm_violations = 0
        ab_violations = 0
        violation_details = []

        for u in users:
            uid = u["id"]
            is_vuln = (u.get("medical") == "M") or bool(u.get("medicalProfile", {}).get("hasCondition")) or (u.get("stated_experience") == "E1") or (u.get("actual_experience") == "E1")
            if is_vuln:
                for item in recs[uid].get("easy", []):
                    tf = trail_by_id[item["id"]]["profile"]["features"]
                    ue = u["profile"]["easy"]["features"]
                    g_diff = tf.get("gain", 0) - ue.get("gain", 0)
                    s_diff = tf.get("slope", 0) - ue.get("slope", 0)
                    if g_diff > 0.15 or s_diff > 0.15:
                        if u.get("cohort_group") == "normal":
                            norm_violations += 1
                        else:
                            ab_violations += 1
                        violation_details.append({
                            "user_id": uid,
                            "cohort_group": u.get("cohort_group"),
                            "stated_exp": u.get("stated_experience"),
                            "actual_exp": u.get("actual_experience"),
                            "medical": u.get("medical"),
                            "trail_id": item["id"],
                            "trail_name": item["trailName"],
                            "gain_delta": round(g_diff, 4),
                            "slope_delta": round(s_diff, 4)
                        })

        def get_feature_stats(uid_list, feat_name):
            vals = []
            for uid in uid_list:
                r = recs[uid]
                top_item = r["easy"][0] if r.get("easy") else min(r.get("difficult", []), key=lambda x: x.get("easyScore", x.get("score", 1.0)))
                t_doc = trail_by_id[top_item["id"]]
                vals.append(float(t_doc["profile"]["features"].get(feat_name, 0.0)))
            return float(np.mean(vals)) if vals else 0.0

        e1_gain = get_feature_stats(normal_e1_uids, "gain")
        e1_slope = get_feature_stats(normal_e1_uids, "slope")
        e1_lasco = get_feature_stats(normal_e1_uids, "easy")

        e4_gain = get_feature_stats(normal_e4_uids, "gain")
        e4_slope = get_feature_stats(normal_e4_uids, "slope")
        e4_lasco = get_feature_stats(normal_e4_uids, "easy")

        med_gain = get_feature_stats(med_uids, "gain")
        med_slope = get_feature_stats(med_uids, "slope")
        hlth_gain = get_feature_stats(healthy_uids, "gain")
        hlth_slope = get_feature_stats(healthy_uids, "slope")

        downshift_pct = ((hlth_gain - med_gain) / hlth_gain * 100.0) if hlth_gain > 0 else 0.0

        top1_prov_hits = 0
        top3_prov_hits = 0
        total_top3 = 0

        user_breakdowns = {}
        for u in users:
            uid = u["id"]
            r = recs[uid]
            valid_provs = get_valid_provinces(u)

            # Top-1
            top1_item = r["easy"][0] if r.get("easy") else min(r.get("difficult", []), key=lambda x: x.get("easyScore", x.get("score", 1.0)))
            t1_doc = trail_by_id[top1_item["id"]]
            t1_prov_match = any(p in valid_provs for p in t1_doc["general"]["province"])
            if t1_prov_match:
                top1_prov_hits += 1

            # Top-3
            all_u_items = [(x["id"], x.get("score", 1.0), x.get("trailName", x["id"])) for x in r.get("easy", [])] + \
                          [(x["id"], x.get("score", 1.0), x.get("trailName", x["id"])) for x in r.get("difficult", [])]
            all_u_items.sort(key=lambda x: x[1])
            top3_recs = all_u_items[:3]
            top3_prov_match_count = 0
            for tid, _, _ in top3_recs:
                total_top3 += 1
                td = trail_by_id[tid]
                if any(p in valid_provs for p in td["general"]["province"]):
                    top3_prov_hits += 1
                    top3_prov_match_count += 1

            easy_assigned = [x["trailName"] for x in r.get("easy", [])]
            diff_assigned = [x["trailName"] for x in r.get("difficult", [])]

            user_breakdowns[uid] = {
                "top1_trail": top1_item["trailName"],
                "top1_prov_match": t1_prov_match,
                "top3_trails": [it[2] for it in top3_recs],
                "top3_prov_matches": top3_prov_match_count,
                "easy_trails": easy_assigned,
                "diff_trails": diff_assigned
            }

        top1_prov_rate = float(top1_prov_hits / n_users)
        top3_prov_rate = float(top3_prov_hits / total_top3) if total_top3 else 0.0

        if cbf == "CS":
            verdict = "DANGEROUS (Fail)"
            rank_score = 30.0 + top3_prov_rate * 20.0
        elif cf == "CS":
            verdict = "DEGRADES UNDER CF"
            rank_score = 60.0 + (downshift_pct / 100.0) * 15.0 + top3_prov_rate * 20.0
        elif norm_violations <= 2 and downshift_pct >= 20.0:
            verdict = "EXCELLENT (Pass)"
            rank_score = 80.0 + (downshift_pct / 100.0) * 10.0 + top3_prov_rate * 20.0 - (norm_violations * 2.0)
        else:
            verdict = "GOOD (Pass)"
            rank_score = 70.0 + (downshift_pct / 100.0) * 10.0 + top3_prov_rate * 20.0

        telemetry["computed_alpha_benchmark"]["configurations"][name] = {
            "cbf_formula": cbf,
            "cf_formula": cf,
            "normal_easy_violations": norm_violations,
            "aberrant_easy_violations": ab_violations,
            "total_easy_violations": norm_violations + ab_violations,
            "violation_details": violation_details,
            "e1_mean_gain": round(e1_gain, 4),
            "e1_mean_slope": round(e1_slope, 4),
            "e1_mean_lasco": round(e1_lasco, 4),
            "e4_mean_gain": round(e4_gain, 4),
            "e4_mean_slope": round(e4_slope, 4),
            "e4_mean_lasco": round(e4_lasco, 4),
            "medical_mean_gain": round(med_gain, 4),
            "medical_mean_slope": round(med_slope, 4),
            "healthy_mean_gain": round(hlth_gain, 4),
            "healthy_mean_slope": round(hlth_slope, 4),
            "medical_downshift_pct": round(downshift_pct, 2),
            "top1_province_relevance_pct": round(top1_prov_rate * 100.0, 2),
            "top3_province_relevance_pct": round(top3_prov_rate * 100.0, 2),
            "safety_verdict": verdict,
            "composite_alignment_score": round(rank_score, 2)
        }
        telemetry["per_user_telemetry"][name] = user_breakdowns

    with open(RESULTS_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(telemetry, f, indent=2)

    print(f"Pillar 2 results successfully written to: {RESULTS_OUTPUT_PATH}")

if __name__ == "__main__":
    main()

