# Google Maps-Grade GPS Drift Mitigation & Compass Heading Architecture

## 1. Problem Analysis: Why GPS Drifts Under Canopy (Shade) and Indoors

In open-sky environments, a mobile device's GNSS receiver has direct **Line-of-Sight (LoS)** to 12–30 satellites across GPS, GLONASS, Galileo, and BeiDou constellations, yielding horizontal accuracy of `3m–5m` with roughly Gaussian zero-mean error.

However, when a hiker enters **dense forest canopy (shade)**, **steep mountain ravines**, or **indoor structures**, four physical and algorithmic issues cause visible blue-dot wandering and "spiderweb" trail scribbles:

1. **Multipath Reflection ("Canopy / Wall Bounce"):**
   - Direct satellite signals are attenuated or blocked by wet foliage, tree trunks, rock walls, or roofs.
   - The GNSS antenna receives **non-line-of-sight (NLoS) reflected signals** that traveled a longer path. Even when the OS reports `accuracy: 10m–19m`, multipath delay biases the pseudorange calculation, causing raw coordinates to jump `5m–18m` sideways or walk in a slow circle while the user is standing completely still.
2. **Unfiltered Foreground Blue Dot (`userLocation`):**
   - Previously, [`TrackHikerGPSFlow.ts`](file:///d:/thrail_app/src/core/flows/TrackHikerGPSFlow.ts) passed every raw GPS fix with `accuracy <= 20m` directly into `globalUserLocation` every 2 seconds without Kalman variance weighting or stationary anchor locking.
3. **Static `3.5m` Deadband Under Degraded Accuracy:**
   - A fixed `3.5m` displacement threshold in [`hikeStoreCreator.ts`](file:///d:/thrail_app/src/core/models/Hike/stores/hikeStoreCreator.ts) works well when `accuracy` is `3m` (open sky), but when `accuracy` degrades to `14m–25m` under shade, random multipath noise routinely jumps `6m–12m`, breaching the `3.5m` gate and accumulating phantom distance.
4. **Unused GNSS Carrier-Phase Doppler Speed (`coords.speed`):**
   - Modern GNSS chipsets compute instantaneous velocity from **carrier-phase Doppler shift** (`location.coords.speed`), which detects whether a user is stationary (`speed < 0.45 m/s`) far more accurately than subtracting two noisy position fixes.

---

## 2. Solution Architecture: 4-Stage Fused Filtering Pipeline

To achieve Google Maps-like stability in both open terrain and shaded/indoor environments, Thrail uses a 4-stage pipeline implemented in [`src/core/utility/gpsKalmanFilter.ts`](file:///d:/thrail_app/src/core/utility/gpsKalmanFilter.ts), [`src/core/flows/TrackHikerGPSFlow.ts`](file:///d:/thrail_app/src/core/flows/TrackHikerGPSFlow.ts), [`src/core/models/Hike/stores/hikeStoreCreator.ts`](file:///d:/thrail_app/src/core/models/Hike/stores/hikeStoreCreator.ts), and [`src/features/Map/TrailMap.native.tsx`](file:///d:/thrail_app/src/features/Map/TrailMap.native.tsx).

```
Raw GNSS Fix (lat, lon, alt, accuracy, speed, timestamp)
   │
   ▼
[Stage 1] Coordinate Validity & Multipath Teleportation Gate
   │  • Rejects Null Island (0,0), NaN, accuracy > 35m
   │  • Rejects physically impossible jumps (> 7.5 m/s & > 1.5x accuracy)
   ▼
[Stage 2] 2D Accuracy-Weighted Kalman Filter (GpsKalmanFilter)
   │  • Process noise Q adapts to Doppler speed (0.22 m/s stationary vs 1.0–3.5 m/s walking)
   │  • Measurement variance R = (accuracy * canopyPenalty)^2
   │  • High Kalman gain K (~0.85) in open sky; low K (~0.10–0.20) in shade/indoors
   ▼
[Stage 3] Doppler Zero-Velocity Update (ZUPT) & Dynamic Stationary Anchor Lock
   │  • Dynamic deadband scales with accuracy & Doppler speed
   │  • Locks Blue Dot to pinned anchor when within uncertainty envelope
   ▼
[Stage 4] 3-Point Hairpin Spike Filter & Cubic UI Interpolation
      • Suppresses < 35° (cosTheta < -0.82) multipath bounce spikes on walkedRoute
      • Smoothly interpolates Blue Dot over 550ms + rotates Compass Heading Cone
```

---

## 3. Mathematical Formulation

### 3.1. 2D Accuracy-Weighted Kalman Filter ([`GpsKalmanFilter`](file:///d:/thrail_app/src/core/utility/gpsKalmanFilter.ts#L95-L296))

The filter tracks state estimate $(\hat{\phi}_k, \hat{\lambda}_k)$ and scalar position uncertainty variance $P_k$ (in $\text{m}^2$):

1. **Prediction Step (Adaptive Process Noise $Q$):**
   $$\Delta t = \min(30,\; \max(0.5,\; t_k - t_{k-1}))$$
   $$Q = \begin{cases} 0.22\text{ m/s} & \text{if } v_{\text{doppler}} < 0.45\text{ m/s (stationary)} \\ \text{clamp}(v_{\text{doppler}}, 1.0, 3.5) & \text{if walking} \end{cases}$$
   $$P_{k|k-1} = P_{k-1} + \Delta t \cdot Q^2$$

2. **Update Step (Canopy-Penalized Measurement Noise $R$):**
   Under tree canopy or indoors ($\sigma_{\text{acc}} > 10\text{ m}$), multipath error is non-Gaussian. We apply a canopy inflation factor $c_{\text{canopy}}$:
   $$c_{\text{canopy}} = \begin{cases} 1.0 & \text{if } \sigma_{\text{acc}} \le 10\text{ m} \\ 1.0 + 0.22 \cdot (\sigma_{\text{acc}} - 10) & \text{if } \sigma_{\text{acc}} > 10\text{ m} \end{cases}$$
   $$R_k = (\sigma_{\text{acc}} \cdot c_{\text{canopy}})^2$$
   $$K_k = \frac{P_{k|k-1}}{P_{k|k-1} + R_k}$$
   $$\hat{\phi}_k = \hat{\phi}_{k-1} + K_k (\phi_{\text{raw}} - \hat{\phi}_{k-1}), \quad \hat{\lambda}_k = \hat{\lambda}_{k-1} + K_k (\lambda_{\text{raw}} - \hat{\lambda}_{k-1})$$
   $$P_k = (1 - K_k) P_{k|k-1}$$

---

### 3.2. Dynamic Stationary Anchor Lock (Doppler ZUPT)

After computing the Kalman estimate $(\hat{\phi}_k, \hat{\lambda}_k)$, we compare its Haversine distance $d_{\text{anchor}}$ from the last locked anchor $(\phi_{\text{anchor}}, \lambda_{\text{anchor}})$ against a **dynamic deadband** $D_{\text{min}}$:

$$D_{\text{min}} = \begin{cases} \max(4.5\text{ m},\; 0.85 \cdot \sigma_{\text{acc}}) & \text{if } v_{\text{doppler}} < 0.45\text{ m/s} \\ \max(2.5\text{ m},\; 2.5 + 0.48 \cdot \max(0, \sigma_{\text{acc}} - 5)) & \text{otherwise} \end{cases}$$

- If $d_{\text{anchor}} < D_{\text{min}}$, the hiker is stationary within the current GNSS uncertainty envelope: the filter outputs $(\phi_{\text{anchor}}, \lambda_{\text{anchor}})$ (`isStationary: true`), preventing any Blue Dot drift or false breadcrumb distance.
- Once the hiker walks outside $D_{\text{min}}$, the anchor smoothly advances to $(\hat{\phi}_k, \hat{\lambda}_k)$.

---

### 3.3. 3-Point Hairpin Multipath Spike Rejection ([`computeTurnCosine`](file:///d:/thrail_app/src/core/utility/gpsKalmanFilter.ts#L45-L64))

When recording the walked trail in [`hikeStoreCreator.ts`](file:///d:/thrail_app/src/core/models/Hike/stores/hikeStoreCreator.ts#L256-L273), if a reflected signal under heavy canopy causes a sudden sideways spike from $A \to B$ followed by a return $B \to C$ within $< 12\text{ s}$, the cosine of the turn angle at $B$ is:

$$\cos\theta = \frac{\vec{AB} \cdot \vec{BC}}{\|\vec{AB}\| \|\vec{BC}\|}$$

If $\cos\theta < -0.82$ (an acute reversal sharper than $35^\circ$) while accuracy is degraded ($> 8\text{ m}$) or speed is elevated ($> 2.2\text{ m/s}$), the spike is rejected.

---

### 3.4. Shortest-Arc Compass Heading Filter ([`smoothCompassHeading`](file:///d:/thrail_app/src/core/utility/gpsKalmanFilter.ts#L70-L89))

To restore the directional facing indicator without compass jitter or $359^\circ \to 1^\circ$ wrap-around spin:
1. [`TrackHikerGPSFlow.ts`](file:///d:/thrail_app/src/core/flows/TrackHikerGPSFlow.ts#L140-L166) subscribes to `Location.watchHeadingAsync` (preferring `trueHeading` over `magHeading`).
2. `smoothCompassHeading` computes the shortest signed angular delta in $[-180^\circ, +180^\circ]$:
   $$\Delta\psi = ((\psi_{\text{raw}} - \psi_{k-1} + 540^\circ) \bmod 360^\circ) - 180^\circ$$
   $$\psi_k = (\psi_{k-1} + \alpha \cdot \Delta\psi + 360^\circ) \bmod 360^\circ \quad (\alpha = 0.28,\; \text{deadband} = 1.5^\circ)$$
3. [`AnimatedUserLocationMarker`](file:///d:/thrail_app/src/features/Map/TrailMap.native.tsx#L298-L378) rotates the directional beam and chevron pointer by $(\psi_k - \text{mapBearing}) \bmod 360^\circ$ so it always points in the true direction the hiker is facing relative to the map viewport.

---

## 4. Key Files Modified

| File | Responsibility |
| :--- | :--- |
| [`src/core/utility/gpsKalmanFilter.ts`](file:///d:/thrail_app/src/core/utility/gpsKalmanFilter.ts) | 2D Accuracy-Weighted Kalman Filter, Doppler ZUPT Stationary Lock, `computeTurnCosine`, and `smoothCompassHeading`. |
| [`src/core/flows/TrackHikerGPSFlow.ts`](file:///d:/thrail_app/src/core/flows/TrackHikerGPSFlow.ts) | Singleton `watchPositionAsync` (`BestForNavigation`) filtered via `sharedGpsKalmanFilter` + singleton `watchHeadingAsync` exposing `userHeading`. |
| [`src/core/utility/locationTask.ts`](file:///d:/thrail_app/src/core/utility/locationTask.ts) | Background location task integration with `sharedGpsKalmanFilter`. |
| [`src/core/models/Hike/stores/hikeStoreCreator.ts`](file:///d:/thrail_app/src/core/models/Hike/stores/hikeStoreCreator.ts) | Dynamic accuracy + Doppler stationary deadband and 3-point hairpin spike rejection on `walkedRoute`. |
| [`src/features/Map/TrailMap.native.tsx`](file:///d:/thrail_app/src/features/Map/TrailMap.native.tsx) | `AnimatedUserLocationMarker` with 550ms cubic coordinate interpolation and Google Maps-style rotating directional heading cone + pointer. |
