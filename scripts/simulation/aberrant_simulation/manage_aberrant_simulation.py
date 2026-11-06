"""
THARESYS Aberrant Simulation Module Manager (`manage_aberrant_simulation.py`).

Manages the Aberrant & Normal Cohort Simulation (48 cohorts) as a self-contained module:
  - 24 Normal Baselines (E1..E4 x N/M x P1..P3)
  - 24 Aberrant Cohorts (all 12 mismatch permutations x N/M)

Capabilities:
  - `restore` : Instantly activates the aberrant & normal simulation dataset in src/recommendation/data/ for UI presentation.
  - `snapshot`: Builds per-cycle snapshots (10, 5, 3 cycles) and manifest.json.
  - `verify`  : Checks SHA-256 hashes of module files against manifest.json.
  - `run`     : Runs the multi-cycle simulation.

Usage:
  engine\\venv\\Scripts\\python.exe scripts\\simulation\\aberrant_simulation\\manage_aberrant_simulation.py restore
  engine\\venv\\Scripts\\python.exe scripts\\simulation\\aberrant_simulation\\manage_aberrant_simulation.py restore --cycles 10
  engine\\venv\\Scripts\\python.exe scripts\\simulation\\aberrant_simulation\\manage_aberrant_simulation.py snapshot
  engine\\venv\\Scripts\\python.exe scripts\\simulation\\aberrant_simulation\\manage_aberrant_simulation.py verify
"""

import argparse
import copy
import csv
import hashlib
import json
import os
import shutil
import sys
from datetime import datetime, timezone
from typing import Any, Dict, List

MODULE_DIR = os.path.dirname(os.path.abspath(__file__))
SIM_DIR = os.path.abspath(os.path.join(MODULE_DIR, ".."))
ROOT = os.path.abspath(os.path.join(SIM_DIR, "..", ".."))
ENGINE_DIR = os.path.join(ROOT, "engine")
SCRIPTS_DIR = os.path.join(MODULE_DIR, "scripts")

if ENGINE_DIR not in sys.path:
    sys.path.insert(0, ENGINE_DIR)
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)

INPUTS_DIR = os.path.join(MODULE_DIR, "inputs")
OUTPUT_DIR = os.path.join(MODULE_DIR, "output")
SNAPSHOTS_DIR = os.path.join(MODULE_DIR, "snapshots")
MANIFEST_PATH = os.path.join(MODULE_DIR, "manifest.json")
APP_DATA_DIR = os.path.join(ROOT, "src", "recommendation", "data")

CYCLE_STAGES = {
    10: {
        "folder": "sim_10cycles",
        "cycles": 10,
        "description": "48 Cohorts (24 Normal + 24 Aberrant) across 10 monthly cycles",
    },
    5: {
        "folder": "sim_5cycles",
        "cycles": 5,
        "description": "48 Cohorts (24 Normal + 24 Aberrant) across 5 monthly cycles",
    },
    3: {
        "folder": "sim_3cycles",
        "cycles": 3,
        "description": "48 Cohorts (24 Normal + 24 Aberrant) across 3 monthly cycles",
    },
}


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            chunk = f.read(65536)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def cmd_restore(cycles: int = 10) -> None:
    """Restores aberrant simulation artifacts into src/recommendation/data/ for app presentation."""
    # If snapshot exists for this cycle, prefer it; otherwise use output/
    stage_info = CYCLE_STAGES.get(cycles)
    stage_dir = os.path.join(SNAPSHOTS_DIR, stage_info["folder"]) if stage_info else None

    if stage_dir and os.path.exists(os.path.join(stage_dir, "simulatedUsers.json")):
        src_users = os.path.join(stage_dir, "simulatedUsers.json")
        src_harness = os.path.join(stage_dir, "harness_results.json")
    else:
        src_users = os.path.join(OUTPUT_DIR, "simulatedUsers.json")
        src_harness = os.path.join(OUTPUT_DIR, "harness_results.json")

    if not os.path.exists(src_users) or not os.path.exists(src_harness):
        raise SystemExit(
            f"Simulation data not found. Please run the simulation first:\n"
            f"  engine\\venv\\Scripts\\python.exe {os.path.relpath(__file__, ROOT)} run --cycles {cycles}"
        )

    os.makedirs(APP_DATA_DIR, exist_ok=True)
    dst_users = os.path.join(APP_DATA_DIR, "simulatedUsers.json")
    dst_harness = os.path.join(APP_DATA_DIR, "simulationHarnessResults.json")

    shutil.copy2(src_users, dst_users)
    shutil.copy2(src_harness, dst_harness)

    print(f"[UI RESTORED] Activated Aberrant Simulation ({cycles} cycles, 48 cohorts) in:")
    print(f"  - src/recommendation/data/simulatedUsers.json")
    print(f"  - src/recommendation/data/simulationHarnessResults.json")
    print(f"The UI at /superadmin/recommendation -> 'Simulation' tab will now display all 48 cohorts!")


def cmd_snapshot() -> None:
    """Builds snapshots for standard cycles and writes manifest.json."""
    from run_aberrant_simulation import execute_simulation

    os.makedirs(SNAPSHOTS_DIR, exist_ok=True)

    for cyc, meta in sorted(CYCLE_STAGES.items()):
        folder_dir = os.path.join(SNAPSHOTS_DIR, meta["folder"])
        os.makedirs(folder_dir, exist_ok=True)

        print(f"\n---> Building snapshot for {meta['description']}...")
        harness = execute_simulation(cycles=cyc, cbf_engine="GD", cf_engine="GD")

        # Copy from output to snapshot folder
        shutil.copy2(os.path.join(OUTPUT_DIR, "simulatedUsers.json"), os.path.join(folder_dir, "simulatedUsers.json"))
        shutil.copy2(os.path.join(OUTPUT_DIR, "harness_results.json"), os.path.join(folder_dir, "harness_results.json"))
        shutil.copy2(os.path.join(OUTPUT_DIR, "convergence_summary.csv"), os.path.join(folder_dir, "convergence_summary.csv"))
        print(f"[SNAPSHOT] Built {meta['folder']}")

    # Build manifest
    manifest_entries = {}
    for root_dir, _, files in os.walk(MODULE_DIR):
        for file in sorted(files):
            full_path = os.path.join(root_dir, file)
            rel_path = os.path.relpath(full_path, MODULE_DIR).replace("\\", "/")
            if rel_path in ("manifest.json",) or "__pycache__" in rel_path or ".git" in rel_path:
                continue
            manifest_entries[rel_path] = sha256_file(full_path)

    manifest = {
        "module": "aberrant_simulation",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "files_count": len(manifest_entries),
        "files": manifest_entries
    }

    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"\n[MANIFEST] Wrote cryptographic manifest with {len(manifest_entries)} files to {MANIFEST_PATH}")


def cmd_verify() -> bool:
    if not os.path.exists(MANIFEST_PATH):
        print(f"ERROR: {MANIFEST_PATH} not found. Run `snapshot` first.")
        return False

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    files_map = manifest.get("files", {})
    mismatches = []
    missing = []

    for rel_path, expected_hash in files_map.items():
        full_path = os.path.join(MODULE_DIR, rel_path.replace("/", os.sep))
        if not os.path.exists(full_path):
            missing.append(rel_path)
            continue
        actual_hash = sha256_file(full_path)
        if actual_hash != expected_hash:
            mismatches.append((rel_path, expected_hash, actual_hash))

    if missing or mismatches:
        print(f"VERIFICATION FAILED: {len(missing)} missing, {len(mismatches)} mismatches.")
        return False

    print(f"VERIFICATION PASSED: All {len(files_map)} files in aberrant_simulation/ match SHA-256 manifest.")
    return True


def main():
    parser = argparse.ArgumentParser(description="THARESYS Aberrant Simulation Module Manager")
    subparsers = parser.add_subparsers(dest="command", help="Sub-commands")

    # restore
    p_restore = subparsers.add_parser("restore", help="Restore simulation data to UI")
    p_restore.add_argument("--cycles", type=int, default=10, choices=[3, 5, 10], help="Cycle stage (default: 10)")

    # snapshot
    subparsers.add_parser("snapshot", help="Build snapshots and manifest")

    # verify
    subparsers.add_parser("verify", help="Verify module hashes against manifest")

    # run
    p_run = subparsers.add_parser("run", help="Run simulation directly")
    p_run.add_argument("--cycles", type=int, default=10, help="Cycles (default: 10)")

    args = parser.parse_args()

    if args.command == "restore":
        cmd_restore(cycles=args.cycles)
    elif args.command == "snapshot":
        cmd_snapshot()
    elif args.command == "verify":
        cmd_verify()
    elif args.command == "run":
        from run_aberrant_simulation import execute_simulation
        execute_simulation(cycles=args.cycles)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()

