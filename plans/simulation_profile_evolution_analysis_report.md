# THARESYS Simulation Analysis Report: Profile Convergence & Runaway Debuff Investigation

**Document Version:** 1.0  
**Date:** November 3, 2026  
**Context:** Multi-Cycle In-Memory Recommendation Simulation (24 Cohorts, 4 Batches: 2026-10 to 2027-01)  
**Target Module:** Adaptive Profile Update Engine (`engine/formula/profile_updater.py`, `scripts/simulation/run_simulation_harness.py`)

---

## 1. Executive Summary

During the execution of the multi-cycle recommendation simulation harness, an unexpected trajectory was observed across several cohorts—most prominently beginner cohorts such as **`E1-M-P3`** and **`E1-M-P2`**:

1. **Distance Divergence:** Rather than converging toward the user's hidden Ground Truth capability ($GT$), the Gower Distance to Ground Truth consistently **increased** across consecutive hiking cycles (e.g. `E1-M-P3` rose from an initial distance of `0.0635` to `0.1026`).
2. **Runaway Feature Collapse:** Physical exertion parameters (`Length`, `Slope`, `Peak Elevation`, and `Elevation Gain`) collapsed downward to near-zero values (`0.00` to `0.04`), even when the user's true Ground Truth capability was substantially higher (e.g. Ground Truth `Length = 0.20, Slope = 0.20, Peak = 0.22`).
3. **Trail-Dominance vs. Profile Learning:** The user profile evolved as an artifact of the specific candidate trails recommended and hiked, rather than learning the latent physiological boundaries of the hiker.

This report presents a thorough investigation into the mathematical mechanics causing this behavior and outlines the structural adjustments required to achieve stable, monotonic convergence.

---

## 2. Problem Encountered: Case Study of Cohort `E1-M-P3`

Cohort `E1-M-P3` represents a beginner hiker with an orthopedic/low-impact medical condition (knee injury) residing in Province P3 (Batangas).

### 2.1. Ground Truth vs. Initial Survey Profile
From onboarding survey generation and deterministic ground truth sampling:
* **Initial Profile (Cycle 0 Prior):**
  $$\text{Length} = 0.20, \quad \text{Peak} = 0.20, \quad \text{Gain} = 0.20, \quad \text{Slope} = 0.20$$
* **Latent Ground Truth Target ($GT$):**
  $$\text{Length} = 0.20, \quad \text{Peak} = 0.22, \quad \text{Gain} = 0.04, \quad \text{Slope} = 0.20$$
* **Initial Gower Distance to GT:** **`0.0635`** *(near-perfect alignment on physical capability)*.

### 2.2. Observed Progression Across 3 Cycles

```
Cycle 0 (2026-10):  GD = 0.0635  |  Len: 0.20, Peak: 0.20, Gain: 0.20, Slope: 0.20
  │ Hiked: Mt. Kulis (Sambong Trail) -> Review: "The trail was too steep" [Mismatch]
  ▼
Cycle 1 (2026-11):  GD = 0.0898  |  Len: 0.21, Peak: 0.17, Gain: 0.21, Slope: 0.00  (Slope crushed to 0)
  │ Hiked: Mt. Sembrano -> Review: "Demanding uphill climb" [Mismatch]
  ▼
Cycle 2 (2026-12):  GD = 0.0885  |  Len: 0.15, Peak: 0.07, Gain: 0.03, Slope: 0.00  (Gain & Peak crushed)
  │ Hiked: Mt. Daraitan -> Review: "Demanding uphill climb" [Mismatch]
  ▼
Cycle 3 (2027-01):  GD = 0.1026  |  Len: 0.04, Peak: 0.00, Gain: 0.00, Slope: 0.00  (All physical metrics -> 0)
```

| Metric | Cycle 0 (Initial) | Cycle 1 | Cycle 2 | Cycle 3 (Terminal) | Ground Truth Target |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Gower Distance to GT** | **`0.0635`** | **`0.0898`** | **`0.0885`** | **`0.1026`** | **`0.0000`** |
| **Length (km)** | 0.20 | 0.21 | 0.15 | **`0.04`** | **`0.20`** |
| **Peak Elevation (MASL)** | 0.20 | 0.17 | 0.07 | **`0.00`** | **`0.22`** |
| **Elevation Gain (m)** | 0.20 | 0.21 | 0.03 | **`0.00`** | **`0.04`** |
| **Slope (%)** | 0.20 | **`0.00`** | 0.00 | **`0.00`** | **`0.20`** |

> [!WARNING]
> In Cycle 0, the user's profile slope ($0.20$) and length ($0.20$) were **already identical** to Ground Truth. By Cycle 3, slope was pushed to `0.00` and length was pushed to `0.04`, doubling the error distance to Ground Truth.

---

## 3. Root Cause Analysis

### 3.1. Mathematical Asymmetry in the Error-Driven Update Formula
The core profile update equation in [`engine/formula/profile_updater.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/formula/profile_updater.py#L34-L144) is formulated as:

$$\Delta_i = W_i \odot \left( \beta_i \cdot (T_i - P) \right)$$

$$P_{\text{new}} = \text{clamp}\left(P + \Delta_i, \; 0.0, \; 1.0\right)$$

Where:
$$\beta_i = \begin{cases} +\dfrac{R_{tu}}{2} & \text{if Match} \\ -\dfrac{1 - R_{tu}}{2} & \text{if Mismatch} \end{cases}$$

#### The Flaw Under Extreme Trail Differences
When a user experiences a trail as a **Mismatch** ($\beta_i < 0$), the formula pushes the profile away from the trail:

$$\Delta_i = - |\beta_i| \cdot W_i \odot (T_i - P)$$

If the hiked trail is significantly more demanding than the profile ($T_i \gg P$), the difference term $(T_i - P)$ is positive and large.
In Cycle 0 for `E1-M-P3`:
* Current Profile Slope: $P = 0.20$
* Mt. Kulis Slope: $T = 0.889$
* Raw Feature Difference: $(T - P) = 0.889 - 0.20 = \mathbf{0.689}$
* Score $R_{tu} = 0.28 \implies \beta = -(1 - 0.28) / 2 = \mathbf{-0.36}$
* Weight for Active Factor ("The trail was too steep"): $W = \mathbf{1.0}$
* **Computed Step:**
  $$\Delta = 1.0 \times (-0.36) \times (0.689) = \mathbf{-0.248}$$
* **New Profile Slope:**
  $$P_{\text{new}} = \text{clamp}(0.20 - 0.248, \; 0.0, \; 1.0) = \mathbf{0.00}$$

> [!CAUTION]
> The formula treats $(T_i - P)$ as the step size. If a beginner who can handle a $20\%$ slope fails an extreme $89\%$ slope, the formula penalizes the hiker proportionally to how extreme the mountain was, subtracting $0.25$ and wiping their slope capability to zero in a single hike.

### 3.2. Limited Catalog Dynamics (The 8-Trail Trap)
The real database catalog currently contains 8 trails. An analysis of their physical metrics reveals a severe skew toward high exertion:

```
Batulao New Trail:                Length = 0.65, Gain = 0.13, Slope = 0.13
Mt. Makiling Traverse (MakTrav):  Length = 1.00, Gain = 0.88, Slope = 0.93  [Extreme]
Mt. Kulis - Sambong Trail:        Length = 0.00, Gain = 0.00, Slope = 0.89  [Extreme Slope]
Mt. Batulao:                      Length = 0.17, Gain = 0.05, Slope = 0.00  [Only gentle trail]
Mt. Tagapo:                       Length = 0.23, Gain = 0.39, Slope = 1.00  [Extreme Slope]
Mariang Makiling Trail (MMT):     Length = 0.52, Gain = 1.00, Slope = 0.56  [Extreme Gain]
Mt. Sembrano:                     Length = 0.40, Gain = 0.74, Slope = 0.48  [High Gain & Slope]
Mt. Daraitan:                     Length = 0.49, Gain = 0.54, Slope = 0.18  [High Gain & Length]
```

Only **one trail** (Mt. Batulao) is genuinely gentle. Once a beginner completes Mt. Batulao, the recommendation engine has no choice but to recommend trails with $40\%–100\%$ exertion metrics. Because every subsequent recommendation is far too difficult, every hike produces a Mismatch, triggering consecutive negative debuffs until every physical attribute is flattened to zero.

### 3.3. Asymmetric Information: Trail Feedback vs. User Capability
In recommendation systems, a user rating an item negative only indicates that the item was outside their utility function; it does not indicate that the user's utility is zero.
* When the user said *"Mt. Kulis was too steep"*, they confirmed that **Slope $0.89$ exceeds their limit**.
* It did **not** mean that their capacity is less than $0.20$.
* Because the algorithm uses the trail vector $T$ as the reference anchor rather than the user's prior baseline $P$, the profile converged toward the inverse of the hiked trails rather than learning the user's true Ground Truth.

---

## 4. Corrective Action Plan

To establish mathematically stable, monotonic convergence without sacrificing the adaptive learning principle, the following remedies must be introduced:

### Remedy 1: Maximum Step-Size Clamping ($\Delta_{\max}$)
Human physical endurance and preferences evolve gradually through experience. A single hike should never shift any profile dimension by more than a plausible physiological increment.
* Enforce a hard ceiling on the single-hike delta:
  $$\Delta_{\text{clamped}} = \text{sign}(\Delta) \cdot \min(|\Delta|, \; \Delta_{\max})$$
* **Recommended Bound:** $\Delta_{\max} = \mathbf{0.04}$ (or $4\%$ of the normalized scale).
* Under this rule, failing Mt. Kulis would adjust the user's slope by at most $-0.04$ (from $0.20 \to 0.16$) rather than crashing by $-0.25$ to $0.00$.

### Remedy 2: Dampening the Learning Rate Divisor ($\beta_{\text{divisor}}$)
In [`engine/parameters.py`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/engine/parameters.py), `BETA_LEARNING_RATE_DIVISOR` is currently set to `2.0`.
* With $R_{tu} = 0.28$, $\beta = -(1 - 0.28) / 2.0 = -0.36$ (a $36\%$ raw multiplier).
* Increasing `BETA_LEARNING_RATE_DIVISOR` to **`5.0` or `6.0`** scales $\beta$ down to $-0.12$, matching standard gradient descent step sizes in recommendation literature.

### Remedy 3: Distance-Decoupled Directional Debuff
On a mismatch where the trail was excessively difficult ($T_k > P_k$), the corrective delta should reflect the uncertainty of the prediction rather than the magnitude of the mountain:
$$\text{Raw\_Delta}_k = -\beta_i \cdot \min(|T_k - P_k|, \; \sigma_{\text{step}})$$
This prevents extreme outliers in the trail catalog from disproportionately skewing user vectors.

### Remedy 4: Synthetic Fallbacks & Catalog Stratification in Simulation
In the simulation harness:
* If the user's capability profile is already within an acceptable distance of Ground Truth ($|P_k - GT_k| \le 0.05$), the simulated review should accurately report comfort when the trail is reasonably paced, preventing artificial mismatch cycles.
* Ensure beginner cohorts have access to realistic low-impact candidate trails in the simulation catalog rather than cycling exclusively through major summits.

---

## 5. Summary & Recommendation

| Component | Current State | Root Cause | Proposed Solution |
| :--- | :--- | :--- | :--- |
| **Step Delta $\Delta$** | Unbounded: $\Delta = W \cdot \beta \cdot (T - P)$ | Massive step ($-0.25$) when trail is extreme | Clamp delta: $|\Delta| \le 0.04$ |
| **Beta Divisor** | `2.0` | High learning rate creates violent oscillations | Increase `BETA_LEARNING_RATE_DIVISOR` to `5.0` |
| **Catalog Scope** | 8 trails (7 are high-exertion) | Beginners starved of gentle hikes $\implies$ endless mismatches | Stratify recommendations & handle catalog scarcity safely |
| **Convergence Rate** | $29.2\%$ (runaway collapse on beginners) | Profiles converge to trails instead of Ground Truth | Implement clamping & dampening to reach $> 80\%$ convergence |

