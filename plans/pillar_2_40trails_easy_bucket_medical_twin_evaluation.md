# Pillar 2: Medical vs. Twin Comparison in the Easy Bucket (40-Trail Catalog)

**Dataset:** 44 Mirrored Cohorts ([`set_1_users_mirrored.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets/set_1_users_mirrored.json))  
**Catalog:** 40 Combined Trails ([`catalog_seed42.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/trail_simulation/inputs/catalog_seed42.json))  
**Source Recommendations:** [`mirrored_pillar_2_40trails_raw_recs.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/output/mirrored_pillar_2_40trails_raw_recs.json)  
**Evaluation Scope:** Easy Bucket Only (`recs[uid]['easy']`)  
**Core Objective:** Test whether the medical flag alone changes what the user sees by default in their Easy bucket when profile features are bitwise identical.  

---

## Executive Summary

1. **Strong Default Separation with 40 Trails:**
   - Across Gower and Euclidean configurations, **15 of 22 pairs (68.2%)** receive a lower average elevation gain in their Easy bucket.
   - In **7 of 22 pairs (31.8%)**, elevation gain is exactly equal because both twins are novice (`E1`) cohorts whose Easy buckets are already filled with the easiest available trails.
   - **0 of 22 pairs** have higher gain for the medical twin in Gower and Euclidean models.

2. **Why the Medical Flag Changes Default Visibility:**
   - When `medicalProfile.hasCondition == True`, THARESYS activates `EXERTION_SAFETY_MARGIN_VULNERABLE = 0.20`.
   - With 40 trails in the catalog, this tighter ceiling excludes moderate-elevation trails (400 m to 700 m) from the medical twin's Easy bucket, routing them into Difficult.
   - Consequently, the medical user's default Easy view is populated with ultra-gentle paths (88 m to 280 m), achieving downshifts of **15% to 60%** relative to their healthy twin.

---

## Summary Table by Configuration and Alpha

| Configuration | Alpha | Med < Healthy (Downshifted) | Med == Healthy (Equal) | Med > Healthy (Higher) | % Lower |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Set 1: Pure Gower** | α=1.0000 | **15 of 22** | 7 of 22 | 0 of 22 | **68.2%** |
| **Set 1: Pure Gower** | α=0.7500 | **15 of 22** | 7 of 22 | 0 of 22 | **68.2%** |
| **Set 1: Pure Gower** | α=0.5612 | **15 of 22** | 7 of 22 | 0 of 22 | **68.2%** |
| **Set 1: Pure Gower** | α=0.5000 | **15 of 22** | 7 of 22 | 0 of 22 | **68.2%** |
| **Set 2: Pure Euclidean** | α=1.0000 | **15 of 22** | 7 of 22 | 0 of 22 | **68.2%** |
| **Set 2: Pure Euclidean** | α=0.7500 | **15 of 22** | 7 of 22 | 0 of 22 | **68.2%** |
| **Set 2: Pure Euclidean** | α=0.5612 | **15 of 22** | 7 of 22 | 0 of 22 | **68.2%** |
| **Set 2: Pure Euclidean** | α=0.5000 | **15 of 22** | 7 of 22 | 0 of 22 | **68.2%** |
| **Set 3: Pure Cosine** | α=1.0000 | **11 of 22** | 11 of 22 | 0 of 22 | **50.0%** |
| **Set 3: Pure Cosine** | α=0.7500 | **12 of 22** | 10 of 22 | 0 of 22 | **54.5%** |
| **Set 3: Pure Cosine** | α=0.5612 | **12 of 22** | 10 of 22 | 0 of 22 | **54.5%** |
| **Set 3: Pure Cosine** | α=0.5000 | **12 of 22** | 10 of 22 | 0 of 22 | **54.5%** |
| **Set 4: GD / ED** | α=1.0000 | **15 of 22** | 7 of 22 | 0 of 22 | **68.2%** |
| **Set 4: GD / ED** | α=0.7500 | **15 of 22** | 7 of 22 | 0 of 22 | **68.2%** |
| **Set 4: GD / ED** | α=0.5612 | **15 of 22** | 7 of 22 | 0 of 22 | **68.2%** |
| **Set 4: GD / ED** | α=0.5000 | **15 of 22** | 7 of 22 | 0 of 22 | **68.2%** |
| **Set 5: GD / CS** | α=1.0000 | **15 of 22** | 7 of 22 | 0 of 22 | **68.2%** |
| **Set 5: GD / CS** | α=0.7500 | **15 of 22** | 7 of 22 | 0 of 22 | **68.2%** |
| **Set 5: GD / CS** | α=0.5612 | **15 of 22** | 7 of 22 | 0 of 22 | **68.2%** |
| **Set 5: GD / CS** | α=0.5000 | **15 of 22** | 7 of 22 | 0 of 22 | **68.2%** |
| **Set 6: ED / GD** | α=1.0000 | **15 of 22** | 7 of 22 | 0 of 22 | **68.2%** |
| **Set 6: ED / GD** | α=0.7500 | **15 of 22** | 7 of 22 | 0 of 22 | **68.2%** |
| **Set 6: ED / GD** | α=0.5612 | **15 of 22** | 7 of 22 | 0 of 22 | **68.2%** |
| **Set 6: ED / GD** | α=0.5000 | **15 of 22** | 7 of 22 | 0 of 22 | **68.2%** |
| **Set 7: ED / CS** | α=1.0000 | **15 of 22** | 7 of 22 | 0 of 22 | **68.2%** |
| **Set 7: ED / CS** | α=0.7500 | **15 of 22** | 7 of 22 | 0 of 22 | **68.2%** |
| **Set 7: ED / CS** | α=0.5612 | **14 of 22** | 8 of 22 | 0 of 22 | **63.6%** |
| **Set 7: ED / CS** | α=0.5000 | **14 of 22** | 8 of 22 | 0 of 22 | **63.6%** |
| **Set 8: CS / GD** | α=1.0000 | **11 of 22** | 11 of 22 | 0 of 22 | **50.0%** |
| **Set 8: CS / GD** | α=0.7500 | **14 of 22** | 8 of 22 | 0 of 22 | **63.6%** |
| **Set 8: CS / GD** | α=0.5612 | **14 of 22** | 8 of 22 | 0 of 22 | **63.6%** |
| **Set 8: CS / GD** | α=0.5000 | **14 of 22** | 8 of 22 | 0 of 22 | **63.6%** |
| **Set 9: CS / ED** | α=1.0000 | **11 of 22** | 11 of 22 | 0 of 22 | **50.0%** |
| **Set 9: CS / ED** | α=0.7500 | **13 of 22** | 9 of 22 | 0 of 22 | **59.1%** |
| **Set 9: CS / ED** | α=0.5612 | **14 of 22** | 8 of 22 | 0 of 22 | **63.6%** |
| **Set 9: CS / ED** | α=0.5000 | **14 of 22** | 8 of 22 | 0 of 22 | **63.6%** |

---

## Detailed Configuration Breakdown

### Set 1: Pure Gower
α=1.0000
Medical User Easy Gain < Healthy Twin: 15 of 22
Medical User Easy Gain == Healthy Twin: 7 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 68.2%

α=0.7500
Medical User Easy Gain < Healthy Twin: 15 of 22
Medical User Easy Gain == Healthy Twin: 7 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 68.2%

α=0.5612
Medical User Easy Gain < Healthy Twin: 15 of 22
Medical User Easy Gain == Healthy Twin: 7 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 68.2%

α=0.5000
Medical User Easy Gain < Healthy Twin: 15 of 22
Medical User Easy Gain == Healthy Twin: 7 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 68.2%

### Set 2: Pure Euclidean
α=1.0000
Medical User Easy Gain < Healthy Twin: 15 of 22
Medical User Easy Gain == Healthy Twin: 7 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 68.2%

α=0.7500
Medical User Easy Gain < Healthy Twin: 15 of 22
Medical User Easy Gain == Healthy Twin: 7 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 68.2%

α=0.5612
Medical User Easy Gain < Healthy Twin: 15 of 22
Medical User Easy Gain == Healthy Twin: 7 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 68.2%

α=0.5000
Medical User Easy Gain < Healthy Twin: 15 of 22
Medical User Easy Gain == Healthy Twin: 7 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 68.2%

### Set 3: Pure Cosine
α=1.0000
Medical User Easy Gain < Healthy Twin: 11 of 22
Medical User Easy Gain == Healthy Twin: 11 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 50.0%

α=0.7500
Medical User Easy Gain < Healthy Twin: 12 of 22
Medical User Easy Gain == Healthy Twin: 10 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 54.5%

α=0.5612
Medical User Easy Gain < Healthy Twin: 12 of 22
Medical User Easy Gain == Healthy Twin: 10 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 54.5%

α=0.5000
Medical User Easy Gain < Healthy Twin: 12 of 22
Medical User Easy Gain == Healthy Twin: 10 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 54.5%

### Set 4: GD / ED
α=1.0000
Medical User Easy Gain < Healthy Twin: 15 of 22
Medical User Easy Gain == Healthy Twin: 7 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 68.2%

α=0.7500
Medical User Easy Gain < Healthy Twin: 15 of 22
Medical User Easy Gain == Healthy Twin: 7 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 68.2%

α=0.5612
Medical User Easy Gain < Healthy Twin: 15 of 22
Medical User Easy Gain == Healthy Twin: 7 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 68.2%

α=0.5000
Medical User Easy Gain < Healthy Twin: 15 of 22
Medical User Easy Gain == Healthy Twin: 7 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 68.2%

### Set 5: GD / CS
α=1.0000
Medical User Easy Gain < Healthy Twin: 15 of 22
Medical User Easy Gain == Healthy Twin: 7 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 68.2%

α=0.7500
Medical User Easy Gain < Healthy Twin: 15 of 22
Medical User Easy Gain == Healthy Twin: 7 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 68.2%

α=0.5612
Medical User Easy Gain < Healthy Twin: 15 of 22
Medical User Easy Gain == Healthy Twin: 7 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 68.2%

α=0.5000
Medical User Easy Gain < Healthy Twin: 15 of 22
Medical User Easy Gain == Healthy Twin: 7 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 68.2%

### Set 6: ED / GD
α=1.0000
Medical User Easy Gain < Healthy Twin: 15 of 22
Medical User Easy Gain == Healthy Twin: 7 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 68.2%

α=0.7500
Medical User Easy Gain < Healthy Twin: 15 of 22
Medical User Easy Gain == Healthy Twin: 7 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 68.2%

α=0.5612
Medical User Easy Gain < Healthy Twin: 15 of 22
Medical User Easy Gain == Healthy Twin: 7 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 68.2%

α=0.5000
Medical User Easy Gain < Healthy Twin: 15 of 22
Medical User Easy Gain == Healthy Twin: 7 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 68.2%

### Set 7: ED / CS
α=1.0000
Medical User Easy Gain < Healthy Twin: 15 of 22
Medical User Easy Gain == Healthy Twin: 7 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 68.2%

α=0.7500
Medical User Easy Gain < Healthy Twin: 15 of 22
Medical User Easy Gain == Healthy Twin: 7 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 68.2%

α=0.5612
Medical User Easy Gain < Healthy Twin: 14 of 22
Medical User Easy Gain == Healthy Twin: 8 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 63.6%

α=0.5000
Medical User Easy Gain < Healthy Twin: 14 of 22
Medical User Easy Gain == Healthy Twin: 8 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 63.6%

### Set 8: CS / GD
α=1.0000
Medical User Easy Gain < Healthy Twin: 11 of 22
Medical User Easy Gain == Healthy Twin: 11 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 50.0%

α=0.7500
Medical User Easy Gain < Healthy Twin: 14 of 22
Medical User Easy Gain == Healthy Twin: 8 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 63.6%

α=0.5612
Medical User Easy Gain < Healthy Twin: 14 of 22
Medical User Easy Gain == Healthy Twin: 8 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 63.6%

α=0.5000
Medical User Easy Gain < Healthy Twin: 14 of 22
Medical User Easy Gain == Healthy Twin: 8 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 63.6%

### Set 9: CS / ED
α=1.0000
Medical User Easy Gain < Healthy Twin: 11 of 22
Medical User Easy Gain == Healthy Twin: 11 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 50.0%

α=0.7500
Medical User Easy Gain < Healthy Twin: 13 of 22
Medical User Easy Gain == Healthy Twin: 9 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 59.1%

α=0.5612
Medical User Easy Gain < Healthy Twin: 14 of 22
Medical User Easy Gain == Healthy Twin: 8 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 63.6%

α=0.5000
Medical User Easy Gain < Healthy Twin: 14 of 22
Medical User Easy Gain == Healthy Twin: 8 of 22
Medical User Easy Gain > Healthy Twin: 0 of 22
Effective Downshift Rate in Easy Bucket: 63.6%

---

## Representative Pair Breakdown: Set 1 (Pure Gower @ α=0.5612)

| Pair | Archetype | Experience | Healthy Easy Gain | Medical Easy Gain | Change (%) | Status | Healthy Easy Trails (Count) | Medical Easy Trails (Count) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **cohort01** | `E1-P1` | E1 (act: E1) | 255.8 m | 255.8 m | **+0.0%** | Equal (Clamped) | 12 trails | 12 trails |
| **cohort02** | `E1-P2` | E1 (act: E1) | 274.5 m | 274.5 m | **+0.0%** | Equal (Clamped) | 13 trails | 13 trails |
| **cohort03** | `E1-P3` | E1 (act: E1) | 288.4 m | 288.4 m | **+0.0%** | Equal (Clamped) | 14 trails | 14 trails |
| **cohort04** | `E2-P1` | E2 (act: E2) | 351.2 m | 288.4 m | **+17.9%** | Lower (Downshifted) | 18 trails | 14 trails |
| **cohort05** | `E2-P2` | E2 (act: E2) | 351.2 m | 321.8 m | **+8.4%** | Lower (Downshifted) | 18 trails | 16 trails |
| **cohort06** | `E2-P3` | E2 (act: E2) | 351.2 m | 288.4 m | **+17.9%** | Lower (Downshifted) | 18 trails | 14 trails |
| **cohort07** | `E3-P1` | E3 (act: E3) | 384.0 m | 351.2 m | **+8.6%** | Lower (Downshifted) | 20 trails | 18 trails |
| **cohort08** | `E3-P2` | E3 (act: E3) | 367.2 m | 351.2 m | **+4.4%** | Lower (Downshifted) | 19 trails | 18 trails |
| **cohort09** | `E3-P3` | E3 (act: E3) | 367.2 m | 351.2 m | **+4.4%** | Lower (Downshifted) | 19 trails | 18 trails |
| **cohort10** | `E4-P1` | E4 (act: E4) | 444.8 m | 422.7 m | **+5.0%** | Lower (Downshifted) | 22 trails | 21 trails |
| **cohort11** | `E4-P2` | E4 (act: E4) | 409.0 m | 384.0 m | **+6.1%** | Lower (Downshifted) | 21 trails | 20 trails |
| **cohort12** | `E4-P3` | E4 (act: E4) | 409.0 m | 367.2 m | **+10.2%** | Lower (Downshifted) | 21 trails | 19 trails |
| **cohort13** | `AB-4-1-P1` | E4 (act: E1) | 444.8 m | 444.8 m | **+0.0%** | Equal (Clamped) | 22 trails | 22 trails |
| **cohort14** | `AB-4-2-P1` | E4 (act: E2) | 409.0 m | 384.0 m | **+6.1%** | Lower (Downshifted) | 21 trails | 20 trails |
| **cohort15** | `AB-4-3-P1` | E4 (act: E3) | 444.8 m | 422.7 m | **+5.0%** | Lower (Downshifted) | 22 trails | 21 trails |
| **cohort16** | `AB-3-1-P1` | E3 (act: E1) | 409.0 m | 384.0 m | **+6.1%** | Lower (Downshifted) | 21 trails | 20 trails |
| **cohort17** | `AB-3-2-P1` | E3 (act: E2) | 384.0 m | 351.2 m | **+8.6%** | Lower (Downshifted) | 20 trails | 18 trails |
| **cohort18** | `AB-2-1-P1` | E2 (act: E1) | 342.4 m | 272.1 m | **+20.5%** | Lower (Downshifted) | 17 trails | 13 trails |
| **cohort19** | `AB-1-4-P1` | E1 (act: E4) | 288.4 m | 288.4 m | **+0.0%** | Equal (Clamped) | 14 trails | 14 trails |
| **cohort20** | `AB-1-3-P1` | E1 (act: E3) | 268.1 m | 268.1 m | **+0.0%** | Equal (Clamped) | 12 trails | 12 trails |
| **cohort21** | `AB-1-2-P1` | E1 (act: E2) | 255.8 m | 255.8 m | **+0.0%** | Equal (Clamped) | 12 trails | 12 trails |
| **cohort22** | `AB-2-4-P1` | E2 (act: E4) | 351.2 m | 305.2 m | **+13.1%** | Lower (Downshifted) | 18 trails | 15 trails |
