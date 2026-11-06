# Recommendation Engine File Directory

This document serves as the directory and categorized index of all files created for the recommendation engine (TARS), including backend implementations, simulation harnesses, datasets, outputs, and documentation.

> **Tip:** You can click any linked file below to open it directly in the editor.

---

## 1. Engine Implementation
*Files related to running the core recommendation engine, distance metrics, mathematical user updates, and service execution.*

### Core Backend & Services (`engine/`)
- [engine/tars.py](../tars.py) — Core scoring and ranking pipeline (hard filtering, Gower distance calculation, multi-objective weighting, candidate ranking).
- [engine/app.py](../app.py) — FastAPI web service exposing recommendation endpoints (e.g. `/recommend`).
- [engine/batch_runner.py](../batch_runner.py) — Batch runner executing recommendations over batches of users.
- [engine/parameters.py](../parameters.py) — Global hyperparameters, feature weights, penalty factors, and scaling constants.
- [engine/profile_utils.py](../profile_utils.py) — User profile parsing, validation, and conversion helpers.
- [engine/firebase_client.py](../firebase_client.py) — Firestore client for loading live user profiles and trail catalogs.
- [engine/gemini_reasoning.py](../gemini_reasoning.py) — Gemini LLM integration for natural language recommendation rationale.
- [engine/Dockerfile](../Dockerfile) & [engine/.dockerignore](../.dockerignore) — Cloud Run container deployment specification.
- [engine/requirements.txt](../requirements.txt) — Python dependencies for the recommendation backend.

### Formula Module (`engine/formula/`)
- [engine/formula/__init__.py](../formula/__init__.py) — Formula package initialization.
- [engine/formula/gower_distance.py](../formula/gower_distance.py) — Mixed-attribute Gower distance formula for ordinal, categorical, and continuous features.
- [engine/formula/cosine_distance.py](../formula/cosine_distance.py) — Vector cosine distance formula.
- [engine/formula/euclidean_distance.py](../formula/euclidean_distance.py) — Continuous feature Euclidean distance formula.
- [engine/formula/profile_updater.py](../formula/profile_updater.py) — Exponential Moving Average (EMA) and feedback update logic to evolve user preference vectors after each hike.

### Engine Tests (`engine/`)
- [engine/test_batch_runner_update.py](../test_batch_runner_update.py) — Tests for batch updates.
- [engine/test_cf_formula.py](../test_cf_formula.py) — Unit tests for distance metrics.
- [engine/test_metrics.py](../test_metrics.py) — Unit tests for scoring metrics.
- [engine/test_parameters.py](../test_parameters.py) — Parameter structure and range validation tests.
- [engine/test_profile_updater.py](../test_profile_updater.py) — Unit tests for profile adaptation math.

### Client-Side Engine Core (`src/recommendation/`)
- [src/recommendation/core.ts](../../src/recommendation/core.ts) — Client-side recommendation scoring implementation.
- [src/recommendation/constants/RecommendationFactors.ts](../../src/recommendation/constants/RecommendationFactors.ts) — Feature keys, normalization scales, and factor weights.
- [src/recommendation/interfaces/Profile.ts](../../src/recommendation/interfaces/Profile.ts) — Type definitions for user profiles and preferences.
- [src/recommendation/store/recommendationStore.ts](../../src/recommendation/store/recommendationStore.ts) — State store for engine parameters and active recommendations.
- [src/recommendation/utilities/normalization.ts](../../src/recommendation/utilities/normalization.ts) — Normalization utilities for trail attributes.
- [src/recommendation/utilities/NormalizeTrails.ts](../../src/recommendation/utilities/NormalizeTrails.ts) — Min-max scaling and bound enforcement for trail vectors.
- [src/recommendation/utilities/FactorWeightsMapper.ts](../../src/recommendation/utilities/FactorWeightsMapper.ts) — Maps UI weights to calculation vectors.
- [src/recommendation/utilities/ProfileFactory.ts](../../src/recommendation/utilities/ProfileFactory.ts) — Profile instantiation factory.
- [src/recommendation/utilities/CreateProfile.ts](../../src/recommendation/utilities/CreateProfile.ts) & [src/recommendation/utilities/__tests__/CreateProfile.test.ts](../../src/recommendation/utilities/__tests__/CreateProfile.test.ts) — Creation and validation of user profiles.
- [src/recommendation/utilities/dataPreparation.ts](../../src/recommendation/utilities/dataPreparation.ts) — Prepares user and trail records for scoring.
- [src/recommendation/utilities/GetData.ts](../../src/recommendation/utilities/GetData.ts) — Data retrieval helpers for trails and preferences.
- [src/recommendation/utilities/GetElevation.ts](../../src/recommendation/utilities/GetElevation.ts) — Elevation processing helper.

---

## 2. Simulation Code
*Files related to running multi-cycle simulations, evaluating constraints, and testing convergence.*

### Simulation Harnesses & Runners
- [engine/run_user_set_simulation.py](../run_user_set_simulation.py) — Iterative simulation runner over seeded user sets.
- [scripts/simulation/run_simulation_harness.py](../../scripts/simulation/run_simulation_harness.py) — Baseline multi-cycle simulation loop.
- [scripts/simulation/trail_simulation/manage_trail_simulation.py](../../scripts/simulation/trail_simulation/manage_trail_simulation.py) — CLI runner for scaling simulation snapshots (40-trail and 80-trail suites).
- [scripts/simulation/trail_simulation/scripts/run_trail_simulation_harness.py](../../scripts/simulation/trail_simulation/scripts/run_trail_simulation_harness.py) — Parameterized harness for multi-cycle synthetic trail runs.
- [scripts/simulation/trail_simulation/setup_trail_simulation_inputs.py](../../scripts/simulation/trail_simulation/setup_trail_simulation_inputs.py) — Inputs and normalization setup for trail simulations.
- [scripts/simulation/trail_simulation/scripts/generate_80trails_simulation.py](../../scripts/simulation/trail_simulation/scripts/generate_80trails_simulation.py) — 80-trail scale benchmark harness.
- [scripts/simulation/trail_simulation/scripts/build_simulation_summary_md.py](../../scripts/simulation/trail_simulation/scripts/build_simulation_summary_md.py) — Aggregator script compiling simulation markdown summaries.
- [scripts/simulation/aberrant_simulation/manage_aberrant_simulation.py](../../scripts/simulation/aberrant_simulation/manage_aberrant_simulation.py) — Aberrant user cohort runner and manager.
- [scripts/simulation/aberrant_simulation/scripts/run_aberrant_simulation.py](../../scripts/simulation/aberrant_simulation/scripts/run_aberrant_simulation.py) — Aberrant user feedback loop simulation script.
- [scripts/simulation/aberrant_simulation/scripts/define_aberrant_cohorts.py](../../scripts/simulation/aberrant_simulation/scripts/define_aberrant_cohorts.py) — Persona definitions for aberrant/adversarial cohorts.

### Evaluation & Pillar Analysis Scripts
- [scripts/simulation/evaluate_pillar_1_variety.py](../../scripts/simulation/evaluate_pillar_1_variety.py) — Pillar 1 inter-user variety evaluator.
- [scripts/simulation/generate_pillar_1_top3_matrices.py](../../scripts/simulation/generate_pillar_1_top3_matrices.py) — Computes Top-3 recommendation overlap and dissimilarity matrices.
- [scripts/simulation/evaluate_pillar_2_constraints.py](../../scripts/simulation/evaluate_pillar_2_constraints.py) — Evaluates hard constraint compliance (medical, difficulty caps, distance limits).
- [scripts/simulation/generate_pillar_2_four_checks_report.py](../../scripts/simulation/generate_pillar_2_four_checks_report.py) — Four-check report generator for safety rules.
- [scripts/simulation/evaluate_pillar_3_contrast.py](../../scripts/simulation/evaluate_pillar_3_contrast.py) — Evaluates polar persona contrast and differentiation.
- [scripts/simulation/evaluate_pillar_4_discrimination.py](../../scripts/simulation/evaluate_pillar_4_discrimination.py) — Evaluates score spread and ranking discrimination.
- [scripts/simulation/aberrant_simulation/scripts/evaluate_aberrant_trajectories.py](../../scripts/simulation/aberrant_simulation/scripts/evaluate_aberrant_trajectories.py) — Trajectory analysis of erratic user interactions.
- [scripts/simulation/run_40trails_mirrored_evaluation.py](../../scripts/simulation/run_40trails_mirrored_evaluation.py) — Execution script for mirrored evaluation across 40 trails.
- [scripts/simulation/generate_40trails_report.py](../../scripts/simulation/generate_40trails_report.py) & [scripts/simulation/generate_40trails_easy_bucket_report.py](../../scripts/simulation/generate_40trails_easy_bucket_report.py) — Report generators for 40-trail evaluations.
- [scripts/simulation/generate_easy_bucket_report.py](../../scripts/simulation/generate_easy_bucket_report.py) — Beginner/easy bucket verification report generator.
- [scripts/simulation/generate_profile_tables.py](../../scripts/simulation/generate_profile_tables.py) — Formats user profile evolution tables.
- [scripts/simulation/test_simulation_users.py](../../scripts/simulation/test_simulation_users.py) — Validates user simulation constraints.
- [scripts/simulation/export_mirrored_raw_recs.py](../../scripts/simulation/export_mirrored_raw_recs.py) — Exports raw mirrored recommendation lists.
- [scripts/simulation/export_trails.py](../../scripts/simulation/export_trails.py) — Exports trails for simulation pipelines.

### UI Simulation Components (`src/recommendation/components/`)
- [src/recommendation/components/ConfigureEngineModal.tsx](../../src/recommendation/components/ConfigureEngineModal.tsx) — Interactive UI modal to tune weights and run simulations.
- [src/recommendation/components/SimulationConvergenceChart.tsx](../../src/recommendation/components/SimulationConvergenceChart.tsx) — Real-time convergence chart visualization component.
- [src/recommendation/components/RecommendationMatrix.tsx](../../src/recommendation/components/RecommendationMatrix.tsx) — UI matrix comparing recommendations across users.
- [src/recommendation/components/SimulatedUserModal.tsx](../../src/recommendation/components/SimulatedUserModal.tsx) & [src/recommendation/components/UserRecommendationsModal.tsx](../../src/recommendation/components/UserRecommendationsModal.tsx) — User profile inspector and per-cycle recommendations modal.
- [src/recommendation/components/SimulationDataset.tsx](../../src/recommendation/components/SimulationDataset.tsx), [src/recommendation/components/SimulationTrailDataset.tsx](../../src/recommendation/components/SimulationTrailDataset.tsx), [src/recommendation/components/TrailDataset.tsx](../../src/recommendation/components/TrailDataset.tsx), [src/recommendation/components/UserDataset.tsx](../../src/recommendation/components/UserDataset.tsx) — UI dataset visualizer panels.

---

## 3. Generated User Data
*Datasets of user personas, profiles, mirrored twins, ground-truth ranges, and specs.*

### Seeded Sets (`engine/data/seeded_user_sets/`)
- [engine/data/seeded_user_sets/set_1_users.json](../data/seeded_user_sets/set_1_users.json) — Base User Set 1 (5 distinct user archetypes).
- [engine/data/seeded_user_sets/set_1_users_mirrored.json](../data/seeded_user_sets/set_1_users_mirrored.json) — Mirrored counter-profiles for Set 1.
- [engine/data/seeded_user_sets/set_2_users.json](../data/seeded_user_sets/set_2_users.json) — User Set 2 (extended personas).
- [engine/data/seeded_user_sets/set_2_users_mirrored.json](../data/seeded_user_sets/set_2_users_mirrored.json) — Mirrored counter-profiles for Set 2.
- [engine/data/seeded_user_sets/set_3_users.json](../data/seeded_user_sets/set_3_users.json) — User Set 3 (edge-case personas).
- [engine/data/seeded_user_sets/set_3_users_mirrored.json](../data/seeded_user_sets/set_3_users_mirrored.json) — Mirrored counter-profiles for Set 3.
- [engine/data/seeded_user_sets/set_4_users.json](../data/seeded_user_sets/set_4_users.json) — User Set 4.
- [engine/data/seeded_user_sets/set_5_users.json](../data/seeded_user_sets/set_5_users.json) — User Set 5.
- [engine/data/seeded_user_sets/seeded_user_sets_summary.json](../data/seeded_user_sets/seeded_user_sets_summary.json) — Statistical summary and catalog of all seeded user sets.
- [engine/data/seeded_user_sets/verification_report.json](../data/seeded_user_sets/verification_report.json) — Verification and boundary check report for seeded sets.

### User Generation & Verification Scripts
- [engine/seed_user_sets.py](../seed_user_sets.py) — Core generator for user sets.
- [engine/generate_mirrored_user_set.py](../generate_mirrored_user_set.py) — Generator for mirrored counter-profiles.
- [engine/generate_mirrored_sets_1_and_2.py](../generate_mirrored_sets_1_and_2.py) — Batch generator for mirrored sets 1 and 2.
- [engine/verify_user_sets.py](../verify_user_sets.py) — Range verification and format validation script.

### Simulation User Cohorts & Range Constraints
- [scripts/simulation/output/users.json](../../scripts/simulation/output/users.json) & [scripts/simulation/output/users_spec.json](../../scripts/simulation/output/users_spec.json) — Active user cohort and spec for the 8-trail harness.
- [scripts/simulation/trail_simulation/inputs/users_40trails.json](../../scripts/simulation/trail_simulation/inputs/users_40trails.json) & [scripts/simulation/trail_simulation/inputs/users_spec.json](../../scripts/simulation/trail_simulation/inputs/users_spec.json) — User cohort and specs for 40-trail testing.
- [scripts/simulation/aberrant_simulation/inputs/app_profiles.json](../../scripts/simulation/aberrant_simulation/inputs/app_profiles.json) & [scripts/simulation/aberrant_simulation/output/users.json](../../scripts/simulation/aberrant_simulation/output/users.json) — Aberrant user cohort profiles.
- [scripts/simulation/gt_ranges.json](../../scripts/simulation/gt_ranges.json) & [scripts/simulation/trail_simulation/inputs/gt_ranges.json](../../scripts/simulation/trail_simulation/inputs/gt_ranges.json) — Ground truth attribute boundaries.
- [scripts/simulation/output/start_distances.csv](../../scripts/simulation/output/start_distances.csv) & [scripts/simulation/trail_simulation/inputs/start_distances_40trails.csv](../../scripts/simulation/trail_simulation/inputs/start_distances_40trails.csv) — Starting geographic distances between users and trailheads.

---

## 4. Generated Trail Data
*Both the original 8 curated real-world trails and synthetic/scaled catalogues.*

### Original 8 Real-World Trails
- [scripts/simulation/output/trails.json](../../scripts/simulation/output/trails.json) — The 8 baseline trails extracted from real mountain data with normalized scoring attributes.
- [scripts/simulation/output/trails_meta.json](../../scripts/simulation/output/trails_meta.json) — Descriptions, locations, and metadata for the original 8 trails.
- [scripts/simulation/trail_simulation/trail_generator/output/real_trails.json](../../scripts/simulation/trail_simulation/trail_generator/output/real_trails.json) — Reference copy of the 8 real trails.
- [scripts/simulation/trail_simulation/trail_generator/output/real_trails_renormalized.json](../../scripts/simulation/trail_simulation/trail_generator/output/real_trails_renormalized.json) & [scripts/simulation/trail_simulation/inputs/real_trails_renormalized.json](../../scripts/simulation/trail_simulation/inputs/real_trails_renormalized.json) — The 8 base trails re-normalized across expanded catalog bounds.
- Extraction pipeline: [scripts/trail_pipeline/extract_trails.py](../../scripts/trail_pipeline/extract_trails.py), [scripts/trail_pipeline/03_append_elevation.py](../../scripts/trail_pipeline/03_append_elevation.py), and [scripts/trail_pipeline/mountains_trails_config.json](../../scripts/trail_pipeline/mountains_trails_config.json).

### Generated & Scaled Trail Catalogs (40, 80, 88 Trails)
- [scripts/simulation/trail_simulation/inputs/catalog_seed42.json](../../scripts/simulation/trail_simulation/inputs/catalog_seed42.json) — 40-trail synthetic catalog (32 generated + 8 base, Seed 42).
- [scripts/simulation/trail_simulation/inputs/catalog_seed7.json](../../scripts/simulation/trail_simulation/inputs/catalog_seed7.json) — 40-trail alternate catalogue (Seed 7) for robustness checks.
- [scripts/simulation/trail_simulation/inputs/norm_bounds_40trails.json](../../scripts/simulation/trail_simulation/inputs/norm_bounds_40trails.json) — Min-max normalization boundaries for the 40-trail catalog.
- [scripts/simulation/trail_simulation/snapshots/scale_80trails_12cycles/catalog_80trails.json](../../scripts/simulation/trail_simulation/snapshots/scale_80trails_12cycles/catalog_80trails.json) & [scripts/simulation/trail_simulation/snapshots/scale_80trails_20cycles/catalog_80trails.json](../../scripts/simulation/trail_simulation/snapshots/scale_80trails_20cycles/catalog_80trails.json) — Scaled 80-trail catalog.
- [src/recommendation/data/cycleSimulationTrails.json](../../src/recommendation/data/cycleSimulationTrails.json) & [src/recommendation/data/trailSimulationCatalog.json](../../src/recommendation/data/trailSimulationCatalog.json) — Trails bundled into the frontend app.
- Trail generator package: [scripts/simulation/trail_simulation/trail_generator/generate.py](../../scripts/simulation/trail_simulation/trail_generator/generate.py), [scripts/simulation/trail_simulation/trail_generator/config.py](../../scripts/simulation/trail_simulation/trail_generator/config.py), and [scripts/simulation/trail_simulation/trail_generator/validate.py](../../scripts/simulation/trail_simulation/trail_generator/validate.py).

---

## 5. Recommendation Outputs
*Result files containing ranked recommendations, harness telemetry, user evolution states, and convergence metrics.*

### Top-Level Harness Outputs
- [engine/data/seeded_user_sets/simulation_output/simulationHarnessResults.json](../data/seeded_user_sets/simulation_output/simulationHarnessResults.json) — Recommendations, candidate scores, and rankings per cycle for seeded user sets.
- [engine/data/seeded_user_sets/simulation_output/simulatedUsers.json](../data/seeded_user_sets/simulation_output/simulatedUsers.json) — User preference vectors after multi-cycle updates.
- [scripts/simulation/output/harness_results.json](../../scripts/simulation/output/harness_results.json) — Baseline simulation full recommendation log.
- [scripts/simulation/output/simulatedUsers.json](../../scripts/simulation/output/simulatedUsers.json) — Evolved profiles for 8-trail runs.
- [scripts/simulation/output/convergence_summary.csv](../../scripts/simulation/output/convergence_summary.csv) — Metric convergence telemetry across cycles.
- [plans/all_simulations_cycle_telemetry.csv](../../plans/all_simulations_cycle_telemetry.csv) & [all_simulations_cycle_telemetry.csv](../../all_simulations_cycle_telemetry.csv) — Aggregated cycle telemetry across all benchmark runs.
- [src/recommendation/data/simulationHarnessResults.json](../../src/recommendation/data/simulationHarnessResults.json) & [src/recommendation/data/simulatedUsers.json](../../src/recommendation/data/simulatedUsers.json) — Bundled results for UI visualization.

### 40-Trail Benchmark Snapshots (`scripts/simulation/trail_simulation/snapshots/`)
- [idealistic_40trails_5cycles/](../../scripts/simulation/trail_simulation/snapshots/idealistic_40trails_5cycles/) (`harness_results.json`, `simulatedUsers.json`, `convergence_summary.csv`)
- [idealistic_40trails_10cycles/](../../scripts/simulation/trail_simulation/snapshots/idealistic_40trails_10cycles/)
- [idealistic_40trails_12cycles/](../../scripts/simulation/trail_simulation/snapshots/idealistic_40trails_12cycles/)
- [idealistic_40trails_20cycles/](../../scripts/simulation/trail_simulation/snapshots/idealistic_40trails_20cycles/)
- [robustness_seed7_10cycles/](../../scripts/simulation/trail_simulation/snapshots/robustness_seed7_10cycles/)
- [realistic_8trails_10cycles/](../../scripts/simulation/trail_simulation/snapshots/realistic_8trails_10cycles/)

### 80-Trail Benchmark Snapshots
- [scale_80trails_12cycles/](../../scripts/simulation/trail_simulation/snapshots/scale_80trails_12cycles/) (`harness_results.json`, `simulatedUsers.json`, `convergence_summary.csv`)
- [scale_80trails_20cycles/](../../scripts/simulation/trail_simulation/snapshots/scale_80trails_20cycles/)

### Aberrant / Stress-Test Cohort Outputs
- [scripts/simulation/aberrant_simulation/output/harness_results.json](../../scripts/simulation/aberrant_simulation/output/harness_results.json) & [scripts/simulation/aberrant_simulation/output/simulatedUsers.json](../../scripts/simulation/aberrant_simulation/output/simulatedUsers.json)
- Snapshots in [scripts/simulation/aberrant_simulation/snapshots/](../../scripts/simulation/aberrant_simulation/snapshots/) (`sim_3cycles`, `sim_5cycles`, `sim_10cycles`, `sim_20cycles`, `scale_88trails_24cycles`).

---

## 6. Documentation
*Markdown and technical documentation detailing how the engine, formulas, simulations, and validation pillars function.*

### Engine Architecture & Design Documents
- [engine/README.md](../README.md) — Service overview, local setup, and endpoint documentation.
- [engine/documents/configuration.md](configuration.md) — Engine hyperparameter reference and operational tuning guide.
- [plans/tars_recommendation_engine_documentation.md](../../plans/tars_recommendation_engine_documentation.md) — Core TARS design, scoring formulas, Gower similarity, and hard-filter pipeline.
- [plans/profile_update_engine_documentation.md](../../plans/profile_update_engine_documentation.md) — Math, EMA parameters, and convergence mechanics of the profile updater.
- [plans/TARS_creation.md](../../plans/TARS_creation.md) — Foundational design document proposing TARS.
- [plans/tars_cloud_run_deployment_plan.md](../../plans/tars_cloud_run_deployment_plan.md) — Google Cloud Run deployment plan.

### Simulation Methodology & Aggregate Summaries
- [plans/simulation_and_evaluation_plan.md](../../plans/simulation_and_evaluation_plan.md) — Master testing methodology and 4-pillar evaluation framework.
- [plans/simulation_results_summary.md](../../plans/simulation_results_summary.md) & [simulation_results_summary.md](../../simulation_results_summary.md) — Executive summary of simulation findings.
- [plans/simulation_benchmark_data_and_results.md](../../plans/simulation_benchmark_data_and_results.md) — Benchmark numbers, iteration curves, and error bounds.
- [plans/simulation_profile_evolution_analysis_report.md](../../plans/simulation_profile_evolution_analysis_report.md) — Analysis of preference drift and convergence stability.
- [plans/aberrant_and_normal_cohort_simulation_report.md](../../plans/aberrant_and_normal_cohort_simulation_report.md) — Comparative study of standard vs. aberrant personas.
- [scripts/simulation/trail_simulation/README.md](../../scripts/simulation/trail_simulation/README.md) & [scripts/simulation/trail_simulation/reports/simulation_40trails_summary.md](../../scripts/simulation/trail_simulation/reports/simulation_40trails_summary.md) — 40-trail synthetic catalog simulation summary.
- [scripts/simulation/aberrant_simulation/README.md](../../scripts/simulation/aberrant_simulation/README.md) — Aberrant user simulation guide.

### Pillar-Specific Evaluation Reports
- [plans/pillar_1_inter_user_variety_evaluation.md](../../plans/pillar_1_inter_user_variety_evaluation.md) — Pillar 1: Inter-user variety and uniqueness evaluation.
- [plans/pillar_1_top3_recommendations_and_dissimilarity_matrix.md](../../plans/pillar_1_top3_recommendations_and_dissimilarity_matrix.md) — Top-3 similarity matrix and analysis.
- [plans/pillar_2_constraint_alignment_evaluation.md](../../plans/pillar_2_constraint_alignment_evaluation.md) — Pillar 2: Safety, distance, and difficulty constraint verification.
- [plans/pillar_2_40trails_easy_bucket_medical_twin_evaluation.md](../../plans/pillar_2_40trails_easy_bucket_medical_twin_evaluation.md) & [plans/pillar_2_easy_bucket_medical_twin_evaluation.md](../../plans/pillar_2_easy_bucket_medical_twin_evaluation.md) — Easy bucket constraint analysis.
- [plans/pillar_2_40trails_mirrored_evaluation_results.md](../../plans/pillar_2_40trails_mirrored_evaluation_results.md) & [plans/pillar_2_mirrored_evaluation_results.md](../../plans/pillar_2_mirrored_evaluation_results.md) — Mirrored counter-profile evaluation.
- [plans/pillar_2_raw_recommendation_list.md](../../plans/pillar_2_raw_recommendation_list.md) — Documented raw recommendation output tables.
- [plans/pillar_3_dual_anchor_contrast_evaluation.md](../../plans/pillar_3_dual_anchor_contrast_evaluation.md) — Pillar 3: Dual-anchor persona contrast analysis.
- [plans/pillar_4_score_discrimination_evaluation.md](../../plans/pillar_4_score_discrimination_evaluation.md) — Pillar 4: Score discrimination and ranking spread.

### Data Generation & Extraction Guides
- [plans/generated_user_sets_registry.md](../../plans/generated_user_sets_registry.md) — Registry of seeded user sets, archetypes, and parameters.
- [plans/user_profile_generation_documentation.md](../../plans/user_profile_generation_documentation.md) — User persona synthesis and preference generation rules.
- [plans/synthetic_trails_generation.md](../../plans/synthetic_trails_generation.md) & [plans/synthetic_trails_generation_v2.md](../../plans/synthetic_trails_generation_v2.md) — Mathematical specification for synthetic trail generation.
- [scripts/simulation/trail_simulation/reports/GENERATION_REPORT.md](../../scripts/simulation/trail_simulation/reports/GENERATION_REPORT.md) — Generation and distribution validation report for synthetic trails.
- [plans/trail-extraction-plan.md](../../plans/trail-extraction-plan.md) — Design document for extracting features from raw GeoJSON tracks.
