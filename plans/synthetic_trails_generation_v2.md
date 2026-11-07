# THARESYS Synthetic Trail Generator & Modular Trail Simulation Plan

Nov 3, 2026 · @Reyn

## Architectural Principle: Modular Simulation Isolation

1. **Module 1 — Cycle Simulation (`scripts/simulation/cycle_simulation/`):**
   - Frozen, self-contained snapshot of the 8-trail multi-cycle convergence study (3, 5, 7, and 10 cycles across 24 cohorts).
   - Preserves all original inputs (`trails.json`, `users.json`, `users_spec.json`, `app_profiles.json`, `start_distances.csv`), scripts, 4 cycle snapshots (`sim1_3cycles` to `sim4_10cycles`), and benchmark reports (`simulation1.md` to `simulation4.md`, `simulation_cycle_summary.md`).
   - Can be restored to the UI (`src/recommendation/data/`) or re-executed deterministically at any time via `manage_cycle_simulation.py`.
2. **Module 2 — Trail Simulation (`scripts/simulation/trail_simulation/` & `trail_generator/`):**
   - Completely isolated in its own directory structure so it never mutates or overwrites the Cycle Simulation's 8-trail files unless explicitly switched into the UI for presentation.

---

## Goal and scope

Build a standalone generator (`trail_generator/`) that produces 32 synthetic trails and combines them with the 8 real trails into one 40-trail catalog (`catalog_seed42.json` and `catalog_seed7.json`). The catalog is used by the **Trail Simulation module** (`scripts/simulation/trail_simulation/`) for the idealistic scaling run, which tests how the engine behaves when the trail set is larger and more diverse. It makes no claim about real routes. The 8 real trails' raw attributes stay unchanged, while their continuous physical features (`length`, `elevation`, `gain`, `slope`) are re-normalized against the combined 40-trail min-max bounds inside the Trail Simulation module.

Out of scope for the generator step: changing the core engine (`engine/`), mutating any Cycle Simulation files (`scripts/simulation/output/` or `scripts/simulation/cycle_simulation/`).

## Read first

- The 8 real trails as stored in `scripts/simulation/output/trails.json` (Nov 3 values: length 3.1 to 14.1 km, elevation 438 to 1090 MASL read via `geography.masl || difficulty.elevation`, gain 118 to 954 m computed via `calculateTrailGain`, Lasco 2 to 6, class minor/major, provinces, slope 5.0 to 14.0%). Export a copy to `trail_generator/output/real_trails.json` before starting.
- The code that builds the 32-number trail vector and its normalization (`src/recommendation/utilities/NormalizeTrails.ts`, `src/recommendation/utilities/CreateProfile.ts`, and `engine/profile_utils.py`).
- The 32-feature layout and exact dictionary keys from `engine/profile_utils.py`:
  - Indices `0..5` physical: `classification` (binary `{0.0, 1.0}`), `length`, `elevation`, `gain`, `slope`, `easy` (`lascoRating / 9.0`)
  - Indices `6..10` `province` (5): `["cavite", "laguna", "batangas", "rizal", "quezon"]`
  - Indices `11..14` `terrain` (4): `["muddy", "rocky", "grassland", "ridges"]`
  - Indices `15..17` `circularity` / route type (3): `["out_and_back", "traverse", "circular"]`
  - Indices `18..20` `waterforms` (3): `["fall", "river", "lake"]`
  - Indices `21..31` `tourism` amenities (11): `["shelter", "resting", "information_board", "clean_water", "river", "lake", "waterfall", "monument", "community", "viewpoint", "network_connection"]`

## Default design decisions

Change these only with the owner's approval.

| Item | Default |
| --- | --- |
| Synthetic trails | 32, giving 40 with the real 8 |
| Difficulty tiers | 4 tiers (easy, moderate, hard, very hard), 8 trails each |
| Provinces | Each of the five provinces on at least 4 trails, Cavite included; 1 or 2 provinces per trail |
| Route types | `out_and_back`, `traverse` and `circular` (loop), with `traverse` and `circular` each on at least 6 synthetic trails |
| Seed | 42 for the main catalog; 7 for a second catalog as a robustness check |
| Tier ranges | Stretch slightly past the real extremes (shorter than Kulis, longer than MakTrav) |

The tier ranges and the route, terrain and amenity rates are modelling choices, not survey data. Record them in the config file and state them in the write-up.

## Implementation steps

1. **Setup.** Create `trail_generator/` with `config.py` (all ranges, quotas, seed), `generate.py`, `validate.py` and `tests/`. Copy the 8 real trails to `trail_generator/output/real_trails.json`, extracting peak elevation via `geography.masl || difficulty.elevation`.
2. **Quota plan.** Build the list of 32 slots first: tier, provinces, route type (`out_and_back`, `traverse`, `circular`). Assign provinces and routes so every quota holds before any number is drawn. Fail loudly if a quota cannot be met.
3. **Raw physical values.** For each synthetic slot, draw length and peak elevation from the tier range, then gain from a share of the elevation range tied to length. Derive synthetic slope as `gain / (length × 1000) × 100` (note: the 8 real trails keep their stored raw `difficulty.slope`, `gain`, and `length` values as-is). Set the Lasco rating (`1..9`) from the tier with a small random offset, and set classification to major (`1.0`) above a Lasco and elevation threshold set in config (minor = `0.0` otherwise).
4. **Categorical features.** Terrains (`muddy`, `rocky`, `grassland`, `ridges`) are multi-hot with probabilities that rise with tier (`rocky` and `ridges` more likely on hard tiers). Route type (`circularity`) is one-hot across `["out_and_back", "traverse", "circular"]`. Waterforms (`fall`, `river`, `lake`) and the 11 `tourism` amenities are sparse, with more amenities on easier trails. Every trail must have at least one terrain.
5. **Normalize (Option 2).** Fix the empirical min-max bounds once over the combined 40 trails strictly for the 4 continuous physical metrics: `length`, `elevation`, `gain`, and `slope`. Keep `classification` binary (`{0.0, 1.0}`) and normalize `easy` on the fixed Lasco scale (`lascoRating / 9.0`). Re-normalize the 8 real trails' continuous physical metrics (`length`, `elevation`, `gain`, `slope`) against these 40-trail min-max bounds in the new catalog and save the bounds in the output.
6. **Write output.** Save `trail_generator/output/catalog_seed42.json` with a header (`seed`, `config_hash`, `bounds`) and a `trails` array containing, per trail:
   - Engine-compatible nested schema: `id`, `general` (`name`, `province`, `active`), `difficulty` (`length`, `elevation`, `gain`, `slope`, `lascoRating`, `classification`, `circularity`), `geography` (`masl`), and `profile.features` reconstructed via `unflatten_profile_features()`.
   - Generator metadata: `name` (`SYN-01` to `SYN-32` for synthetic), `raw` values dict, flat 32-number `vector`, `tier`, and `synthetic: true` (real trails carry `synthetic: false`).
7. **Validate.** Run `validate.py` on every output (checks below). The script exits with an error if any check fails.
8. **Second catalog.** Generate `catalog_seed7.json` the same way. Do not tune the config to make a seed look better.
9. **Report.** Write a short summary with the per-tier physical ranges, province and route counts, and a pairwise-distance summary for the real set versus the full catalog.

## Validation checks

| Check | Pass rule |
| --- | --- |
| Quotas | 8 synthetic trails per tier; each province on at least 4 trails; route minimums met (`traverse >= 6`, `circular >= 6`) |
| Ranges | All 32 numbers in `[0, 1]`; synthetic raw values inside the tier ranges |
| Consistency | For `synthetic: true`, raw slope matches `gain / (length × 1000) × 100`; for `synthetic: false` (the 8 real trails), raw values equal their stored values in `real_trails.json` and normalized indices `1..4` match the 40-trail min-max bounds (with `easy == lascoRating / 9.0`) |
| Schema | Every trail flattens cleanly via `flatten_profile_features(trail["profile"])` to match `trail["vector"]` within float32 tolerance |
| Duplicates | No two trails closer than a small distance threshold under normalized Euclidean |
| Diversity | Spread of pairwise trail distances at least as wide as the real 8 |
| Coverage | Difficulty composite score covers the full range, with trails below the easiest and above the hardest real trail |
| Determinism | Same seed and config give byte-identical JSON |
| Simulation fit | Under disjoint Easy/Difficult anchor partitioning (`score_easy <= score_diff` using user profiles re-derived against the 40-trail bounds), every one of the 24 simulated users has at least 5 unhiked `easy` trails, at least 5 unhiked `difficult` trails, and at least 10 unhiked trails in their primary target anchor after excluding their ticked survey history |

## Hand-off to the Trail Simulation module

- The Trail Simulation module (`scripts/simulation/trail_simulation/`) loads `catalog_seed42.json` as the trail set for the idealistic run and `real_trails_renormalized.json` for the realistic run, with the same 40-trail bounds file applied to both.
- Inside `scripts/simulation/trail_simulation/`, the 24 users' initial survey profiles (`E2`, `E3`, `E4`) are generated into a dedicated `trail_simulation/output/users_40trails.json` from the re-normalized vectors of their ticked real trails so user priors and trail coordinates remain in the exact same coordinate space—without touching the Cycle Simulation's `users.json`.
- Results from this catalog are stored in `scripts/simulation/trail_simulation/snapshots/` and `engine_simulations/trail_simulation/` and can be switched into the UI (`src/recommendation/data/`) on demand.

