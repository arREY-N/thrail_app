Act as a Senior React Native & MapLibre Mobile Performance Engineer. We have identified 12 memory and resource leaks across our Map and GPS tracking architecture in `thrail_app` (covering both Native and Web platforms). Please fix all 12 issues below cleanly without breaking existing functionality, and verify with ESLint and TypeScript (`npx eslint` & `npx tsc --noEmit`).

> **CORE MANDATE: STRICT BEHAVIORAL PRESERVATION & ZERO FUNCTIONAL ALTERATIONS**  
> All existing user-facing features, APIs, visual designs, and interaction flows must remain **100% identical**.  
> - Do NOT remove or modify existing props, user-visible buttons, overlays, badges, or interactive toggles.
> - Do NOT change GPS tracking behavior, breadcrumb recording, heading compass rotation, or map navigation logic.
> - Only eliminate the root memory leaks, duplicate listeners, dangling timers/RAF callbacks, and unthrottled re-render cycles to make the map snappy and eliminate mobile lag.


### 1. Decouple Background GPS Control Functions from Stateful Hook Subscriptions (`src/core/flows/TrackHikerGPSFlow.ts` & `src/core/flows/CreateHikeFlow.ts`)

- **Problem:** `src/core/flows/CreateHikeFlow.ts` (line 24) calls `const { startBackgroundTracking, stopBackgroundTracking } = TrackHikerGPSFlow();` solely to access those two functions. Because `TrackHikerGPSFlow()` registers React state listeners for `userLocation` (every 1.5s) and `userHeading` (every 80ms), `CreateHikeFlow` (and the entire `HikeView` + `HikeRecordingScreen` tree) re-renders up to 12 times per second unnecessarily.
- **Fix:**
  - Export `startBackgroundLocationTracking` and `stopBackgroundLocationTracking` as standalone module-level functions from `src/core/flows/TrackHikerGPSFlow.ts` (and keep returning them from `TrackHikerGPSFlow()` for backward compatibility).
  - In `src/core/flows/CreateHikeFlow.ts`, import and use the standalone `startBackgroundLocationTracking` and `stopBackgroundLocationTracking` functions instead of invoking the `TrackHikerGPSFlow()` hook.

### 2. Fix Async Unmount Race Condition for Native GPS & Compass Watchers (`src/core/flows/TrackHikerGPSFlow.ts`)

- **Problem:** In `initForegroundGps()`, `Location.watchHeadingAsync` and `Location.watchPositionAsync` are awaited asynchronously. If all map instances unmount (`globalActiveInstances === 0`) while `initForegroundGps()` is still awaiting permissions or sensor initialization, the subscriptions resolve after the cleanup effect has already run and remain leaked forever in the background.
- **Fix:**
  - After `await Location.watchHeadingAsync(...)` and `await Location.watchPositionAsync(...)` resolve inside `initForegroundGps()`, check `if (globalActiveInstances <= 0)`: if no instances are mounted anymore, immediately call `.remove()` on the newly created subscription(s), null out `globalHeadingSub` / `globalLocationSub`, and return early.

### 3. Prevent AsyncStorage Serialization Churn & Non-Serializable State Leaks in Zustand (`src/core/models/Hike/stores/hikeStore.native.ts` & `src/core/flows/TrackHikerGPSFlow.ts`)

- **Problem:**
  1. `src/core/models/Hike/stores/hikeStore.native.ts` persists state to `AsyncStorage`. Ensure transient fields (`currentLocation`, `locationByGroup`, `activeListeners`, `isLoading`, `error`, `gpsError`) are excluded from `partialize`.
  2. In `src/core/flows/TrackHikerGPSFlow.ts`, `useHikeStore.getState().setCurrentLocation(latestCoord)` is called every 1.5s even when `currentLocation` hasn't moved, allocating new object instances and triggering selector churn.
- **Fix:**
  - Verify that `src/core/models/Hike/stores/hikeStore.native.ts` includes only crash-recovery session data (`currentHike`, `active`, `elapsedTime`, `timerStartTime`, `totalDistance`, `totalElevationGain`, `coordinates`, `walkedRoute`, `isSegmentFirstPoint`, `activeGroupId`, `shareLocationEnabled`, `profile`, `events`) in `partialize`.
  - In `src/core/flows/TrackHikerGPSFlow.ts`, only call `useHikeStore.getState().setCurrentLocation(latestCoord)` when `hasCoordChanged` is true (or when no `currentLocation` is set yet).

### 4. Eliminate Duplicate Firestore Group Location Listeners (`src/core/models/Group/hooks/useGroupLocation.ts` & `src/core/models/Hike/stores/hikeStoreCreator.ts`)

- **Problem:** Both `useGroupLocation(groupId)` (lines 17–36) and `startShareLocation(groupId)` in `hikeStoreCreator.ts` (lines 380–392) independently call `HikeRepo.listenToLocations(groupId, ...)`, creating duplicate Firestore `onSnapshot` listeners for the same `groupId`.
- **Fix:**
  - In `src/core/models/Group/hooks/useGroupLocation.ts`, check if `useHikeStore.getState().activeListeners[groupId]` already exists before registering a second listener, or centralize the listener registration in `hikeStoreCreator.ts` so at most one active `listenToLocations` subscription exists per `groupId`, and ensure it is always unsubscribed on cleanup.

### 5. Stop In-Flight `Animated.timing` Animations on Update and Unmount (`src/features/Map/TrailMap.native.tsx` & `src/features/Navigation/screens/HikeRecordingScreen.tsx`)

- **Problem:**
  - In `AnimatedUserLocationMarker` (`src/features/Map/TrailMap.native.tsx`, lines 341–347), `Animated.timing(animValue, ...).start()` is called without storing the animation in a ref and stopping it when a new `lngLat` arrives or when the component unmounts.
  - In `src/features/Navigation/screens/HikeRecordingScreen.tsx` (lines 224–226), `animateProgress` starts `Animated.timing` on `completeAnim` without stopping it on unmount.
- **Fix:**
  - In `AnimatedUserLocationMarker`, store the `Animated.CompositeAnimation` in a `useRef`, stop any previous animation before starting a new one, and stop it in the `useEffect` cleanup function.
  - In `HikeRecordingScreen.tsx`, stop `completeAnim` (`completeAnim.stopAnimation()`) on unmount.

### 6. Cancel Pending `requestAnimationFrame` & `setTimeout` Callbacks on Unmount (`src/features/Map/TrailMap.native.tsx` & `src/features/Navigation/screens/NavigationScreen.tsx`)

- **Problem:**
  - In `src/features/Map/TrailMap.native.tsx` (lines 835 and 853), `handleStyleLoaded` and `toggleOffline` call `requestAnimationFrame(...)` without tracking the frame IDs or cancelling them on unmount.
  - In `src/features/Navigation/screens/NavigationScreen.tsx` (line 106), `setTimeout(() => mapRef.current?.centerOnUser(), 150)` is not cleared on unmount.
- **Fix:**
  - Track the `requestAnimationFrame` IDs in a ref in `TrailMap.native.tsx` and call `cancelAnimationFrame` before scheduling a new one and in an unmount `useEffect` cleanup.
  - Return `() => clearTimeout(timer)` from the `selectedTrail` `useEffect` in `NavigationScreen.tsx`.

### 7. Stabilize `hikerLocations` Prop & Gate LKL Polling Interval in Hike Recording (`src/features/Navigation/screens/HikeRecordingScreen.tsx` & `src/features/Map/TrailMap.native.tsx`)

- **Problem:**
  - In `src/features/Navigation/screens/HikeRecordingScreen.tsx`:
    1. The 5-second `setInterval` updating `currentTime` (lines 214–219) runs even when `!isGuidedHike` and `hikerLocations` is empty, forcing unnecessary re-renders every 5 seconds.
    2. Line 409 passes `hikerLocations={showOtherHikers ? enrichedHikerLocations : []}` and `TrailMap.native.tsx` has default param `hikerLocations = []`, allocating a new array reference on every render when empty.
- **Fix:**
  - Define a module-level `const EMPTY_HIKER_LOCATIONS: HikerLocation[] = [];` in both `HikeRecordingScreen.tsx` and `TrailMap.native.tsx` so empty arrays are referentially stable.
  - Only run the 5-second `currentTime` interval in `HikeRecordingScreen.tsx` when `isGuidedHike` is true or `hikerLocations.length > 0`.

### 8. Gate Web LKL Polling Interval & Stabilize Default Prop (`src/features/Map/TrailMap.web.tsx`)

- **Problem:**
  - In `src/features/Map/TrailMap.web.tsx` (lines 807–814), a 10-second `setInterval` unconditionally triggers `forceTick((n) => n + 1)` every 10 seconds even when `hikerLocations` is empty (e.g., trail overview or preview mode), causing continual background re-renders.
  - Line 361 default parameter `hikerLocations = []` allocates a new array reference on every render, invalidating downstream `useEffect` dependencies.
- **Fix:**
  - Define `const EMPTY_HIKER_LOCATIONS: HikerLocation[] = [];` at the module level in `TrailMap.web.tsx`.
  - Only start the 10-second LKL interval when `hikerLocations && hikerLocations.length > 0`. Clear the timer whenever hiker locations become empty.

### 9. Cancel Web MapLibre GL `idle`, `RAF`, and `setTimeout` Callbacks on Unmount (`src/features/Map/TrailMap.web.tsx`)

- **Problem:**
  - In `TrailMap.web.tsx` (line 496), `map.once("idle", () => setStyleVersion((v) => v + 1))` attaches an unmanaged callback to the shared `sharedMap` singleton. If the component unmounts while style loading is in flight, the callback executes on an unmounted component.
  - Line 453 executes `requestAnimationFrame(onLoad)` without tracking or cancelling the frame ID on unmount.
  - Line 403 executes `setTimeout(() => setNotice(null), 3500)` without tracking or clearing on unmount.
- **Fix:**
  - Maintain an `isMountedRef` in `TrailMap.web.tsx` and guard all asynchronous map callbacks (`idle`, `requestAnimationFrame`, geolocation errors) against firing state updates after unmount.
  - Track `onLoad` RAF ID and `notice` timer in refs and cancel/clear them in the unmount cleanup function.

### 10. Prevent Browser `URL.createObjectURL` Memory Leaks in Offline Trail Manager (`src/features/Map/services/TrailOfflineManager.ts`)

- **Problem:**
  - In `TrailOfflineManager.ts` (lines 250–262), `URL.createObjectURL(blob)` is called for cached trail GeoJSONs and stored in `webBlobCache`. When `forceRefresh` is requested, the old `blobUrl` is overwritten in `webBlobCache` without calling `URL.revokeObjectURL(oldUrl)`.
  - In `buildWebAllMountainsUrl` (lines 396–401), a combined multi-megabyte `FeatureCollection` Blob URL is created. Consecutive invocations leak previous blob URLs into browser memory indefinitely.
- **Fix:**
  - Before caching a new `blobUrl` for an existing key in `webBlobCache`, call `URL.revokeObjectURL(existingUrl)`.
  - In `buildWebAllMountainsUrl`, track the active all-mountains blob URL and revoke it before allocating a new one when `forceRefresh` is true.
  - Export a `clearWebBlobCache()` helper to revoke all active blob URLs on logout or session cleanup.

### 11. Eliminate Duplicate Concurrent `<TrailMap>` Instances in Trail Details (`src/features/Trail/tabs/TrailDetailsTab.tsx`)

- **Problem:**
  - `src/features/Trail/tabs/TrailDetailsTab.tsx` mounts a `<TrailMap>` vector map component in the inline preview card (line 354) AND another `<TrailMap>` vector map inside the interactive route `<Modal>` (line 530).
  - When the user opens the modal, two heavy vector map instances run simultaneously:
    - On Native: Two MapLibre native map controllers compete for GPU memory and disk caches.
    - On Web: Both components attempt to claim the single `sharedContainer` / `sharedMap` DOM singleton, causing container reparenting thrash and marker teardown conflicts.
  - The preview card's offline toggle button calls `mapRef.current?.toggleOffline()`, but `mapRef` is attached only to the modal instance (which is unmounted or inactive when viewing the card).
- **Fix:**
  - Preserve the exact visual and interactive preview card experience, but conditionally unmount the background preview map while the full-screen modal is active (`!isMapPreviewVisible`), ensuring only one vector map engine runs at any time.
  - Bind `isOfflineMode` directly to the preview `<TrailMap isOffline={isOfflineMode} />` prop so toggling online/offline from the preview card works seamlessly without depending on a detached modal ref.

### 12. Consolidate Per-Marker 10s Tickers in Native Hiker Markers (`src/features/Map/TrailMap.native.tsx`)

- **Problem:**
  - In `AnimatedHikerMarker` (`src/features/Map/TrailMap.native.tsx`, lines 174–179), every single rendered hiker marker starts its own independent 10-second `setInterval` to recalculate `Date.now()`.
  - In a group hike with 20 hikers, 20 separate JavaScript interval timers run concurrently, causing 20 separate state updates every 10 seconds.
- **Fix:**
  - Remove the internal `setInterval` from `AnimatedHikerMarker`.
  - Pass a single, centralized `currentTime` timestamp from the parent `TrailMap` component to each marker (or compute LKL state at the parent level), reducing N timers to at most 1.

