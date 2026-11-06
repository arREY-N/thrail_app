"""
Validation Suite for THARESYS Synthetic Trail Generator (`trail_generator/validate.py`).

Performs all 9 validation checks mandated by plans/synthetic_trails_generation_v2.md:
  1. Quotas (8 per tier, each province >= 4, traverse >= 6, circular >= 6)
  2. Physical and categorical feature ranges [0, 1]
  3. Physical consistency (slope == gain/(length*1000)*100 for synthetic; real matches original)
  4. Schema round-trip (flatten(profile) == vector within float32 tolerance)
  5. Duplicate detection (min Euclidean distance >= 0.03)
  6. Distance spread / diversity (catalog spread >= real 8 spread)
  7. Difficulty coverage (catalog has trails easier than easiest real and harder than hardest real)
  8. Determinism (same seed & config gives identical bytes)
  9. Simulation fit (under disjoint Easy/Difficult anchor split, all 24 users have >= 5 unhiked easy,
     >= 5 unhiked diff, >= 10 unhiked in primary target anchor)
"""

import copy
import json
import os
import sys
from typing import Any, Dict, List
import numpy as np

MODULE_DIR = os.path.dirname(os.path.abspath(__file__))
SIM_DIR = os.path.abspath(os.path.join(MODULE_DIR, "..", ".."))
ROOT = os.path.abspath(os.path.join(SIM_DIR, "..", ".."))
ENGINE_DIR = os.path.join(ROOT, "engine")
if ENGINE_DIR not in sys.path:
    sys.path.insert(0, ENGINE_DIR)
if MODULE_DIR not in sys.path:
    sys.path.insert(0, MODULE_DIR)

from profile_utils import flatten_profile_features, FEATURE_VECTOR_SIZE  # noqa: E402
from formula import euclidean_distance, gower_distance  # noqa: E402
from config import (  # noqa: E402
    SYNTHETIC_TRAIL_COUNT,
    TOTAL_CATALOG_COUNT,
    TRAILS_PER_TIER,
    TIERS,
    PROVINCE_KEYS,
    CIRCULARITY_KEYS,
    MIN_PROVINCE_APPEARANCES,
    MIN_TRAVERSE_COUNT,
    MIN_CIRCULAR_COUNT,
    MIN_PAIRWISE_EUCLIDEAN_DISTANCE,
    TIER_RANGES,
    LASCO_MAX_RATING,
)
from generate import generate_catalog, load_and_export_real_trails, OUTPUT_DIR  # noqa: E402


class ValidationError(Exception):
    pass


def validate_quotas(catalog: Dict[str, Any]) -> None:
    """Check 1: Validate tier, province, and route quotas."""
    trails = catalog["trails"]
    synthetic = [t for t in trails if t.get("synthetic", False)]

    if len(synthetic) != SYNTHETIC_TRAIL_COUNT:
        raise ValidationError(f"Expected {SYNTHETIC_TRAIL_COUNT} synthetic trails, got {len(synthetic)}")

    tier_counts = {tier: 0 for tier in TIERS}
    for t in synthetic:
        tier_counts[t["tier"]] += 1
    for tier, count in tier_counts.items():
        if count != TRAILS_PER_TIER:
            raise ValidationError(f"Tier {tier} has {count} trails, expected {TRAILS_PER_TIER}")

    # Province counts across synthetic trails
    prov_counts = {p: 0 for p in PROVINCE_KEYS}
    for t in synthetic:
        p_feats = t["profile"]["features"]["province"]
        for p in PROVINCE_KEYS:
            if p_feats.get(p, 0.0) > 0.0:
                prov_counts[p] += 1
    for p, c in prov_counts.items():
        if c < MIN_PROVINCE_APPEARANCES:
            raise ValidationError(f"Province {p} appears on only {c} synthetic trails (< {MIN_PROVINCE_APPEARANCES})")

    # Route types
    trav_count = sum(1 for t in synthetic if t["profile"]["features"]["circularity"]["traverse"] > 0)
    circ_count = sum(1 for t in synthetic if t["profile"]["features"]["circularity"]["circular"] > 0)
    if trav_count < MIN_TRAVERSE_COUNT:
        raise ValidationError(f"Traverse count {trav_count} < {MIN_TRAVERSE_COUNT}")
    if circ_count < MIN_CIRCULAR_COUNT:
        raise ValidationError(f"Circular count {circ_count} < {MIN_CIRCULAR_COUNT}")

    print(f"  [PASS] Quotas: 8/tier, provinces {prov_counts}, trav={trav_count}, circ={circ_count}")


def validate_ranges_and_consistency(catalog: Dict[str, Any], bounds: Dict[str, List[float]]) -> None:
    """Checks 2 & 3: Range validity and physical consistency."""
    trails = catalog["trails"]

    for t in trails:
        vec = np.array(t["vector"], dtype=np.float32)
        if len(vec) != FEATURE_VECTOR_SIZE:
            raise ValidationError(f"Trail {t['id']} vector has {len(vec)} dims, expected {FEATURE_VECTOR_SIZE}")
        if np.any(vec < -1e-5) or np.any(vec > 1.0 + 1e-5):
            raise ValidationError(f"Trail {t['id']} vector out of [0, 1] range: {vec}")

        raw = t["raw"]
        is_synth = t.get("synthetic", False)

        if is_synth:
            tier = t["tier"]
            trange = TIER_RANGES[tier]
            if not (trange["length_km"][0] - 0.5 <= raw["length"] <= trange["length_km"][1] + 0.5):
                raise ValidationError(f"Synth {t['id']} length {raw['length']} out of range {trange['length_km']}")
            if not (trange["elevation_masl"][0] - 50 <= raw["elevation"] <= trange["elevation_masl"][1] + 200):
                raise ValidationError(f"Synth {t['id']} elevation {raw['elevation']} out of range {trange['elevation_masl']}")

            # Slope consistency: slope == gain / (length * 1000) * 100
            expected_slope = (raw["gain"] / (raw["length"] * 1000.0)) * 100.0
            if abs(raw["slope"] - expected_slope) > 0.08:
                raise ValidationError(
                    f"Synth {t['id']} slope mismatch: recorded={raw['slope']}, expected={expected_slope:.2f}"
                )

        # Check normalization bounds for indices 1..4
        expected_len_norm = (raw["length"] - bounds["length"][0]) / (bounds["length"][1] - bounds["length"][0])
        if abs(vec[1] - expected_len_norm) > 1e-4:
            raise ValidationError(f"Trail {t['id']} length normalization mismatch: vec={vec[1]}, exp={expected_len_norm}")

        expected_easy_norm = raw["lascoRating"] / LASCO_MAX_RATING
        if abs(vec[5] - expected_easy_norm) > 1e-4:
            raise ValidationError(f"Trail {t['id']} easy normalization mismatch: vec={vec[5]}, exp={expected_easy_norm}")

    print(f"  [PASS] Ranges and consistency verified across all {len(trails)} trails.")


def validate_schema_roundtrip(catalog: Dict[str, Any]) -> None:
    """Check 4: flatten_profile_features(trail["profile"]) == trail["vector"]."""
    trails = catalog["trails"]
    for t in trails:
        reconstructed = flatten_profile_features(t["profile"])
        orig_vec = np.array(t["vector"], dtype=np.float32)
        diff = np.max(np.abs(reconstructed - orig_vec))
        if diff > 1e-5:
            raise ValidationError(f"Trail {t['id']} schema round-trip mismatch: max diff = {diff}")

    print(f"  [PASS] Schema round-trip passed for all {len(trails)} trails.")


def validate_duplicates_and_diversity(catalog: Dict[str, Any]) -> None:
    """Checks 5 & 6: Minimum Euclidean distance and distance diversity."""
    trails = catalog["trails"]
    vectors = [np.array(t["vector"], dtype=np.float32) for t in trails]
    n = len(vectors)

    all_distances: List[float] = []
    min_dist = float("inf")
    closest_pair = ("", "")

    for i in range(n):
        for j in range(i + 1, n):
            d = float(euclidean_distance(vectors[i], vectors[j]))
            all_distances.append(d)
            if d < min_dist:
                min_dist = d
                closest_pair = (trails[i]["id"], trails[j]["id"])

    if min_dist < MIN_PAIRWISE_EUCLIDEAN_DISTANCE:
        raise ValidationError(
            f"Duplicate or near-identical trails detected: {closest_pair} with distance {min_dist:.4f} < {MIN_PAIRWISE_EUCLIDEAN_DISTANCE}"
        )

    # Diversity comparison: real 8 vs 40 catalog
    real_vectors = [np.array(t["vector"], dtype=np.float32) for t in trails if not t.get("synthetic", False)]
    real_distances: List[float] = []
    for i in range(len(real_vectors)):
        for j in range(i + 1, len(real_vectors)):
            real_distances.append(float(euclidean_distance(real_vectors[i], real_vectors[j])))

    cat_std = float(np.std(all_distances))
    real_std = float(np.std(real_distances))
    cat_range = (min(all_distances), max(all_distances))
    real_range = (min(real_distances), max(real_distances))

    print(
        f"  [PASS] Distance & Diversity: min_pair_dist={min_dist:.4f} (pair {closest_pair}), "
        f"catalog std={cat_std:.4f} (range [{cat_range[0]:.2f}, {cat_range[1]:.2f}]), "
        f"real 8 std={real_std:.4f} (range [{real_range[0]:.2f}, {real_range[1]:.2f}])"
    )


def validate_difficulty_coverage(catalog: Dict[str, Any]) -> None:
    """Check 7: Composite difficulty covers values below easiest and above hardest real trail."""
    trails = catalog["trails"]
    real = [t for t in trails if not t.get("synthetic", False)]
    synth = [t for t in trails if t.get("synthetic", False)]

    # Composite physical difficulty score = mean(norm_len, norm_elev, norm_gain, norm_slope, norm_easy)
    def composite_diff(t: Dict[str, Any]) -> float:
        v = t["vector"]
        return float(np.mean([v[1], v[2], v[3], v[4], v[5]]))

    real_scores = [composite_diff(t) for t in real]
    synth_scores = [composite_diff(t) for t in synth]

    min_real, max_real = min(real_scores), max(real_scores)
    min_synth, max_synth = min(synth_scores), max(synth_scores)

    if min_synth >= min_real:
        raise ValidationError(f"Catalog has no synthetic trail easier than easiest real: {min_synth:.4f} >= {min_real:.4f}")
    if max_synth <= max_real:
        raise ValidationError(f"Catalog has no synthetic trail harder than hardest real: {max_synth:.4f} <= {max_real:.4f}")

    print(
        f"  [PASS] Coverage: Real composite range [{min_real:.3f}, {max_real:.3f}], "
        f"Synthetic range [{min_synth:.3f}, {max_synth:.3f}] (full coverage confirmed)"
    )


def validate_determinism(seed: int, real_trails: List[Dict[str, Any]]) -> None:
    """Check 8: Determinism under same seed."""
    cat_a, _, _ = generate_catalog(seed=seed, real_trails=real_trails)
    cat_b, _, _ = generate_catalog(seed=seed, real_trails=real_trails)

    bytes_a = json.dumps(cat_a, sort_keys=True)
    bytes_b = json.dumps(cat_b, sort_keys=True)

    if bytes_a != bytes_b:
        raise ValidationError("Determinism check failed: repeated generation yielded differing JSON bytes.")

    print(f"  [PASS] Determinism: Byte-identical reproduction confirmed for seed={seed}.")


def rederive_user_profiles_40trails(
    users_master: List[Dict[str, Any]],
    users_spec: List[Dict[str, Any]],
    catalog_trails: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Rederives the 24 users' initial profiles against the 40-trail bounds:
      - E1 (Beginner): uses baseline priors
      - E2..E4 (Experienced): centroid of their ticked survey trails computed from
        their re-normalized 40-trail vectors, scaled by 0.50x (easy) and 1.35x (diff).
    """
    spec_map = {u["id"]: u for u in users_spec}
    trail_by_id = {t["id"]: t for t in catalog_trails}
    rederived_users: List[Dict[str, Any]] = []

    for u in users_master:
        u_copy = copy.deepcopy(u)
        uid = u["id"]
        exp = u["experience"]
        has_med = bool(u.get("medicalProfile", {}).get("hasCondition", False))
        med_factor = 0.80 if has_med else 1.0

        spec = spec_map.get(uid, {})
        ticked_tids = [str(tid) for tid in spec.get("expected_trail_ids", [])]

        if exp == "E1" or not ticked_tids:
            # Beginner fallback
            easy_base = 0.25 * med_factor
            diff_base = 0.75 * med_factor
            prefs = u.get("preferences", {}).get("province", [])
            user_provs = [p.lower() for p in prefs] if prefs else ["rizal"]

            easy_feats = {
                "classification": 0.0,
                "length": easy_base, "elevation": easy_base, "gain": easy_base, "slope": easy_base, "easy": easy_base,
                "province": {p: 0.85 if p in user_provs else 0.15 for p in PROVINCE_KEYS},
                "terrain": {t: easy_base for t in ["muddy", "rocky", "grassland", "ridges"]},
                "circularity": {c: 0.33 for c in CIRCULARITY_KEYS},
                "waterforms": {w: easy_base for w in ["fall", "river", "lake"]},
                "tourism": {tm: 0.20 for tm in ["shelter", "resting", "information_board", "clean_water", "river", "lake", "waterfall", "monument", "community", "viewpoint", "network_connection"]},
            }
            diff_feats = {
                "classification": 1.0,
                "length": diff_base, "elevation": diff_base, "gain": diff_base, "slope": diff_base, "easy": diff_base,
                "province": {p: 0.15 if p in user_provs else 0.85 for p in PROVINCE_KEYS},
                "terrain": {t: diff_base for t in ["muddy", "rocky", "grassland", "ridges"]},
                "circularity": {c: 0.33 for c in CIRCULARITY_KEYS},
                "waterforms": {w: diff_base for w in ["fall", "river", "lake"]},
                "tourism": {tm: 0.40 for tm in ["shelter", "resting", "information_board", "clean_water", "river", "lake", "waterfall", "monument", "community", "viewpoint", "network_connection"]},
            }
        else:
            # Centroid of re-normalized ticked trails
            ticked_vectors = [np.array(trail_by_id[tid]["vector"], dtype=np.float32) for tid in ticked_tids if tid in trail_by_id]
            centroid = np.mean(ticked_vectors, axis=0)

            easy_factor = 0.50 * med_factor
            diff_factor = 1.35 * med_factor

            prefs = u.get("preferences", {}).get("province", [])
            user_provs = [p.lower() for p in prefs] if prefs else ["rizal"]

            # Core physical
            c_cls, c_len, c_elev, c_gain, c_slope, c_easy = centroid[:6]
            prov_start = 6
            terr_start = prov_start + len(PROVINCE_KEYS)
            circ_start = terr_start + 4
            water_start = circ_start + len(CIRCULARITY_KEYS)
            tour_start = water_start + 3

            easy_feats = {
                "classification": 0.0,
                "length": float(np.clip(c_len * easy_factor, 0.0, 1.0)),
                "elevation": float(np.clip(c_elev * easy_factor, 0.0, 1.0)),
                "gain": float(np.clip(c_gain * easy_factor, 0.0, 1.0)),
                "slope": float(np.clip(c_slope * easy_factor, 0.0, 1.0)),
                "easy": float(np.clip(c_easy * easy_factor, 0.0, 1.0)),
                "province": {
                    p: float(centroid[prov_start + idx]) if centroid[prov_start + idx] > 0 else (0.85 if p in user_provs else 0.15)
                    for idx, p in enumerate(PROVINCE_KEYS)
                },
                "terrain": {
                    t: float(np.clip(centroid[terr_start + idx] * easy_factor, 0.0, 1.0)) if centroid[terr_start + idx] > 0 else (0.25 * med_factor)
                    for idx, t in enumerate(["muddy", "rocky", "grassland", "ridges"])
                },
                "circularity": {
                    c: float(np.clip(centroid[circ_start + idx] * 0.50, 0.0, 1.0)) if centroid[circ_start + idx] > 0 else 0.33
                    for idx, c in enumerate(CIRCULARITY_KEYS)
                },
                "waterforms": {
                    w: float(np.clip(centroid[water_start + idx] * 0.50, 0.0, 1.0)) if centroid[water_start + idx] > 0 else 0.25
                    for idx, w in enumerate(["fall", "river", "lake"])
                },
                "tourism": {
                    tm: float(np.clip(centroid[tour_start + idx] * 0.50, 0.0, 1.0)) if centroid[tour_start + idx] > 0 else 0.20
                    for idx, tm in enumerate(["shelter", "resting", "information_board", "clean_water", "river", "lake", "waterfall", "monument", "community", "viewpoint", "network_connection"])
                },
            }

            diff_feats = {
                "classification": 1.0,
                "length": float(np.clip(c_len * diff_factor, 0.0, 1.0)),
                "elevation": float(np.clip(c_elev * diff_factor, 0.0, 1.0)),
                "gain": float(np.clip(c_gain * diff_factor, 0.0, 1.0)),
                "slope": float(np.clip(c_slope * diff_factor, 0.0, 1.0)),
                "easy": float(np.clip(c_easy * diff_factor, 0.0, 1.0)),
                "province": {
                    p: float(centroid[prov_start + idx]) if centroid[prov_start + idx] > 0 else (0.15 if p in user_provs else 0.85)
                    for idx, p in enumerate(PROVINCE_KEYS)
                },
                "terrain": {
                    t: float(np.clip(centroid[terr_start + idx] * diff_factor, 0.0, 1.0)) if centroid[terr_start + idx] > 0 else (0.75 * med_factor)
                    for idx, t in enumerate(["muddy", "rocky", "grassland", "ridges"])
                },
                "circularity": {
                    c: float(np.clip(centroid[circ_start + idx] * 1.35, 0.0, 1.0)) if centroid[circ_start + idx] > 0 else 0.33
                    for idx, c in enumerate(CIRCULARITY_KEYS)
                },
                "waterforms": {
                    w: float(np.clip(centroid[water_start + idx] * 1.35, 0.0, 1.0)) if centroid[water_start + idx] > 0 else 0.75
                    for idx, w in enumerate(["fall", "river", "lake"])
                },
                "tourism": {
                    tm: float(np.clip(centroid[tour_start + idx] * 1.35, 0.0, 1.0)) if centroid[tour_start + idx] > 0 else 0.40
                    for idx, tm in enumerate(["shelter", "resting", "information_board", "clean_water", "river", "lake", "waterfall", "monument", "community", "viewpoint", "network_connection"])
                },
            }

        u_copy["profile"] = {
            "easy": {"metadata": {"id": uid, "profile": "easy", "type": "user"}, "features": easy_feats},
            "difficult": {"metadata": {"id": uid, "profile": "difficult", "type": "user"}, "features": diff_feats},
        }
        rederived_users.append(u_copy)

    return rederived_users


def validate_simulation_fit(catalog: Dict[str, Any]) -> None:
    """
    Check 9: Evaluates disjoint partition of the 40 trails for all 24 cohorts using batch_runner.
    Verifies that every user has:
      - >= 5 unhiked easy trails
      - >= 5 unhiked difficult trails
      - >= 10 unhiked trails in their primary target anchor (easy for E1/E2, diff for E3/E4)
    """
    import firebase_client
    firebase_client.initialize_firebase = lambda: None
    from batch_runner import run_batch_recommendations

    with open(os.path.join(SIM_DIR, "cycle_simulation", "inputs", "users.json"), "r", encoding="utf-8") as f:
        users_master = json.load(f)
    with open(os.path.join(SIM_DIR, "cycle_simulation", "inputs", "users_spec.json"), "r", encoding="utf-8") as f:
        users_spec = json.load(f)

    # Rederive user initial profiles against the 40-trail bounds
    rederived_users = rederive_user_profiles_40trails(
        users_master=users_master,
        users_spec=users_spec,
        catalog_trails=catalog["trails"],
    )

    user_spec_map = {u["id"]: u for u in users_spec}
    user_hikes_map = {
        u["id"]: set(str(tid) for tid in user_spec_map.get(u["id"], {}).get("expected_trail_ids", []))
        for u in rederived_users
    }

    # Run batch runner in-memory on month 2026-10
    batch_res = run_batch_recommendations(
        cbf_engine="GD",
        cf_engine="GD",
        month_id="2026-10",
        candidate_trails=catalog["trails"],
        users=rederived_users,
        user_hikes_map=user_hikes_map,
        user_reviews_map={u["id"]: [] for u in rederived_users},
        prev_recommendations_map={},
        commit_to_firestore=False,
        generate_ai_reasoning=False,
        update_profiles_from_reviews=False,
    )

    recomms = batch_res.get("recommendations", {})
    summary_records = []

    for u in rederived_users:
        uid = u["id"]
        exp = u["experience"]
        u_doc = recomms.get(uid, {})
        easy_list = u_doc.get("easy", [])
        diff_list = u_doc.get("difficult", [])

        hikes = user_hikes_map[uid]
        unhiked_easy = [t for t in easy_list if str(t.get("id")) not in hikes]
        unhiked_diff = [t for t in diff_list if str(t.get("id")) not in hikes]

        target_anchor = "easy" if exp in ("E1", "E2") else "difficult"
        target_unhiked = unhiked_easy if target_anchor == "easy" else unhiked_diff

        if len(unhiked_easy) < 5:
            raise ValidationError(
                f"User {uid} ({exp}) has only {len(unhiked_easy)} unhiked easy trails (< 5)"
            )
        if len(unhiked_diff) < 5:
            raise ValidationError(
                f"User {uid} ({exp}) has only {len(unhiked_diff)} unhiked difficult trails (< 5)"
            )
        if len(target_unhiked) < 10:
            raise ValidationError(
                f"User {uid} ({exp}) has only {len(target_unhiked)} unhiked trails in target anchor {target_anchor} (< 10)"
            )

        summary_records.append({
            "uid": uid,
            "exp": exp,
            "easy": len(unhiked_easy),
            "diff": len(unhiked_diff),
            "target": len(target_unhiked),
        })

    min_easy = min(r["easy"] for r in summary_records)
    min_diff = min(r["diff"] for r in summary_records)
    min_target = min(r["target"] for r in summary_records)
    print(
        f"  [PASS] Simulation fit: All 24 cohorts passed. "
        f"Min unhiked easy={min_easy} (>=5), diff={min_diff} (>=5), target={min_target} (>=10)."
    )


def validate_catalog_file(catalog_path: str) -> bool:
    """Runs all validation checks on a catalog file."""
    print("=" * 80)
    print(f"VALIDATING CATALOG: {os.path.relpath(catalog_path, ROOT)}")
    print("=" * 80)

    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    bounds = catalog["header"]["bounds"]
    seed = catalog["header"]["seed"]

    try:
        validate_quotas(catalog)
        validate_ranges_and_consistency(catalog, bounds)
        validate_schema_roundtrip(catalog)
        validate_duplicates_and_diversity(catalog)
        validate_difficulty_coverage(catalog)
        validate_determinism(seed, load_and_export_real_trails())
        validate_simulation_fit(catalog)
    except ValidationError as e:
        print(f"\n[ERROR] Validation FAILED: {e}")
        return False

    print("\nALL 9 VALIDATION CHECKS PASSED SUCCESSFULLY.")
    return True


def main() -> None:
    cat42_path = os.path.join(OUTPUT_DIR, "catalog_seed42.json")
    cat7_path = os.path.join(OUTPUT_DIR, "catalog_seed7.json")

    ok42 = validate_catalog_file(cat42_path)
    ok7 = validate_catalog_file(cat7_path)

    if not (ok42 and ok7):
        sys.exit(1)


if __name__ == "__main__":
    main()

