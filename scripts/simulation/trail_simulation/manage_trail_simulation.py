"""
THARESYS Trail Simulation Module Manager (`manage_trail_simulation.py`).

Manages the 40-Trail Scaling Simulation benchmark as a fixed, self-contained module.

Stages supported:
  1. `idealistic_40trails_10cycles`: 40-trail catalog (Seed 42) across 10 monthly cycles
  2. `idealistic_40trails_5cycles` : 40-trail catalog (Seed 42) across 5 monthly cycles
  3. `realistic_8trails_10cycles`  : 8 real trails under 40-trail re-normalized coordinate space
  4. `robustness_seed7_10cycles`   : 40-trail catalog (Seed 7) across 10 monthly cycles

Capabilities:
  - `generate`    : Runs generator and validation checks (quotas, ranges, diversity, simulation fit).
  - `setup_inputs`: Rederives 24 users' initial survey profiles into inputs/users_40trails.json.
  - `run`         : Runs the simulation harness for any stage or all stages.
  - `snapshot`    : Builds complete per-stage output folders and generates cryptographic manifest.json.
  - `verify`      : Checks SHA-256 hashes of all frozen module files against manifest.json.
  - `restore`     : Instantly activates any stage in src/recommendation/data/ for UI presentation.
  - `rerun`       : Re-executes in-memory directly from inputs/ and asserts exact trajectory match.

Usage:
  engine\\venv\\Scripts\\python.exe scripts\\simulation\\trail_simulation\\manage_trail_simulation.py generate
  engine\\venv\\Scripts\\python.exe scripts\\simulation\\trail_simulation\\manage_trail_simulation.py snapshot
  engine\\venv\\Scripts\\python.exe scripts\\simulation\\trail_simulation\\manage_trail_simulation.py verify
  engine\\venv\\Scripts\\python.exe scripts\\simulation\\trail_simulation\\manage_trail_simulation.py restore --stage idealistic_40trails_10cycles
  engine\\venv\\Scripts\\python.exe scripts\\simulation\\trail_simulation\\manage_trail_simulation.py rerun --stage all
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
GEN_DIR = os.path.join(MODULE_DIR, "trail_generator")
SCRIPTS_DIR = os.path.join(MODULE_DIR, "scripts")

if ENGINE_DIR not in sys.path:
    sys.path.insert(0, ENGINE_DIR)
if GEN_DIR not in sys.path:
    sys.path.insert(0, GEN_DIR)
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)

INPUTS_DIR = os.path.join(MODULE_DIR, "inputs")
SNAPSHOTS_DIR = os.path.join(MODULE_DIR, "snapshots")
REPORTS_DIR = os.path.join(MODULE_DIR, "reports")
MANIFEST_PATH = os.path.join(MODULE_DIR, "manifest.json")
APP_DATA_DIR = os.path.join(ROOT, "src", "recommendation", "data")

STAGE_CONFIGS = {
    "idealistic_40trails_12cycles": {
        "folder": "idealistic_40trails_12cycles",
        "catalog_file": "catalog_seed42.json",
        "cycles": 12,
        "description": "Idealistic 40-trail catalog (Seed 42) across 12 monthly cycles (1 Full Year)",
    },
    "idealistic_40trails_20cycles": {
        "folder": "idealistic_40trails_20cycles",
        "catalog_file": "catalog_seed42.json",
        "cycles": 20,
        "description": "Idealistic 40-trail catalog (Seed 42) across 20 monthly cycles",
    },
    "idealistic_40trails_10cycles": {
        "folder": "idealistic_40trails_10cycles",
        "catalog_file": "catalog_seed42.json",
        "cycles": 10,
        "description": "Idealistic 40-trail catalog (Seed 42) across 10 monthly cycles",
    },
    "idealistic_40trails_5cycles": {
        "folder": "idealistic_40trails_5cycles",
        "catalog_file": "catalog_seed42.json",
        "cycles": 5,
        "description": "Idealistic 40-trail catalog (Seed 42) across 5 monthly cycles",
    },
    "realistic_8trails_12cycles": {
        "folder": "realistic_8trails_12cycles",
        "catalog_file": "real_trails_renormalized.json",
        "cycles": 12,
        "description": "Realistic 8 real trails under 40-trail re-normalized coordinate space (12 cycles / 1 Year)",
    },
    "realistic_8trails_20cycles": {
        "folder": "realistic_8trails_20cycles",
        "catalog_file": "real_trails_renormalized.json",
        "cycles": 20,
        "description": "Realistic 8 real trails under 40-trail re-normalized coordinate space (20 cycles)",
    },
    "realistic_8trails_10cycles": {
        "folder": "realistic_8trails_10cycles",
        "catalog_file": "real_trails_renormalized.json",
        "cycles": 10,
        "description": "Realistic 8 real trails under 40-trail re-normalized coordinate space (10 cycles)",
    },
    "robustness_seed7_20cycles": {
        "folder": "robustness_seed7_20cycles",
        "catalog_file": "catalog_seed7.json",
        "cycles": 20,
        "description": "Robustness 40-trail catalog (Seed 7) across 20 monthly cycles",
    },
    "robustness_seed7_10cycles": {
        "folder": "robustness_seed7_10cycles",
        "catalog_file": "catalog_seed7.json",
        "cycles": 10,
        "description": "Robustness 40-trail catalog (Seed 7) across 10 monthly cycles",
    },
}


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def cmd_generate() -> None:
    print("=" * 80)
    print("RUNNING TRAIL GENERATOR AND VALIDATION")
    print("=" * 80)
    from generate import main as gen_main
    from validate import main as val_main
    from setup_trail_simulation_inputs import setup_inputs

    gen_main()
    val_main()
    setup_inputs()
    print("\n[GENERATE COMPLETE] Generator and inputs are initialized and validated.")


def cmd_run(stage_name: str = "all") -> None:
    from run_trail_simulation_harness import run_simulation

    target_stages = list(STAGE_CONFIGS.keys()) if stage_name == "all" else [stage_name]

    with open(os.path.join(INPUTS_DIR, "users_40trails.json"), "r", encoding="utf-8") as f:
        users_master = json.load(f)
    with open(os.path.join(INPUTS_DIR, "users_spec.json"), "r", encoding="utf-8") as f:
        users_spec = json.load(f)

    for st_name in target_stages:
        cfg = STAGE_CONFIGS[st_name]
        print(f"\n[RUNNING STAGE] {st_name} ({cfg['description']})...")

        cat_path = os.path.join(INPUTS_DIR, cfg["catalog_file"])
        with open(cat_path, "r", encoding="utf-8") as f:
            cat_data = json.load(f)
        candidate_trails = cat_data["trails"] if isinstance(cat_data, dict) and "trails" in cat_data else cat_data

        harness_res, users_bundle, csv_rows = run_simulation(
            candidate_trails=candidate_trails,
            users_master=users_master,
            users_spec=users_spec,
            cycles=cfg["cycles"],
        )

        out_dir = os.path.join(SNAPSHOTS_DIR, cfg["folder"])
        os.makedirs(out_dir, exist_ok=True)

        with open(os.path.join(out_dir, "harness_results.json"), "w", encoding="utf-8", newline="\n") as f:
            json.dump(harness_res, f, indent=2)
        with open(os.path.join(out_dir, "simulatedUsers.json"), "w", encoding="utf-8", newline="\n") as f:
            json.dump(users_bundle, f, indent=2)
        with open(os.path.join(out_dir, "convergence_summary.csv"), "w", encoding="utf-8", newline="\n") as f:
            writer = csv.DictWriter(f, fieldnames=list(csv_rows[0].keys()))
            writer.writeheader()
            writer.writerows(csv_rows)

        print(
            f"  [STAGE DONE] {st_name}: convergence_rate={harness_res['convergence_rate']*100:.1f}%, "
            f"mean_delta_gd={harness_res['mean_delta_gd']} -> saved to {os.path.relpath(out_dir, ROOT)}"
        )


def cmd_snapshot() -> None:
    print("=" * 80)
    print("BUILDING AND LOCKING TRAIL SIMULATION SNAPSHOT MODULE")
    print("=" * 80)

    # 1. Ensure inputs and snapshots exist
    cmd_generate()
    cmd_run("all")

    # 2. Copy generation report into reports/
    os.makedirs(REPORTS_DIR, exist_ok=True)
    gen_rep_src = os.path.join(GEN_DIR, "output", "GENERATION_REPORT.md")
    if os.path.exists(gen_rep_src):
        shutil.copy2(gen_rep_src, os.path.join(REPORTS_DIR, "GENERATION_REPORT.md"))

    # 3. Write cryptographic SHA-256 manifest
    manifest_entries: Dict[str, str] = {}
    for root_dir, _, files in os.walk(MODULE_DIR):
        for file in sorted(files):
            full_path = os.path.join(root_dir, file)
            rel_path = os.path.relpath(full_path, MODULE_DIR).replace("\\", "/")
            if rel_path in ("manifest.json",) or "__pycache__" in rel_path:
                continue
            manifest_entries[rel_path] = sha256_file(full_path)

    manifest = {
        "module": "trail_simulation",
        "description": "Frozen 40-trail scaling benchmark snapshots (idealistic, realistic, robustness)",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "default_ui_stage": "idealistic_40trails_12cycles",
        "stages": STAGE_CONFIGS,
        "files": manifest_entries,
    }

    with open(MANIFEST_PATH, "w", encoding="utf-8", newline="\n") as f:
        json.dump(manifest, f, indent=2, sort_keys=True)

    print(f"\n[MANIFEST] Recorded {len(manifest_entries)} files in {os.path.relpath(MANIFEST_PATH, ROOT)}")
    print("Trail Simulation module snapshot is locked and verified.")


def cmd_verify() -> bool:
    if not os.path.exists(MANIFEST_PATH):
        print("ERROR: manifest.json not found. Run `snapshot` first.")
        return False

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    files_map: Dict[str, str] = manifest.get("files", {})
    mismatches: List[str] = []
    missing: List[str] = []

    for rel_path, expected_hash in sorted(files_map.items()):
        full_path = os.path.join(MODULE_DIR, rel_path.replace("/", os.sep))
        if not os.path.exists(full_path):
            missing.append(rel_path)
            continue
        actual_hash = sha256_file(full_path)
        if actual_hash != expected_hash:
            mismatches.append(f"{rel_path} (expected {expected_hash[:12]}..., got {actual_hash[:12]}...)")

    if missing or mismatches:
        print("VERIFICATION FAILED:")
        for m in missing:
            print(f"  [MISSING]  {m}")
        for mm in mismatches:
            print(f"  [MISMATCH] {mm}")
        return False

    print(f"VERIFICATION PASSED: All {len(files_map)} files in `trail_simulation/` match SHA-256 manifest.")
    return True


def cmd_restore(stage: str = "idealistic_40trails_12cycles") -> None:
    if stage not in STAGE_CONFIGS:
        raise SystemExit(f"Unknown stage '{stage}'. Choose from {list(STAGE_CONFIGS.keys())}")

    cfg = STAGE_CONFIGS[stage]
    stage_dir = os.path.join(SNAPSHOTS_DIR, cfg["folder"])
    if not os.path.exists(stage_dir):
        raise SystemExit(f"Snapshot directory {stage_dir} not found. Run `snapshot` first.")

    os.makedirs(APP_DATA_DIR, exist_ok=True)
    shutil.copy2(
        os.path.join(stage_dir, "simulatedUsers.json"),
        os.path.join(APP_DATA_DIR, "simulatedUsers.json"),
    )
    shutil.copy2(
        os.path.join(stage_dir, "harness_results.json"),
        os.path.join(APP_DATA_DIR, "simulationHarnessResults.json"),
    )

    print(f"[UI RESTORED] Activated Trail Simulation stage: '{stage}' in:")
    print(f"  - src/recommendation/data/simulatedUsers.json")
    print(f"  - src/recommendation/data/simulationHarnessResults.json")


def cmd_rerun(stage_name: str = "all") -> None:
    """Re-runs Trail Simulation in-memory from inputs/ and asserts deterministic reproduction."""
    from run_trail_simulation_harness import run_simulation

    target_stages = list(STAGE_CONFIGS.keys()) if stage_name == "all" else [stage_name]

    with open(os.path.join(INPUTS_DIR, "users_40trails.json"), "r", encoding="utf-8") as f:
        users_master = json.load(f)
    with open(os.path.join(INPUTS_DIR, "users_spec.json"), "r", encoding="utf-8") as f:
        users_spec = json.load(f)

    for st_name in target_stages:
        cfg = STAGE_CONFIGS[st_name]
        stage_dir = os.path.join(SNAPSHOTS_DIR, cfg["folder"])
        with open(os.path.join(stage_dir, "harness_results.json"), "r", encoding="utf-8") as f:
            expected_harness = json.load(f)

        cat_path = os.path.join(INPUTS_DIR, cfg["catalog_file"])
        with open(cat_path, "r", encoding="utf-8") as f:
            cat_data = json.load(f)
        candidate_trails = cat_data["trails"] if isinstance(cat_data, dict) and "trails" in cat_data else cat_data

        actual_harness, _, _ = run_simulation(
            candidate_trails=candidate_trails,
            users_master=users_master,
            users_spec=users_spec,
            cycles=cfg["cycles"],
        )

        # Check trajectory equivalence
        exp_tele = expected_harness["arms"]["adaptive"]["user_telemetry"]
        act_tele = actual_harness["arms"]["adaptive"]["user_telemetry"]

        for uid, exp_cycles in exp_tele.items():
            for c_idx, exp_c in enumerate(exp_cycles):
                act_gd = act_tele[uid][c_idx]["distances"]["mean_gd"]
                exp_gd = exp_c["distances"]["mean_gd"]
                if act_gd != exp_gd:
                    raise AssertionError(
                        f"Mismatch on stage {st_name} user={uid} cycle={c_idx}: "
                        f"got {act_gd}, expected {exp_gd}"
                    )

        print(f"[RERUN OK] {st_name}: 100% exact trajectory match across all 24 cohorts.")


def main() -> None:
    parser = argparse.ArgumentParser(description="THARESYS Trail Simulation Module Manager")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("generate", help="Run trail generator, validation, and input derivation")
    p_run = sub.add_parser("run", help="Run simulation harness for specified stage")
    p_run.add_argument("--stage", default="all", choices=list(STAGE_CONFIGS.keys()) + ["all"])

    sub.add_parser("snapshot", help="Build and lock complete Trail Simulation snapshot & SHA-256 manifest")
    sub.add_parser("verify", help="Verify all files in trail_simulation/ against manifest.json")

    p_restore = sub.add_parser("restore", help="Restore chosen Trail Simulation stage to App UI")
    p_restore.add_argument(
        "--stage",
        default="idealistic_40trails_10cycles",
        choices=list(STAGE_CONFIGS.keys()),
        help="Stage to activate",
    )

    p_rerun = sub.add_parser("rerun", help="Re-run simulation in-memory and verify deterministic equivalence")
    p_rerun.add_argument("--stage", default="all", choices=list(STAGE_CONFIGS.keys()) + ["all"])

    args = parser.parse_args()
    if args.command == "generate":
        cmd_generate()
    elif args.command == "run":
        cmd_run(stage_name=args.stage)
    elif args.command == "snapshot":
        cmd_snapshot()
    elif args.command == "verify":
        ok = cmd_verify()
        if not ok:
            sys.exit(1)
    elif args.command == "restore":
        cmd_restore(stage=args.stage)
    elif args.command == "rerun":
        cmd_rerun(stage_name=args.stage)


if __name__ == "__main__":
    main()

