# Pillar 2: Safety & Constraint Verification on 40 Trails (32 Synthetic + 8 Real)

**Dataset:** 44 Mirrored Cohorts ([`set_1_users_mirrored.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/data/seeded_user_sets/set_1_users_mirrored.json))  
**Catalog:** 40 Trails combined ([`catalog_seed42.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/trail_simulation/inputs/catalog_seed42.json))  
**Raw Output Telemetry:** [`mirrored_pillar_2_40trails_raw_recs.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/output/mirrored_pillar_2_40trails_raw_recs.json)  
**Date:** November 5, 2026  

> Differences between configs on 8 trails often come down to one trail swap, so don’t claim one config is better unless the counts clearly differ. With 40 trails, separation between engines becomes substantially more pronounced.

---

### Configuration 1: Set 1: Pure Gower
α=1.0000
Hardest-Trail Count (6/9 in Either Bucket): 10 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 15 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 5 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

α=0.7500
Hardest-Trail Count (6/9 in Either Bucket): 10 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 15 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 5 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

α=0.5612
Hardest-Trail Count (6/9 in Either Bucket): 9 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 15 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 5 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

α=0.5000
Hardest-Trail Count (6/9 in Either Bucket): 9 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 15 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 5 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

### Configuration 2: Set 2: Pure Euclidean
α=1.0000
Hardest-Trail Count (6/9 in Either Bucket): 12 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 15 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 7 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

α=0.7500
Hardest-Trail Count (6/9 in Either Bucket): 15 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 15 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 6 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

α=0.5612
Hardest-Trail Count (6/9 in Either Bucket): 14 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 15 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 5 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

α=0.5000
Hardest-Trail Count (6/9 in Either Bucket): 14 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 15 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 5 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

### Configuration 3: Set 3: Pure Cosine
α=1.0000
Hardest-Trail Count (6/9 in Either Bucket): 4 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 11 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 8 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

α=0.7500
Hardest-Trail Count (6/9 in Either Bucket): 4 of 31
Easy-Bucket Check (Contains > 3/9): 30 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 12 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 8 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

α=0.5612
Hardest-Trail Count (6/9 in Either Bucket): 4 of 31
Easy-Bucket Check (Contains > 3/9): 30 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 12 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 9 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

α=0.5000
Hardest-Trail Count (6/9 in Either Bucket): 4 of 31
Easy-Bucket Check (Contains > 3/9): 30 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 12 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 9 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

### Configuration 4: Set 4: GD / ED
α=1.0000
Hardest-Trail Count (6/9 in Either Bucket): 10 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 15 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 5 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

α=0.7500
Hardest-Trail Count (6/9 in Either Bucket): 11 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 15 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 5 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

α=0.5612
Hardest-Trail Count (6/9 in Either Bucket): 12 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 15 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 4 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

α=0.5000
Hardest-Trail Count (6/9 in Either Bucket): 14 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 15 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 4 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

### Configuration 5: Set 5: GD / CS
α=1.0000
Hardest-Trail Count (6/9 in Either Bucket): 10 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 15 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 5 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

α=0.7500
Hardest-Trail Count (6/9 in Either Bucket): 7 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 15 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 7 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

α=0.5612
Hardest-Trail Count (6/9 in Either Bucket): 7 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 15 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 7 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

α=0.5000
Hardest-Trail Count (6/9 in Either Bucket): 5 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 15 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 7 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

### Configuration 6: Set 6: ED / GD
α=1.0000
Hardest-Trail Count (6/9 in Either Bucket): 12 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 15 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 7 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

α=0.7500
Hardest-Trail Count (6/9 in Either Bucket): 12 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 15 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 6 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

α=0.5612
Hardest-Trail Count (6/9 in Either Bucket): 12 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 15 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 5 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

α=0.5000
Hardest-Trail Count (6/9 in Either Bucket): 10 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 15 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 5 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

### Configuration 7: Set 7: ED / CS
α=1.0000
Hardest-Trail Count (6/9 in Either Bucket): 12 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 15 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 7 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

α=0.7500
Hardest-Trail Count (6/9 in Either Bucket): 8 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 15 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 9 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

α=0.5612
Hardest-Trail Count (6/9 in Either Bucket): 7 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 14 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 8 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

α=0.5000
Hardest-Trail Count (6/9 in Either Bucket): 7 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 14 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 8 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

### Configuration 8: Set 8: CS / GD
α=1.0000
Hardest-Trail Count (6/9 in Either Bucket): 4 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 11 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 8 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

α=0.7500
Hardest-Trail Count (6/9 in Either Bucket): 4 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 14 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 7 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

α=0.5612
Hardest-Trail Count (6/9 in Either Bucket): 5 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 14 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 8 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

α=0.5000
Hardest-Trail Count (6/9 in Either Bucket): 5 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 14 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 8 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

### Configuration 9: Set 9: CS / ED
α=1.0000
Hardest-Trail Count (6/9 in Either Bucket): 4 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 11 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 8 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

α=0.7500
Hardest-Trail Count (6/9 in Either Bucket): 4 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 13 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 8 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

α=0.5612
Hardest-Trail Count (6/9 in Either Bucket): 5 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 14 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 8 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22

α=0.5000
Hardest-Trail Count (6/9 in Either Bucket): 5 of 31
Easy-Bucket Check (Contains > 3/9): 31 of 31
Empty-Bucket Rate: 0 of 44
Medical vs. Twin (Lower Gain - Easy Bucket): 14 of 22
Medical vs. Twin (Lower Gain - Top 5 Slots): 7 of 22
Medical vs. Twin (Lower Gain - All Received): 0 of 22
