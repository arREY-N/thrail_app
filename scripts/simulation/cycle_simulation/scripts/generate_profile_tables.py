import json
import os

ROOT = r"c:\Users\LENOVO\Documents\dev\thrail_app"
OUT_DIR = os.path.join(ROOT, "scripts", "simulation", "output")
SIM_DIR = os.path.join(ROOT, "engine_simulations")

def generate_profile_trajectory_section(results_file, sim_num, total_cycles):
    with open(results_file, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    telemetry = data["arms"]["adaptive"]["user_telemetry"]
    months = data["months"]
    
    md_lines = []
    md_lines.append(f"## 5. Cycle-by-Cycle User Profile Evolution (All 24 Cohorts)\n")
    md_lines.append(f"This section documents the chronological evolution of both the **Easy Anchor** (baseline capability) and **Difficult Anchor** (aspirational limit) across all {len(months)} monthly batches ($T = {total_cycles}$ hiking cycles), along with the hike selections and review feedback that triggered profile adjustments.\n")
    
    # We can group cohorts by Experience Tier for clarity
    tiers = {
        "E1 (Beginner Novice)": ["E1-M-P1", "E1-M-P2", "E1-M-P3", "E1-N-P1", "E1-N-P2", "E1-N-P3"],
        "E2 (Experienced Gentle)": ["E2-M-P1", "E2-M-P2", "E2-M-P3", "E2-N-P1", "E2-N-P2", "E2-N-P3"],
        "E3 (Intermediate Mixed)": ["E3-M-P1", "E3-M-P2", "E3-M-P3", "E3-N-P1", "E3-N-P2", "E3-N-P3"],
        "E4 (Advanced High-Altitude)": ["E4-M-P1", "E4-M-P2", "E4-M-P3", "E4-N-P1", "E4-N-P2", "E4-N-P3"]
    }
    
    for tier_name, uids in tiers.items():
        md_lines.append(f"### 5.{list(tiers.keys()).index(tier_name)+1}. {tier_name}\n")
        
        for uid in uids:
            snaps = telemetry.get(uid, [])
            if not snaps:
                continue
                
            md_lines.append(f"#### Cohort `{uid}` Profile Trajectory\n")
            md_lines.append("| Cycle | Month | Easy Anchor (Len, Slp, Gn, Pk, Easy) | Diff Anchor (Len, Slp, Gn, Pk, Easy) | Mean GD | Hiked Trail & Target Slot | Review & Primary Factor |")
            md_lines.append("| :---: | :---: | :--- | :--- | :---: | :--- | :--- |")
            
            for snap in snaps:
                c = snap["cycle"]
                m = snap["month"]
                ef = snap["profile"]["easy"]["features"]
                df = snap["profile"]["difficult"]["features"]
                
                easy_str = f"L:{ef['length']:.2f}, S:{ef['slope']:.2f}, G:{ef['gain']:.2f}, P:{ef['elevation']:.2f}, E:{ef['easy']:.2f}"
                diff_str = f"L:{df['length']:.2f}, S:{df['slope']:.2f}, G:{df['gain']:.2f}, P:{df['elevation']:.2f}, E:{df['easy']:.2f}"
                
                mean_gd = snap["distances"]["mean_gd"]
                
                hike = snap.get("hiked")
                if hike:
                    rehike_badge = " *(Rehike)*" if hike.get("isRehike") else ""
                    hike_str = f"**{hike['trailName']}** ({hike['targetAnchor'].capitalize()}){rehike_badge}"
                else:
                    hike_str = "*Terminal Evaluation*"
                    
                rev = snap.get("review")
                if rev:
                    rev_str = f"{rev['perceivedDifficulty']} (Factor: {rev['primaryFactorKey']})"
                else:
                    rev_str = "*None*"
                    
                md_lines.append(f"| {c} | {m} | `{easy_str}` | `{diff_str}` | {mean_gd:.4f} | {hike_str} | {rev_str} |")
                
            md_lines.append("") # blank line between cohorts
            
    return "\n".join(md_lines)

def update_simulation_doc(sim_file, section_content):
    with open(sim_file, "r", encoding="utf-8") as f:
        text = f.read()
        
    # Check if section 5 already exists
    if "## 5. Cycle-by-Cycle User Profile Evolution" in text:
        idx_start = text.find("## 5. Cycle-by-Cycle User Profile Evolution")
        # Find next major section (either ## 5. Comparative Analysis or ## 6. Key Findings)
        next_headers = ["## 5. Comparative Analysis", "## 6. Key Findings", "## 5. Key Findings"]
        idx_end = len(text)
        for h in next_headers:
            pos = text.find(h, idx_start + 10)
            if pos != -1 and pos < idx_end:
                idx_end = pos
        new_text = text[:idx_start] + section_content + "\n---\n\n" + text[idx_end:]
    else:
        # Insert before Section 5 or Section 6
        target_headers = ["## 5. Comparative Analysis", "## 5. Key Findings"]
        inserted = False
        for th in target_headers:
            pos = text.find(th)
            if pos != -1:
                # If target is ## 5. Comparative Analysis, rename it to ## 6. Comparative Analysis, and ## 6. Key Findings to ## 7.
                # Or insert it cleanly
                # Let's adjust section numbering:
                # In simulation1: current is ## 4. Full Simulation... then ## 5. Key Findings
                # With profile evolution, it becomes ## 5. Cycle-by-Cycle Profile Evolution, and ## 6. Key Findings
                # In simulation2: current is ## 4. Full..., ## 5. Comparative..., ## 6. Key Findings
                # With profile evolution, it becomes ## 5. Cycle-by-Cycle Profile Evolution, ## 6. Comparative..., ## 7. Key Findings
                pass
        
    print(f"Prepared update for {sim_file}")

if __name__ == "__main__":
    sec1 = generate_profile_trajectory_section(
        os.path.join(OUT_DIR, "harness_results_simulation1.json"),
        sim_num=1,
        total_cycles=3
    )
    sec2 = generate_profile_trajectory_section(
        os.path.join(OUT_DIR, "harness_results_simulation2.json"),
        sim_num=2,
        total_cycles=5
    )
    
    # Update simulation1.md
    with open(os.path.join(SIM_DIR, "simulation1.md"), "r", encoding="utf-8") as f:
        sim1_text = f.read()
    idx1 = sim1_text.find("## 5. Key Findings")
    if idx1 != -1:
        sim1_updated = sim1_text[:idx1] + sec1 + "---\n\n## 6. Key Findings" + sim1_text[idx1 + len("## 5. Key Findings"):]
        with open(os.path.join(SIM_DIR, "simulation1.md"), "w", encoding="utf-8") as f:
            f.write(sim1_updated)
        print("Updated simulation1.md with cycle-by-cycle profiles!")
        
    # Update simulation2.md
    with open(os.path.join(SIM_DIR, "simulation2.md"), "r", encoding="utf-8") as f:
        sim2_text = f.read()
    idx2 = sim2_text.find("## 5. Comparative Analysis")
    if idx2 != -1:
        sim2_updated = sim2_text[:idx2] + sec2 + "---\n\n## 6. Comparative Analysis" + sim2_text[idx2 + len("## 5. Comparative Analysis"):]
        # Also adjust ## 6. Key Findings -> ## 7. Key Findings
        sim2_updated = sim2_updated.replace("## 6. Key Findings", "## 7. Key Findings")
        with open(os.path.join(SIM_DIR, "simulation2.md"), "w", encoding="utf-8") as f:
            f.write(sim2_updated)
        print("Updated simulation2.md with cycle-by-cycle profiles!")

