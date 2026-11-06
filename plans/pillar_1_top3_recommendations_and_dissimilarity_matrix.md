# THARESYS Pillar 1: Top-3 Recommendations & Inter-User Jaccard Dissimilarity Matrices

**Evaluation Parameters:**
- **Total Cohorts Evaluated:** 44 (44 users, 24 Normal Baselines + 20 Aberrant Mismatches)
- **Candidate Catalog:** 8 Real Production Trails ([`trails.json`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/scripts/simulation/output/trails.json))
- **Operational Dynamic Alpha:** `alpha_44 = 0.5612244898`
- **Total Upper-Triangle Pairwise Intersections per Configuration:** $\binom{44}{2} = \mathbf{946}$ pairs

---

## Top-3 Mean Variety Summary Leaderboard

| Configuration | CBF | CF | Top-3 Mean Dissimilarity | Personalization Rank |
| :--- | :---: | :---: | :---: | :---: |
| **Configuration 8: Set 8 - CS / GD** | `CS` | `GD` | **`0.580655`** (58.07%) | **#1** |
| **Configuration 9: Set 9 - CS / ED** | `CS` | `ED` | **`0.565328`** (56.53%) | **#2** |
| **Configuration 5: Set 5 - GD / CS** | `GD` | `CS` | **`0.564905`** (56.49%) | **#3** |
| **Configuration 7: Set 7 - ED / CS** | `ED` | `CS` | **`0.547146`** (54.71%) | **#4** |
| **Configuration 6: Set 6 - ED / GD** | `ED` | `GD` | **`0.494609`** (49.46%) | **#5** |
| **Configuration 3: Set 3 - Pure Cosine** | `CS` | `CS` | **`0.493446`** (49.34%) | **#6** |
| **Configuration 2: Set 2 - Pure Euclidean** | `ED` | `ED` | **`0.490592`** (49.06%) | **#7** |
| **Configuration 4: Set 4 - GD / ED** | `GD` | `ED` | **`0.476533`** (47.65%) | **#8** |
| **Configuration 1: Set 1 - Pure Gower** | `GD` | `GD` | **`0.465645`** (46.56%) | **#9** |

---

## Cohort Index Legend (Users 1 to 44)

| User # | User ID | Cohort Group | Stated Tier | Actual Tier | Medical Condition | Preferred Province(s) |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| **U1** | `s1_E1-N-P1` | `normal` | `E1` | `E1` | None (N) | Rizal |
| **U2** | `s1_E1-N-P2` | `normal` | `E1` | `E1` | None (N) | Batangas, Laguna |
| **U3** | `s1_E1-N-P3` | `normal` | `E1` | `E1` | None (N) | Cavite |
| **U4** | `s1_E1-M-P1` | `normal` | `E1` | `E1` | Yes (M) | Rizal |
| **U5** | `s1_E1-M-P2` | `normal` | `E1` | `E1` | Yes (M) | Batangas, Laguna |
| **U6** | `s1_E1-M-P3` | `normal` | `E1` | `E1` | Yes (M) | Cavite |
| **U7** | `s1_E2-N-P1` | `normal` | `E2` | `E2` | None (N) | Rizal |
| **U8** | `s1_E2-N-P2` | `normal` | `E2` | `E2` | None (N) | Batangas, Laguna |
| **U9** | `s1_E2-N-P3` | `normal` | `E2` | `E2` | None (N) | Cavite |
| **U10** | `s1_E2-M-P1` | `normal` | `E2` | `E2` | Yes (M) | Rizal |
| **U11** | `s1_E2-M-P2` | `normal` | `E2` | `E2` | Yes (M) | Batangas, Laguna |
| **U12** | `s1_E2-M-P3` | `normal` | `E2` | `E2` | Yes (M) | Cavite |
| **U13** | `s1_E3-N-P1` | `normal` | `E3` | `E3` | None (N) | Rizal |
| **U14** | `s1_E3-N-P2` | `normal` | `E3` | `E3` | None (N) | Batangas, Laguna |
| **U15** | `s1_E3-N-P3` | `normal` | `E3` | `E3` | None (N) | Cavite |
| **U16** | `s1_E3-M-P1` | `normal` | `E3` | `E3` | Yes (M) | Rizal |
| **U17** | `s1_E3-M-P2` | `normal` | `E3` | `E3` | Yes (M) | Batangas, Laguna |
| **U18** | `s1_E3-M-P3` | `normal` | `E3` | `E3` | Yes (M) | Cavite |
| **U19** | `s1_E4-N-P1` | `normal` | `E4` | `E4` | None (N) | Rizal |
| **U20** | `s1_E4-N-P2` | `normal` | `E4` | `E4` | None (N) | Batangas, Laguna |
| **U21** | `s1_E4-N-P3` | `normal` | `E4` | `E4` | None (N) | Cavite |
| **U22** | `s1_E4-M-P1` | `normal` | `E4` | `E4` | Yes (M) | Rizal |
| **U23** | `s1_E4-M-P2` | `normal` | `E4` | `E4` | Yes (M) | Batangas, Laguna |
| **U24** | `s1_E4-M-P3` | `normal` | `E4` | `E4` | Yes (M) | Cavite |
| **U25** | `s1_AB-4-1-N-P1` | `aberrant` | `E4` | `E1` | None (N) | Rizal |
| **U26** | `s1_AB-4-1-M-P1` | `aberrant` | `E4` | `E1` | Yes (M) | Rizal |
| **U27** | `s1_AB-4-2-N-P1` | `aberrant` | `E4` | `E2` | None (N) | Rizal |
| **U28** | `s1_AB-4-2-M-P1` | `aberrant` | `E4` | `E2` | Yes (M) | Rizal |
| **U29** | `s1_AB-4-3-N-P1` | `aberrant` | `E4` | `E3` | None (N) | Rizal |
| **U30** | `s1_AB-4-3-M-P1` | `aberrant` | `E4` | `E3` | Yes (M) | Rizal |
| **U31** | `s1_AB-3-1-N-P1` | `aberrant` | `E3` | `E1` | None (N) | Rizal |
| **U32** | `s1_AB-3-1-M-P1` | `aberrant` | `E3` | `E1` | Yes (M) | Rizal |
| **U33** | `s1_AB-3-2-N-P1` | `aberrant` | `E3` | `E2` | None (N) | Rizal |
| **U34** | `s1_AB-3-2-M-P1` | `aberrant` | `E3` | `E2` | Yes (M) | Rizal |
| **U35** | `s1_AB-2-1-N-P1` | `aberrant` | `E2` | `E1` | None (N) | Rizal |
| **U36** | `s1_AB-2-1-M-P1` | `aberrant` | `E2` | `E1` | Yes (M) | Rizal |
| **U37** | `s1_AB-1-4-N-P1` | `aberrant` | `E1` | `E4` | None (N) | Rizal |
| **U38** | `s1_AB-1-4-M-P1` | `aberrant` | `E1` | `E4` | Yes (M) | Rizal |
| **U39** | `s1_AB-1-3-N-P1` | `aberrant` | `E1` | `E3` | None (N) | Rizal |
| **U40** | `s1_AB-1-3-M-P1` | `aberrant` | `E1` | `E3` | Yes (M) | Rizal |
| **U41** | `s1_AB-1-2-N-P1` | `aberrant` | `E1` | `E2` | None (N) | Rizal |
| **U42** | `s1_AB-1-2-M-P1` | `aberrant` | `E1` | `E2` | Yes (M) | Rizal |
| **U43** | `s1_AB-2-4-N-P1` | `aberrant` | `E2` | `E4` | None (N) | Rizal |
| **U44** | `s1_AB-2-4-M-P1` | `aberrant` | `E2` | `E4` | Yes (M) | Rizal |

---

## Configuration 1: Set 1 - Pure Gower
**CBF Formula:** `GD` | **CF Formula:** `GD` | **Dynamic Alpha:** `0.561224`
**Configuration Top-3 Mean Jaccard Dissimilarity:** **`0.465645`** (46.56%)

### Top-3 Recommendation List
| user | top 1 | top 2 | top 3 |
| :---: | :--- | :--- | :--- |
| 1 (`E1-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mariang Makiling Trail (MMT) |
| 2 (`E1-N-P2`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Daraitan |
| 3 (`E1-N-P3`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Sembrano |
| 4 (`E1-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Batulao via New Trail | Mt. Sembrano |
| 5 (`E1-M-P2`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Sembrano |
| 6 (`E1-M-P3`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Sembrano |
| 7 (`E2-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Sembrano |
| 8 (`E2-N-P2`) | Mt. Kulis - Sambong Trail | Batulao Traverse | Mt. Sembrano |
| 9 (`E2-N-P3`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Batulao Traverse |
| 10 (`E2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Sembrano |
| 11 (`E2-M-P2`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Sembrano |
| 12 (`E2-M-P3`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Sembrano |
| 13 (`E3-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 14 (`E3-N-P2`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 15 (`E3-N-P3`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 16 (`E3-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Batulao Traverse |
| 17 (`E3-M-P2`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Daraitan |
| 18 (`E3-M-P3`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Makiling Traverse (MakTrav) |
| 19 (`E4-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 20 (`E4-N-P2`) | Mt. Sembrano | Mt. Daraitan | Mt. Kulis - Sambong Trail |
| 21 (`E4-N-P3`) | Mt. Sembrano | Mt. Daraitan | Mt. Kulis - Sambong Trail |
| 22 (`E4-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Batulao Traverse |
| 23 (`E4-M-P2`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Batulao Traverse |
| 24 (`E4-M-P3`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 25 (`AB-4-1-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 26 (`AB-4-1-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan |
| 27 (`AB-4-2-N-P1`) | Mt. Daraitan | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) |
| 28 (`AB-4-2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 29 (`AB-4-3-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 30 (`AB-4-3-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Batulao Traverse |
| 31 (`AB-3-1-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 32 (`AB-3-1-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Sembrano |
| 33 (`AB-3-2-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 34 (`AB-3-2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Batulao via New Trail |
| 35 (`AB-2-1-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Sembrano |
| 36 (`AB-2-1-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Sembrano |
| 37 (`AB-1-4-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Batulao via New Trail | Batulao Traverse |
| 38 (`AB-1-4-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Batulao via New Trail | Mt. Sembrano |
| 39 (`AB-1-3-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Batulao via New Trail | Mt. Sembrano |
| 40 (`AB-1-3-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Batulao via New Trail |
| 41 (`AB-1-2-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Sembrano |
| 42 (`AB-1-2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Batulao via New Trail |
| 43 (`AB-2-4-N-P1`) | Mt. Kulis - Sambong Trail | Batulao Traverse | Mt. Sembrano |
| 44 (`AB-2-4-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Daraitan |

### User × User Jaccard Dissimilarity Matrix (Upper Triangle)
> *Bottom triangle removed; diagonal set to 0.00 since self-recommendations are identical.*
> *Dissimilarity values: `0.00` (identical), `0.50` (2 overlapping), `0.80` (1 overlapping), `1.00` (0 overlapping).*

| user | U1 | U2 | U3 | U4 | U5 | U6 | U7 | U8 | U9 | U10 | U11 | U12 | U13 | U14 | U15 | U16 | U17 | U18 | U19 | U20 | U21 | U22 | U23 | U24 | U25 | U26 | U27 | U28 | U29 | U30 | U31 | U32 | U33 | U34 | U35 | U36 | U37 | U38 | U39 | U40 | U41 | U42 | U43 | U44 |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **U1** | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 |
| **U2** | - | 0.00 | 0.00 | 0.50 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 |
| **U3** | - | - | 0.00 | 0.50 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 |
| **U4** | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 |
| **U5** | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 |
| **U6** | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 |
| **U7** | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 |
| **U8** | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 |
| **U9** | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 |
| **U10** | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 |
| **U11** | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 |
| **U12** | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 |
| **U13** | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 |
| **U14** | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 |
| **U15** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 |
| **U16** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 |
| **U17** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 |
| **U18** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 |
| **U19** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 |
| **U20** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 |
| **U21** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 |
| **U22** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 |
| **U23** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 |
| **U24** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 |
| **U25** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 |
| **U26** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 |
| **U27** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 |
| **U28** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 |
| **U29** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 |
| **U30** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 |
| **U31** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 |
| **U32** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 |
| **U33** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 |
| **U34** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 |
| **U35** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 |
| **U36** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 |
| **U37** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 |
| **U38** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 |
| **U39** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 |
| **U40** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 |
| **U41** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.00 |
| **U42** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 |
| **U43** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 |
| **U44** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 |

## Configuration 2: Set 2 - Pure Euclidean
**CBF Formula:** `ED` | **CF Formula:** `ED` | **Dynamic Alpha:** `0.561224`
**Configuration Top-3 Mean Jaccard Dissimilarity:** **`0.490592`** (49.06%)

### Top-3 Recommendation List
| user | top 1 | top 2 | top 3 |
| :---: | :--- | :--- | :--- |
| 1 (`E1-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Batulao via New Trail |
| 2 (`E1-N-P2`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Daraitan |
| 3 (`E1-N-P3`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan |
| 4 (`E1-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Batulao via New Trail | Batulao Traverse |
| 5 (`E1-M-P2`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Batulao via New Trail |
| 6 (`E1-M-P3`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 7 (`E2-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 8 (`E2-N-P2`) | Mt. Kulis - Sambong Trail | Batulao Traverse | Mt. Sembrano |
| 9 (`E2-N-P3`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail |
| 10 (`E2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan |
| 11 (`E2-M-P2`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Batulao via New Trail |
| 12 (`E2-M-P3`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan |
| 13 (`E3-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 14 (`E3-N-P2`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 15 (`E3-N-P3`) | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail |
| 16 (`E3-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Batulao Traverse |
| 17 (`E3-M-P2`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Sembrano |
| 18 (`E3-M-P3`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Makiling Traverse (MakTrav) |
| 19 (`E4-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 20 (`E4-N-P2`) | Mt. Sembrano | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) |
| 21 (`E4-N-P3`) | Mt. Sembrano | Mt. Kulis - Sambong Trail | Mt. Daraitan |
| 22 (`E4-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Batulao Traverse |
| 23 (`E4-M-P2`) | Mt. Kulis - Sambong Trail | Batulao Traverse | Mt. Daraitan |
| 24 (`E4-M-P3`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan |
| 25 (`AB-4-1-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 26 (`AB-4-1-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan |
| 27 (`AB-4-2-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mt. Daraitan |
| 28 (`AB-4-2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 29 (`AB-4-3-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan |
| 30 (`AB-4-3-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Batulao Traverse |
| 31 (`AB-3-1-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan |
| 32 (`AB-3-1-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Sembrano |
| 33 (`AB-3-2-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan |
| 34 (`AB-3-2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Sembrano |
| 35 (`AB-2-1-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan |
| 36 (`AB-2-1-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Batulao via New Trail |
| 37 (`AB-1-4-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Batulao via New Trail | Batulao Traverse |
| 38 (`AB-1-4-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Batulao via New Trail | Batulao Traverse |
| 39 (`AB-1-3-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Batulao via New Trail | Batulao Traverse |
| 40 (`AB-1-3-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Batulao via New Trail |
| 41 (`AB-1-2-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail |
| 42 (`AB-1-2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Batulao via New Trail |
| 43 (`AB-2-4-N-P1`) | Mt. Kulis - Sambong Trail | Batulao Traverse | Mt. Makiling Traverse (MakTrav) |
| 44 (`AB-2-4-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mariang Makiling Trail (MMT) |

### User × User Jaccard Dissimilarity Matrix (Upper Triangle)
> *Bottom triangle removed; diagonal set to 0.00 since self-recommendations are identical.*
> *Dissimilarity values: `0.00` (identical), `0.50` (2 overlapping), `0.80` (1 overlapping), `1.00` (0 overlapping).*

| user | U1 | U2 | U3 | U4 | U5 | U6 | U7 | U8 | U9 | U10 | U11 | U12 | U13 | U14 | U15 | U16 | U17 | U18 | U19 | U20 | U21 | U22 | U23 | U24 | U25 | U26 | U27 | U28 | U29 | U30 | U31 | U32 | U33 | U34 | U35 | U36 | U37 | U38 | U39 | U40 | U41 | U42 | U43 | U44 |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **U1** | 0.00 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.80 | 0.50 |
| **U2** | - | 0.00 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 |
| **U3** | - | - | 0.00 | 0.80 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.00 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 |
| **U4** | - | - | - | 0.00 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 |
| **U5** | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 |
| **U6** | - | - | - | - | - | 0.00 | 0.00 | 0.80 | 0.50 | 0.00 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 |
| **U7** | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.00 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 |
| **U8** | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 |
| **U9** | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.80 |
| **U10** | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 |
| **U11** | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 |
| **U12** | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 |
| **U13** | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 |
| **U14** | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 |
| **U15** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 |
| **U16** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.00 | 0.80 |
| **U17** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 |
| **U18** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 |
| **U19** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 |
| **U20** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 |
| **U21** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 |
| **U22** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.00 | 0.80 |
| **U23** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 |
| **U24** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 |
| **U25** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 |
| **U26** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 |
| **U27** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 |
| **U28** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 |
| **U29** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 |
| **U30** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.00 | 0.80 |
| **U31** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 |
| **U32** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 |
| **U33** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 |
| **U34** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 |
| **U35** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 |
| **U36** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 |
| **U37** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 |
| **U38** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 |
| **U39** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 |
| **U40** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.80 | 0.50 |
| **U41** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.80 |
| **U42** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 |
| **U43** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 |
| **U44** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 |

## Configuration 3: Set 3 - Pure Cosine
**CBF Formula:** `CS` | **CF Formula:** `CS` | **Dynamic Alpha:** `0.561224`
**Configuration Top-3 Mean Jaccard Dissimilarity:** **`0.493446`** (49.34%)

### Top-3 Recommendation List
| user | top 1 | top 2 | top 3 |
| :---: | :--- | :--- | :--- |
| 1 (`E1-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mariang Makiling Trail (MMT) |
| 2 (`E1-N-P2`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Mt. Batulao via New Trail |
| 3 (`E1-N-P3`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Mt. Batulao via New Trail |
| 4 (`E1-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail | Batulao Traverse |
| 5 (`E1-M-P2`) | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail | Mt. Daraitan |
| 6 (`E1-M-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mariang Makiling Trail (MMT) |
| 7 (`E2-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Mt. Batulao via New Trail |
| 8 (`E2-N-P2`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Mt. Batulao via New Trail |
| 9 (`E2-N-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail | Batulao Traverse |
| 10 (`E2-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mt. Batulao via New Trail |
| 11 (`E2-M-P2`) | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail | Mt. Daraitan |
| 12 (`E2-M-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail | Mt. Daraitan |
| 13 (`E3-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mariang Makiling Trail (MMT) |
| 14 (`E3-N-P2`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Mt. Batulao via New Trail |
| 15 (`E3-N-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mariang Makiling Trail (MMT) |
| 16 (`E3-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Mt. Batulao via New Trail |
| 17 (`E3-M-P2`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Mt. Daraitan |
| 18 (`E3-M-P3`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Mt. Sembrano |
| 19 (`E4-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Mt. Sembrano |
| 20 (`E4-N-P2`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Mt. Daraitan |
| 21 (`E4-N-P3`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Mt. Batulao via New Trail |
| 22 (`E4-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Mt. Daraitan |
| 23 (`E4-M-P2`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Batulao Traverse |
| 24 (`E4-M-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mariang Makiling Trail (MMT) |
| 25 (`AB-4-1-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Mt. Batulao via New Trail |
| 26 (`AB-4-1-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Mt. Daraitan |
| 27 (`AB-4-2-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mariang Makiling Trail (MMT) |
| 28 (`AB-4-2-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mariang Makiling Trail (MMT) |
| 29 (`AB-4-3-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Batulao Traverse |
| 30 (`AB-4-3-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Mt. Daraitan |
| 31 (`AB-3-1-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Mt. Daraitan |
| 32 (`AB-3-1-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mariang Makiling Trail (MMT) |
| 33 (`AB-3-2-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mariang Makiling Trail (MMT) |
| 34 (`AB-3-2-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mariang Makiling Trail (MMT) |
| 35 (`AB-2-1-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mt. Batulao via New Trail |
| 36 (`AB-2-1-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mt. Batulao via New Trail |
| 37 (`AB-1-4-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail | Batulao Traverse |
| 38 (`AB-1-4-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail | Batulao Traverse |
| 39 (`AB-1-3-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mt. Batulao via New Trail |
| 40 (`AB-1-3-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mt. Batulao via New Trail |
| 41 (`AB-1-2-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mt. Batulao via New Trail |
| 42 (`AB-1-2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail |
| 43 (`AB-2-4-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Mt. Batulao via New Trail |
| 44 (`AB-2-4-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) |

### User × User Jaccard Dissimilarity Matrix (Upper Triangle)
> *Bottom triangle removed; diagonal set to 0.00 since self-recommendations are identical.*
> *Dissimilarity values: `0.00` (identical), `0.50` (2 overlapping), `0.80` (1 overlapping), `1.00` (0 overlapping).*

| user | U1 | U2 | U3 | U4 | U5 | U6 | U7 | U8 | U9 | U10 | U11 | U12 | U13 | U14 | U15 | U16 | U17 | U18 | U19 | U20 | U21 | U22 | U23 | U24 | U25 | U26 | U27 | U28 | U29 | U30 | U31 | U32 | U33 | U34 | U35 | U36 | U37 | U38 | U39 | U40 | U41 | U42 | U43 | U44 |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **U1** | 0.00 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U2** | - | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.80 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 |
| **U3** | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.80 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 |
| **U4** | - | - | - | 0.00 | 0.50 | 0.80 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 |
| **U5** | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 |
| **U6** | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U7** | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.80 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 |
| **U8** | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.80 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 |
| **U9** | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 |
| **U10** | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.00 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 |
| **U11** | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 |
| **U12** | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 |
| **U13** | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U14** | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.80 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 |
| **U15** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U16** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.80 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 |
| **U17** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U18** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U19** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U20** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U21** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 |
| **U22** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U23** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 |
| **U24** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U25** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 |
| **U26** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U27** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U28** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U29** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U30** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U31** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U32** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U33** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U34** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U35** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 |
| **U36** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 |
| **U37** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 |
| **U38** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 |
| **U39** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 |
| **U40** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 |
| **U41** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.50 |
| **U42** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 |
| **U43** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 |
| **U44** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 |

## Configuration 4: Set 4 - GD / ED
**CBF Formula:** `GD` | **CF Formula:** `ED` | **Dynamic Alpha:** `0.561224`
**Configuration Top-3 Mean Jaccard Dissimilarity:** **`0.476533`** (47.65%)

### Top-3 Recommendation List
| user | top 1 | top 2 | top 3 |
| :---: | :--- | :--- | :--- |
| 1 (`E1-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mariang Makiling Trail (MMT) |
| 2 (`E1-N-P2`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Daraitan |
| 3 (`E1-N-P3`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan |
| 4 (`E1-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Batulao via New Trail | Mt. Sembrano |
| 5 (`E1-M-P2`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Sembrano |
| 6 (`E1-M-P3`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Sembrano |
| 7 (`E2-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 8 (`E2-N-P2`) | Mt. Kulis - Sambong Trail | Batulao Traverse | Mt. Sembrano |
| 9 (`E2-N-P3`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Sembrano |
| 10 (`E2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 11 (`E2-M-P2`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Sembrano |
| 12 (`E2-M-P3`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Sembrano |
| 13 (`E3-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 14 (`E3-N-P2`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Batulao Traverse |
| 15 (`E3-N-P3`) | Mt. Daraitan | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) |
| 16 (`E3-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Batulao Traverse |
| 17 (`E3-M-P2`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Sembrano |
| 18 (`E3-M-P3`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Makiling Traverse (MakTrav) |
| 19 (`E4-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 20 (`E4-N-P2`) | Mt. Sembrano | Mt. Kulis - Sambong Trail | Mt. Daraitan |
| 21 (`E4-N-P3`) | Mt. Sembrano | Mt. Kulis - Sambong Trail | Mt. Daraitan |
| 22 (`E4-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Batulao Traverse |
| 23 (`E4-M-P2`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Batulao Traverse |
| 24 (`E4-M-P3`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan |
| 25 (`AB-4-1-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 26 (`AB-4-1-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan |
| 27 (`AB-4-2-N-P1`) | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail |
| 28 (`AB-4-2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 29 (`AB-4-3-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 30 (`AB-4-3-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Batulao Traverse |
| 31 (`AB-3-1-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 32 (`AB-3-1-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Sembrano |
| 33 (`AB-3-2-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 34 (`AB-3-2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Makiling Traverse (MakTrav) |
| 35 (`AB-2-1-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 36 (`AB-2-1-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Sembrano |
| 37 (`AB-1-4-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Batulao via New Trail | Batulao Traverse |
| 38 (`AB-1-4-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Batulao via New Trail | Mt. Daraitan |
| 39 (`AB-1-3-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Batulao via New Trail | Batulao Traverse |
| 40 (`AB-1-3-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Batulao via New Trail |
| 41 (`AB-1-2-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 42 (`AB-1-2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Batulao via New Trail |
| 43 (`AB-2-4-N-P1`) | Mt. Kulis - Sambong Trail | Batulao Traverse | Mt. Sembrano |
| 44 (`AB-2-4-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Daraitan |

### User × User Jaccard Dissimilarity Matrix (Upper Triangle)
> *Bottom triangle removed; diagonal set to 0.00 since self-recommendations are identical.*
> *Dissimilarity values: `0.00` (identical), `0.50` (2 overlapping), `0.80` (1 overlapping), `1.00` (0 overlapping).*

| user | U1 | U2 | U3 | U4 | U5 | U6 | U7 | U8 | U9 | U10 | U11 | U12 | U13 | U14 | U15 | U16 | U17 | U18 | U19 | U20 | U21 | U22 | U23 | U24 | U25 | U26 | U27 | U28 | U29 | U30 | U31 | U32 | U33 | U34 | U35 | U36 | U37 | U38 | U39 | U40 | U41 | U42 | U43 | U44 |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **U1** | 0.00 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 |
| **U2** | - | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U3** | - | - | 0.00 | 0.80 | 0.50 | 0.50 | 0.00 | 0.80 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U4** | - | - | - | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.80 | 0.00 | 0.50 | 0.50 |
| **U5** | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U6** | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U7** | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U8** | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.00 | 0.50 |
| **U9** | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 |
| **U10** | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U11** | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U12** | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U13** | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U14** | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 |
| **U15** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U16** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 |
| **U17** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U18** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 |
| **U19** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U20** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U21** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U22** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 |
| **U23** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 |
| **U24** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U25** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U26** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U27** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U28** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U29** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U30** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 |
| **U31** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U32** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 |
| **U33** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U34** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 |
| **U35** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U36** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U37** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 |
| **U38** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 |
| **U39** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 |
| **U40** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.00 | 0.50 | 0.50 |
| **U41** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.80 | 0.50 |
| **U42** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 |
| **U43** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 |
| **U44** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 |

## Configuration 5: Set 5 - GD / CS
**CBF Formula:** `GD` | **CF Formula:** `CS` | **Dynamic Alpha:** `0.561224`
**Configuration Top-3 Mean Jaccard Dissimilarity:** **`0.564905`** (56.49%)

### Top-3 Recommendation List
| user | top 1 | top 2 | top 3 |
| :---: | :--- | :--- | :--- |
| 1 (`E1-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Makiling Traverse (MakTrav) |
| 2 (`E1-N-P2`) | Mt. Sembrano | Mariang Makiling Trail (MMT) | Mt. Batulao via New Trail |
| 3 (`E1-N-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mt. Sembrano |
| 4 (`E1-M-P1`) | Mt. Batulao via New Trail | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail |
| 5 (`E1-M-P2`) | Mt. Daraitan | Mt. Batulao via New Trail | Mt. Makiling Traverse (MakTrav) |
| 6 (`E1-M-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mt. Sembrano |
| 7 (`E2-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mariang Makiling Trail (MMT) |
| 8 (`E2-N-P2`) | Mt. Makiling Traverse (MakTrav) | Batulao Traverse | Mariang Makiling Trail (MMT) |
| 9 (`E2-N-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail | Mt. Kulis - Sambong Trail |
| 10 (`E2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan |
| 11 (`E2-M-P2`) | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail |
| 12 (`E2-M-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mt. Kulis - Sambong Trail |
| 13 (`E3-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mt. Kulis - Sambong Trail |
| 14 (`E3-N-P2`) | Mt. Makiling Traverse (MakTrav) | Batulao Traverse | Mariang Makiling Trail (MMT) |
| 15 (`E3-N-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mariang Makiling Trail (MMT) |
| 16 (`E3-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Batulao Traverse |
| 17 (`E3-M-P2`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mt. Sembrano |
| 18 (`E3-M-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mt. Sembrano |
| 19 (`E4-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mariang Makiling Trail (MMT) |
| 20 (`E4-N-P2`) | Mt. Makiling Traverse (MakTrav) | Mt. Sembrano | Batulao Traverse |
| 21 (`E4-N-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Sembrano | Mt. Daraitan |
| 22 (`E4-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mariang Makiling Trail (MMT) |
| 23 (`E4-M-P2`) | Mt. Makiling Traverse (MakTrav) | Batulao Traverse | Mt. Daraitan |
| 24 (`E4-M-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mariang Makiling Trail (MMT) |
| 25 (`AB-4-1-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mt. Daraitan |
| 26 (`AB-4-1-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mt. Daraitan |
| 27 (`AB-4-2-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Batulao Traverse |
| 28 (`AB-4-2-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mariang Makiling Trail (MMT) |
| 29 (`AB-4-3-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Batulao Traverse |
| 30 (`AB-4-3-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Mt. Daraitan |
| 31 (`AB-3-1-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Batulao Traverse |
| 32 (`AB-3-1-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan |
| 33 (`AB-3-2-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mt. Kulis - Sambong Trail |
| 34 (`AB-3-2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) |
| 35 (`AB-2-1-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan |
| 36 (`AB-2-1-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail |
| 37 (`AB-1-4-N-P1`) | Mt. Batulao via New Trail | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail |
| 38 (`AB-1-4-M-P1`) | Mt. Batulao via New Trail | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail |
| 39 (`AB-1-3-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail |
| 40 (`AB-1-3-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Batulao via New Trail |
| 41 (`AB-1-2-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan |
| 42 (`AB-1-2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Batulao via New Trail | Mt. Makiling Traverse (MakTrav) |
| 43 (`AB-2-4-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Batulao Traverse |
| 44 (`AB-2-4-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) |

### User × User Jaccard Dissimilarity Matrix (Upper Triangle)
> *Bottom triangle removed; diagonal set to 0.00 since self-recommendations are identical.*
> *Dissimilarity values: `0.00` (identical), `0.50` (2 overlapping), `0.80` (1 overlapping), `1.00` (0 overlapping).*

| user | U1 | U2 | U3 | U4 | U5 | U6 | U7 | U8 | U9 | U10 | U11 | U12 | U13 | U14 | U15 | U16 | U17 | U18 | U19 | U20 | U21 | U22 | U23 | U24 | U25 | U26 | U27 | U28 | U29 | U30 | U31 | U32 | U33 | U34 | U35 | U36 | U37 | U38 | U39 | U40 | U41 | U42 | U43 | U44 |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **U1** | 0.00 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 |
| **U2** | - | 0.00 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 1.00 | 0.80 | 1.00 | 1.00 | 0.80 | 0.80 | 1.00 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 1.00 | 0.80 | 1.00 | 1.00 | 1.00 | 0.80 | 1.00 | 0.80 | 1.00 | 1.00 | 1.00 | 0.80 | 1.00 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 1.00 | 0.80 | 0.80 | 0.80 |
| **U3** | - | - | 0.00 | 0.80 | 0.50 | 0.00 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.00 | 0.50 | 0.80 | 0.50 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 |
| **U4** | - | - | - | 0.00 | 0.50 | 0.80 | 0.50 | 0.80 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 | 0.00 | 0.80 | 0.50 |
| **U5** | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 |
| **U6** | - | - | - | - | - | 0.00 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.00 | 0.50 | 0.80 | 0.50 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 |
| **U7** | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.00 | 0.80 | 0.80 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U8** | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.00 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 1.00 | 0.80 | 0.80 | 0.00 | 0.50 |
| **U9** | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 | 0.00 | 0.80 | 0.50 |
| **U10** | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.80 | 0.50 |
| **U11** | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 |
| **U12** | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.80 | 0.50 |
| **U13** | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.80 | 0.50 |
| **U14** | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 1.00 | 0.80 | 0.80 | 0.00 | 0.50 |
| **U15** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 1.00 | 0.50 | 0.80 | 0.50 | 0.50 |
| **U16** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 |
| **U17** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.50 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 |
| **U18** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 |
| **U19** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.80 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U20** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 |
| **U21** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 |
| **U22** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U23** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 1.00 | 0.50 | 0.80 | 0.50 | 0.80 |
| **U24** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 1.00 | 0.50 | 0.80 | 0.50 | 0.50 |
| **U25** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.80 | 0.50 |
| **U26** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.80 | 0.50 |
| **U27** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 1.00 | 0.50 | 0.80 | 0.50 | 0.80 |
| **U28** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 1.00 | 0.50 | 0.80 | 0.50 | 0.50 |
| **U29** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 1.00 | 0.50 | 0.80 | 0.50 | 0.80 |
| **U30** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 1.00 | 0.50 | 0.80 | 0.50 | 0.50 |
| **U31** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 1.00 | 0.50 | 0.80 | 0.50 | 0.80 |
| **U32** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.80 | 0.50 |
| **U33** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.80 | 0.50 |
| **U34** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U35** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.80 | 0.50 |
| **U36** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 | 0.00 | 0.80 | 0.50 |
| **U37** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 | 0.00 | 0.80 | 0.50 |
| **U38** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.50 | 0.00 | 0.80 | 0.50 |
| **U39** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.00 | 0.80 | 0.50 |
| **U40** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 1.00 | 0.80 |
| **U41** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.50 |
| **U42** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 |
| **U43** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 |
| **U44** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 |

## Configuration 6: Set 6 - ED / GD
**CBF Formula:** `ED` | **CF Formula:** `GD` | **Dynamic Alpha:** `0.561224`
**Configuration Top-3 Mean Jaccard Dissimilarity:** **`0.494609`** (49.46%)

### Top-3 Recommendation List
| user | top 1 | top 2 | top 3 |
| :---: | :--- | :--- | :--- |
| 1 (`E1-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Batulao via New Trail |
| 2 (`E1-N-P2`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Daraitan |
| 3 (`E1-N-P3`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan |
| 4 (`E1-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Batulao via New Trail | Mt. Sembrano |
| 5 (`E1-M-P2`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Batulao via New Trail |
| 6 (`E1-M-P3`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Sembrano |
| 7 (`E2-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 8 (`E2-N-P2`) | Mt. Kulis - Sambong Trail | Batulao Traverse | Mt. Sembrano |
| 9 (`E2-N-P3`) | Mt. Kulis - Sambong Trail | Mt. Batulao via New Trail | Mt. Makiling Traverse (MakTrav) |
| 10 (`E2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 11 (`E2-M-P2`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Batulao via New Trail |
| 12 (`E2-M-P3`) | Mt. Kulis - Sambong Trail | Mt. Batulao via New Trail | Mt. Daraitan |
| 13 (`E3-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 14 (`E3-N-P2`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 15 (`E3-N-P3`) | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail |
| 16 (`E3-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Sembrano |
| 17 (`E3-M-P2`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Daraitan |
| 18 (`E3-M-P3`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Makiling Traverse (MakTrav) |
| 19 (`E4-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 20 (`E4-N-P2`) | Mt. Sembrano | Mt. Kulis - Sambong Trail | Mt. Daraitan |
| 21 (`E4-N-P3`) | Mt. Sembrano | Mt. Kulis - Sambong Trail | Mt. Daraitan |
| 22 (`E4-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Batulao Traverse |
| 23 (`E4-M-P2`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Batulao Traverse |
| 24 (`E4-M-P3`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 25 (`AB-4-1-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 26 (`AB-4-1-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan |
| 27 (`AB-4-2-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 28 (`AB-4-2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 29 (`AB-4-3-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 30 (`AB-4-3-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Batulao Traverse |
| 31 (`AB-3-1-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 32 (`AB-3-1-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Sembrano |
| 33 (`AB-3-2-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 34 (`AB-3-2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Batulao via New Trail |
| 35 (`AB-2-1-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) |
| 36 (`AB-2-1-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Daraitan | Mt. Sembrano |
| 37 (`AB-1-4-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Batulao via New Trail | Batulao Traverse |
| 38 (`AB-1-4-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Batulao via New Trail | Batulao Traverse |
| 39 (`AB-1-3-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Batulao via New Trail | Batulao Traverse |
| 40 (`AB-1-3-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Batulao via New Trail |
| 41 (`AB-1-2-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan |
| 42 (`AB-1-2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Batulao via New Trail |
| 43 (`AB-2-4-N-P1`) | Mt. Kulis - Sambong Trail | Batulao Traverse | Mariang Makiling Trail (MMT) |
| 44 (`AB-2-4-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Sembrano | Mt. Daraitan |

### User × User Jaccard Dissimilarity Matrix (Upper Triangle)
> *Bottom triangle removed; diagonal set to 0.00 since self-recommendations are identical.*
> *Dissimilarity values: `0.00` (identical), `0.50` (2 overlapping), `0.80` (1 overlapping), `1.00` (0 overlapping).*

| user | U1 | U2 | U3 | U4 | U5 | U6 | U7 | U8 | U9 | U10 | U11 | U12 | U13 | U14 | U15 | U16 | U17 | U18 | U19 | U20 | U21 | U22 | U23 | U24 | U25 | U26 | U27 | U28 | U29 | U30 | U31 | U32 | U33 | U34 | U35 | U36 | U37 | U38 | U39 | U40 | U41 | U42 | U43 | U44 |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **U1** | 0.00 | 0.50 | 0.80 | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.80 | 0.00 | 0.80 | 0.50 |
| **U2** | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 |
| **U3** | - | - | 0.00 | 0.80 | 0.50 | 0.50 | 0.00 | 0.80 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.80 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U4** | - | - | - | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.80 | 0.00 | 0.80 | 0.50 |
| **U5** | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 |
| **U6** | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 |
| **U7** | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.80 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U8** | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 |
| **U9** | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 |
| **U10** | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.80 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U11** | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 |
| **U12** | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 |
| **U13** | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.80 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U14** | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.80 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U15** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.80 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U16** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 |
| **U17** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 |
| **U18** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 |
| **U19** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.80 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U20** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 |
| **U21** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 |
| **U22** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 |
| **U23** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 |
| **U24** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.80 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U25** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.80 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U26** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.80 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U27** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.80 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U28** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.80 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U29** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.00 | 0.80 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U30** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 |
| **U31** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.80 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U32** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 |
| **U33** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U34** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.80 | 0.00 | 0.80 | 0.50 |
| **U35** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.00 | 0.80 | 0.80 | 0.50 |
| **U36** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 |
| **U37** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 |
| **U38** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 |
| **U39** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 |
| **U40** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.00 | 0.80 | 0.50 |
| **U41** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.80 | 0.50 |
| **U42** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 |
| **U43** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 |
| **U44** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 |

## Configuration 7: Set 7 - ED / CS
**CBF Formula:** `ED` | **CF Formula:** `CS` | **Dynamic Alpha:** `0.561224`
**Configuration Top-3 Mean Jaccard Dissimilarity:** **`0.547146`** (54.71%)

### Top-3 Recommendation List
| user | top 1 | top 2 | top 3 |
| :---: | :--- | :--- | :--- |
| 1 (`E1-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Sembrano |
| 2 (`E1-N-P2`) | Mt. Sembrano | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail |
| 3 (`E1-N-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mt. Batulao via New Trail |
| 4 (`E1-M-P1`) | Mt. Batulao via New Trail | Mt. Makiling Traverse (MakTrav) | Batulao Traverse |
| 5 (`E1-M-P2`) | Mt. Daraitan | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail |
| 6 (`E1-M-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mt. Sembrano |
| 7 (`E2-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mt. Daraitan |
| 8 (`E2-N-P2`) | Mt. Makiling Traverse (MakTrav) | Batulao Traverse | Mt. Batulao via New Trail |
| 9 (`E2-N-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail | Mt. Kulis - Sambong Trail |
| 10 (`E2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan |
| 11 (`E2-M-P2`) | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail | Mt. Daraitan |
| 12 (`E2-M-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail | Mt. Kulis - Sambong Trail |
| 13 (`E3-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mt. Kulis - Sambong Trail |
| 14 (`E3-N-P2`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Mt. Daraitan |
| 15 (`E3-N-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mariang Makiling Trail (MMT) |
| 16 (`E3-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Batulao Traverse |
| 17 (`E3-M-P2`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mt. Sembrano |
| 18 (`E3-M-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mt. Sembrano |
| 19 (`E4-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) |
| 20 (`E4-N-P2`) | Mt. Makiling Traverse (MakTrav) | Mt. Sembrano | Batulao Traverse |
| 21 (`E4-N-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Sembrano | Mt. Daraitan |
| 22 (`E4-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mariang Makiling Trail (MMT) |
| 23 (`E4-M-P2`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Batulao Traverse |
| 24 (`E4-M-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mariang Makiling Trail (MMT) |
| 25 (`AB-4-1-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan |
| 26 (`AB-4-1-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mt. Daraitan |
| 27 (`AB-4-2-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Batulao Traverse |
| 28 (`AB-4-2-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mariang Makiling Trail (MMT) |
| 29 (`AB-4-3-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mt. Kulis - Sambong Trail |
| 30 (`AB-4-3-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Mt. Daraitan |
| 31 (`AB-3-1-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Batulao Traverse |
| 32 (`AB-3-1-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) |
| 33 (`AB-3-2-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mt. Daraitan |
| 34 (`AB-3-2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) |
| 35 (`AB-2-1-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail |
| 36 (`AB-2-1-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail |
| 37 (`AB-1-4-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail | Batulao Traverse |
| 38 (`AB-1-4-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail | Mt. Kulis - Sambong Trail |
| 39 (`AB-1-3-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail |
| 40 (`AB-1-3-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Batulao via New Trail | Mt. Makiling Traverse (MakTrav) |
| 41 (`AB-1-2-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail |
| 42 (`AB-1-2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail |
| 43 (`AB-2-4-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Mt. Kulis - Sambong Trail |
| 44 (`AB-2-4-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) |

### User × User Jaccard Dissimilarity Matrix (Upper Triangle)
> *Bottom triangle removed; diagonal set to 0.00 since self-recommendations are identical.*
> *Dissimilarity values: `0.00` (identical), `0.50` (2 overlapping), `0.80` (1 overlapping), `1.00` (0 overlapping).*

| user | U1 | U2 | U3 | U4 | U5 | U6 | U7 | U8 | U9 | U10 | U11 | U12 | U13 | U14 | U15 | U16 | U17 | U18 | U19 | U20 | U21 | U22 | U23 | U24 | U25 | U26 | U27 | U28 | U29 | U30 | U31 | U32 | U33 | U34 | U35 | U36 | U37 | U38 | U39 | U40 | U41 | U42 | U43 | U44 |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **U1** | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 |
| **U2** | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 |
| **U3** | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 |
| **U4** | - | - | - | 0.00 | 0.50 | 0.80 | 0.80 | 0.00 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 |
| **U5** | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 |
| **U6** | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.80 | 0.50 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 |
| **U7** | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 |
| **U8** | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 |
| **U9** | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 |
| **U10** | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 |
| **U11** | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 |
| **U12** | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 |
| **U13** | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 |
| **U14** | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U15** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U16** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 |
| **U17** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.50 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 |
| **U18** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 |
| **U19** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.80 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 |
| **U20** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 |
| **U21** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 |
| **U22** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 |
| **U23** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 |
| **U24** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U25** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 |
| **U26** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 |
| **U27** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 |
| **U28** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U29** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 |
| **U30** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U31** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 |
| **U32** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 |
| **U33** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 |
| **U34** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 |
| **U35** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 |
| **U36** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 |
| **U37** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 |
| **U38** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 |
| **U39** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 |
| **U40** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 |
| **U41** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.50 |
| **U42** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 |
| **U43** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 |
| **U44** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 |

## Configuration 8: Set 8 - CS / GD
**CBF Formula:** `CS` | **CF Formula:** `GD` | **Dynamic Alpha:** `0.561224`
**Configuration Top-3 Mean Jaccard Dissimilarity:** **`0.580655`** (58.07%)

### Top-3 Recommendation List
| user | top 1 | top 2 | top 3 |
| :---: | :--- | :--- | :--- |
| 1 (`E1-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Sembrano |
| 2 (`E1-N-P2`) | Mt. Sembrano | Mariang Makiling Trail (MMT) | Mt. Batulao via New Trail |
| 3 (`E1-N-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mariang Makiling Trail (MMT) |
| 4 (`E1-M-P1`) | Mt. Batulao via New Trail | Mt. Makiling Traverse (MakTrav) | Batulao Traverse |
| 5 (`E1-M-P2`) | Mt. Batulao via New Trail | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan |
| 6 (`E1-M-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mt. Batulao via New Trail |
| 7 (`E2-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Mt. Kulis - Sambong Trail |
| 8 (`E2-N-P2`) | Mt. Makiling Traverse (MakTrav) | Batulao Traverse | Mariang Makiling Trail (MMT) |
| 9 (`E2-N-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail | Batulao Traverse |
| 10 (`E2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan |
| 11 (`E2-M-P2`) | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail | Mt. Daraitan |
| 12 (`E2-M-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail | Mt. Kulis - Sambong Trail |
| 13 (`E3-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Batulao Traverse |
| 14 (`E3-N-P2`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Mt. Daraitan |
| 15 (`E3-N-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mariang Makiling Trail (MMT) |
| 16 (`E3-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mariang Makiling Trail (MMT) |
| 17 (`E3-M-P2`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mt. Sembrano |
| 18 (`E3-M-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mt. Sembrano |
| 19 (`E4-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mariang Makiling Trail (MMT) |
| 20 (`E4-N-P2`) | Mt. Makiling Traverse (MakTrav) | Mt. Sembrano | Batulao Traverse |
| 21 (`E4-N-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Sembrano | Batulao Traverse |
| 22 (`E4-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mariang Makiling Trail (MMT) |
| 23 (`E4-M-P2`) | Mt. Makiling Traverse (MakTrav) | Batulao Traverse | Mt. Daraitan |
| 24 (`E4-M-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mariang Makiling Trail (MMT) |
| 25 (`AB-4-1-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mariang Makiling Trail (MMT) |
| 26 (`AB-4-1-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Batulao Traverse |
| 27 (`AB-4-2-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mariang Makiling Trail (MMT) |
| 28 (`AB-4-2-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mariang Makiling Trail (MMT) |
| 29 (`AB-4-3-N-P1`) | Mt. Makiling Traverse (MakTrav) | Batulao Traverse | Mariang Makiling Trail (MMT) |
| 30 (`AB-4-3-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Mt. Daraitan |
| 31 (`AB-3-1-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Batulao Traverse |
| 32 (`AB-3-1-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) |
| 33 (`AB-3-2-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mt. Kulis - Sambong Trail |
| 34 (`AB-3-2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail |
| 35 (`AB-2-1-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan |
| 36 (`AB-2-1-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail |
| 37 (`AB-1-4-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail | Batulao Traverse |
| 38 (`AB-1-4-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail | Batulao Traverse |
| 39 (`AB-1-3-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail |
| 40 (`AB-1-3-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail |
| 41 (`AB-1-2-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail |
| 42 (`AB-1-2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Batulao via New Trail | Mt. Makiling Traverse (MakTrav) |
| 43 (`AB-2-4-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Batulao Traverse |
| 44 (`AB-2-4-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) |

### User × User Jaccard Dissimilarity Matrix (Upper Triangle)
> *Bottom triangle removed; diagonal set to 0.00 since self-recommendations are identical.*
> *Dissimilarity values: `0.00` (identical), `0.50` (2 overlapping), `0.80` (1 overlapping), `1.00` (0 overlapping).*

| user | U1 | U2 | U3 | U4 | U5 | U6 | U7 | U8 | U9 | U10 | U11 | U12 | U13 | U14 | U15 | U16 | U17 | U18 | U19 | U20 | U21 | U22 | U23 | U24 | U25 | U26 | U27 | U28 | U29 | U30 | U31 | U32 | U33 | U34 | U35 | U36 | U37 | U38 | U39 | U40 | U41 | U42 | U43 | U44 |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **U1** | 0.00 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 |
| **U2** | - | 0.00 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 1.00 | 0.80 | 0.80 | 1.00 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 1.00 | 0.80 | 0.80 | 1.00 | 0.80 | 0.80 | 0.80 | 0.80 | 1.00 | 0.80 | 1.00 | 0.80 | 1.00 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 |
| **U3** | - | - | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.00 | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.00 | 0.50 | 0.80 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U4** | - | - | - | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 |
| **U5** | - | - | - | - | 0.00 | 0.00 | 0.80 | 0.80 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 |
| **U6** | - | - | - | - | - | 0.00 | 0.80 | 0.80 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 |
| **U7** | - | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.00 | 0.80 | 0.50 | 0.00 | 0.80 | 0.80 | 0.00 | 0.80 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U8** | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.00 | 0.50 |
| **U9** | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 |
| **U10** | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 |
| **U11** | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 |
| **U12** | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.80 | 0.50 |
| **U13** | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 |
| **U14** | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.00 | 0.50 | 0.80 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U15** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.00 | 0.50 | 0.80 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U16** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.00 | 0.80 | 0.80 | 0.00 | 0.80 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U17** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 |
| **U18** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 |
| **U19** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.80 | 0.00 | 0.80 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U20** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 |
| **U21** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 |
| **U22** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U23** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 |
| **U24** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U25** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U26** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 |
| **U27** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U28** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U29** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.00 | 0.50 |
| **U30** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U31** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 |
| **U32** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U33** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 |
| **U34** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.80 | 0.50 |
| **U35** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 |
| **U36** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.80 | 0.50 |
| **U37** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 |
| **U38** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 |
| **U39** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.00 | 0.80 | 0.50 |
| **U40** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.80 | 0.50 |
| **U41** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.80 | 0.50 |
| **U42** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 |
| **U43** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 |
| **U44** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 |

## Configuration 9: Set 9 - CS / ED
**CBF Formula:** `CS` | **CF Formula:** `ED` | **Dynamic Alpha:** `0.561224`
**Configuration Top-3 Mean Jaccard Dissimilarity:** **`0.565328`** (56.53%)

### Top-3 Recommendation List
| user | top 1 | top 2 | top 3 |
| :---: | :--- | :--- | :--- |
| 1 (`E1-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Sembrano |
| 2 (`E1-N-P2`) | Mt. Sembrano | Mariang Makiling Trail (MMT) | Mt. Makiling Traverse (MakTrav) |
| 3 (`E1-N-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mt. Batulao via New Trail |
| 4 (`E1-M-P1`) | Mt. Batulao via New Trail | Mt. Makiling Traverse (MakTrav) | Batulao Traverse |
| 5 (`E1-M-P2`) | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail | Mt. Daraitan |
| 6 (`E1-M-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mt. Batulao via New Trail |
| 7 (`E2-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mariang Makiling Trail (MMT) |
| 8 (`E2-N-P2`) | Mt. Makiling Traverse (MakTrav) | Batulao Traverse | Mt. Batulao via New Trail |
| 9 (`E2-N-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail | Batulao Traverse |
| 10 (`E2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan |
| 11 (`E2-M-P2`) | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail | Mt. Daraitan |
| 12 (`E2-M-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail | Mt. Kulis - Sambong Trail |
| 13 (`E3-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mt. Batulao via New Trail |
| 14 (`E3-N-P2`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Mt. Daraitan |
| 15 (`E3-N-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mariang Makiling Trail (MMT) |
| 16 (`E3-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mariang Makiling Trail (MMT) |
| 17 (`E3-M-P2`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mt. Sembrano |
| 18 (`E3-M-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mt. Sembrano |
| 19 (`E4-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mariang Makiling Trail (MMT) |
| 20 (`E4-N-P2`) | Mt. Makiling Traverse (MakTrav) | Mt. Sembrano | Mariang Makiling Trail (MMT) |
| 21 (`E4-N-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Sembrano | Batulao Traverse |
| 22 (`E4-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mariang Makiling Trail (MMT) |
| 23 (`E4-M-P2`) | Mt. Makiling Traverse (MakTrav) | Batulao Traverse | Mt. Daraitan |
| 24 (`E4-M-P3`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mariang Makiling Trail (MMT) |
| 25 (`AB-4-1-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mariang Makiling Trail (MMT) |
| 26 (`AB-4-1-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Kulis - Sambong Trail | Mariang Makiling Trail (MMT) |
| 27 (`AB-4-2-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mariang Makiling Trail (MMT) |
| 28 (`AB-4-2-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mariang Makiling Trail (MMT) |
| 29 (`AB-4-3-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Batulao Traverse |
| 30 (`AB-4-3-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Mt. Daraitan |
| 31 (`AB-3-1-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Batulao Traverse |
| 32 (`AB-3-1-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) |
| 33 (`AB-3-2-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Daraitan | Mt. Kulis - Sambong Trail |
| 34 (`AB-3-2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail |
| 35 (`AB-2-1-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail |
| 36 (`AB-2-1-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail |
| 37 (`AB-1-4-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail | Batulao Traverse |
| 38 (`AB-1-4-M-P1`) | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail | Batulao Traverse |
| 39 (`AB-1-3-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail |
| 40 (`AB-1-3-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail |
| 41 (`AB-1-2-N-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail |
| 42 (`AB-1-2-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mt. Batulao via New Trail |
| 43 (`AB-2-4-N-P1`) | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) | Batulao Traverse |
| 44 (`AB-2-4-M-P1`) | Mt. Kulis - Sambong Trail | Mt. Makiling Traverse (MakTrav) | Mariang Makiling Trail (MMT) |

### User × User Jaccard Dissimilarity Matrix (Upper Triangle)
> *Bottom triangle removed; diagonal set to 0.00 since self-recommendations are identical.*
> *Dissimilarity values: `0.00` (identical), `0.50` (2 overlapping), `0.80` (1 overlapping), `1.00` (0 overlapping).*

| user | U1 | U2 | U3 | U4 | U5 | U6 | U7 | U8 | U9 | U10 | U11 | U12 | U13 | U14 | U15 | U16 | U17 | U18 | U19 | U20 | U21 | U22 | U23 | U24 | U25 | U26 | U27 | U28 | U29 | U30 | U31 | U32 | U33 | U34 | U35 | U36 | U37 | U38 | U39 | U40 | U41 | U42 | U43 | U44 |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **U1** | 0.00 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 |
| **U2** | - | 0.00 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U3** | - | - | 0.00 | 0.50 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 |
| **U4** | - | - | - | 0.00 | 0.50 | 0.50 | 0.80 | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 |
| **U5** | - | - | - | - | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 |
| **U6** | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 |
| **U7** | - | - | - | - | - | - | 0.00 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.00 | 0.80 | 0.50 | 0.00 | 0.50 | 0.80 | 0.00 | 0.80 | 0.50 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U8** | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 |
| **U9** | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 |
| **U10** | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 |
| **U11** | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 |
| **U12** | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.80 | 0.50 |
| **U13** | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 |
| **U14** | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U15** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U16** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.00 | 0.50 | 0.80 | 0.00 | 0.80 | 0.50 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U17** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 |
| **U18** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 |
| **U19** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.00 | 0.80 | 0.50 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U20** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U21** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 |
| **U22** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U23** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 |
| **U24** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U25** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U26** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U27** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U28** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U29** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.00 | 0.50 |
| **U30** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 |
| **U31** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 | 0.80 | 0.80 | 0.80 | 0.50 | 0.50 | 0.80 | 0.80 | 0.80 | 0.80 | 0.50 | 0.80 |
| **U32** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.00 |
| **U33** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.80 | 0.80 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 | 0.50 |
| **U34** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.80 | 0.50 |
| **U35** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.80 | 0.50 |
| **U36** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.00 | 0.00 | 0.00 | 0.00 | 0.80 | 0.50 |
| **U37** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 |
| **U38** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 | 0.50 | 0.50 | 0.50 | 0.50 | 0.80 |
| **U39** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.00 | 0.80 | 0.50 |
| **U40** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.00 | 0.80 | 0.50 |
| **U41** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.00 | 0.80 | 0.50 |
| **U42** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.80 | 0.50 |
| **U43** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 | 0.50 |
| **U44** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 0.00 |
