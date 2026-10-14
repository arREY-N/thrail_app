# TARS 2.0: Dual-Anchor Recommendation Categorization & Disjoint Partitioning Plan

## 1. Executive Summary & Objective

In the **TARS 2.0 (Two-Anchor Recommendation System)** architecture, user preferences are represented by two distinct target vectors:
1. **$P_e$ (Easy Anchor Profile):** Represents the user's comfortable, safe baseline physical capability (*"What can I hike comfortably today?"*).
2. **$P_d$ (Difficult Anchor Profile):** Represents the user's aspirational, challenging boundary (*"What hike will challenge my stamina without exceeding my safety limits?"*).

In raw information retrieval, every mountain in the candidate database receives two match scores: $R_{tu}(P_e)$ and $R_{tu}(P_d)$. However, displaying identical trails across both lists in a user-facing mobile app creates redundancy.

This plan details how to **categorize and partition candidate mountains** into two mutually exclusive, distinct user experiences:
* **Section 1: "Recommended For Your Comfort Level" ($P_e$)** $\rightarrow$ E.g., Top 3 Easy/Moderate Trails.
* **Section 2: "Ready for a Challenge?" ($P_d$)** $\rightarrow$ E.g., Top 2 Demanding/Major Trails.

---

## 2. Categorization & Partitioning Strategies

### Strategy A: Disjoint Top-K Partitioning (Recommended)
This approach guarantees **zero duplicate mountains** between the Easy and Difficult UI sections while strictly adhering to algorithmic match scores.

1. **Step 1:** Calculate $R_{tu}(P_e)$ for all candidate trails in dataset $\mathcal{M}$.
2. **Step 2:** Select the top $K_e$ trails with the lowest $R_{tu}(P_e)$ scores for the Easy section:
   $$\mathcal{S}_{\text{easy}} = \arg\min_{T \subset \mathcal{M}, |T|=K_e} \sum_{t \in T} R_{tu}(P_e, t)$$
3. **Step 3:** Remove $\mathcal{S}_{\text{easy}}$ from candidate set: $\mathcal{M}' = \mathcal{M} \setminus \mathcal{S}_{\text{easy}}$.
4. **Step 4:** Select the top $K_d$ trails with the lowest $R_{tu}(P_d)$ scores from the remaining candidates $\mathcal{M}'$:
   $$\mathcal{S}_{\text{difficult}} = \arg\min_{T \subset \mathcal{M}', |T|=K_d} \sum_{t \in T} R_{tu}(P_d, t)$$

#### Example Result with 5 CALABARZON Mountains:
* **$P_e$ Easy Section ($K_e = 3$):** Mt. Kulis, Mt. Tagapo, Mt. Batulao.
* **$P_d$ Difficult Section ($K_d = 2$):** Mt. Daraitan, Mt. Makiling.

---

### Strategy B: Physical Intensity Gating (Rule-Based Thresholding)
This approach uses mountain physical metrics (LASCO Difficulty Rating and Elevation Gain) to partition candidates before scoring:

| Category | LASCO Rating Filter | Elevation Gain Filter | Target Mountains in Dataset |
| :--- | :---: | :---: | :--- |
| **Easy Anchor Pool ($\mathcal{M}_{\text{easy}}$)** | $\le 3 / 9$ (Minor) | $\le 450\text{ m}$ | Mt. Kulis, Mt. Tagapo, Mt. Batulao |
| **Difficult Anchor Pool ($\mathcal{M}_{\text{diff}}$)** | $\ge 4 / 9$ (Major / Demanding) | $\ge 500\text{ m}$ | Mt. Daraitan, Mt. Makiling |

```python
def partition_trails_by_intensity(trails_df):
    easy_candidates = trails_df[
        (trails_df['difficulty_lascoRating'] <= 3) & 
        (trails_df['difficulty_gain'] <= 450)
    ]
    diff_candidates = trails_df[
        (trails_df['difficulty_lascoRating'] >= 4) | 
        (trails_df['difficulty_gain'] >= 500)
    ]
    return easy_candidates, diff_candidates
```

---

### Strategy C: Relative Affinity Score ($\Delta R_{tu}$)
Assigns each mountain to the anchor profile that it mathematically favors the most:

$$\Delta R_{tu}(t) = R_{tu}(P_e, t) - R_{tu}(P_d, t)$$

* **If $\Delta R_{tu}(t) < 0$:** The trail has a lower distance to $P_e$ $\rightarrow$ Assigned to **Easy Category ($P_e$)**.
* **If $\Delta R_{tu}(t) > 0$:** The trail has a lower distance to $P_d$ $\rightarrow$ Assigned to **Difficult Category ($P_d$)**.

---

## 3. Mobile App Wireframe & Layout

In the mobile app home screen (`src/app/(main)/hike/view.tsx` or Explore tab), the recommendations will render as two distinct carousels:

```
┌──────────────────────────────────────────────────────────┐
│  🟢 RECOMMENDED FOR YOUR LEVEL (Easy Anchor Pe)          │
│  "Safe & comfortable trails matching your experience"    │
│                                                          │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │ Mt. Kulis       │  │ Mt. Tagapo      │  ...           │
│  │ Rizal • 4.0 km  │  │ Rizal • 5.0 km  │                │
│  │ Match: 96.7%    │  │ Match: 93.8%    │                │
│  └─────────────────┘  └─────────────────┘                │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  🔴 READY FOR A CHALLENGE? (Difficult Anchor Pd)         │
│  "Aspirational trails to push your endurance"            │
│                                                          │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │ Mt. Daraitan    │  │ Mt. Makiling    │  ...           │
│  │ Rizal • 8.0 km  │  │ Laguna • 16.0 km│                │
│  │ Match: 94.9%    │  │ Match: 88.6%    │                │
│  └─────────────────┘  └─────────────────┘                │
└──────────────────────────────────────────────────────────┘
```

---

## 4. API Schema Specification (Proposed)

### Request Payload (`POST /api/recommend`):
```json
{
  "user_id": "user_101",
  "preferences": {
    "experience": "Beginner",
    "province": ["Rizal", "Batangas"],
    "tourism_1": true
  },
  "active_user_count": 25,
  "config_name": "HYBRID_GOWER",
  "partition_mode": "disjoint",
  "k_easy": 3,
  "k_difficult": 2
}
```

### Response Payload:
```json
{
  "user_id": "user_101",
  "config_used": "HYBRID_GOWER",
  "alpha_tuner": 0.75,
  "easy_anchor_recommendations": [
    { "trail_id": "trail_005", "trail_name": "Mt. Kulis", "province": "Rizal", "r_tu": 0.0334, "category": "Comfortable" },
    { "trail_id": "trail_004", "trail_name": "Mt. Tagapo", "province": "Rizal", "r_tu": 0.0618, "category": "Comfortable" },
    { "trail_id": "trail_002", "trail_name": "Mt. Batulao", "province": "Batangas", "r_tu": 0.0505, "category": "Comfortable" }
  ],
  "difficult_anchor_recommendations": [
    { "trail_id": "trail_001", "trail_name": "Mt. Daraitan", "province": "Rizal", "r_tu": 0.0507, "category": "Challenging" },
    { "trail_id": "trail_003", "trail_name": "Mt. Makiling", "province": "Laguna", "r_tu": 0.1141, "category": "Challenging" }
  ]
}
```

---

## 5. Python Implementation Snippet (`core/recommender.py`)

When ready to implement, add this method to `HybridRecommender`:

```python
def get_disjoint_categorized_recommendations(
    self,
    user_id: str,
    preferences: dict,
    k_easy: int = 3,
    k_difficult: int = 2,
    weight_mode: str = "group_balanced"
) -> dict:
    # 1. Get raw full recommendations
    raw_res = self.get_hybrid_recommendations(
        user_id=user_id,
        preferences=preferences,
        top_k=len(self.trail_vectors),
        weight_mode=weight_mode
    )
    
    # 2. Pick top k_easy for Easy Anchor
    easy_pool = raw_res["easy_anchor_recommendations"]
    easy_selected = easy_pool[:k_easy]
    easy_ids = {item["trail_id"] for item in easy_selected}
    
    # 3. Filter out Easy selections from Difficult pool (Disjoint Partition)
    diff_pool = raw_res["difficult_anchor_recommendations"]
    diff_candidates = [item for item in diff_pool if item["trail_id"] not in easy_ids]
    diff_selected = diff_candidates[:k_difficult]
    
    return {
        "user_id": user_id,
        "alpha_tuner": raw_res["alpha_tuner"],
        "easy_anchor_recommendations": easy_selected,
        "difficult_anchor_recommendations": diff_selected
    }
```

---

## 6. Implementation Checklist

- [ ] Add `partition_mode: str = "disjoint"` parameter to `/api/recommend` in `app.py`.
- [ ] Add `get_disjoint_categorized_recommendations()` method in `core/recommender.py`.
- [ ] Update frontend React Native UI hook `useRecommendation` to display Easy Carousel ($K_e=3$) and Challenge Carousel ($K_d=2$).
- [ ] Add unit test `test_disjoint_partition_recommendations()` in `tests/test_tars_recommender.py`.
