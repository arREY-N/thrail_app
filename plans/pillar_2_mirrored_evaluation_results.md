# Pillar 2: Safety & Constraint Verification on Mirrored Cohorts

**Dataset:** 44 Mirrored Cohorts ([`set_1_users_mirrored.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets/set_1_users_mirrored.json))  
**Catalog:** 8 Production Trails ([`trails.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/output/trails.json))  
**Raw Recommendations Source:** [`mirrored_pillar_2_raw_recommendations.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/output/mirrored_pillar_2_raw_recommendations.json)  
**Date:** November 5, 2026  

> **Limitation:** Differences between configs on 8 trails often come down to one trail swap, so don’t claim one config is better unless the counts clearly differ.

---

## Evaluation Protocol & Measures
1. **Hardest-Trail Count:** Count protected users (31 beginner and medical cohorts) who receive the 6/9 trail (*Mt. Makiling Traverse*) in either bucket's top recommended slots (`easy[:3]` or `diff[:2]`).
2. **Easy-Bucket Check:** Count protected users whose Easy bucket contains any trail above 3/9. An empty Easy bucket passes this check, because it is safe even if it is unhelpful.
3. **Empty-Bucket Rate:** Count users whose Easy bucket is empty, per config (out of 44 total users).
4. **Medical vs. Twin (Top-5):** For each of the 22 identical twin pairs, count how many medical users received an average elevation gain lower than their healthy twin across their Top-5 recommended trails.

---

### Set 1: Pure Gower
α=1.0000
Hardest-Trail Count (6/9 in Either Bucket): 13 of 31
Easy-Bucket Check (Contains > 3/9): 16 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 8 of 22

α=0.7500
Hardest-Trail Count (6/9 in Either Bucket): 13 of 31
Easy-Bucket Check (Contains > 3/9): 16 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 7 of 22

α=0.5612
Hardest-Trail Count (6/9 in Either Bucket): 13 of 31
Easy-Bucket Check (Contains > 3/9): 16 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 6 of 22

α=0.5000
Hardest-Trail Count (6/9 in Either Bucket): 13 of 31
Easy-Bucket Check (Contains > 3/9): 16 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 6 of 22

### Set 2: Pure Euclidean
α=1.0000
Hardest-Trail Count (6/9 in Either Bucket): 21 of 31
Easy-Bucket Check (Contains > 3/9): 13 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 6 of 22

α=0.7500
Hardest-Trail Count (6/9 in Either Bucket): 21 of 31
Easy-Bucket Check (Contains > 3/9): 13 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 6 of 22

α=0.5612
Hardest-Trail Count (6/9 in Either Bucket): 22 of 31
Easy-Bucket Check (Contains > 3/9): 13 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 6 of 22

α=0.5000
Hardest-Trail Count (6/9 in Either Bucket): 24 of 31
Easy-Bucket Check (Contains > 3/9): 13 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 6 of 22

### Set 3: Pure Cosine
α=1.0000
Hardest-Trail Count (6/9 in Either Bucket): 31 of 31
Easy-Bucket Check (Contains > 3/9): 10 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 4 of 22

α=0.7500
Hardest-Trail Count (6/9 in Either Bucket): 31 of 31
Easy-Bucket Check (Contains > 3/9): 10 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 2 of 22

α=0.5612
Hardest-Trail Count (6/9 in Either Bucket): 31 of 31
Easy-Bucket Check (Contains > 3/9): 10 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 2 of 22

α=0.5000
Hardest-Trail Count (6/9 in Either Bucket): 31 of 31
Easy-Bucket Check (Contains > 3/9): 10 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 2 of 22

### Set 4: GD / ED
α=1.0000
Hardest-Trail Count (6/9 in Either Bucket): 13 of 31
Easy-Bucket Check (Contains > 3/9): 16 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 8 of 22

α=0.7500
Hardest-Trail Count (6/9 in Either Bucket): 19 of 31
Easy-Bucket Check (Contains > 3/9): 14 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 6 of 22

α=0.5612
Hardest-Trail Count (6/9 in Either Bucket): 19 of 31
Easy-Bucket Check (Contains > 3/9): 14 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 6 of 22

α=0.5000
Hardest-Trail Count (6/9 in Either Bucket): 19 of 31
Easy-Bucket Check (Contains > 3/9): 14 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 5 of 22

### Set 5: GD / CS
α=1.0000
Hardest-Trail Count (6/9 in Either Bucket): 13 of 31
Easy-Bucket Check (Contains > 3/9): 16 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 8 of 22

α=0.7500
Hardest-Trail Count (6/9 in Either Bucket): 22 of 31
Easy-Bucket Check (Contains > 3/9): 13 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 5 of 22

α=0.5612
Hardest-Trail Count (6/9 in Either Bucket): 26 of 31
Easy-Bucket Check (Contains > 3/9): 13 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 4 of 22

α=0.5000
Hardest-Trail Count (6/9 in Either Bucket): 29 of 31
Easy-Bucket Check (Contains > 3/9): 13 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 4 of 22

### Set 6: ED / GD
α=1.0000
Hardest-Trail Count (6/9 in Either Bucket): 21 of 31
Easy-Bucket Check (Contains > 3/9): 13 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 6 of 22

α=0.7500
Hardest-Trail Count (6/9 in Either Bucket): 21 of 31
Easy-Bucket Check (Contains > 3/9): 13 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 6 of 22

α=0.5612
Hardest-Trail Count (6/9 in Either Bucket): 19 of 31
Easy-Bucket Check (Contains > 3/9): 13 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 6 of 22

α=0.5000
Hardest-Trail Count (6/9 in Either Bucket): 17 of 31
Easy-Bucket Check (Contains > 3/9): 13 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 6 of 22

### Set 7: ED / CS
α=1.0000
Hardest-Trail Count (6/9 in Either Bucket): 21 of 31
Easy-Bucket Check (Contains > 3/9): 13 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 6 of 22

α=0.7500
Hardest-Trail Count (6/9 in Either Bucket): 28 of 31
Easy-Bucket Check (Contains > 3/9): 13 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 6 of 22

α=0.5612
Hardest-Trail Count (6/9 in Either Bucket): 29 of 31
Easy-Bucket Check (Contains > 3/9): 12 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 3 of 22

α=0.5000
Hardest-Trail Count (6/9 in Either Bucket): 29 of 31
Easy-Bucket Check (Contains > 3/9): 12 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 3 of 22

### Set 8: CS / GD
α=1.0000
Hardest-Trail Count (6/9 in Either Bucket): 31 of 31
Easy-Bucket Check (Contains > 3/9): 10 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 4 of 22

α=0.7500
Hardest-Trail Count (6/9 in Either Bucket): 29 of 31
Easy-Bucket Check (Contains > 3/9): 11 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 4 of 22

α=0.5612
Hardest-Trail Count (6/9 in Either Bucket): 29 of 31
Easy-Bucket Check (Contains > 3/9): 11 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 4 of 22

α=0.5000
Hardest-Trail Count (6/9 in Either Bucket): 29 of 31
Easy-Bucket Check (Contains > 3/9): 11 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 5 of 22

### Set 9: CS / ED
α=1.0000
Hardest-Trail Count (6/9 in Either Bucket): 31 of 31
Easy-Bucket Check (Contains > 3/9): 10 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 4 of 22

α=0.7500
Hardest-Trail Count (6/9 in Either Bucket): 29 of 31
Easy-Bucket Check (Contains > 3/9): 11 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 5 of 22

α=0.5612
Hardest-Trail Count (6/9 in Either Bucket): 29 of 31
Easy-Bucket Check (Contains > 3/9): 11 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 5 of 22

α=0.5000
Hardest-Trail Count (6/9 in Either Bucket): 29 of 31
Easy-Bucket Check (Contains > 3/9): 11 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain): 4 of 22
