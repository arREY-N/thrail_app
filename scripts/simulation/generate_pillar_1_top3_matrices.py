"""
Pillar 1: Top-3 Recommendations and Inter-User Jaccard Dissimilarity Matrix Generator

Generates:
1. Recommendation tables for all 44 users across all 9 configurations (Top 1, Top 2, Top 3 trails).
2. 44x44 Upper-Triangle User x User Jaccard Dissimilarity Matrix for each configuration.
3. Computes the exact Top-3 Mean for each configuration across all 946 pairs.
4. Outputs the complete report to plans/pillar_1_top3_recommendations_and_dissimilarity_matrix.md.
"""

import os
import sys
import json
import itertools
from typing import Dict, Any, List, Tuple
import numpy as np
from unittest.mock import MagicMock

# Mock firebase_admin modules for offline execution
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
MD_OUTPUT_PATH = os.path.join(ROOT, "plans", "pillar_1_top3_recommendations_and_dissimilarity_matrix.md")

CONFIGURATIONS = [
    ("Configuration 1: Set 1 - Pure Gower", "GD", "GD"),
    ("Configuration 2: Set 2 - Pure Euclidean", "ED", "ED"),
    ("Configuration 3: Set 3 - Pure Cosine", "CS", "CS"),
    ("Configuration 4: Set 4 - GD / ED", "GD", "ED"),
    ("Configuration 5: Set 5 - GD / CS", "GD", "CS"),
    ("Configuration 6: Set 6 - ED / GD", "ED", "GD"),
    ("Configuration 7: Set 7 - ED / CS", "ED", "CS"),
    ("Configuration 8: Set 8 - CS / GD", "CS", "GD"),
    ("Configuration 9: Set 9 - CS / ED", "CS", "ED"),
]


def extract_top3(recs_doc: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    """Extracts top 3 items by overall R_tu proximity score across both anchors."""
    all_items = []
    for x in recs_doc.get("easy", []):
        all_items.append((x["id"], x.get("score", 1.0), x.get("trailName", x["id"])))
    for x in recs_doc.get("difficult", []):
        all_items.append((x["id"], x.get("score", 1.0), x.get("trailName", x["id"])))
    all_items.sort(key=lambda it: it[1])
    top3 = all_items[:3]
    return [it[0] for it in top3], [it[2] for it in top3]


def jaccard_dissimilarity(s1: set, s2: set) -> float:
    inter = len(s1 & s2)
    union = len(s1 | s2)
    return float(1.0 - (inter / union)) if union > 0 else 0.0


def main():
    with open(TRAILS_PATH, "r", encoding="utf-8") as f:
        trails = json.load(f)
    with open(USERS_PATH, "r", encoding="utf-8") as f:
        users = json.load(f)

    n_users = len(users)
    alpha = compute_alpha(n_users)
    print(f"Generating Top-3 matrices for {n_users} users and {len(trails)} trails (alpha={alpha:.10f})...")

    # Mapping user indices 1..44
    user_lookup = {i + 1: u for i, u in enumerate(users)}
    uids = [u["id"] for u in users]
    pairs = list(itertools.combinations(range(1, n_users + 1), 2))

    summary_rows = []
    config_sections = []

    for cfg_idx, (cfg_name, cbf, cf) in enumerate(CONFIGURATIONS, start=1):
        print(f"Running {cfg_name} ({cbf}/{cf})...")
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

        top3_ids = {}
        top3_names = {}
        for idx in range(1, n_users + 1):
            uid = user_lookup[idx]["id"]
            t_ids, t_names = extract_top3(recs[uid])
            top3_ids[idx] = set(t_ids)
            top3_names[idx] = t_names

        # Compute pairwise dissimilarities
        pair_dissims = {}
        dissim_values = []
        for i, j in pairs:
            d = jaccard_dissimilarity(top3_ids[i], top3_ids[j])
            pair_dissims[(i, j)] = d
            dissim_values.append(d)

        mean_top3 = float(np.mean(dissim_values))
        summary_rows.append((cfg_idx, cfg_name, cbf, cf, mean_top3))

        # Build Markdown content for this configuration
        sec = []
        sec.append(f"## {cfg_name}")
        sec.append(f"**CBF Formula:** `{cbf}` | **CF Formula:** `{cf}` | **Dynamic Alpha:** `{alpha:.6f}`")
        sec.append(f"**Configuration Top-3 Mean Jaccard Dissimilarity:** **`{mean_top3:.6f}`** ({mean_top3 * 100:.2f}%)\n")

        # 1. Recommendation List Table
        sec.append("### Top-3 Recommendation List")
        sec.append("| user | top 1 | top 2 | top 3 |")
        sec.append("| :---: | :--- | :--- | :--- |")
        for idx in range(1, n_users + 1):
            u_info = user_lookup[idx]
            cohort_tag = u_info.get("cohort_id", u_info["id"])
            t1 = top3_names[idx][0] if len(top3_names[idx]) > 0 else "-"
            t2 = top3_names[idx][1] if len(top3_names[idx]) > 1 else "-"
            t3 = top3_names[idx][2] if len(top3_names[idx]) > 2 else "-"
            sec.append(f"| {idx} (`{cohort_tag}`) | {t1} | {t2} | {t3} |")
        sec.append("")

        # 2. User x User Matrix Table
        sec.append("### User × User Jaccard Dissimilarity Matrix (Upper Triangle)")
        sec.append("> *Bottom triangle removed; diagonal set to 0.00 since self-recommendations are identical.*")
        sec.append("> *Dissimilarity values: `0.00` (identical), `0.50` (2 overlapping), `0.80` (1 overlapping), `1.00` (0 overlapping).*")
        sec.append("")

        header_cols = ["user"] + [f"U{j}" for j in range(1, n_users + 1)]
        sec.append("| " + " | ".join(header_cols) + " |")
        sec.append("| " + " | ".join([":---:"] * len(header_cols)) + " |")

        for i in range(1, n_users + 1):
            row = [f"**U{i}**"]
            for j in range(1, n_users + 1):
                if i == j:
                    row.append("0.00")
                elif i > j:
                    row.append("-")
                else:
                    d_val = pair_dissims.get((i, j), 0.0)
                    row.append(f"{d_val:.2f}")
            sec.append("| " + " | ".join(row) + " |")
        sec.append("")

        config_sections.append("\n".join(sec))

    # Build Full Document
    doc = []
    doc.append("# THARESYS Pillar 1: Top-3 Recommendations & Inter-User Jaccard Dissimilarity Matrices")
    doc.append("")
    doc.append("**Evaluation Parameters:**")
    doc.append(f"- **Total Cohorts Evaluated:** 44 ({n_users} users, 24 Normal Baselines + 20 Aberrant Mismatches)")
    doc.append(f"- **Candidate Catalog:** 8 Real Production Trails ([`trails.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/output/trails.json))")
    doc.append(f"- **Operational Dynamic Alpha:** `alpha_{44} = 0.5612244898`")
    doc.append(f"- **Total Upper-Triangle Pairwise Intersections per Configuration:** $\\binom{{44}}{{2}} = \\mathbf{{946}}$ pairs")
    doc.append("")
    doc.append("---")
    doc.append("")
    doc.append("## Top-3 Mean Variety Summary Leaderboard")
    doc.append("")
    doc.append("| Configuration | CBF | CF | Top-3 Mean Dissimilarity | Personalization Rank |")
    doc.append("| :--- | :---: | :---: | :---: | :---: |")
    
    # Sort summary by Top-3 mean descending
    sorted_summary = sorted(summary_rows, key=lambda x: x[4], reverse=True)
    for rank, (cfg_idx, name, cbf, cf, m) in enumerate(sorted_summary, start=1):
        doc.append(f"| **{name}** | `{cbf}` | `{cf}` | **`{m:.6f}`** ({m*100:.2f}%) | **#{rank}** |")
    
    doc.append("")
    doc.append("---")
    doc.append("")
    doc.append("## Cohort Index Legend (Users 1 to 44)")
    doc.append("")
    doc.append("| User # | User ID | Cohort Group | Stated Tier | Actual Tier | Medical Condition | Preferred Province(s) |")
    doc.append("| :---: | :--- | :---: | :---: | :---: | :---: | :--- |")
    for idx in range(1, n_users + 1):
        u = user_lookup[idx]
        uid = u["id"]
        group = u.get("cohort_group", "normal")
        st = u.get("stated_experience", u.get("experience", "-"))
        at = u.get("actual_experience", u.get("experience", "-"))
        med = "Yes (M)" if u.get("medical") == "M" else "None (N)"
        prov = ", ".join(u.get("preferences", {}).get("province", []))
        doc.append(f"| **U{idx}** | `{uid}` | `{group}` | `{st}` | `{at}` | {med} | {prov} |")
    
    doc.append("")
    doc.append("---")
    doc.append("")

    # Append all configuration details
    doc.extend(config_sections)

    full_text = "\n".join(doc)
    with open(MD_OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(full_text)

    print(f"\n[OK] Complete markdown report saved to: {MD_OUTPUT_PATH}")


if __name__ == "__main__":
    main()

