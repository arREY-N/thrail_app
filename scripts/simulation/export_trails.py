"""
Read-only trail export for the THARESYS profile simulation.

Reads /trails from Firestore (no writes) and writes:
  - trails.json : trail documents exactly as stored (nested profile, nulls kept), sorted by id
  - trails_meta.json : trail count, content SHA-256, export time, source project

Re-run this script whenever trails are added or changed; the hash shows whether anything differs.

Usage (from repo root):
    engine\\venv\\Scripts\\python.exe scripts\\simulation\\export_trails.py [--out scripts/simulation/output]
"""

import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "engine"))

from firebase_client import initialize_firebase, fetch_trails  # noqa: E402  # pyright: ignore[reportMissingImports]


def _json_default(o):
    if hasattr(o, "isoformat"):
        return o.isoformat()
    if hasattr(o, "latitude") and hasattr(o, "longitude"):
        return {"latitude": o.latitude, "longitude": o.longitude}
    return str(o)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default=os.path.join(ROOT, "scripts", "simulation", "output"))
    args = parser.parse_args()

    db = initialize_firebase()
    if db is None:
        sys.exit("Could not connect to Firestore; nothing exported.")

    trails = sorted(fetch_trails(db), key=lambda t: str(t.get("id")))
    if not trails:
        sys.exit("No trails found; nothing exported.")

    # Round-trip through JSON so the hash covers exactly what is written
    body = json.dumps(trails, indent=2, sort_keys=True, ensure_ascii=False, default=_json_default)
    digest = hashlib.sha256(body.encode("utf-8")).hexdigest()

    os.makedirs(args.out, exist_ok=True)
    with open(os.path.join(args.out, "trails.json"), "w", encoding="utf-8", newline="\n") as f:
        f.write(body)
    meta = {
        "trail_count": len(trails),
        "trail_ids": [t.get("id") for t in trails],
        "sha256": digest,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "project": db.project,
    }
    with open(os.path.join(args.out, "trails_meta.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(meta, f, indent=2)

    print(f"Exported {len(trails)} trails to {args.out}")
    print(f"sha256 {digest}")


if __name__ == "__main__":
    main()

