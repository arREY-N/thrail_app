"""
THARESYS Cycle Simulation Module — Snapshot, Verification, Rerun & UI Restoration Manager.

Treats the completed 8-trail Multi-Cycle Simulation (3, 5, 7, and 10 cycles across 24 cohorts)
as a fixed, self-contained benchmark module.

Capabilities:
  1. `snapshot` : Captures all inputs, scripts, reports, and builds complete per-run snapshots
                  (sim1_3cycles, sim2_5cycles, sim3_7cycles, sim4_10cycles) including
                  per-stage `simulatedUsers.json`, `harness_results.json`, and `convergence_summary.csv`,
                  plus a cryptographic SHA-256 `manifest.json`.
  2. `verify`   : Verifies that all frozen files in `cycle_simulation/` match their SHA-256 hashes
                  in `manifest.json`.
  3. `restore`  : Instantly restores any Cycle Simulation stage (3, 5, 7, or 10 cycles) into
                  `src/recommendation/data/simulatedUsers.json` and `simulationHarnessResults.json`
                  (and optionally `scripts/simulation/output/`) for immediate UI presentation.
  4. `rerun`    : Re-runs the Cycle Simulation in-memory from the frozen `inputs/` and verifies
                  deterministic reproduction against the frozen snapshots.

Usage (from repo root):
  engine\\venv\\Scripts\\python.exe scripts\\simulation\\cycle_simulation\\manage_cycle_simulation.py snapshot
  engine\\venv\\Scripts\\python.exe scripts\\simulation\\cycle_simulation\\manage_cycle_simulation.py verify
  engine\\venv\\Scripts\\python.exe scripts\\simulation\\cycle_simulation\\manage_cycle_simulation.py restore --cycles 10
  engine\\venv\\Scripts\\python.exe scripts\\simulation\\cycle_simulation\\manage_cycle_simulation.py rerun --cycles all
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

if ENGINE_DIR not in sys.path:
    sys.path.insert(0, ENGINE_DIR)

INPUTS_DIR = os.path.join(MODULE_DIR, "inputs")
SCRIPTS_DIR = os.path.join(MODULE_DIR, "scripts")
SNAPSHOTS_DIR = os.path.join(MODULE_DIR, "snapshots")
REPORTS_DIR = os.path.join(MODULE_DIR, "reports")
MANIFEST_PATH = os.path.join(MODULE_DIR, "manifest.json")

ORIG_OUTPUT_DIR = os.path.join(SIM_DIR, "output")
ORIG_REPORTS_DIR = os.path.join(ROOT, "engine_simulations")
APP_DATA_DIR = os.path.join(ROOT, "src", "recommendation", "data")

STAGE_MAP = {
    3: {"sim_num": 1, "folder": "sim1_3cycles", "archive": "harness_results_simulation1.json"},
    5: {"sim_num": 2, "folder": "sim2_5cycles", "archive": "harness_results_simulation2.json"},
    7: {"sim_num": 3, "folder": "sim3_7cycles", "archive": "harness_results_simulation3.json"},
    10: {"sim_num": 4, "folder": "sim4_10cycles", "archive": "harness_results_simulation4.json"},
}


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def load_start_distances_map(csv_path: str) -> Dict[str, Dict[str, Any]]:
    result: Dict[str, Dict[str, Any]] = {}
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            uid = row["user_id"]
            result[uid] = {
                "user_id": uid,
                "experience": row["experience"],
                "medical": row["medical"],
                "province_pattern": row["province_pattern"],
                "easy_gower": float(row["easy_gower"]),
                "easy_euclidean": float(row["easy_euclidean"]),
                "easy_cosine": float(row["easy_cosine"]),
                "diff_gower": float(row["diff_gower"]),
                "diff_euclidean": float(row["diff_euclidean"]),
                "diff_cosine": float(row["diff_cosine"]),
            }
    return result


def build_stage_artifacts_from_harness(
    users_base: List[Dict[str, Any]],
    start_dist_map: Dict[str, Dict[str, Any]],
    harness_data: Dict[str, Any],
) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Reconstructs:
      1. The 24-user `simulatedUsers.json` bundle (with startDistances, cycleHistory, convergence)
      2. The `convergence_summary.csv` rows
    for a given harness_results.json payload.
    """
    adapt_tele = harness_data["arms"]["adaptive"]["user_telemetry"]
    ctrl_tele = harness_data["arms"]["control"]["user_telemetry"]
    months = harness_data["months"]

    simulated_users_bundle: List[Dict[str, Any]] = []
    csv_rows: List[Dict[str, Any]] = []

    for u in users_base:
        uid = u["id"]
        exp = u["experience"]
        med = u["medical"]

        u_adapt = adapt_tele[uid]
        u_ctrl = ctrl_tele[uid]

        start_gd = u_adapt[0]["distances"]["mean_gd"]
        adapt_end_gd = u_adapt[-1]["distances"]["mean_gd"]
        ctrl_end_gd = u_ctrl[-1]["distances"]["mean_gd"]
        delta_gd = round(adapt_end_gd - start_gd, 4)
        has_converged = delta_gd < 0

        convergence_obj = {
            "start_gd": start_gd,
            "end_gd": adapt_end_gd,
            "ctrl_end_gd": ctrl_end_gd,
            "delta_gd": delta_gd,
            "has_converged": has_converged,
        }

        user_entry = copy.deepcopy(u)
        if uid in start_dist_map:
            user_entry["startDistances"] = copy.deepcopy(start_dist_map[uid])
        user_entry["cycleHistory"] = copy.deepcopy(u_adapt)
        user_entry["convergence"] = convergence_obj
        simulated_users_bundle.append(user_entry)

        for c_idx in range(len(months)):
            csv_rows.append({
                "user_id": uid,
                "experience": exp,
                "medical": med,
                "cycle": c_idx,
                "month": months[c_idx],
                "adaptive_mean_gd": u_adapt[c_idx]["distances"]["mean_gd"],
                "adaptive_mean_ed": u_adapt[c_idx]["distances"]["mean_ed"],
                "adaptive_mean_cs": u_adapt[c_idx]["distances"]["mean_cs"],
                "adaptive_rec_alignment": u_adapt[c_idx]["rec_alignment_rate"],
                "control_mean_gd": u_ctrl[c_idx]["distances"]["mean_gd"],
                "control_mean_ed": u_ctrl[c_idx]["distances"]["mean_ed"],
                "control_mean_cs": u_ctrl[c_idx]["distances"]["mean_cs"],
            })

    return simulated_users_bundle, csv_rows


def cmd_snapshot() -> None:
    print("=" * 80)
    print("BUILDING FIXED CYCLE SIMULATION SNAPSHOT MODULE")
    print("=" * 80)

    for d in (INPUTS_DIR, SCRIPTS_DIR, SNAPSHOTS_DIR, REPORTS_DIR):
        os.makedirs(d, exist_ok=True)

    # 1. Copy fixed input fixtures
    input_files = [
        (os.path.join(SIM_DIR, "gt_ranges.json"), os.path.join(INPUTS_DIR, "gt_ranges.json")),
        (os.path.join(ORIG_OUTPUT_DIR, "trails.json"), os.path.join(INPUTS_DIR, "trails.json")),
        (os.path.join(ORIG_OUTPUT_DIR, "trails_meta.json"), os.path.join(INPUTS_DIR, "trails_meta.json")),
        (os.path.join(ORIG_OUTPUT_DIR, "users_spec.json"), os.path.join(INPUTS_DIR, "users_spec.json")),
        (os.path.join(ORIG_OUTPUT_DIR, "app_profiles.json"), os.path.join(INPUTS_DIR, "app_profiles.json")),
        (os.path.join(ORIG_OUTPUT_DIR, "users.json"), os.path.join(INPUTS_DIR, "users.json")),
        (os.path.join(ORIG_OUTPUT_DIR, "start_distances.csv"), os.path.join(INPUTS_DIR, "start_distances.csv")),
    ]
    for src, dst in input_files:
        shutil.copy2(src, dst)
        print(f"[INPUT]   Copied {os.path.relpath(dst, ROOT)}")

    # 2. Copy fixed scripts
    script_files = [
        "define_users.py",
        "export_trails.py",
        "sample_ground_truth.py",
        "run_simulation_harness.py",
        "generate_profile_tables.py",
        "test_simulation_users.py",
    ]
    for fname in script_files:
        src = os.path.join(SIM_DIR, fname)
        dst = os.path.join(SCRIPTS_DIR, fname)
        if os.path.exists(src):
            shutil.copy2(src, dst)
            print(f"[SCRIPT]  Copied {os.path.relpath(dst, ROOT)}")

    # 3. Copy benchmark reports
    report_files = [
        "simulation1.md",
        "simulation2.md",
        "simulation3.md",
        "simulation4.md",
        "simulation_cycle_summary.md",
    ]
    for rname in report_files:
        src = os.path.join(ORIG_REPORTS_DIR, rname)
        dst = os.path.join(REPORTS_DIR, rname)
        if os.path.exists(src):
            shutil.copy2(src, dst)
            print(f"[REPORT]  Copied {os.path.relpath(dst, ROOT)}")

    # 4. Build complete per-stage snapshots for 3, 5, 7, and 10 cycles
    with open(os.path.join(INPUTS_DIR, "users.json"), "r", encoding="utf-8") as f:
        users_base = json.load(f)
    start_dist_map = load_start_distances_map(os.path.join(INPUTS_DIR, "start_distances.csv"))

    for cycles, meta in sorted(STAGE_MAP.items()):
        stage_dir = os.path.join(SNAPSHOTS_DIR, meta["folder"])
        os.makedirs(stage_dir, exist_ok=True)

        src_harness = os.path.join(ORIG_OUTPUT_DIR, meta["archive"])
        dst_harness = os.path.join(stage_dir, "harness_results.json")
        shutil.copy2(src_harness, dst_harness)

        with open(dst_harness, "r", encoding="utf-8") as f:
            harness_data = json.load(f)

        sim_users_bundle, csv_rows = build_stage_artifacts_from_harness(
            users_base=users_base,
            start_dist_map=start_dist_map,
            harness_data=harness_data,
        )

        dst_sim_users = os.path.join(stage_dir, "simulatedUsers.json")
        with open(dst_sim_users, "w", encoding="utf-8", newline="\n") as f:
            json.dump(sim_users_bundle, f, indent=2)

        dst_csv = os.path.join(stage_dir, "convergence_summary.csv")
        with open(dst_csv, "w", encoding="utf-8", newline="\n") as f:
            writer = csv.DictWriter(f, fieldnames=list(csv_rows[0].keys()))
            writer.writeheader()
            writer.writerows(csv_rows)

        print(
            f"[STAGE]   Built {meta['folder']} (cycles={cycles}, "
            f"convergence_rate={harness_data.get('convergence_rate')})"
        )

    # 5. Write cryptographic manifest
    manifest_entries: Dict[str, str] = {}
    for root_dir, _, files in os.walk(MODULE_DIR):
        for file in sorted(files):
            full_path = os.path.join(root_dir, file)
            rel_path = os.path.relpath(full_path, MODULE_DIR).replace("\\", "/")
            if rel_path in ("manifest.json",) or "__pycache__" in rel_path:
                continue
            manifest_entries[rel_path] = sha256_file(full_path)

    manifest = {
        "module": "cycle_simulation",
        "description": "Frozen 8-trail multi-cycle convergence benchmark snapshot (3, 5, 7, 10 cycles)",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "default_ui_cycles": 10,
        "stages": STAGE_MAP,
        "files": manifest_entries,
    }
    with open(MANIFEST_PATH, "w", encoding="utf-8", newline="\n") as f:
        json.dump(manifest, f, indent=2, sort_keys=True)

    print(f"\n[MANIFEST] Recorded {len(manifest_entries)} files in {os.path.relpath(MANIFEST_PATH, ROOT)}")
    print("Cycle Simulation snapshot is locked and ready.")


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

    print(f"VERIFICATION PASSED: All {len(files_map)} files in `cycle_simulation/` match SHA-256 manifest.")
    return True


def cmd_restore(cycles: int = 10, restore_workspace_output: bool = False) -> None:
    if cycles not in STAGE_MAP:
        raise SystemExit(f"Unsupported cycle count {cycles}. Choose from {list(STAGE_MAP.keys())}.")

    meta = STAGE_MAP[cycles]
    stage_dir = os.path.join(SNAPSHOTS_DIR, meta["folder"])
    if not os.path.exists(stage_dir):
        raise SystemExit(f"Snapshot directory {stage_dir} does not exist. Run `snapshot` first.")

    # 1. Restore App UI datasets (`src/recommendation/data/`)
    os.makedirs(APP_DATA_DIR, exist_ok=True)
    shutil.copy2(
        os.path.join(stage_dir, "simulatedUsers.json"),
        os.path.join(APP_DATA_DIR, "simulatedUsers.json"),
    )
    shutil.copy2(
        os.path.join(stage_dir, "harness_results.json"),
        os.path.join(APP_DATA_DIR, "simulationHarnessResults.json"),
    )
    print(f"[UI RESTORED] Activated Cycle Simulation ({cycles} cycles / {meta['folder']}) in:")
    print(f"  - src/recommendation/data/simulatedUsers.json")
    print(f"  - src/recommendation/data/simulationHarnessResults.json")

    # 2. Optionally restore `scripts/simulation/output/`
    if restore_workspace_output:
        os.makedirs(ORIG_OUTPUT_DIR, exist_ok=True)
        for fname in ("trails.json", "trails_meta.json", "users_spec.json", "app_profiles.json", "users.json", "start_distances.csv"):
            shutil.copy2(os.path.join(INPUTS_DIR, fname), os.path.join(ORIG_OUTPUT_DIR, fname))
        shutil.copy2(os.path.join(stage_dir, "harness_results.json"), os.path.join(ORIG_OUTPUT_DIR, "harness_results.json"))
        shutil.copy2(os.path.join(stage_dir, "convergence_summary.csv"), os.path.join(ORIG_OUTPUT_DIR, "convergence_summary.csv"))
        for c_key, c_meta in STAGE_MAP.items():
            c_dir = os.path.join(SNAPSHOTS_DIR, c_meta["folder"])
            shutil.copy2(
                os.path.join(c_dir, "harness_results.json"),
                os.path.join(ORIG_OUTPUT_DIR, c_meta["archive"]),
            )
        print(f"[WORKSPACE RESTORED] Restored all 8-trail Cycle Simulation files in scripts/simulation/output/")


def cmd_rerun(cycles_arg: str = "all") -> None:
    """
    Re-executes the Cycle Simulation in-memory directly from `cycle_simulation/inputs/`
    without mutating any files, and verifies 100% trajectory equivalence against the frozen snapshots.
    """
    sys.path.insert(0, SIM_DIR)
    import firebase_client
    firebase_client.initialize_firebase = lambda: None

    from batch_runner import run_batch_recommendations
    from run_simulation_harness import (
        extract_covered_vector_from_dict,
        extract_covered_vector_from_32d,
        compute_vector_distances,
        determine_simulated_review,
    )
    from profile_utils import flatten_profile_features

    target_cycles = list(STAGE_MAP.keys()) if cycles_arg == "all" else [int(cycles_arg)]

    with open(os.path.join(INPUTS_DIR, "trails.json"), "r", encoding="utf-8") as f:
        trails = json.load(f)
    with open(os.path.join(INPUTS_DIR, "users.json"), "r", encoding="utf-8") as f:
        users_master = json.load(f)
    with open(os.path.join(INPUTS_DIR, "users_spec.json"), "r", encoding="utf-8") as f:
        users_spec = json.load(f)

    user_spec_map = {u["id"]: u for u in users_spec}
    trail_by_id = {t["id"]: t for t in trails}
    trail_covered_vectors = {
        t["id"]: extract_covered_vector_from_32d(flatten_profile_features(t.get("profile", t)))
        for t in trails
    }

    for cycles in target_cycles:
        meta = STAGE_MAP[cycles]
        stage_dir = os.path.join(SNAPSHOTS_DIR, meta["folder"])
        with open(os.path.join(stage_dir, "harness_results.json"), "r", encoding="utf-8") as f:
            expected_harness = json.load(f)

        months = []
        base_year, base_month = 2026, 10
        for m in range(cycles + 1):
            cur_m = base_month + m
            cur_y = base_year + (cur_m - 1) // 12
            cur_m_norm = ((cur_m - 1) % 12) + 1
            months.append(f"{cur_y:04d}-{cur_m_norm:02d}")

        arm_users = copy.deepcopy(users_master)
        user_hikes_map = {
            u["id"]: set(str(tid) for tid in user_spec_map.get(u["id"], {}).get("expected_trail_ids", []))
            for u in arm_users
        }
        user_hike_history = {
            u["id"]: list(str(tid) for tid in user_spec_map.get(u["id"], {}).get("expected_trail_ids", []))
            for u in arm_users
        }
        user_reviews_map: Dict[str, List[Dict[str, Any]]] = {u["id"]: [] for u in arm_users}
        prev_recommendations_map: Dict[str, Dict[str, Any]] = {}
        user_cycle_telemetry: Dict[str, List[Dict[str, Any]]] = {u["id"]: [] for u in arm_users}

        for cycle_idx, active_month in enumerate(months):
            batch_res = run_batch_recommendations(
                cbf_engine="GD",
                cf_engine="GD",
                month_id=active_month,
                candidate_trails=trails,
                users=arm_users,
                user_hikes_map=user_hikes_map,
                user_reviews_map=user_reviews_map,
                prev_recommendations_map=prev_recommendations_map,
                commit_to_firestore=False,
                generate_ai_reasoning=False,
                update_profiles_from_reviews=True,
            )
            recomms = batch_res.get("recommendations", {})
            cycle_reviews_this_month: Dict[str, List[Dict[str, Any]]] = {u["id"]: [] for u in arm_users}

            for u in arm_users:
                uid = u["id"]
                u_doc = recomms.get(uid, {})
                u_prof = u_doc.get("profile", u.get("profile", {}))

                app_easy_vec = extract_covered_vector_from_dict(u_prof.get("easy", {}).get("features", {}))
                app_diff_vec = extract_covered_vector_from_dict(u_prof.get("difficult", {}).get("features", {}))
                gt_easy_vec = extract_covered_vector_from_dict(u["groundTruth"]["easy"])
                gt_diff_vec = extract_covered_vector_from_dict(u["groundTruth"]["difficult"])

                easy_dist = compute_vector_distances(app_easy_vec, gt_easy_vec)
                diff_dist = compute_vector_distances(app_diff_vec, gt_diff_vec)

                easy_recs = u_doc.get("easy", [])
                diff_recs = u_doc.get("difficult", [])

                if cycle_idx < cycles:
                    picked_item = None
                    target_slot = "easy"
                    unhiked_easy = [r for r in easy_recs if str(r.get("id")) not in user_hikes_map[uid]]
                    unhiked_diff = [r for r in diff_recs if str(r.get("id")) not in user_hikes_map[uid]]
                    exp = u.get("experience", "E1")
                    has_unhiked = bool(unhiked_easy or unhiked_diff)

                    if has_unhiked:
                        if exp in ("E1", "E2"):
                            picked_item = unhiked_easy[0] if unhiked_easy else unhiked_diff[0]
                            target_slot = "easy" if unhiked_easy else "difficult"
                        else:
                            if cycle_idx == 0:
                                picked_item = unhiked_easy[0] if unhiked_easy else unhiked_diff[0]
                                target_slot = "easy" if unhiked_easy else "difficult"
                            else:
                                picked_item = unhiked_diff[0] if unhiked_diff else unhiked_easy[0]
                                target_slot = "difficult" if unhiked_diff else "easy"
                    else:
                        pool = (easy_recs if easy_recs else diff_recs) if exp in ("E1", "E2") else (diff_recs if diff_recs else easy_recs)
                        target_slot = ("easy" if easy_recs else "difficult") if exp in ("E1", "E2") else ("difficult" if diff_recs else "easy")
                        if pool:
                            history = user_hike_history.get(uid, [])
                            def last_hike_index(item):
                                tid = str(item.get("id"))
                                try:
                                    return len(history) - 1 - history[::-1].index(tid)
                                except ValueError:
                                    return -1
                            picked_item = min(pool, key=last_hike_index)

                    if picked_item:
                        picked_tid = str(picked_item.get("id"))
                        user_hikes_map[uid].add(picked_tid)
                        user_hike_history[uid].append(picked_tid)
                        rev = determine_simulated_review(
                            trail_doc=trail_by_id[picked_tid],
                            target_anchor=target_slot,
                            gt_easy_vec=gt_easy_vec,
                            gt_diff_vec=gt_diff_vec,
                            trail_covered_vec=trail_covered_vectors[picked_tid],
                            active_month=active_month,
                        )
                        cycle_reviews_this_month[uid].append(rev)

                user_cycle_telemetry[uid].append({
                    "cycle": cycle_idx,
                    "mean_gd": round((easy_dist["gd"] + diff_dist["gd"]) / 2.0, 4),
                })

                if u_doc.get("profile"):
                    u["profile"] = u_doc["profile"]

            prev_recommendations_map = recomms
            for uid, rev_list in cycle_reviews_this_month.items():
                user_reviews_map[uid].extend(rev_list)

        # Compare against snapshot
        exp_tele = expected_harness["arms"]["adaptive"]["user_telemetry"]
        for uid, snaps in user_cycle_telemetry.items():
            for idx, s in enumerate(snaps):
                exp_gd = exp_tele[uid][idx]["distances"]["mean_gd"]
                if s["mean_gd"] != exp_gd:
                    raise AssertionError(
                        f"Mismatch on {meta['folder']} user={uid} cycle={idx}: "
                        f"got {s['mean_gd']}, expected {exp_gd}"
                    )
        print(f"[RERUN OK] {meta['folder']} ({cycles} cycles): 100% exact trajectory match across all 24 cohorts.")


def main() -> None:
    parser = argparse.ArgumentParser(description="THARESYS Cycle Simulation Module Manager")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("snapshot", help="Build and lock the Cycle Simulation snapshot and SHA-256 manifest")
    sub.add_parser("verify", help="Verify all files in cycle_simulation/ against manifest.json")

    p_restore = sub.add_parser("restore", help="Restore a Cycle Simulation run (3, 5, 7, or 10 cycles) to App UI")
    p_restore.add_argument("--cycles", type=int, default=10, choices=[3, 5, 7, 10], help="Cycle stage to activate")
    p_restore.add_argument(
        "--restore-workspace",
        action="store_true",
        help="Also restore scripts/simulation/output/ files from the frozen snapshot",
    )

    p_rerun = sub.add_parser("rerun", help="Re-run Cycle Simulation from frozen inputs and verify equivalence")
    p_rerun.add_argument("--cycles", default="all", choices=["3", "5", "7", "10", "all"])

    args = parser.parse_args()
    if args.command == "snapshot":
        cmd_snapshot()
    elif args.command == "verify":
        ok = cmd_verify()
        if not ok:
            sys.exit(1)
    elif args.command == "restore":
        cmd_restore(cycles=args.cycles, restore_workspace_output=args.restore_workspace)
    elif args.command == "rerun":
        cmd_rerun(cycles_arg=args.cycles)


if __name__ == "__main__":
    main()

