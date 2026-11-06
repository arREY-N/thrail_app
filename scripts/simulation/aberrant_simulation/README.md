# THARESYS Aberrant & Normal Cohort Simulation Module (`aberrant_simulation`)

This module evaluates recommendation engine performance and convergence behavior across both **Normal Baseline Cohorts** (concordant: stated experience == actual capability) and **Aberrant Cohorts** (discordant: hikers who overestimate or underestimate their skills).

---

## 1. Problem Context

In real-world trail applications, self-reported survey data suffers from significant cognitive distortion:
- **Overestimation / Hubris Bias:** Hikers who once completed a strenuous trail (perhaps with difficulty or assistance) claim high proficiency ($E3$ or $E4$), while their sustainable physiological baseline is novice ($E1$ or $E2$).
- **Underestimation / Sandbagging Bias:** Seasoned endurance athletes or cautious hikers register as beginners ($E1$).
- **Core Recommendation Challenge:** Static recommenders would trap overconfident hikers in hazardous high-altitude routes. THARESYS uses review factor feedback and dynamic profile updating to adjust user profiles towards their true physiological Ground Truth ($E_{\text{actual}}$).

---

## 2. Cohort Population (48 Total Cohorts)

1. **24 Normal Baseline Cohorts (Concordant):**
   - $E1..E4 \times \text{Medical }(M, N) \times \text{Provinces }(P1, P2, P3)$
   - Stated Tier == Actual Tier ($1-1, 2-2, 3-3, 4-4$)
2. **24 Aberrant Cohorts (Discordant):**
   - All 12 permutation pairs $P(4, 2) = 12$ across Healthy ($N$) and Medical Condition ($M$):
     - **Overestimated (Actual < Stated):** `4-1`, `4-2`, `4-3`, `3-1`, `3-2`, `2-1`
     - **Underestimated (Actual > Stated):** `1-4`, `1-3`, `1-2`, `2-4`, `2-3`, `3-4`

---

## 3. Directory Structure

```text
scripts/simulation/aberrant_simulation/
├── inputs/
│   ├── trails.json             # 8 production trails
│   ├── trails_meta.json
│   ├── gt_ranges.json          # Ground truth sampling ranges
│   └── app_profiles.json       # Intake survey profile templates
├── scripts/
│   ├── define_aberrant_cohorts.py    # Generates 48 cohorts & ground truths
│   ├── run_aberrant_simulation.py    # Multi-cycle recommendation harness
│   └── evaluate_aberrant_trajectories.py # Telemetry analysis & report generation
├── output/
│   ├── users.json              # 48 cohorts with app profiles and ground truth
│   ├── users_spec.json
│   ├── start_distances.csv     # Cold-start distance metrics
│   ├── harness_results.json    # Complete cycle-by-cycle telemetry
│   ├── simulatedUsers.json     # Final adapted profile states
│   └── convergence_summary.csv # Per-cohort convergence metrics
└── README.md
```

---

## 4. Quick Commands

### 1. Re-Generate Cohorts & Ground Truths
```powershell
engine\venv\Scripts\python.exe scripts\simulation\aberrant_simulation\scripts\define_aberrant_cohorts.py
```

### 2. Run Multi-Cycle Simulation (e.g. 10 Monthly Batches)
```powershell
engine\venv\Scripts\python.exe scripts\simulation\aberrant_simulation\scripts\run_aberrant_simulation.py --cycles 10
```

### 3. Generate Markdown Analysis Report
```powershell
engine\venv\Scripts\python.exe scripts\simulation\aberrant_simulation\scripts\evaluate_aberrant_trajectories.py
```

Full report is available at [`plans/aberrant_and_normal_cohort_simulation_report.md`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/plans/aberrant_and_normal_cohort_simulation_report.md).

