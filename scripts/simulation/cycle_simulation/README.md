# THARESYS Cycle Simulation Module (`cycle_simulation`)

This directory freezes the completed **8-Trail Multi-Cycle Simulation** (`3`, `5`, `7`, and `10` monthly cycles across 24 simulated hiker cohorts) as a fixed, self-contained module.

Nothing in this directory is mutated when running future modules (such as the 40-trail Synthetic Trail Simulation). Any of the 4 cycle benchmark stages can be deterministically verified, re-run in-memory, or restored into the React Native application UI (`src/recommendation/data/`) with a single command.

---

## Directory Structure

```text
scripts/simulation/cycle_simulation/
├── manage_cycle_simulation.py   # Snapshot, verification, in-memory rerun, and UI restore CLI
├── manifest.json                # Cryptographic SHA-256 hashes of all frozen files in this module
├── README.md                    # Module documentation and quick-restore commands
├── inputs/                      # Frozen 8-trail & 24-cohort input fixtures
│   ├── gt_ranges.json
│   ├── trails.json
│   ├── trails_meta.json
│   ├── users_spec.json
│   ├── app_profiles.json
│   ├── users.json
│   └── start_distances.csv
├── scripts/                     # Frozen snapshot of the Cycle Simulation scripts
│   ├── define_users.py
│   ├── export_trails.py
│   ├── sample_ground_truth.py
│   ├── run_simulation_harness.py
│   ├── generate_profile_tables.py
│   └── test_simulation_users.py
├── reports/                     # Frozen markdown evaluation reports
│   ├── simulation1.md           # 3-cycle evaluation report
│   ├── simulation2.md           # 5-cycle evaluation report
│   ├── simulation3.md           # 7-cycle evaluation report
│   ├── simulation4.md           # 10-cycle evaluation report
│   └── simulation_cycle_summary.md
└── snapshots/                   # Complete per-stage outputs (ready for instant UI swap)
    ├── sim1_3cycles/
    │   ├── harness_results.json
    │   ├── simulatedUsers.json
    │   └── convergence_summary.csv
    ├── sim2_5cycles/
    │   ├── harness_results.json
    │   ├── simulatedUsers.json
    │   └── convergence_summary.csv
    ├── sim3_7cycles/
    │   ├── harness_results.json
    │   ├── simulatedUsers.json
    │   └── convergence_summary.csv
    └── sim4_10cycles/
        ├── harness_results.json
        ├── simulatedUsers.json
        └── convergence_summary.csv
```

---

## Quick Commands (Run from Repository Root)

### 1. Verify Snapshot Integrity (SHA-256)
Checks that every file in `scripts/simulation/cycle_simulation/` matches its recorded SHA-256 hash in `manifest.json`:
```powershell
engine\venv\Scripts\python.exe scripts\simulation\cycle_simulation\manage_cycle_simulation.py verify
```

### 2. Re-Run & Verify Deterministic Trajectory Equivalence
Re-runs the recommendation engine (`batch_runner.py`) in-memory across `3`, `5`, `7`, and `10` cycles directly from `inputs/` (without modifying any files on disk) and asserts 100% exact trajectory match against the frozen snapshots:
```powershell
engine\venv\Scripts\python.exe scripts\simulation\cycle_simulation\manage_cycle_simulation.py rerun --cycles all
```

### 3. Restore Any Cycle Stage to the App UI (`src/recommendation/data/`)
Copies the chosen stage's `simulatedUsers.json` and `harness_results.json` into `src/recommendation/data/simulatedUsers.json` and `src/recommendation/data/simulationHarnessResults.json` so it can be presented immediately in the app:

- **Restore Simulation 4 (10 Cycles — Default Final Stage):**
  ```powershell
  engine\venv\Scripts\python.exe scripts\simulation\cycle_simulation\manage_cycle_simulation.py restore --cycles 10
  ```
- **Restore Simulation 3 (7 Cycles):**
  ```powershell
  engine\venv\Scripts\python.exe scripts\simulation\cycle_simulation\manage_cycle_simulation.py restore --cycles 7
  ```
- **Restore Simulation 2 (5 Cycles):**
  ```powershell
  engine\venv\Scripts\python.exe scripts\simulation\cycle_simulation\manage_cycle_simulation.py restore --cycles 5
  ```
- **Restore Simulation 1 (3 Cycles):**
  ```powershell
  engine\venv\Scripts\python.exe scripts\simulation\cycle_simulation\manage_cycle_simulation.py restore --cycles 3
  ```
- **Also Restore `scripts/simulation/output/` Workspace Files (Optional):**
  Add `--restore-workspace` to also copy all 8-trail Cycle Simulation outputs back into `scripts/simulation/output/`:
  ```powershell
  engine\venv\Scripts\python.exe scripts\simulation\cycle_simulation\manage_cycle_simulation.py restore --cycles 10 --restore-workspace
  ```

