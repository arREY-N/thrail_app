"""
Step 2 of the profile simulation plan: define the 24 simulated users (survey answers only).

Reads the exported trails (trails.json) so that ticked trails use the exact full trail names,
and writes users_spec.json. Deterministic: same trails export gives byte-identical output.

Usage (from repo root):
    python scripts/simulation/define_users.py
"""

import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "output")

# Experience level -> unique name fragments of the ticked trails (plan section 5, step 2)
EXPERIENCE = {
    "E1": [],
    "E2": ["Kulis", "Tagapo"],
    "E3": ["Tagapo", "Makiling Traverse"],
    "E4": ["Mariang Makiling", "Makiling Traverse"],
}
MEDICAL = {"M": True, "N": False}
PROVINCES = {
    "P1": ["Rizal"],
    "P2": ["Batangas", "Laguna"],
    "P3": ["Cavite"],
}


def resolve(trails, fragment):
    hits = [t for t in trails if fragment.lower() in t["general"]["name"].lower()]
    if len(hits) != 1:
        raise SystemExit(f"Fragment '{fragment}' matched {len(hits)} trails, expected exactly 1")
    return hits[0]


def main():
    with open(os.path.join(OUT_DIR, "trails.json"), encoding="utf-8") as f:
        trails = json.load(f)

    users = []
    for exp, fragments in EXPERIENCE.items():
        ticked = [resolve(trails, fr) for fr in fragments]
        for med, has_condition in MEDICAL.items():
            for prov, provinces in PROVINCES.items():
                users.append({
                    "id": f"{exp}-{med}-{prov}",
                    "experience": exp,
                    "medical": med,
                    "province_pattern": prov,
                    "medicalProfile": {"hasCondition": has_condition},
                    "preferences": {
                        "province": provinces,
                        "location": [t["general"]["name"] for t in ticked],
                    },
                    "expected_trail_ids": sorted(t["id"] for t in ticked),
                })

    users.sort(key=lambda u: u["id"])
    ids = [u["id"] for u in users]
    assert len(users) == 24 and len(set(ids)) == 24, "expected 24 unique users"

    path = os.path.join(OUT_DIR, "users_spec.json")
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(users, f, indent=2, sort_keys=True, ensure_ascii=False)
    print(f"Wrote {len(users)} users to {path}")
    print(", ".join(ids))


if __name__ == "__main__":
    main()

