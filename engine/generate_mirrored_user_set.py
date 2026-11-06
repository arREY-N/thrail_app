"""
Generates a mirrored 44-user set based on the canonical 44 cohort blueprints.
Each of the 22 unique cohort archetypes is represented by an IDENTICAL twin pair:
  - cohortXX_healthy (medical: "N", medicalProfile.hasCondition: False)
  - cohortXX_medical (medical: "M", medicalProfile.hasCondition: True)

All anchor features, preferences, experience tiers, and parameters are copied 100% identically
without pre-downshifting, ensuring that downshift evaluations measure the engine's downshift
logic rather than the dataset generator's downshift.
"""

import os
import sys
import json
import copy
from typing import Dict, Any, List, Tuple

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ENGINE_DIR = os.path.join(ROOT, "engine")
ORIGINAL_SET_PATH = os.path.join(ENGINE_DIR, "data", "seeded_user_sets", "set_1_users.json")
OUTPUT_MIRRORED_PATH = os.path.join(ENGINE_DIR, "data", "seeded_user_sets", "set_1_users_mirrored.json")


def generate_mirrored_twins(original_users_path: str, output_path: str) -> List[Dict[str, Any]]:
    with open(original_users_path, "r", encoding="utf-8") as f:
        original_users = json.load(f)

    # Filter the 22 healthy base users
    healthy_bases = [u for u in original_users if u.get("medical") == "N"]
    assert len(healthy_bases) == 22, f"Expected 22 healthy base users, found {len(healthy_bases)}"

    mirrored_set = []

    for idx, base in enumerate(healthy_bases, 1):
        pair_num = f"{idx:02d}"
        healthy_id = f"cohort{pair_num}_healthy"
        medical_id = f"cohort{pair_num}_medical"
        base_cohort_code = base.get("cohort_id", "").replace("-N-", "-")

        # 1. Healthy Twin
        healthy_user = copy.deepcopy(base)
        healthy_user["id"] = healthy_id
        healthy_user["cohort_id"] = healthy_id
        healthy_user["twin_pair_id"] = f"cohort{pair_num}"
        healthy_user["base_cohort_code"] = base_cohort_code
        healthy_user["label"] = f"Cohort {pair_num} Healthy ({base_cohort_code})"
        healthy_user["medical"] = "N"
        healthy_user["medicalProfile"] = {"hasCondition": False}
        if "profile" in healthy_user:
            if "easy" in healthy_user["profile"] and "metadata" in healthy_user["profile"]["easy"]:
                healthy_user["profile"]["easy"]["metadata"]["id"] = healthy_id
            if "difficult" in healthy_user["profile"] and "metadata" in healthy_user["profile"]["difficult"]:
                healthy_user["profile"]["difficult"]["metadata"]["id"] = healthy_id

        # 2. Medical Twin (Exact clone of Healthy Twin, with ONLY medical flags flipped)
        medical_user = copy.deepcopy(healthy_user)
        medical_user["id"] = medical_id
        medical_user["cohort_id"] = medical_id
        medical_user["twin_pair_id"] = f"cohort{pair_num}"
        medical_user["base_cohort_code"] = base_cohort_code
        medical_user["label"] = f"Cohort {pair_num} Medical ({base_cohort_code})"
        medical_user["medical"] = "M"
        medical_user["medicalProfile"] = {"hasCondition": True}
        if "profile" in medical_user:
            if "easy" in medical_user["profile"] and "metadata" in medical_user["profile"]["easy"]:
                medical_user["profile"]["easy"]["metadata"]["id"] = medical_id
            if "difficult" in medical_user["profile"] and "metadata" in medical_user["profile"]["difficult"]:
                medical_user["profile"]["difficult"]["metadata"]["id"] = medical_id

        mirrored_set.append(healthy_user)
        mirrored_set.append(medical_user)

    assert len(mirrored_set) == 44, f"Expected 44 mirrored users, got {len(mirrored_set)}"

    # Save to new file
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(mirrored_set, f, indent=2)

    print(f"[OK] Saved {len(mirrored_set)} mirrored users to: {output_path}")
    return mirrored_set


def verify_field_by_field_loudly(mirrored_users: List[Dict[str, Any]]):
    """
    Compares each pair field by field and confirms the ONLY differences are:
      - user id / cohort_id / label / profile metadata id
      - medical flag ('N' vs 'M')
      - medicalProfile.hasCondition (False vs True)
    Fails loudly with AssertionError if any other field differs.
    """
    pairs: Dict[str, Dict[str, Any]] = {}
    for u in mirrored_users:
        twin_id = u["twin_pair_id"]
        if twin_id not in pairs:
            pairs[twin_id] = {}
        if u["medical"] == "N":
            pairs[twin_id]["healthy"] = u
        else:
            pairs[twin_id]["medical"] = u

    print(f"\nRunning loud field-by-field verification on {len(pairs)} twin pairs...")

    for pair_id, p in sorted(pairs.items()):
        assert "healthy" in p, f"LOUD FAILURE: Missing healthy twin for {pair_id}"
        assert "medical" in p, f"LOUD FAILURE: Missing medical twin for {pair_id}"

        h = p["healthy"]
        m = p["medical"]

        # Confirm medical flags are strictly opposite
        assert h["medical"] == "N", f"LOUD FAILURE [{pair_id}]: healthy twin medical != 'N'"
        assert m["medical"] == "M", f"LOUD FAILURE [{pair_id}]: medical twin medical != 'M'"
        assert h["medicalProfile"]["hasCondition"] is False, f"LOUD FAILURE [{pair_id}]: healthy twin hasCondition is not False"
        assert m["medicalProfile"]["hasCondition"] is True, f"LOUD FAILURE [{pair_id}]: medical twin hasCondition is not True"

        # Check all top-level keys
        assert set(h.keys()) == set(m.keys()), f"LOUD FAILURE [{pair_id}]: Key mismatch between twins: {set(h.keys()) ^ set(m.keys())}"

        allowed_different_keys = {"id", "cohort_id", "label", "medical", "medicalProfile"}

        for k in h.keys():
            if k in allowed_different_keys:
                continue

            if k == "profile":
                for anchor in ("easy", "difficult"):
                    assert anchor in h["profile"] and anchor in m["profile"], f"LOUD FAILURE [{pair_id}]: missing anchor {anchor}"
                    h_anchor = h["profile"][anchor]
                    m_anchor = m["profile"][anchor]

                    # Features must be 100% IDENTICAL
                    h_feats = h_anchor["features"]
                    m_feats = m_anchor["features"]
                    assert h_feats == m_feats, (
                        f"LOUD FAILURE [{pair_id}]: {anchor} features mismatch!\n"
                        f"Healthy: {h_feats}\nMedical: {m_feats}"
                    )
            elif k == "preferences":
                assert h["preferences"] == m["preferences"], (
                    f"LOUD FAILURE [{pair_id}]: preferences mismatch!\n"
                    f"Healthy: {h['preferences']}\nMedical: {m['preferences']}"
                )
            elif k == "groundTruth":
                assert h["groundTruth"] == m["groundTruth"], (
                    f"LOUD FAILURE [{pair_id}]: groundTruth mismatch!\n"
                    f"Healthy: {h['groundTruth']}\nMedical: {m['groundTruth']}"
                )
            else:
                assert h[k] == m[k], f"LOUD FAILURE [{pair_id}]: Field '{k}' differs: healthy='{h[k]}', medical='{m[k]}'"

        print(f"  [PASS] {pair_id} ({h['id']} vs {m['id']}) - 100% identical except medical condition flags.")

    print("\n[ALL CHECKS PASSED] Every pair is identical bit-for-bit in all anchor features, preferences, tiers, and ground truth.")


if __name__ == "__main__":
    mirrored = generate_mirrored_twins(ORIGINAL_SET_PATH, OUTPUT_MIRRORED_PATH)
    verify_field_by_field_loudly(mirrored)

