# THARESYS Synthetic Trail Generator: Implementation Plan

Nov 3, 2026 · @Reyn

## Goal and scope

Build a script that produces 32 synthetic trails and combines them with the 8 real trails into one 40-trail catalog. The catalog is used for the idealistic simulation run, which tests how the engine behaves when the trail set is larger and more diverse. It makes no claim about real routes. The 8 real trails stay unchanged. The generator is separate from the engine and the simulation harness and only writes a JSON file.

Out of scope: changing the engine, changing the user generator, running the simulation.

## Read first

- The 8 real trails as stored in the database (Nov 3 values: length, gain, Lasco, class, provinces, slope 5.0 to 14.0%). Export them to a JSON file before starting.
- The code that builds the 32-number trail vector and its min-max normalization (Thrail app and `profile_utils.py`). The generator must call or exactly mirror it. If the two disagree, stop and report.
- The 32-feature layout: indices 0 to 5 physical (classification, length, elevation, gain, slope, Lasco), then provinces (5), terrains (4), route type (3), waterforms (3), amenities (11).

## Default design decisions

Change these only with the owner's approval.

| Item | Default |
| --- | --- |
| Synthetic trails | 32, giving 40 with the real 8 |
| Difficulty tiers | 4 tiers (easy, moderate, hard, very hard), 8 trails each |
| Provinces | Each of the five provinces on at least 4 trails, Cavite included; 1 or 2 provinces per trail |
| Route types | Out-and-back, traverse and loop, with traverse and loop each on at least 6 synthetic trails |
| Seed | 42 for the main catalog; 7 for a second catalog as a robustness check |
| Tier ranges | Stretch slightly past the real extremes (shorter than Kulis, longer than MakTrav) |

The tier ranges and the route, terrain and amenity rates are modelling choices, not survey data. Record them in the config file and state them in the write-up.

## Implementation steps

1. **Setup.** Create `trail_generator/` with `config.py` (all ranges, quotas, seed), `generate.py`, `validate.py` and `tests/`. Export the 8 real trails to `real_trails.json`.
2. **Quota plan.** Build the list of 32 slots first: tier, provinces, route type. Assign provinces and routes so every quota holds before any number is drawn. Fail loudly if a quota cannot be met.
3. **Raw physical values.** For each slot, draw length and peak elevation from the tier range, then gain from a share of the elevation range tied to length. Derive slope as gain / (length × 1000) × 100, the same formula the engine uses. Set the Lasco rating from the tier with a small random offset, and set classification to major above a Lasco and elevation threshold set in config.
4. **Categorical features.** Terrains are multi-hot with probabilities that rise with tier (rocky and ridges more likely on hard tiers). Route type is one-hot. Waterforms and the 11 amenities are sparse, with more amenities on easier trails. Every trail must have at least one terrain.
5. **Normalize.** Fix the min-max bounds once over the combined 40 trails, using the engine's normalization code. Re-normalize the 8 real trails against these bounds and use the same bounds for every run. Save the bounds in the output.
6. **Write output.** Save `catalog_seed42.json` with, per trail: id, name (`SYN-01` to `SYN-32`), raw values, 32-number vector, tier, `synthetic: true`. Real trails carry `synthetic: false`. Add a header with seed, config hash and bounds.
7. **Validate.** Run `validate.py` on every output (checks below). The script exits with an error if any check fails.
8. **Second catalog.** Generate seed 7 the same way. Do not tune the config to make a seed look better.
9. **Report.** Write a short summary with the per-tier physical ranges, province and route counts, and a pairwise-distance summary for the real set versus the full catalog.

## Validation checks

| Check | Pass rule |
| --- | --- |
| Quotas | 8 trails per tier; each province on at least 4 trails; route minimums met |
| Ranges | All 32 numbers in \[0, 1\]; raw values inside the tier ranges |
| Consistency | Slope matches gain / length; the 8 real trails equal their stored values |
| Duplicates | No two trails closer than a small distance threshold under normalized Euclidean |
| Diversity | Spread of pairwise trail distances at least as wide as the real 8 |
| Coverage | Difficulty composite score covers the full range, with trails below the easiest and above the hardest real trail |
| Determinism | Same seed and config give byte-identical JSON |
| Simulation fit | Every one of the 24 simulated users has at least 5 unhiked trails after their ticked history |

## Hand-off to the simulation

- The simulation loads `catalog_seed42.json` as the trail set for the idealistic run and `real_trails.json` for the realistic run, with the same bounds file for both.
- Results from this catalog must be labelled as a scaling test on generated trails.
- Later runs can add sizes (for example 20 and 80 trails) by changing one number in config.

## Risks

- **Bounds mismatch.** Normalizing the synthetic trails differently from the real ones would make the two runs incomparable. Step 5 and the Consistency check cover this.
- **Arbitrary ranges.** The catalog is only as realistic as its ranges. Keep them in config, state them, and run the second seed.
- **Engine mismatch.** If the engine's vector layout differs from the layout above, stop and report instead of adapting silently.

## Definition of done

Two validated catalogs (seeds 42 and 7), the config and bounds files, the validation report, tests passing, and one command that regenerates everything from the seed.
