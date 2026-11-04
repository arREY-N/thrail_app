# Live Altitude (MASL) & Cumulative Elevation Gain/Loss HUD Plan ("Best of Both Worlds")

**Document Path:** `plans/live-altitude-and-elevation-hud-plan.md`  
**Version:** 1.0  
**Scope:** Hike Store Telemetry (`hikeStoreCreator.ts`, `hikeStore.native.ts`), Hike Recording Flow (`CreateHikeFlow.ts`), and Live Recording HUD (`HikeRecordingScreen.tsx`, `HikeRecordingScreen.types.ts`, `src/app/(app)/(main)/hike/view.tsx`).

---

## 1. Executive Summary & Problem Statement

When recording or mocking a mountain trail (such as **Mount Batulao**, which starts at **`621 m` MASL**, dips to **`575 m`** over the first `2.6 km`, climbs to **`770 m` MASL** at the peak, and accumulates **`↗ 362 m` gain / `↘ 362 m` loss** over `11.52 km`), hikers and testers expect two distinct elevation metrics:

1. **Current Altitude / MASL (`621 m` → `770 m`):**
   - Shows the hiker's real-time height above sea level (`currentLocation.altitude`).
   - Provides immediate visual feedback at the trailhead (`621 m`), during downhill approaches (`621 m` → `575 m`), and at the summit (`770 m`), matching the elevation curve in GPX Studio and trail MASL markers.
2. **Cumulative Elevation Gain & Loss (`↑ 362 m` / `↓ 362 m`):**
   - Measures the total vertical meters climbed (`totalElevationGain`) and descended (`totalElevationLoss`) using a **3.0m hysteresis deadband** against `elevationBaseline`.
   - Preserves full compatibility with `hike.elevation` and `review.elevation` for post-hike history, profile statistics, and the TARS Recommendation Inspector.

---

## 2. Should We Also Add Elevation Loss (`↓ m`)?

### Recommendation: **Yes — Track in Store & Display Compactly**
- **Why it is valuable:**
  1. **Downhill Trail Starts & Summit Descents:** On trails like Mt. Batulao where the first `2.6 km` is downhill (`621 m` → `575 m`) and the second half of the hike is a long descent from the summit, `totalElevationGain` does not increment while descending. Showing **`↓ 46 m`** alongside **`↑ 0 m`** confirms that vertical telemetry is actively tracking the descent.
  2. **1:1 GPX Studio Parity:** Matches standard outdoor GPS tools (GPX Studio `↗ 362 m  ↘ 362 m`, Garmin, Gaia GPS, AllTrails).
  3. **Zero Extra Sensor Cost:** Our 3.0m hysteresis filter in `hikeStoreCreator.ts` already detects descents (`altDiff <= -3.0`) to lower `elevationBaseline`. Accumulating `totalElevationLoss += Math.abs(altDiff)` (when `altDiff <= -3.0 && altDiff > -35`) requires only 3 lines of logic.
  4. **Zero Breaking Changes to DB / Recommendation Engine:** `hike.elevation` and `review.elevation` continue to receive `totalElevationGain` (`↑ 362 m`) so existing Firestore schemas and TARS recommendation records remain 100% unchanged.

---

## 3. UI Design: "Best of Both Worlds" HUD Layout

In `HikeRecordingScreen.tsx`, the 3-column metrics card (`Distance | Duration | Elevation`) is updated as follows:

```text
┌────────────────────┬────────────────────┬────────────────────────┐
│      5.80 km       │      01:15:20      │         770 m          │
│      DISTANCE      │      DURATION      │       ELEVATION        │
│                    │                    │     ↑ 245m   ↓ 46m     │
└────────────────────┴────────────────────┴────────────────────────┘
```

### Behavior Across Hike Lifecycle States

| Hike State | Main Value (`metricValue`) | Label (`metricLabel`) | Sub-Metrics (`elevationDeltaRow`) |
| :--- | :--- | :--- | :--- |
| **Pre-Hike (`unhiked`, before Start)** | **`621 m`** *(as soon as 3D GPS locks; `--` while searching)* | `ALTITUDE (MASL)` or `ELEVATION` | *Hidden until recording starts* |
| **Started — Trailhead (`0.0 km`)** | **`621 m`** | `ELEVATION` | `↑ 0m  ↓ 0m` |
| **Started — Valley Dip (`2.6 km`)** | **`575 m`** | `ELEVATION` | `↑ 0m  ↓ 46m` |
| **Started — Summit (`5.8 km`)** | **`770 m`** | `ELEVATION` | `↑ 245m  ↓ 50m` |
| **Completed — Finish (`11.52 km`)** | **`621 m`** | `ELEVATION` | `↑ 362m  ↓ 362m` |

> **Alternative Minimal Sub-Label (Gain Only):**  
> If a single-line sub-label is preferred without elevation loss, the bottom line can render `↑ 245 m` (or `ELEVATION • ↑ 245m`).

---

## 4. Step-by-Step Implementation Plan

### Phase 1: Store & Flow Telemetry (`totalElevationLoss`)

#### - [x] Task 1.1: Add `totalElevationLoss` to `HikeState` & Hysteresis Filter
- **Files:**
  - `src/core/models/Hike/stores/hikeStoreCreator.ts`
  - `src/core/models/Hike/stores/hikeStore.native.ts`
- **Changes:**
  1. Add `totalElevationLoss: number;` to `HikeState` (initialized to `0`, reset to `0` in `reset()` and `startHike()`, and persisted in `hikeStore.native.ts` `partialize`).
  2. In Step 5 of `addCoordinate` (`hikeStoreCreator.ts`), update the descent branch of the 3.0m hysteresis deadband:
     ```ts
     const altDiff = currAlt - state.elevationBaseline;
     if (altDiff >= 3.0 && altDiff < 35) {
         state.totalElevationGain += altDiff;
         state.elevationBaseline = currAlt;
     } else if (altDiff >= 35 || altDiff <= -35) {
         // Sensor spike / 3D re-anchor (> 35m jump): reset baseline without adding phantom gain/loss
         state.elevationBaseline = currAlt;
     } else if (altDiff <= -3.0) {
         state.totalElevationLoss += Math.abs(altDiff);
         state.elevationBaseline = currAlt;
     }
     ```

#### - [x] Task 1.2: Expose `totalElevationLoss` in `CreateHikeFlow.ts` & `hike/view.tsx`
- **Files:**
  - `src/core/flows/CreateHikeFlow.ts`
  - `src/app/(app)/(main)/hike/view.tsx`
  - `src/features/Navigation/types/HikeRecordingScreen.types.ts`
- **Changes:**
  1. Reset `totalElevationLoss: 0` alongside `totalElevationGain: 0` in `onResetHike` and unmount cleanup in `CreateHikeFlow.ts`.
  2. Return `totalElevationLoss: useHikeStore(s => s.totalElevationLoss)` from `CreateHikeFlow` and pass it through `HikeView` to `HikeRecordingScreen`.
  3. Add optional `totalElevationLoss?: number;` to `HikeRecordingScreenProps`.

---

### Phase 2: "Best of Both Worlds" HUD in `HikeRecordingScreen.tsx`

#### - [x] Task 2.1: Derive Live Altitude MASL & Gain/Loss Strings
- **File:**
  - `src/features/Navigation/screens/HikeRecordingScreen.tsx`
- **Changes:**
  1. Read `currentLocation?.altitude` (already subscribed via `const currentLocation = useHikeStore((s) => s.currentLocation)`).
  2. Validate live altitude:
     ```ts
     const rawCurrentAlt = currentLocation?.altitude;
     const hasValidCurrentAlt =
         typeof rawCurrentAlt === "number" &&
         !isNaN(rawCurrentAlt) &&
         isFinite(rawCurrentAlt) &&
         rawCurrentAlt !== 0;

     // Show live MASL altitude whenever a valid 3D fix is available (or fallback to --)
     const liveAltitudeMaslStr = hasValidCurrentAlt
         ? `${Math.round(rawCurrentAlt)} m`
         : "--";

     const liveGainStr = `↑ ${Math.round(totalElevationGain || 0)}m`;
     const liveLossStr = `↓ ${Math.round(totalElevationLoss || 0)}m`;
     ```
  3. Render in the right-hand `metricItem` column of `metricsGrid`:
     ```tsx
     <View style={styles.metricItem}>
         <CustomText style={styles.metricValue}>{liveAltitudeMaslStr}</CustomText>
         <CustomText style={styles.metricLabel}>Elevation</CustomText>
         {isTracking && (
             <View style={styles.elevationDeltaRow}>
                 <CustomText style={styles.elevationGainText}>{liveGainStr}</CustomText>
                 <CustomText style={styles.elevationLossText}>{liveLossStr}</CustomText>
             </View>
         )}
     </View>
     ```

---

## 5. Impact on Existing Systems

| System | Impact | Details |
| :--- | :--- | :--- |
| **TARS Recommendation Engine** | **None (100% Preserved)** | Recommendation math uses trail database `geography.masl` and Open-Meteo `calculateTrailGain`. |
| **Post-Hike Summary & Reviews** | **None (100% Preserved)** | `hike.elevation` and `review.elevation` still store `totalElevationGain` (`362 m`). |
| **Local CSV Track Export** | **None (100% Preserved)** | Continues saving raw `[timestamp, lat, lon, altitude]` rows. |
| **Live Group / Rescue Cards** | **Enhanced** | Both the HUD and the Search & Rescue card display matching live MASL altitude (`621 m` → `770 m`). |
