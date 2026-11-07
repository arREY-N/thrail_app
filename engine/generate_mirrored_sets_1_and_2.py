import os
import sys
import json
import copy
from typing import Dict, Any, List

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ENGINE_DIR = os.path.join(ROOT, "engine")
SEEDED_DIR = os.path.join(ENGINE_DIR, "data", "seeded_user_sets")


def generate_mirrored_set(set_num: int):
    input_path = os.path.join(SEEDED_DIR, f"set_{set_num}_users.json")
    output_path = os.path.join(SEEDED_DIR, f"set_{set_num}_users_mirrored.json")

    with open(input_path, "r", encoding="utf-8") as f:
        original_users = json.load(f)

    healthy_bases = [u for u in original_users if u.get("medical") == "N"]
    assert len(healthy_bases) == 22, f"Expected 22 healthy base users in Set {set_num}, found {len(healthy_bases)}"

    mirrored_set = []

    for idx, base in enumerate(healthy_bases, 1):
        pair_num = f"{idx:02d}"
        healthy_id = f"s{set_num}_cohort{pair_num}_healthy" if set_num > 1 else f"cohort{pair_num}_healthy"
        medical_id = f"s{set_num}_cohort{pair_num}_medical" if set_num > 1 else f"cohort{pair_num}_medical"
        base_cohort_code = base.get("cohort_id", "").replace("-N-", "-")

        # 1. Healthy Twin
        healthy_user = copy.deepcopy(base)
        healthy_user["id"] = healthy_id
        healthy_user["cohort_id"] = healthy_id
        healthy_user["twin_pair_id"] = f"cohort{pair_num}"
        healthy_user["base_cohort_code"] = base_cohort_code
        healthy_user["label"] = f"Set {set_num} Cohort {pair_num} Healthy ({base_cohort_code})"
        healthy_user["medical"] = "N"
        healthy_user["medicalProfile"] = {"hasCondition": False}
        if "profile" in healthy_user:
            if "easy" in healthy_user["profile"] and "metadata" in healthy_user["profile"]["easy"]:
                healthy_user["profile"]["easy"]["metadata"]["id"] = healthy_id
            if "difficult" in healthy_user["profile"] and "metadata" in healthy_user["profile"]["difficult"]:
                healthy_user["profile"]["difficult"]["metadata"]["id"] = healthy_id

        # 2. Medical Twin
        medical_user = copy.deepcopy(healthy_user)
        medical_user["id"] = medical_id
        medical_user["cohort_id"] = medical_id
        medical_user["twin_pair_id"] = f"cohort{pair_num}"
        medical_user["base_cohort_code"] = base_cohort_code
        medical_user["label"] = f"Set {set_num} Cohort {pair_num} Medical ({base_cohort_code})"
        medical_user["medical"] = "M"
        medical_user["medicalProfile"] = {"hasCondition": True}
        if "profile" in medical_user:
            if "easy" in medical_user["profile"] and "metadata" in medical_user["profile"]["easy"]:
                medical_user["profile"]["easy"]["metadata"]["id"] = medical_id
            if "difficult" in medical_user["profile"] and "metadata" in medical_user["profile"]["difficult"]:
                medical_user["profile"]["difficult"]["metadata"]["id"] = medical_id

        mirrored_set.append(healthy_user)
        mirrored_set.append(medical_user)

    assert len(mirrored_set) == 44, f"Expected 44 mirrored users in Set {set_num}, got {len(mirrored_set)}"

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(mirrored_set, f, indent=2)

    print(f"[OK] Generated Set {set_num} Mirrored Set: {output_path} ({len(mirrored_set)} users)")
    return mirrored_set


def verify_loudly(mirrored_users: List[Dict[str, Any]], set_num: int):
    pairs = {}
    for u in mirrored_users:
        twin_id = u["twin_pair_id"]
        if twin_id not in pairs:
            pairs[twin_id] = {}
        if u["medical"] == "N":
            pairs[twin_id]["healthy"] = u
        else:
            pairs[twin_id]["medical"] = u

    print(f"\nVerifying field-by-field Set {set_num} ({len(pairs)} pairs)...")
    for pair_id, p in sorted(pairs.items()):
        assert "healthy" in p and "medical" in p
        h, m = p["healthy"], p["medical"]
        assert h["medical"] == "N" and m["medical"] == "M"
        assert h["medicalProfile"]["hasCondition"] is False
        assert m["medicalProfile"]["hasCondition"] is True
        assert h["preferences"] == m["preferences"]
        assert h["profile"]["easy"]["features"] == m["profile"]["easy"]["features"]
        assert h["profile"]["difficult"]["features"] == m["profile"]["difficult"]["features"]
    print(f"[PASS] Set {set_num} 100% verified! Only medical condition flags differ.")


if __name__ == "__main__":
    for s in [1, 2]:
        m = generate_mirrored_set(s)
        verify_loudly(m, s)

