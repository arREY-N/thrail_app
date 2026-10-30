# Architectural Evaluation & Implementation Plan: Web Admin Live Location Monitoring

## Executive Summary

This document presents the architectural evaluation, technical design, and implementation plan for enabling Admins and Coordinators to monitor active hikers' live shared locations (`hikerLocations`) on a desktop/laptop web browser in real time.

### Objectives
1. **Architectural Evaluation:** Compare **Option A** (single screen with `Platform.OS === 'web'` guards) versus **Option B** (dedicated `.web.tsx` screen variant with extracted shared hook) and establish the winning engineering choice.
2. **Real-Time Subscription Verification:** Confirm that Firestore's `hikerLocations` streaming runs reliably on web without requiring device GPS permissions (`permissionGranted`) or active hike sessions (`currentHike.status === "started"`).
3. **Desktop Spectator UI:** Provide a clean, distraction-free spectator experience on web with zero mobile recording HUD/buttons, a floating header showing `🟢 LIVE MONITOR • X Hiker(s) on Trail`, and proper `bottomInset={24}` for the Search & Rescue Card.
4. **Camera Focus Correction:** Eliminate the desktop browser geolocation prompt on mount that flies the map to the coordinator's home. Instead, focus on initial trail coordinates or fit bounds to the trail GeoJSON (`map.fitBounds(...)`), only requesting geolocation if the user explicitly clicks recenter.
5. **Memory Leak & Non-Regression Guarantees:** Ensure complete cleanup of Firestore listeners, timers, animation frames, and DOM elements on unmount while maintaining 100% parity across `TrailMap.native.tsx` and `TrailMap.web.tsx`.

---

## Part 1: Architectural Evaluation

### 1. Analysis of Current `HikeRecordingScreen.tsx`

`src/features/Navigation/screens/HikeRecordingScreen.tsx` is currently **1,271 lines long** and contains heavy mobile-specific couplings:
1. **Mobile Tutorial & Measurement Engine:** `useHikeRecordingTutorial` registers global layout measurements (`measureInWindow`) across 10+ UI elements for mobile step tooltips.
2. **Native Gesture & Long-Press Animations:** `completeAnim` drives a native animated hold-to-complete button, along with modal slide-in/fade transitions.
3. **Mobile Hardware Lifecycles:** Direct ties to mobile GPS background task triggers (`mapRef.current?.startBackgroundTracking()`), local AsyncStorage clear (`clearLocalTrack()`), phone dialer (`tel:911`), SMS intents, and device camera.
4. **Native Dialogs:** Multiple `Alert.alert` calls with multi-action button arrays (`Track`, `Open in Maps`, `Cancel`), which do not translate cleanly to `react-native-web`.
5. **Existing Primitive Guard:** An early return `if (Platform.OS === 'web')` exists on line 443. However, all 15+ React hooks above line 443 (including tutorial measurement hooks and state managers) still execute unconditionally on web, while the returned web JSX on line 443 was an unconfigured stub that omitted `hikerLocations`, `mountainId`, `geoJsonPath`, and live status indicators.

---

### 2. Comparison: Option A vs. Option B

| Evaluation Metric | Option A: Single Screen with Platform Guards | Option B: Dedicated `.web.tsx` Screen + Shared Hook |
| :--- | :--- | :--- |
| **Code Maintainability** | ❌ Clutters an already 1,271-line file with dozens of `{Platform.OS !== 'web' && (...)}` branches, increasing line count to 1,450+. | ✅ Clean separation of concerns. `HikeRecordingScreen.web.tsx` will be ~180 lines of focused, declarative desktop code. |
| **Web Bundle Size & Safety** | ❌ Web bundle includes all mobile tutorial engines, hold-to-complete animation drivers, and mobile modal trees. | ✅ Metro platform resolution serves only `.web.tsx` to web clients. Mobile-only code is tree-shaken from web. |
| **Mobile Regression Risk** | ❌ High. Any refactor to mobile recording buttons risks altering web behavior, and vice versa. | ✅ Zero risk. `HikeRecordingScreen.tsx` remains dedicated to native mobile hike tracking without invasive web conditionals. |
| **React Hooks Compliance** | ⚠️ Risky. If any developer attempts to skip mobile-only hooks inside `if (Platform.OS === 'web')`, it violates React's Rules of Hooks. | ✅ 100% compliant. Both `.tsx` and `.web.tsx` declare their exact hook dependencies unconditionally. |
| **Desktop UX Quality** | ⚠️ Clunky. Desktop map suffers from mobile layout assumptions (such as `dashboardHeight` insets). | ✅ Premium. Fullscreen viewport map, desktop glassmorphism floating header, and slide-out hiker roster panel. |

### Decision: **Option B is the Winning Architecture**
**Option B** is decisively the superior engineering choice:
- **Zero code duplication:** The core data transformation logic (matching hiker IDs to group member names, filtering ghost locations older than 24h, calculating Last Known Location / Signal Lost status) will be extracted into a shared hook: `useEnrichedHikerLocations.ts`.
- **Zero mobile regression:** `HikeRecordingScreen.tsx` retains 100% of its mobile functionality. The dead web return stub is cleanly removed.
- **Native Metro resolution:** Expo/Metro automatically resolves `HikeRecordingScreen.web.tsx` on web and `HikeRecordingScreen.tsx` on iOS/Android. `src/app/(app)/(main)/hike/view.tsx` continues importing `HikeRecordingScreen` without changes.

---

## Part 2: Technical Architecture & Core Requirements

```
                       src/app/(app)/(main)/hike/view.tsx
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼ (Metro on Web)                          ▼ (Metro on Native)
  HikeRecordingScreen.web.tsx                  HikeRecordingScreen.tsx
                 │                                         │
                 ├────────────────────┬────────────────────┤
                 │                    │                    │
                 ▼                    ▼                    ▼
     useEnrichedHikerLocations   TrailMap.web.tsx   TrailMap.native.tsx
                 │                    │                    │
                 ▼                    ▼                    ▼
     useGroupLocation.ts        MapLibre WebGL       MapLibre Native
     (Firestore onSnapshot)   (FitBounds / Rescue) (Compass / GPS Kalman)
```

---

### 1. Real-Time Firestore `hikerLocations` Subscription on Web

#### Audit of Data Flow
1. In `src/app/(app)/(main)/hike/view.tsx`:
   - `useGroupLocation(resolvedGroupId)` subscribes to `groups/{groupId}/liveLocations` via `LocationRepository.listenToLocations(groupId, onUpdate)`.
   - `LocationRepository.listenToLocations` uses Firestore's native Web SDK `onSnapshot(colRef, ...)`.
   - The hook does **not** check device GPS permissions (`permissionGranted`).
   - The hook does **not** check `currentHike.status === "started"`.
   - Updates are saved to `hikeStore.locationByGroup[groupId]` and returned as `location: groupLocations`.
   - `view.tsx` passes `hikerLocations={groupLocations || []}` to `<HikeRecordingScreen />`.
2. **Unmount Cleanup Guarantee:**
   - In `useGroupLocation.ts`: The `useEffect` returns `() => { if (typeof unsub === "function") unsub(); }`.
   - When the Admin leaves the web page or navigates away, the Firestore `onSnapshot` listener is immediately terminated, preventing memory leaks and unnecessary billing read charges.

---

### 2. Clean Web Admin Spectator UI (`HikeRecordingScreen.web.tsx`)

#### Layout & UI Components
1. **Fullscreen Viewport Map:**
   - Mount `<TrailMap />` filling 100% width and height.
   - Pass `bottomInset={24}` so that when an Admin clicks on any hiker pin, the Search & Rescue Card (`liveSelectedHiker`) sits 24px above the bottom edge of the desktop viewport without overlapping navigation bars.
   - Pass `isOffline={false}` and `showControls={true}` (exposing desktop zoom/pitch navigation controls).
2. **Desktop Floating Glass Header:**
   - Positioned at `top: 16, left: 24, right: 24` (with responsive max-width 1200px and centered).
   - **Back Button:** Circular glass pill button navigating back safely (`router.canGoBack() ? router.back() : router.replace(...)`).
   - **Trail Info & Live Monitor Badge:**
     - Primary title: `hike.trail?.name || "Independent Route"`.
     - Live indicator badge: `🟢 LIVE MONITOR • ${hikerLocations.length} Hiker(s) on Trail` styled with emerald glass background (`rgba(16, 185, 129, 0.15)`), green pulsing dot, and white text.
   - **Hiker Roster Toggle Button:** Glass button displaying active hiker count icon (`CustomIcon` "users").
3. **Desktop Hiker Roster Panel (Side Sheet):**
   - Collapsible desktop slide-out drawer or overlay card on the right side of the screen.
   - Lists all group members sorted by status:
     - 🟢 **Live Signal:** Currently transmitting (within 2 minutes).
     - ⚠️ **Last Known Location (Signal Lost):** Inactive > 2 minutes, showing relative time elapsed (`14m ago`).
     - ⚪ **Offline:** No active pings.
   - Clicking a hiker flies the map camera smoothly to their exact coordinates:
     ```ts
     mapRef.current?.flyTo({
       center: [hiker.longitude, hiker.latitude],
       zoom: 17,
       duration: 800
     });
     ```
4. **Complete Omission of Mobile Recording Elements:**
   - No `Distance`, `Duration`, or `Elevation Gain` metric HUD.
   - No `Start Recording`, `Pause`, `Resume`, `Hold to Finish`, or `Discard` buttons.
   - No mobile-only GPS accuracy warnings or offline PMTiles toggle banners.
   - No mobile walkthrough tutorial modals.

---

### 3. Fix Initial Camera Focus in `TrailMap.web.tsx`

#### Root Cause of the Admin PC Geolocation Issue
In `src/features/Map/TrailMap.web.tsx`, lines 806–808:
```ts
useEffect(() => {
  if (mapReady) ensureGeolocation();
}, [mapReady, ensureGeolocation]);
```
- On mount, `ensureGeolocation()` immediately triggers `navigator.geolocation.watchPosition()`.
- On desktop PCs, this prompts the Admin with a browser permission popup (`"thrail.app wants to know your location"`).
- When granted, the watch callback sees `!centeredOnUserRef.current` and calls `map.flyTo({ center: userCoords, zoom: 16 })`, flying the camera to the Admin's house (e.g. Manila or Cebu) instead of the mountain trail (e.g. Mount Pulag).
- Meanwhile, the trail GeoJSON bounds fetch on line 744 computes `trailBoundsRef.current`, but **never** calls `map.fitBounds()`. It only called `fitBounds` if geolocation threw an error!

#### Surgical Fix
1. **Remove Mount Geolocation Effect:** Delete `useEffect(() => { if (mapReady) ensureGeolocation(); }, [mapReady, ensureGeolocation]);`.
2. **On Web Mount Camera Priority:**
   - **Priority 1 (Initial Coordinates):** If `hasInitialCoords` (`initialLon` and `initialLat`) is provided, fly/center the camera to `[parsedLon, parsedLat]`:
     ```ts
     mapRef.current?.flyTo({ center: [parsedLon, parsedLat], zoom: 14, duration: 800 });
     ```
   - **Priority 2 (Trail GeoJSON Bounds):** Once the active or context GeoJSON is downloaded and bounds are computed:
     ```ts
     const bounds = computeBounds(json);
     trailBoundsRef.current = bounds;
     if (bounds && !hasInitialCoordsRef.current && !centeredOnUserRef.current && mapRef.current) {
       mapRef.current.fitBounds(bounds, { padding: 60, duration: 800 });
     }
     ```
   - **Priority 3 (Active Hikers Fallback):** If neither coordinates nor trail GeoJSON exist, but `hikerLocations` are present, compute bounding box of all valid hiker positions and fit bounds.
3. **Explicit Geolocation Only:** Only invoke `ensureGeolocation()` if the Admin explicitly triggers `centerOnUser()` via an imperative ref or a UI recenter action.

---

## Part 3: Shared Extraction & File Structure

### 1. New File: `src/features/Navigation/types/HikeRecordingScreen.types.ts`
Export `HikeRecordingScreenProps` so both `HikeRecordingScreen.tsx` and `HikeRecordingScreen.web.tsx` share identical, strongly-typed props.

### 2. New File: `src/features/Navigation/hooks/useEnrichedHikerLocations.ts`
Extract member matching and Last Known Location status calculation into a shared hook:
```ts
export interface EnrichedHikerLocation extends HikerLocation {
  isLost?: boolean;
  statusRank?: number;
}

export function useEnrichedHikerLocations(
  currentGroup: Group | null,
  hikerLocations: HikerLocation[] | undefined,
  currentTimeMs: number
) {
  // 1. Sorted members with live/signal_lost/offline statuses
  // 2. Enriched hiker locations with full names and 24h ghost TTL filtering
  return { sortedMembers, enrichedHikerLocations };
}
```

### 3. New File: `src/features/Navigation/screens/HikeRecordingScreen.web.tsx`
Dedicated web admin live location monitoring screen implementing Part 2 requirements.

### 4. Refactor: `src/features/Navigation/screens/HikeRecordingScreen.tsx`
- Remove the dead line 443 `if (Platform.OS === 'web')` return block.
- Consume the shared `useEnrichedHikerLocations` hook.
- Preserve 100% of mobile recording, tutorial, and HUD functionality.

### 5. Refactor: `src/features/Map/TrailMap.web.tsx`
- Remove auto-invoked `ensureGeolocation()` on mount.
- Add immediate `map.fitBounds(bounds, { padding: 60, duration: 800 })` upon GeoJSON load when initial coordinates are not provided.
- Align `TrailMapProps`, `TrailMapRef`, and `HikerLocation` interfaces to match `TrailMap.native.tsx` with 100% parity.
- Verify unmount cleanup of `loadRafRef`, `ResizeObserver`, `hikerEntries` RAFs, `setInterval` (10s LKL ticker), `setTimeout` (`noticeTimeoutRef`), and re-initialize `isMountedRef.current = true` on mount.

---

## Part 4: Strict Non-Regression & Memory Leak Guardrails

### 1. Zero Mobile Regression
- Mobile UI, layout, gestures, timer ticking, tutorial flows, and offline PMTiles rendering in `HikeRecordingScreen.tsx` and `TrailMap.native.tsx` remain untouched.
- Interface contract: `TrailMapProps` and `TrailMapRef` remain identical across web and native.

### 2. Memory Leak Audit Matrix
| Component / Hook | Resource | Cleanup Mechanism on Unmount |
| :--- | :--- | :--- |
| `useGroupLocation.ts` | Firestore `onSnapshot` | Returned unsubscribe function `unsub()` called in `useEffect` cleanup. |
| `TrailMap.web.tsx` | MapLibre Map instance | Retained in module-level `sharedMap` for instant re-navigation; container detached from DOM host. |
| `TrailMap.web.tsx` | RAF Animation Handles | `cancelAnimationFrame(loadRafRef.current)` and `cancelAnimationFrame(entry.raf)` for all hiker markers. |
| `TrailMap.web.tsx` | DOM ResizeObserver | `ro.disconnect()`. |
| `TrailMap.web.tsx` | 10s LKL Ticker | `clearInterval(id)` in `useEffect` cleanup. |
| `TrailMap.web.tsx` | Notice Timeout | `clearTimeout(noticeTimeoutRef.current)`. |
| `TrailMap.web.tsx` | Geolocation Watcher | `navigator.geolocation.clearWatch(geoWatchRef.current)`. |
| `TrailMap.web.tsx` | Markers & Event Listeners | `entry.marker.remove()` for all entries; `map.off("load")`, `map.off("dragstart")`. |
| `HikeRecordingScreen.web.tsx` | 5s Clock Ticker | `clearInterval(intervalId)` in `useEffect` cleanup. |

---

## Part 5: Step-by-Step Implementation Plan

### Step 1: Types & Shared Hook Extraction
1. Create `src/features/Navigation/types/HikeRecordingScreen.types.ts` containing `HikeRecordingScreenProps`.
2. Create `src/features/Navigation/hooks/useEnrichedHikerLocations.ts` with member sorting, LKL detection, and 24-hour ghost pin TTL.
3. Update `src/features/Navigation/screens/HikeRecordingScreen.tsx` to use the shared hook and types, removing the legacy line 443 web return stub.

### Step 2: Implement Web Admin Spectator Screen
1. Create `src/features/Navigation/screens/HikeRecordingScreen.web.tsx`:
   - Top floating header: Back button, trail title, emerald badge `🟢 LIVE MONITOR • X Hiker(s) on Trail`.
   - Collapsible desktop Hiker Roster Drawer showing active and LKL hikers with "Focus on Map" triggers.
   - Fullscreen `<TrailMap />` with `bottomInset={24}`, `showControls={true}`, `showRecenter={true}`, and enriched hiker locations.
   - Resolve `mountainId`, `trailFileName`, and `geoJsonPath` from `hike.trail` / `useTrailItem`.

### Step 3: Fix Initial Camera Focus & Interface Parity in `TrailMap.web.tsx`
1. Remove `if (mapReady) ensureGeolocation()` effect.
2. In GeoJSON load callback, call `map.fitBounds(trailBoundsRef.current, { padding: 60, duration: 800 })` when `hasInitialCoords` is false.
3. Update `TrailMapProps` interface (`compassPosition` and `attributionPosition`) to match `TrailMap.native.tsx`.
4. Ensure `isMountedRef.current = true` at the top of the mount effect.

### Step 4: Verification & Linting
1. Run TypeScript check: `npx tsc --noEmit`
2. Run ESLint on all touched files:
   ```bash
   npx eslint src/features/Navigation/screens/HikeRecordingScreen.web.tsx src/features/Navigation/screens/HikeRecordingScreen.tsx src/features/Navigation/hooks/useEnrichedHikerLocations.ts src/features/Map/TrailMap.web.tsx
   ```
3. Verify zero runtime warnings or errors.
