# THARESYS Engine Simulation & Evaluation Plan: 4-Pillar Quality Benchmark

This document outlines the simulation, evaluation methodology, and comparison metrics used to test and benchmark the 9 formula configurations of the **Thrail App Recommendation System (THARESYS)**.

---

## 1. Objective

To determine which of the 9 THARESYS engine configurations produces the highest quality, most personalized, and logically sound hiking recommendations when tested across diverse user cohorts.

---

## 2. The 9 THARESYS Engine Configurations

The hybrid recommendation score is computed as:
`R_tu = (alpha * CBF_score) + ((1 - alpha) * CF_score)`

Each configuration pairs a Content-Based Filtering (CBF) formula with a Collaborative Filtering (CF) formula:

| Configuration | CBF Formula (User_A - Trail_T) | CF Formula (User_A - User_B & User_B - Trail_T) |
| :--- | :--- | :--- |
| **Set 1: Pure Gower** | Gower Distance (GD) | Gower Distance (GD) |
| **Set 2: Pure Euclidean** | Normalized Euclidean (ED) | Normalized Euclidean (ED) |
| **Set 3: Pure Cosine** | Cosine Distance (CS) | Cosine Distance (CS) |
| **Set 4** | Gower Distance (GD) | Normalized Euclidean (ED) |
| **Set 5** | Gower Distance (GD) | Cosine Distance (CS) |
| **Set 6** | Normalized Euclidean (ED) | Gower Distance (GD) |
| **Set 7** | Normalized Euclidean (ED) | Cosine Distance (CS) |
| **Set 8** | Cosine Distance (CS) | Gower Distance (GD) |
| **Set 9** | Cosine Distance (CS) | Normalized Euclidean (ED) |

---

## 3. The 4-Pillar Evaluation Framework

To prevent evaluating solely on output variance (which could favor erratic random noise), each engine set is evaluated against four distinct, quantifiable criteria:

### Pillar 1: Inter-User Variety (Personalization Diversity)
- **Question**: Do different user profiles receive distinctly different trail recommendations?
- **Measurement**:
  - Top-5 List Overlap / Jaccard Dissimilarity between user cohorts.
  - Formula: `Variety = 1.0 - (Count(Intersection(Recs_A, Recs_B)) / Count(Union(Recs_A, Recs_B)))`
- **Expected Outcome**: A beginner seeking gentle trails in Rizal should have low recommendation overlap with an experienced peak bagger in Batangas.

### Pillar 2: Constraint Alignment (Logical Correctness)
- **Question**: Does the engine respect the physical, medical, and geographical profile of the user?
- **Measurement**:
  - **Difficulty Match**: Beginners receive trails with Lasco ratings <= 3/9 and gentle gradients.
  - **Medical Safety**: Users with reported medical conditions receive conservative physical exertion demands (<= 20% downshifted bounds).
  - **Location Relevance**: Top recommendations prioritize trails located in or adjacent to the user's preferred provinces.
- **Expected Outcome**: High compliance with safety and preference filters.

### Pillar 3: Dual-Anchor Contrast (Easy vs. Difficult Separation)
- **Question**: For the same user, does the engine produce high contrast between the Easy Anchor (recovery/leisure) and the Difficult Anchor (aspirational challenge)?
- **Measurement**:
  - Distance separation between the average feature vector of the Easy recommendations vs. the Difficult recommendations.
- **Expected Outcome**: Non-overlapping, distinct sets: Top-3 accessible trails for the Easy anchor and Top-2 ambitious trails for the Difficult anchor.

### Pillar 4: Score Discrimination (Dynamic Range)
- **Question**: Does the formula clearly distinguish between strong matches and poor matches?
- **Measurement**:
  - Spread (Standard Deviation and Range) between the lowest R_tu score and the highest R_tu score across the catalog.
- **Expected Outcome**: Good matches sit clearly near `0.05` to `0.20`, and poor matches sit clearly above `0.60` (preventing score compression where all trails cluster in a narrow `0.48 - 0.52` range).

---

## 4. Simulation Cohorts (Synthetic User Profiles)

The simulation will generate `n` representative synthetic user profiles derived from [user_profile_generation_documentation.md](file:///c:/Users/LENOVO/Documents/dev/thrail_app/plans/user_profile_generation_documentation.md):

1. **Cohort 1: Beginner with Medical Constraints**
   - High safety priority, low slope tolerance, localized to comfortable province.
2. **Cohort 2: Beginner Explorer**
   - Healthy, introductory physical exertion, open to multi-province exploration.
3. **Cohort 3: Regular Hiker**
   - Moderate distance (5 - 10 km), moderate gain (300 - 600 m), balanced preferences.
4. **Cohort 4: Experienced Mountain Trekker**
   - Proven history on major trails, high physical stamina, aspirational elevation targets.
5. **Cohort 5: Technical Terrain Specialist**
   - Preference for rocky ridges, river crossings, and non-circular/traverse routes.

---

## 5. Execution Steps for the Simulation Phase

1. **Synthetic Data Loading**:
   - Generate test user profile vectors (Easy and Difficult anchors) using the calibrated bounds.
   - Load candidate trail catalog with normalized 15-dimensional vectors.
2. **Batch Execution**:
   - Run each user through all 9 configurations under cold start (`alpha = 1.0`), transitional (`alpha = 0.75`), and steady state (`alpha = 0.50`).
3. **Scorecard Compilation**:
   - Compute the 4-pillar scores for each set.
   - Present a side-by-side leaderboard ranking the configurations from most effective to least effective.
