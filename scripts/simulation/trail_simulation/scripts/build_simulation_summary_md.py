"""
build_simulation_summary_md.py

Generates the comprehensive `simulation_results_summary.md` summarizing all simulation setups
conducted in THARESYS, covering:
  1. Cycle or Trail Simulation
  2. Setup & Configuration
  3. Short description
  4. User profile table showing how each user's profiles grow per cycle
  5. Average Difficult GD, Average Easy GD, Mean Cycle GD per cycle
  6. Results
  7. Limitations found
  8. Actions taken, if any
"""

import json
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))

SIMULATIONS = [
    {
        "id": "cycle_sim_1",
        "category": "Cycle Simulation",
        "title": "Simulation 1: 8 Real Trails across 3 Monthly Cycles",
        "snapshot_path": "scripts/simulation/cycle_simulation/snapshots/sim1_3cycles",
        "catalog_type": "8 Real Benchmark Calabarzon Trails",
        "cycles": 3,
        "description": "Baseline verification of cold-start adaptive recommendation across 3 monthly hiking batches. Evaluates early-stage convergence under pure content-based filtering and cold-start collaborative filtering.",
        "limitations": "Short 3-cycle duration is insufficient for advanced cohorts (E3/E4) to traverse the 0.30 physical gap between cold-start priors and true capacity limits. Unconstrained review deltas occasionally triggered excessive dampening on beginner cohorts.",
        "actions": "Introduced maximum step-size clamping (Delta_max = 0.04) and expanded evaluation horizon to 5 and 7 cycles.",
    },
    {
        "id": "cycle_sim_2",
        "category": "Cycle Simulation",
        "title": "Simulation 2: 8 Real Trails across 5 Monthly Cycles",
        "snapshot_path": "scripts/simulation/cycle_simulation/snapshots/sim2_5cycles",
        "catalog_type": "8 Real Benchmark Calabarzon Trails",
        "cycles": 5,
        "description": "Mid-horizon evaluation across 5 monthly cycles to assess whether profile adjustment stabilizes after initial cold-start surveys.",
        "limitations": "Beginners who were occasionally recommended moderately steep trails (Mt. Tagapo/Sembrano) accumulated consecutive negative difficulty reviews, threatening profile debuffing.",
        "actions": "Formalized stratified recovery cadences (protecting vulnerable beginners on 100% easy trails while testing 2-easy/1-challenge on intermediates).",
    },
    {
        "id": "cycle_sim_3",
        "category": "Cycle Simulation",
        "title": "Simulation 3: 8 Real Trails across 7 Monthly Cycles",
        "snapshot_path": "scripts/simulation/cycle_simulation/snapshots/sim3_7cycles",
        "catalog_type": "8 Real Benchmark Calabarzon Trails",
        "cycles": 7,
        "description": "Extended evaluation across 7 monthly cycles where hikers approach catalog exhaustion (7 of 8 real trails hiked).",
        "limitations": "Real trail catalog has a physical gap: minor trails in Calabarzon still feature steep ascents (slope > 8.0%), leaving no ultra-flat walks for medical beginners.",
        "actions": "Initiated the synthetic trail simulation module to provide a continuous, multi-tier catalog with dedicated Tier 1 entry-level trails.",
    },
    {
        "id": "cycle_sim_4",
        "category": "Cycle Simulation",
        "title": "Simulation 4: 8 Real Trails across 10 Monthly Cycles",
        "snapshot_path": "scripts/simulation/cycle_simulation/snapshots/sim4_10cycles",
        "catalog_type": "8 Real Benchmark Calabarzon Trails",
        "cycles": 10,
        "description": "Long-horizon real-trail benchmark across 10 monthly cycles. Because 10 > 8, this simulation tests least-recently-hiked rehike mechanics in a closed real-world catalog.",
        "limitations": "With only 8 trails available, hikers must repeat previously completed mountains by Month 9 and 10. Cohort profiles plateau around the centroid of the 8 mountains rather than continuous ground truth.",
        "actions": "Confirmed that rehike mechanics are functionally stable, and transitioned primary scaling evaluation to the 40-trail synthetic catalog.",
    },
    {
        "id": "trail_sim_40_5",
        "category": "Trail Simulation",
        "title": "Simulation 5: 40-Trail Synthetic Catalog (Seed 42) across 5 Cycles",
        "snapshot_path": "scripts/simulation/trail_simulation/snapshots/idealistic_40trails_5cycles",
        "catalog_type": "40 Synthetic Trails (Seed 42, 10 trails per tier)",
        "cycles": 5,
        "description": "Initial deployment of the balanced 40-trail synthetic catalog across 5 cycles. Proves that multi-tier scaling provides sufficient variety for cold-start exploration.",
        "limitations": "5 cycles only sample 25% of the available 20-trail target slots, representing an incomplete learning curve.",
        "actions": "Extended the standard simulation horizon to 10 and 12 cycles.",
    },
    {
        "id": "trail_sim_40_10",
        "category": "Trail Simulation",
        "title": "Simulation 6: 40-Trail Synthetic Catalog (Seed 42) across 10 Cycles",
        "snapshot_path": "scripts/simulation/trail_simulation/snapshots/idealistic_40trails_10cycles",
        "catalog_type": "40 Synthetic Trails (Seed 42, 10 trails per tier)",
        "cycles": 10,
        "description": "Standard 10-month evaluation benchmark under balanced synthetic topography. Evaluates the 2-hike interval cadence (E1 baseline, E2 challenge cadence, E3/E4 recovery cadence).",
        "limitations": "At 10 cycles, convergence reaches 95.83%, but questions remained regarding whether extending beyond 10 cycles would yield mathematical zero error.",
        "actions": "Tested extended 20-cycle run to observe late-stage behavior.",
    },
    {
        "id": "trail_sim_40_12",
        "category": "Trail Simulation",
        "title": "Simulation 7: 40-Trail Synthetic Catalog (Seed 42) across 12 Cycles (1 Full Year)",
        "snapshot_path": "scripts/simulation/trail_simulation/snapshots/idealistic_40trails_12cycles",
        "catalog_type": "40 Synthetic Trails (Seed 42, 10 trails per tier)",
        "cycles": 12,
        "description": "Annual 12-month simulation ($T = 12$) capturing a full calendar year of monthly hikes. Evaluates steady-state profile adaptation without catalog depletion.",
        "limitations": "Approaching inventory boundary for intermediate tiers (10 trails per tier).",
        "actions": "Locked as the primary 1-year academic benchmark demonstration for production reporting.",
    },
    {
        "id": "trail_sim_40_20",
        "category": "Trail Simulation",
        "title": "Simulation 8: 40-Trail Synthetic Catalog (Seed 42) across 20 Cycles",
        "snapshot_path": "scripts/simulation/trail_simulation/snapshots/idealistic_40trails_20cycles",
        "catalog_type": "40 Synthetic Trails (Seed 42, 10 trails per tier)",
        "cycles": 20,
        "description": "Stress-test of the 40-trail catalog over an extended 20-month horizon to test long-term stability and identify saturation boundaries.",
        "limitations": "Inventory Depletion & Catalog Pull: Because each tier only had 10 trails, advanced cohorts exhausted Moderate trails by Cycle 14 and were forced into Tier 4 Very Hard mountains (SYN-25, SYN-30, SYN-32). Positive match feedback pulled their difficult anchors upward past Ground Truth, causing mean GD to inflect upwards after Cycle 15.",
        "actions": "Formulated the 'Catalog Inventory Depletion' thesis and designed the expanded 80-synthetic-trail catalog.",
    },
    {
        "id": "trail_sim_real8_renorm",
        "category": "Trail Simulation",
        "title": "Simulation 9: Realistic 8 Real Trails in 40-Trail Re-normalized Space across 10 Cycles",
        "snapshot_path": "scripts/simulation/trail_simulation/snapshots/realistic_8trails_10cycles",
        "catalog_type": "8 Real Calabarzon Trails (Re-normalized to 40-Trail Coordinate Bounds)",
        "cycles": 10,
        "description": "Methodological control experiment: embeds the 8 real trails into the expanded coordinate bounds of the 40-trail catalog, ensuring fair mathematical comparison.",
        "limitations": "Demonstrated that real trails cluster tightly in a sub-region of the coordinate space, leaving lower and upper quadrants unpopulated in actual Calabarzon geography.",
        "actions": "Validated that synthetic trails faithfully extend the real coordinate space without distorting real trail relative distances.",
    },
    {
        "id": "trail_sim_robustness_seed7",
        "category": "Trail Simulation",
        "title": "Simulation 10: Robustness Run on Alternate Topology (Seed 7) across 10 Cycles",
        "snapshot_path": "scripts/simulation/trail_simulation/snapshots/robustness_seed7_10cycles",
        "catalog_type": "40 Synthetic Trails (Seed 7 Alternate Topology, 10 per tier)",
        "cycles": 10,
        "description": "Robustness and sensitivity test using an independently generated synthetic catalog (Seed 7) with altered mountain peaks, route types, and terrain distributions.",
        "limitations": "Different trail combinations slightly altered intermediate convergence paths for E2 cohorts.",
        "actions": "Confirmed algorithm robustness: achieved 95.83% convergence rate on Seed 7, proving that convergence is independent of catalog RNG artifacting.",
    },
    {
        "id": "scale_80trails_12",
        "category": "Expanded Trail Simulation",
        "title": "Simulation 11: Expanded 80 Synthetic Trails (88 Total) across 12 Cycles (1 Full Year)",
        "snapshot_path": "scripts/simulation/trail_simulation/snapshots/scale_80trails_12cycles",
        "catalog_type": "88 Total Trails (80 Synthetic + 8 Real, 20 trails per tier, expanded min/max)",
        "cycles": 12,
        "description": "Full-scale simulation on 80 synthetic trails with physical attributes extending beyond previous bounds (length 1.5-21.7 km, elevation 192-2830 m, gain 67-2617 m, slope 2.4-17.3%). Evaluates a full 1-year calendar progression.",
        "limitations": "E1-N-P1 showed a minor residual gap (+0.0015) due to high initial baseline match.",
        "actions": "Achieved record 95.83% convergence and strictly monotonic decline across every single month.",
    },
    {
        "id": "scale_80trails_20",
        "category": "Expanded Trail Simulation",
        "title": "Simulation 12: Expanded 80 Synthetic Trails (88 Total) across 20 Cycles",
        "snapshot_path": "scripts/simulation/trail_simulation/snapshots/scale_80trails_20cycles",
        "catalog_type": "88 Total Trails (80 Synthetic + 8 Real, 20 trails per tier, expanded min/max)",
        "cycles": 20,
        "description": "Definitive verification test: runs 20 cycles on the 80-trail catalog (20 trails/tier) to prove that the late-stage divergence in Simulation 8 was strictly caused by tier inventory exhaustion.",
        "limitations": "Residual error stabilizes around GD ~ 0.137 due to discrete mountain inventory topography.",
        "actions": "Conclusively proved the hypothesis: with 20 trails per tier, divergence was completely eliminated, achieving continuous monotonic convergence from Cycle 0 to Cycle 20 and an all-time record Mean Delta GD of -0.0220.",
    },
]


def generate_markdown():
    lines = []
    lines.append("# THARESYS Simulation Results Summary: Comprehensive Benchmark Report")
    lines.append("")
    lines.append("> **Document Overview:** This report compiles detailed empirical results, user profile progression tables, cycle-by-cycle distance telemetry, limitations, and corrective actions across all 12 simulation experiments conducted for the THARESYS recommendation engine.")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Table of Simulation Experiments")
    lines.append("")
    lines.append("| # | Category | Simulation Name | Catalog Size | Cycles | Convergence Rate | Mean Delta GD |")
    lines.append("| :-: | :--- | :--- | :---: | :---: | :---: | :---: |")

    # Pre-scan for summary table
    for idx, sim in enumerate(SIMULATIONS, start=1):
        full_dir = os.path.join(ROOT, sim["snapshot_path"])
        harness_file = os.path.join(full_dir, "harness_results.json")
        conv_str = "N/A"
        delta_str = "N/A"
        if os.path.exists(harness_file):
            with open(harness_file, "r", encoding="utf-8") as f:
                h = json.load(f)
                c_val = h.get("convergence_rate")
                d_val = h.get("mean_delta_gd")
                if c_val is not None:
                    conv_str = f"{c_val * 100:.1f}%"
                if d_val is not None:
                    delta_str = f"{d_val:.4f}"
        lines.append(f"| {idx} | {sim['category']} | [{sim['title']}](#{sim['id']}) | {sim['catalog_type'].split()[0]} | {sim['cycles']} | **{conv_str}** | `{delta_str}` |")

    lines.append("")
    lines.append("---")
    lines.append("")

    # Detailed Sections
    for idx, sim in enumerate(SIMULATIONS, start=1):
        print(f"Processing Sim {idx}: {sim['title']}...")
        full_dir = os.path.join(ROOT, sim["snapshot_path"])
        users_file = os.path.join(full_dir, "simulatedUsers.json")
        harness_file = os.path.join(full_dir, "harness_results.json")

        if not os.path.exists(users_file) or not os.path.exists(harness_file):
            print(f"Skipping {sim['id']}: missing data files in {full_dir}")
            continue

        with open(users_file, "r", encoding="utf-8") as f:
            users_data = json.load(f)
        with open(harness_file, "r", encoding="utf-8") as f:
            harness_data = json.load(f)

        total_users = len(users_data)
        cycles_count = len(users_data[0]["cycleHistory"]) - 1
        conv_rate = harness_data.get("convergence_rate", 0.0)
        mean_delta = harness_data.get("mean_delta_gd", 0.0)

        lines.append(f"<a id=\"{sim['id']}\"></a>")
        lines.append(f"## {idx}. {sim['title']}")
        lines.append("")
        lines.append(f"**1. Simulation Type:** `{sim['category']}`  ")
        lines.append(f"**2. Setup & Configuration:**  ")
        lines.append(f"- **Catalog Size & Source:** {sim['catalog_type']}  ")
        lines.append(f"- **Simulated Cycles:** {cycles_count} Monthly Cycles (Months `00` to `{cycles_count:02d}`)  ")
        lines.append(f"- **Cohorts Evaluated:** {total_users} Deterministic Simulated User Cohorts (`E1-M-P1` to `E4-N-P3`)  ")
        lines.append(f"- **Convergence Metrics Engine:** Gower Distance (GD), Euclidean Distance (ED), Cosine Distance (CS)  ")
        lines.append(f"- **Cadence Policy:** Stratified Recovery Cadence (E1: 100% Easy; E2: 2 Easy / 1 Diff; E3/E4: 2 Diff / 1 Easy)  ")
        lines.append("")
        lines.append(f"**3. Description:**  ")
        lines.append(f"{sim['description']}")
        lines.append("")

        # Section 4: User Profile Table
        lines.append(f"### 4. User Profile Growth Table (All {total_users} Cohorts)")
        lines.append("")
        lines.append("| User ID | Exp | Med | Prov | Initial GD (Start) | Final GD (End) | Delta GD (Change) | Convergence Status | Easy Anchor (L, G, S) Start -> End | Difficult Anchor (L, G, S) Start -> End |")
        lines.append("| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :--- |")

        for u in users_data:
            uid = u["id"]
            exp = u["experience"]
            med = u["medical"]
            prov = u.get("province_pattern", "P1")
            conv = u.get("convergence", {})
            start_gd = conv.get("start_gd", u["cycleHistory"][0]["distances"]["mean_gd"])
            end_gd = conv.get("end_gd", u["cycleHistory"][-1]["distances"]["mean_gd"])
            delta_gd = conv.get("delta_gd", round(end_gd - start_gd, 4))
            has_conv = conv.get("has_converged", delta_gd < 0)
            status_badge = "**CONVERGED**" if has_conv else "STABLE / DIFF"

            p_start = u["cycleHistory"][0].get("profile_snapshot") or u["cycleHistory"][0].get("profile") or {}
            p_end = u["cycleHistory"][-1].get("profile_snapshot") or u["cycleHistory"][-1].get("profile") or {}
            e_start = p_start.get("easy", {}).get("features", {})
            e_end = p_end.get("easy", {}).get("features", {})
            d_start = p_start.get("difficult", {}).get("features", {})
            d_end = p_end.get("difficult", {}).get("features", {})

            e_l0, e_g0, e_s0 = e_start.get("length", 0.0), e_start.get("gain", 0.0), e_start.get("slope", 0.0)
            e_l1, e_g1, e_s1 = e_end.get("length", 0.0), e_end.get("gain", 0.0), e_end.get("slope", 0.0)
            d_l0, d_g0, d_s0 = d_start.get("length", 0.0), d_start.get("gain", 0.0), d_start.get("slope", 0.0)
            d_l1, d_g1, d_s1 = d_end.get("length", 0.0), d_end.get("gain", 0.0), d_end.get("slope", 0.0)

            e_str = f"[{e_l0:.2f}, {e_g0:.2f}, {e_s0:.2f}] -> [{e_l1:.2f}, {e_g1:.2f}, {e_s1:.2f}]"
            d_str = f"[{d_l0:.2f}, {d_g0:.2f}, {d_s0:.2f}] -> [{d_l1:.2f}, {d_g1:.2f}, {d_s1:.2f}]"

            lines.append(f"| `{uid}` | {exp} | {med} | {prov} | `{start_gd:.4f}` | `{end_gd:.4f}` | `{delta_gd:+.4f}` | {status_badge} | `{e_str}` | `{d_str}` |")

        lines.append("")

        # Section 5: Average Distance Telemetry per Cycle
        lines.append(f"### 5. Cycle-by-Cycle Distance Telemetry (Difficult GD, Easy GD, Mean GD)")
        lines.append("")
        lines.append("| Cycle | Month | Average Easy GD | Average Difficult GD | Mean Cycle GD | Delta from Start |")
        lines.append("| :---: | :---: | :---: | :---: | :---: | :---: |")

        start_cycle_mean = 0.0
        for c in range(cycles_count + 1):
            m_label = users_data[0]["cycleHistory"][c].get("month", f"Month {c:02d}")
            easy_vals = []
            diff_vals = []
            mean_vals = []
            for u in users_data:
                d_obj = u["cycleHistory"][c]["distances"]
                # support both nested and flat distance objects
                e_gd = d_obj.get("easy", {}).get("gd") if isinstance(d_obj.get("easy"), dict) else d_obj.get("easy_gd", 0.0)
                d_gd = d_obj.get("difficult", {}).get("gd") if isinstance(d_obj.get("difficult"), dict) else d_obj.get("diff_gd", 0.0)
                m_gd = d_obj.get("mean_gd", 0.0)
                if e_gd is not None: easy_vals.append(e_gd)
                if d_gd is not None: diff_vals.append(d_gd)
                if m_gd is not None: mean_vals.append(m_gd)

            avg_e = sum(easy_vals) / len(easy_vals) if easy_vals else 0.0
            avg_d = sum(diff_vals) / len(diff_vals) if diff_vals else 0.0
            avg_m = sum(mean_vals) / len(mean_vals) if mean_vals else 0.0

            if c == 0:
                start_cycle_mean = avg_m
            cum_delta = avg_m - start_cycle_mean

            lines.append(f"| Cycle {c:02d} | `{m_label}` | `{avg_e:.4f}` | `{avg_d:.4f}` | **`{avg_m:.4f}`** | `{cum_delta:+.4f}` |")

        lines.append("")

        # Section 6: Results
        lines.append(f"### 6. Results")
        lines.append(f"- **Overall Convergence Rate:** **`{conv_rate * 100:.2f}%`** ({sum(1 for u in users_data if u.get('convergence', {}).get('has_converged', False))}/{total_users} Cohorts)  ")
        lines.append(f"- **Mean Delta Gower Distance:** **`{mean_delta:.4f}`**  ")
        lines.append(f"- **Initial Mean GD:** `{start_cycle_mean:.4f}` $\\longrightarrow$ **Final Mean GD:** `{avg_m:.4f}`  ")
        lines.append("")

        # Section 7 & 8: Limitations and Actions Taken
        lines.append(f"### 7. Limitations Found")
        lines.append(f"{sim['limitations']}")
        lines.append("")
        lines.append(f"### 8. Actions Taken")
        lines.append(f"{sim['actions']}")
        lines.append("")
        lines.append("---")
        lines.append("")

    out_file = os.path.join(ROOT, "simulation_results_summary.md")
    with open(out_file, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines))
    print(f"\nSuccessfully generated comprehensive summary file: {out_file}")


if __name__ == "__main__":
    generate_markdown()
