# THARESYS 40-Trail Scaling Simulation Summary Report

**Date:** November 3, 2026  
**Module:** `trail_simulation`  
**Engines:** Content-Based Filtering (Gower Distance) + Collaborative Filtering (Gower Distance)

---

## 1. Executive Summary

This simulation benchmark evaluates the scaling behavior, convergence stability, and cohort safety of the THARESYS recommendation engine when expanding the candidate trail pool from **8 real trails** to **40 trails** (8 real + 32 synthetic trails across 4 difficulty tiers: Easy, Moderate, Hard, Very Hard).

All continuous physical dimensions (`length`, `elevation`, `gain`, `slope`) were normalized under the combined 40-trail empirical min-max bounds (`Option 2`), and user priors were initialized in this identical coordinate space without mutating any historical Cycle Simulation benchmark files.

---

## 2. Benchmark Stage Comparison

| Benchmark Stage | Candidate Pool | Cycles | Cohorts | Convergence Rate | Mean $\Delta$ GD | Primary Finding |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Idealistic 40-Trail (Seed 42)** | 40 trails | 10 | 24 | **91.7%** (22/24) | **-0.0141** | With a 5x larger catalog, hikers discover diverse unhiked options in every cycle without pool exhaustion; steady convergence toward GT anchors is preserved. |
| **Idealistic 40-Trail (Seed 42)** | 40 trails | 5 | 24 | **95.8%** (23/24) | **-0.0066** | Rapid early convergence is achieved by cycle 5 across all experience levels. |
| **Realistic 8-Trail (Renormalized)** | 8 trails | 10 | 24 | **100.0%** (24/24) | **-0.0197** | Renormalizing the 8 real trails under 40-trail bounds preserves 100% convergence in the 8-trail environment. |
| **Robustness 40-Trail (Seed 7)** | 40 trails | 10 | 24 | **91.7%** (22/24) | **-0.0133** | Robustness check with an alternative random seed replicates the 91.7% convergence rate and distance trajectory within $\pm 0.0008$ GD. |

---

## 3. Disjoint Partitioning & Safety Ceiling Behavior

In the 40-trail catalog, candidate trails were partitioned into disjoint `easy` and `difficult` pools for each user based on relative anchor proximity and the absolute physical exertion ceiling:
- **Unhiked Easy Trails Available:** Across all 24 cohorts, minimum unhiked easy trails available was **11** (threshold requirement $\ge 5$).
- **Unhiked Difficult Trails Available:** Across all 24 cohorts, minimum unhiked difficult trails available was **18** (threshold requirement $\ge 5$).
- **Unhiked Primary Target Anchor Trails:** Across all 24 cohorts, minimum unhiked trails in the hiker's target anchor was **11** (threshold requirement $\ge 10$).
- **Medical & Beginner Protection:** Vulnerable hikers reporting medical conditions or beginner status (`E1`) were protected from trails with steep slope ($> 0.15$ normalized margin) or excessive vertical climb, routing those trails strictly to the difficult pool.

---

## 4. Key Conclusions

1. **Catalog Expansion Viability:** Expanding from 8 to 40 trails successfully eliminated trail exhaustion issues without causing recommendation divergence or thrashing.
2. **Deterministic Reproducibility:** Every trajectory and recommendation sequence reproduces identically from seeds 42 and 7.
3. **Module Independence:** Both the 8-trail Cycle Simulation and the 40-trail Trail Simulation exist as isolated, complete snapshot modules that can be restored into the UI on demand without interference.

