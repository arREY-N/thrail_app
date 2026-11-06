# Pillar 2: Medical vs. Twin Comparison in the Easy Bucket

**Dataset:** 44 Mirrored Cohorts ([`set_1_users_mirrored.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets/set_1_users_mirrored.json))  
**Catalog:** 8 Production Trails ([`trails.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/output/trails.json))  
**Evaluation Target:** Easy Bucket Only (`recs[uid]['easy']`)  
**Question Answered:** *Does the medical flag actually change what the user sees by default in their Easy bucket when profile inputs are identical?*  

---

## Executive Summary

1. **The Medical Flag Directly Alters Default Recommendations:**
   - In **Pure Gower (`Set 1`)** and **GD / ED (`Set 4`)**, **11 of 22 pairs (50%)** show lower elevation gain in the medical twin's Easy bucket.
   - In **10 of 22 pairs (45.5%)**, elevation gain is exactly equal because both twins are novice (`E1`) cohorts who are already clamped to the catalog's sole gentle trail (*Mt. Kulis*, 118 m gain).
   - Only **1 pair** (an aberrant mismatch archetype) showed higher gain.

2. **Algorithmic Mechanism:**
   - When `user.medicalProfile.hasCondition == True`, the engine activates `EXERTION_SAFETY_MARGIN_VULNERABLE = 0.20` (vs `0.35` for healthy).
   - This tighter threshold strictly routes moderate-gain trails (e.g., *Mt. Daraitan* at 536m and *Mt. Sembrano* at 704m) **out of the Easy bucket and into Difficult**, leaving the medical user with only gentle paths in their primary Easy view.

---

## Results by Engine Configuration and Alpha

### Set 1: Pure Gower
α=1.0000
- **Medical User Easy Gain < Healthy Twin:** 11 of 22 pairs (50.0%)
- **Medical User Easy Gain == Healthy Twin:** 10 of 22 pairs (45.5%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)

α=0.7500
- **Medical User Easy Gain < Healthy Twin:** 11 of 22 pairs (50.0%)
- **Medical User Easy Gain == Healthy Twin:** 10 of 22 pairs (45.5%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)

α=0.5612
- **Medical User Easy Gain < Healthy Twin:** 11 of 22 pairs (50.0%)
- **Medical User Easy Gain == Healthy Twin:** 10 of 22 pairs (45.5%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)

α=0.5000
- **Medical User Easy Gain < Healthy Twin:** 11 of 22 pairs (50.0%)
- **Medical User Easy Gain == Healthy Twin:** 10 of 22 pairs (45.5%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)

### Set 2: Pure Euclidean
α=1.0000
- **Medical User Easy Gain < Healthy Twin:** 9 of 22 pairs (40.9%)
- **Medical User Easy Gain == Healthy Twin:** 12 of 22 pairs (54.5%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)

α=0.7500
- **Medical User Easy Gain < Healthy Twin:** 9 of 22 pairs (40.9%)
- **Medical User Easy Gain == Healthy Twin:** 12 of 22 pairs (54.5%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)

α=0.5612
- **Medical User Easy Gain < Healthy Twin:** 10 of 22 pairs (45.5%)
- **Medical User Easy Gain == Healthy Twin:** 11 of 22 pairs (50.0%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)

α=0.5000
- **Medical User Easy Gain < Healthy Twin:** 10 of 22 pairs (45.5%)
- **Medical User Easy Gain == Healthy Twin:** 11 of 22 pairs (50.0%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)

### Set 3: Pure Cosine
α=1.0000
- **Medical User Easy Gain < Healthy Twin:** 6 of 22 pairs (27.3%)
- **Medical User Easy Gain == Healthy Twin:** 16 of 22 pairs (72.7%)
- **Medical User Easy Gain > Healthy Twin:** 0 of 22 pairs (0.0%)

α=0.7500
- **Medical User Easy Gain < Healthy Twin:** 7 of 22 pairs (31.8%)
- **Medical User Easy Gain == Healthy Twin:** 15 of 22 pairs (68.2%)
- **Medical User Easy Gain > Healthy Twin:** 0 of 22 pairs (0.0%)

α=0.5612
- **Medical User Easy Gain < Healthy Twin:** 6 of 22 pairs (27.3%)
- **Medical User Easy Gain == Healthy Twin:** 16 of 22 pairs (72.7%)
- **Medical User Easy Gain > Healthy Twin:** 0 of 22 pairs (0.0%)

α=0.5000
- **Medical User Easy Gain < Healthy Twin:** 6 of 22 pairs (27.3%)
- **Medical User Easy Gain == Healthy Twin:** 16 of 22 pairs (72.7%)
- **Medical User Easy Gain > Healthy Twin:** 0 of 22 pairs (0.0%)

### Set 4: GD / ED
α=1.0000
- **Medical User Easy Gain < Healthy Twin:** 11 of 22 pairs (50.0%)
- **Medical User Easy Gain == Healthy Twin:** 10 of 22 pairs (45.5%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)

α=0.7500
- **Medical User Easy Gain < Healthy Twin:** 11 of 22 pairs (50.0%)
- **Medical User Easy Gain == Healthy Twin:** 10 of 22 pairs (45.5%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)

α=0.5612
- **Medical User Easy Gain < Healthy Twin:** 11 of 22 pairs (50.0%)
- **Medical User Easy Gain == Healthy Twin:** 10 of 22 pairs (45.5%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)

α=0.5000
- **Medical User Easy Gain < Healthy Twin:** 11 of 22 pairs (50.0%)
- **Medical User Easy Gain == Healthy Twin:** 10 of 22 pairs (45.5%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)

### Set 5: GD / CS
α=1.0000
- **Medical User Easy Gain < Healthy Twin:** 11 of 22 pairs (50.0%)
- **Medical User Easy Gain == Healthy Twin:** 10 of 22 pairs (45.5%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)

α=0.7500
- **Medical User Easy Gain < Healthy Twin:** 9 of 22 pairs (40.9%)
- **Medical User Easy Gain == Healthy Twin:** 12 of 22 pairs (54.5%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)

α=0.5612
- **Medical User Easy Gain < Healthy Twin:** 8 of 22 pairs (36.4%)
- **Medical User Easy Gain == Healthy Twin:** 13 of 22 pairs (59.1%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)

α=0.5000
- **Medical User Easy Gain < Healthy Twin:** 8 of 22 pairs (36.4%)
- **Medical User Easy Gain == Healthy Twin:** 13 of 22 pairs (59.1%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)

### Set 6: ED / GD
α=1.0000
- **Medical User Easy Gain < Healthy Twin:** 9 of 22 pairs (40.9%)
- **Medical User Easy Gain == Healthy Twin:** 12 of 22 pairs (54.5%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)

α=0.7500
- **Medical User Easy Gain < Healthy Twin:** 10 of 22 pairs (45.5%)
- **Medical User Easy Gain == Healthy Twin:** 11 of 22 pairs (50.0%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)

α=0.5612
- **Medical User Easy Gain < Healthy Twin:** 10 of 22 pairs (45.5%)
- **Medical User Easy Gain == Healthy Twin:** 11 of 22 pairs (50.0%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)

α=0.5000
- **Medical User Easy Gain < Healthy Twin:** 10 of 22 pairs (45.5%)
- **Medical User Easy Gain == Healthy Twin:** 11 of 22 pairs (50.0%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)

### Set 7: ED / CS
α=1.0000
- **Medical User Easy Gain < Healthy Twin:** 9 of 22 pairs (40.9%)
- **Medical User Easy Gain == Healthy Twin:** 12 of 22 pairs (54.5%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)

α=0.7500
- **Medical User Easy Gain < Healthy Twin:** 9 of 22 pairs (40.9%)
- **Medical User Easy Gain == Healthy Twin:** 12 of 22 pairs (54.5%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)

α=0.5612
- **Medical User Easy Gain < Healthy Twin:** 8 of 22 pairs (36.4%)
- **Medical User Easy Gain == Healthy Twin:** 13 of 22 pairs (59.1%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)

α=0.5000
- **Medical User Easy Gain < Healthy Twin:** 8 of 22 pairs (36.4%)
- **Medical User Easy Gain == Healthy Twin:** 13 of 22 pairs (59.1%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)

### Set 8: CS / GD
α=1.0000
- **Medical User Easy Gain < Healthy Twin:** 6 of 22 pairs (27.3%)
- **Medical User Easy Gain == Healthy Twin:** 16 of 22 pairs (72.7%)
- **Medical User Easy Gain > Healthy Twin:** 0 of 22 pairs (0.0%)

α=0.7500
- **Medical User Easy Gain < Healthy Twin:** 9 of 22 pairs (40.9%)
- **Medical User Easy Gain == Healthy Twin:** 13 of 22 pairs (59.1%)
- **Medical User Easy Gain > Healthy Twin:** 0 of 22 pairs (0.0%)

α=0.5612
- **Medical User Easy Gain < Healthy Twin:** 9 of 22 pairs (40.9%)
- **Medical User Easy Gain == Healthy Twin:** 12 of 22 pairs (54.5%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)

α=0.5000
- **Medical User Easy Gain < Healthy Twin:** 9 of 22 pairs (40.9%)
- **Medical User Easy Gain == Healthy Twin:** 12 of 22 pairs (54.5%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)

### Set 9: CS / ED
α=1.0000
- **Medical User Easy Gain < Healthy Twin:** 6 of 22 pairs (27.3%)
- **Medical User Easy Gain == Healthy Twin:** 16 of 22 pairs (72.7%)
- **Medical User Easy Gain > Healthy Twin:** 0 of 22 pairs (0.0%)

α=0.7500
- **Medical User Easy Gain < Healthy Twin:** 9 of 22 pairs (40.9%)
- **Medical User Easy Gain == Healthy Twin:** 13 of 22 pairs (59.1%)
- **Medical User Easy Gain > Healthy Twin:** 0 of 22 pairs (0.0%)

α=0.5612
- **Medical User Easy Gain < Healthy Twin:** 9 of 22 pairs (40.9%)
- **Medical User Easy Gain == Healthy Twin:** 12 of 22 pairs (54.5%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)

α=0.5000
- **Medical User Easy Gain < Healthy Twin:** 9 of 22 pairs (40.9%)
- **Medical User Easy Gain == Healthy Twin:** 12 of 22 pairs (54.5%)
- **Medical User Easy Gain > Healthy Twin:** 1 of 22 pairs (4.5%)
