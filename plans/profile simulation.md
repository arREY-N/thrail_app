# THARESYS Simulation: User Profile Generation Plan

**For the coding agent.** Scope is the 24 simulated users only: survey answers, app profile and ground truth. The hike loop, CF and metrics are out of scope. Where this plan and the code disagree, stop and ask instead of picking one.

## 1. Output

One file, `users.json`, with 24 records. Each record holds the user ID, survey answers, the app profile (easy and difficult profiles in nested form, as the app saves them), the ground truth (easy and difficult anchors, section 4), the seed, and the versions used (CreateProfile.ts commit, trail export hash, normalization bounds). A second file, `start_distances.csv`, shows how far each app profile starts from its ground truth.

## 2. Verified from CreateProfile.ts and the trail table

- Survey: medical condition (yes or no), ticked trails (the options are the 8 trails), preferred provinces (Cavite, Laguna, Batangas, Rizal, Quezon).
- The catalog is the 8 trails saved in the database. Min-max bounds are taken over these 8: length 3.1 to 14.1 km, peak 438 to 1090 m, gain 112 to 948 m, slope 5.0 to 14.0 percent. Lasco is the raw value divided by 9. Use the stored normalized vectors and never recompute them.
- Beginner (no ticked trail): length, peak, gain, Lasco, slope, terrain (4), route (3) and water (3) start at 0.25 on the easy anchor and 0.75 on the difficult one. Amenities (11) are 0.20 and 0.40. Classification is 0 and 1. A selected province is 0.85 easy and 0.15 difficult; an unselected one is the reverse.
- Experienced: average the ticked trails' vectors, then easy = 0.50 times the average and difficult = 1.35 times the average, clamped to \[0, 1\]. This applies to length, peak, gain, Lasco and slope, and to terrain, route, water and amenities when the average is above 0. Otherwise those fall back to the beginner values. Provinces seen in the history keep their average on both anchors; unseen ones use the survey rule above. Classification stays 0 and 1.
- Classification is 0 and 1 at generation and only becomes continuous through updates. It has no review factor, so it moves at the 0.2 baseline weight, and trails only offer 0 or 1.
- Slope is not gain divided by length (Mt. Kulis: 112 m over 3.1 km would be 3.6 percent, but the table shows 13 percent). The slope formula in the profile doc is out of date.
- Missing waterform and amenity values are null. Averages skip nulls, and a feature that is null on every ticked trail falls back to the base value.
- Vector order in the engine (`flatten_profile_features`): classification, length, elevation, gain, slope, Lasco (indices 0 to 5); provinces 6 to 10 (cavite, laguna, batangas, rizal, quezon); terrain 11 to 14 (muddy, rocky, grassland, ridges); route 15 to 17 (out\_and\_back, traverse, circular); water 18 to 20 (fall, river, lake); amenities 21 to 31 (shelter, resting, information\_board, clean\_water, river, lake, waterfall, monument, community, viewpoint, network\_connection).
- On a trail, the engine turns a null into 0.0, while the app's generator skips nulls when averaging the ticked trails. Keep nulls in the trail documents and let each side apply its own rule.
- A profile with no `features` is skipped by the batch runner (and raises an error for targeted users). The 0.33 route fallback in `extract_user_anchor_profiles` only applies when exactly one anchor is present, and then it replaces both anchors. Generated profiles must always have both anchors with full features.
- Review weights (`resolve_review_factor_weights`): only slope, length, elevation, gain and terrain have review factors. Classification, Lasco, provinces, route, water and amenities always move at the 0.2 baseline. A review with an empty factor list gets weight 1.0 on all 32 features instead, so simulated reviews must always include at least one factor (decided; the engine is left unchanged and this is documented in the write-up).
- `HasMedicalCondition` is also true when `medicalProfile.details` is non-empty, while the engine fallback only reads `hasCondition`. Simulated users set only `hasCondition` and leave `details` empty or absent.
- `CreateProfile.ts` imports `useTrailStore`, which is backed by Firestore. The Node dump script must not load it against the real database; stub it or import only the pure functions.

## 3. Decisions (confirmed) to complete before running

| # | Item | What the code does | Decision (confirmed) |
| --- | --- | --- | --- |
| D1 | Medical scope | Multiplies by 0.80 the Lasco, length, peak, gain, slope and terrain (as you described), but also route and water in both paths, and amenities in the experienced path when observed | **Confirmed.** Change the code so only Lasco, length, peak, gain, slope and terrain are scaled. This includes the experienced path's fallback bases: terrain fallback stays scaled, route, water and amenities fall back to unscaled bases, and observed route, water and amenities values are not scaled. Separate commit, with tests (including an experienced medical test), before generating. |
| D2 | Ground-truth scope | Only six physical features are defined | **Confirmed.** Ground truth covers 10 features: classification, Lasco, length, peak, gain, slope and the 4 terrains. Provinces, route, water and amenities are left out of the hiker's judgement and the convergence metrics, but still logged. |
| D3 | E2 to E4 ranges | Only E1 is defined | **Confirmed approach.** Use the draft table in section 4, generate `start_distances.csv`, and review it before the bands are final. |
| D4 | E2 and E3 histories | Mt. Batulao is a major trail | **Confirmed.** Replace Mt. Batulao with Mt. Tagapo. Mt. Tagapo and Mt. Kulis are both steep, so E2 starts with a high slope anchor (about 0.47 easy and 1.0 difficult). |
| D5 | Ticked trails | The batch runner counts only the hikes collection as hiked, so a trail ticked in the survey would be recommended again | **Confirmed.** Treat ticked trails as already hiked in the harness only, with the engine unchanged (6 trails left for E2 to E4), and say so in the write-up. |
| D6 | Tourism weight order | `CANONICAL_FEATURES` lists `clean_water` before `information_board`, but the vector order (`TOURISM_KEYS`) has them the other way round, so the weights for indices 23 and 24 sit on the wrong features | **Confirmed.** Fix `parameters.py` in a separate small commit, with a test, before generating. |
| D7 | Reviews without factors | An empty factor list gives weight 1.0 on all features | **Confirmed.** Engine unchanged; simulated reviews always carry at least one factor. |

## 4. Ground truth

Sampling, per user:

1. Seed: numpy SeedSequence from \[42, a stable integer taken from the SHA-256 of the user ID\]. Never use Python's built-in hash. Adding or removing a user must not change anyone else's ground truth.
2. Draw each covered feature's easy and difficult values uniformly from the bands below.
3. Medical users: draw one scale m from U(0.65, 0.85). Multiply Lasco, length, peak, gain, slope and the 4 terrains on both anchors. Classification is not scaled. Clamp to \[0, 1\].
4. Check that difficult minus easy is at least 0.15 on the five physical features. If not, redraw the whole user. Stop with an error after 100 tries.

Bands on the normalized scale (E1 agreed, E2 to E4 draft):

| Level | Easy anchor | Difficult anchor |
| --- | --- | --- |
| E1 beginner | 0.05 to 0.35 | 0.40 to 0.65 |
| E2 easy history | 0.05 to 0.30 | 0.35 to 0.60 |
| E3 mixed history | 0.15 to 0.40 | 0.50 to 0.75 |
| E4 hard history | 0.25 to 0.50 | 0.60 to 0.90 |

Terrain uses the same bands. Classification, at every level: easy 0.00 to 0.20, difficult 0.40 to 0.80.

Why these: the bands move up with the hardness of the ticked history, and they are independent of the app's 0.5, 1.35, 0.25 and 0.75 settings, so each user starts with a real gap to close. Keep them in `gt_ranges.json` so they can change without touching code. Review `start_distances.csv` before approving them. Using the same band for every feature is a simplification; per-feature bands anchored to the ticked trails are the alternative if the hiker needs to be more realistic.

## 5. Steps

1. **Export trails.** Export the 8 trail documents exactly as stored in the database (nested profile, nulls kept) into `trails.json`, plus the normalization bounds. Acceptance: values match the reference table within 0.001 on the 29 columns it shows. The table omits the three tourism river, lake and waterfall features, so check those against the code.
2. **Define the 24 users** (experience, medical, province pattern). E1: no ticked trails. E2: Mt. Kulis and Mt. Tagapo. E3: Mt. Tagapo and Mt. Makiling Traverse. E4: Mariang Makiling Trail and Mt. Makiling Traverse. Medical: M (condition) or N (none). Provinces: P1 Rizal, P2 Batangas and Laguna, P3 Cavite. IDs look like `E2-M-P1` and `E2-N-P1`.
3. **Matching check.** `MatchSurveyTrails` now gives priority to an exact trail ID or full trail name, so simulated survey answers must use the full trail names exactly as exported (for example `Mt. Makiling Traverse (MakTrav)`). For each of the 8 trail names it must return exactly that trail, and for each experience level exactly the intended set. Note: the real survey (`MOUNTAIN_OPTIONS` in `ProfileInfoScreen.tsx`) offers mountains with a province, such as `Mt. Makiling (Laguna)`, not trail names, and those still select every trail on that mountain. `Mt. Kulis` and `Mt. Tagapo` are not in that list, so the simulation deliberately uses trail names instead of the real survey options.
4. **App profiles.** A small Node script calls `GenerateUserProfile` for each user with the 8 real trails and dumps each user as the batch runner expects: `id`, `medicalProfile`, `preferences`, and `profile.easy` and `profile.difficult` with `metadata` and nested `features`, exactly as the app saves them. Do not pre-flatten. Acceptance: the engine's `flatten_profile_features` returns the order in section 2 and the dumped values.
5. **Ground truth** with the Python sampler from section 4, reading `gt_ranges.json`. Store each anchor as named features with their engine indices.
6. **Write** `users.json` and `start_distances.csv` (per user, app anchor to ground-truth anchor distance on the covered features, under the three rulers).

## 6. Tests (definition of done)

1. Regenerating gives a byte-identical `users.json`.
2. `E1-N-P1`: 0.25 and 0.75 on the five physical features, 4 terrains, 3 route and 3 water features; amenities 0.20 and 0.40; classification 0 and 1; Rizal 0.85 and 0.15, other provinces 0.15 and 0.85.
3. `E1-M-P1` after the D1 change: 0.20 and 0.60 on the five physical features and 4 terrains only; route, water and amenities as in test 2.
4. Hand calculation for E2 with the default histories (Mt. Kulis and Mt. Tagapo), no condition: length average 0.1135 gives easy 0.057 and difficult 0.153; gain average 0.1945 gives 0.097 and 0.263; slope average 0.9445 gives 0.472 and 1.0 (clamped). Tolerance 0.002.
5. The matching check from step 3 passes.
6. Ground truth: every user has a gap of at least 0.15 on the five physical features, all values lie in \[0, 1\], and each medical user shows one scale m in \[0.65, 0.85\].
7. Removing one user from the list leaves the other 23 ground-truth records unchanged.
8. Medical twins (same user with and without the condition) differ only on the five physical features and 4 terrains, after the D1 change.
9. Every dumped profile is non-empty, and `extract_user_anchor_profiles` returns the dumped vectors, not its fallback (a route value of 0.33 would give the fallback away).
10. Experienced medical (after the D1 change): `E2-M-P1` against `E2-N-P1` differ only on the five physical features and the 4 terrains (scaled by 0.80, clamped); route, water and amenities are identical, including any fallback values.
11. D6 test: the weight vector order for indices 21 to 31 matches `TOURISM_KEYS`, so `information_board` is at index 23 and `clean_water` at index 24 with their own weights.

## 7. Do not

- Do not recompute normalization or edit trail vectors by hand.
- Do not edit CreateProfile.ts except for the D1 change, and do not edit the engine except for the D6 fix in `parameters.py`. Each goes in its own commit with tests, before generating.
- Do not set any ground-truth value by hand.
- Do not read from or write to the real database at any point in this step.

## 8. Carried to the harness plan (not part of this step)

- Run `run_batch_recommendations` itself, in memory: pass `users`, `candidate_trails`, `user_hikes_map`, `user_reviews_map` and `prev_recommendations_map`, set `commit_to_firestore=False` and `generate_ai_reasoning=False`, and patch `initialize_firebase` to return None. The match logic and review weights live inside it.
- Run all 24 users in one batch, because alpha counts the users in the batch (about 0.77 for 24). Control and update arms run as separate pools.
- Hiked trails stay in the lists with `haveHiked` set, so the simulated hiker's pick must skip them.
- A review is applied at the start of the next batch, so T hikes need T + 1 batches. Reviews need a `createdAt` in the previous month; undated reviews apply every month.
- Simulated hikers must give at least one review difficulty factor (D7). Lasco and classification have no factor and move at the 0.2 baseline.
- Tau defaults to 0.35 in the code (the plan says 0.3). Peers use the matching anchor, exclude the user, and lag one cycle behind.
