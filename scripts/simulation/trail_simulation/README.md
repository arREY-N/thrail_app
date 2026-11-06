# THARESYS Trail Simulation Module (`trail_simulation`)

This directory houses the **40-Trail Scaling Simulation** as an isolated, fixed, self-contained module.

It tests how the THARESYS dual-anchor recommendation engine scales when the trail catalog expands from the 8 real trails to a 40-trail catalog (8 real + 32 synthetic trails across 4 difficulty tiers).

Nothing in this module mutates or overwrites any file from the **Cycle Simulation** module (`scripts/simulation/cycle_simulation/` or `scripts/simulation/output/`). Any Trail Simulation benchmark stage can be verified, reproduced in-memory, or restored into the React Native app UI (`src/recommendation/data/`) with a single command.

---

## Directory Structure

```text
scripts/simulation/trail_simulation/
├── manage_trail_simulation.py         # Snapshot, verify, rerun, and UI restoration CLI
├── setup_trail_simulation_inputs.py   # Re-derives 24 user initial survey profiles under 40-trail bounds
├── manifest.json                      # Cryptographic SHA-256 hashes of all frozen module files
├── README.md                          # Module documentation & quick-restore guide
├── trail_generator/                   # Standalone 40-trail synthetic catalog generator
│   ├── config.py                      # Tier ranges, quotas, CALABARZON probabilities, seed
│   ├── generate.py                    # Catalog generator (Seed 42 & Seed 7)
│   ├── validate.py                    # 9-check validation suite (quotas, ranges, diversity, simulation fit)
│   ├── tests/                         # Unit tests
│   └── output/                        # Catalogs, bounds, and generation report
├── inputs/                            # Frozen 40-trail fixtures
│   ├── catalog_seed42.json            # 40-trail main catalog (8 real + 32 synthetic)
│   ├── catalog_seed7.json             # 40-trail robustness catalog
│   ├── real_trails_renormalized.json  # 8 real trails under 40-trail bounds
│   ├── norm_bounds_40trails.json      # Empirical min-max bounds for length, elevation, gain, slope
│   ├── users_40trails.json            # 24 simulated cohorts with priors in 40-trail coordinate space
│   ├── start_distances_40trails.csv   # Initial distances to Ground Truth anchors
│   ├── users_spec.json                # User cohort specifications
│   └── gt_ranges.json                 # Ground truth generation ranges
├── scripts/                           # Trail simulation harness
│   └── run_trail_simulation_harness.py
├── reports/                           # Evaluation & generation reports
│   ├── GENERATION_REPORT.md           # Trail generator summary & diversity comparisons
│   └── simulation_40trails_summary.md # 40-trail scaling vs 8-trail realistic evaluation report
└── snapshots/                         # Complete per-stage artifacts (ready for instant UI swap)
    ├── idealistic_40trails_10cycles/  # Main 40-trail scaling benchmark (10 cycles)
    │   ├── harness_results.json
    │   ├── simulatedUsers.json
    │   └── convergence_summary.csv
    ├── idealistic_40trails_5cycles/   # 40-trail mid-term benchmark (5 cycles)
    │   ├── harness_results.json
    │   ├── simulatedUsers.json
    │   └── convergence_summary.csv
    ├── realistic_8trails_10cycles/    # 8-trail benchmark under 40-trail normalization (10 cycles)
    │   ├── harness_results.json
    │   ├── simulatedUsers.json
    │   └── convergence_summary.csv
    └── robustness_seed7_10cycles/     # Robustness catalog benchmark (10 cycles)
        ├── harness_results.json
        ├── simulatedUsers.json
        └── convergence_summary.csv
```

---

## Quick Commands (Run from Repository Root)

### 1. Verify Snapshot Integrity (SHA-256)
```powershell
engine\venv\Scripts\python.exe scripts\simulation\trail_simulation\manage_trail_simulation.py verify
```

### 2. Re-Run & Assert Deterministic Trajectory Equivalence
Re-runs the recommendation engine across all 4 stages in-memory directly from `inputs/` and verifies exact trajectory equivalence against the snapshots:
```powershell
engine\venv\Scripts\python.exe scripts\simulation\trail_simulation\manage_trail_simulation.py rerun --stage all
```

### 3. Restore Any Stage to the React Native UI (`src/recommendation/data/`)
Copies the selected stage's `simulatedUsers.json` and `harness_results.json` into `src/recommendation/data/` for immediate exploration in the mobile app:

- **Restore Idealistic 40-Trail Scaling (10 Cycles — Default):**
  ```powershell
  engine\venv\Scripts\python.exe scripts\simulation\trail_simulation\manage_trail_simulation.py restore --stage idealistic_40trails_10cycles
  ```

- **Restore Idealistic 40-Trail Scaling (5 Cycles):**
  ```powershell
  engine\venv\Scripts\python.exe scripts\simulation\trail_simulation\manage_trail_simulation.py restore --stage idealistic_40trails_5cycles
  ```

- **Restore Realistic 8-Trail Run (10 Cycles under 40-Trail Bounds):**
  ```powershell
  engine\venv\Scripts\python.exe scripts\simulation\trail_simulation\manage_trail_simulation.py restore --stage realistic_8trails_10cycles
  ```

- **Restore Robustness Catalog (Seed 7, 10 Cycles):**
  ```powershell
  engine\venv\Scripts\python.exe scripts\simulation\trail_simulation\manage_trail_simulation.py restore --stage robustness_seed7_10cycles
  ```

*(To switch back to the original 8-trail Cycle Simulation at any time, run: `engine\venv\Scripts\python.exe scripts\simulation\cycle_simulation\manage_cycle_simulation.py restore --cycles 10`)*

