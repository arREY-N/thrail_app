# Weather, Location & Map Memory Leak Remediation & Optimization Plan

**Document Path:** `plans/weather-location-map-optimization-plan.md`  
**Version:** 1.0  
**Author:** Senior Mobile Architect & QA Lead  
**Scope:** Weather System (`weatherStore`, `weatherRepository`, `WeatherScreen`, `WeatherWidget`), Location System (`src/hooks/useLocation.ts`, `locationStoreCreator.ts`), and Map/GPS System (`TrackHikerGPSFlow.ts`, `TrailMap.native.tsx`, `TrailMap.web.tsx`, `NavigationScreen.tsx`, `HikeRecordingScreen.tsx`).

---

## 1. Executive Summary & Core Mandate

> **STRICT BEHAVIORAL PRESERVATION & ZERO FUNCTIONAL ALTERATIONS**  
> All existing user-facing features, UI components, warning thresholds (Sunny, Heat Index, UV, Wind, Visibility, Rain), offline map capabilities, Kalman-filtered GPS tracking, and group hiker LKL pins must remain **100% identical**.  
> These tasks strictly eliminate memory leaks, dangling timers/listeners, unmount race conditions, and redundant network/hardware requests.

---

## 2. Implementation Tasks

### Phase 1: Weather System Memory & Cache Optimizations

#### - [x] Task 1.1: Bound In-Memory Weather Store & Badge Caches (LRU Eviction)
- **Status:** ✅ Completed
- **Files:**
  - `src/core/stores/weatherStore.ts`
  - `src/core/repositories/weatherRepository.ts`
- **Problem:**
  - `useWeatherStore.data` (`Record<string, ProcessedWeatherData>`) and `badgeMemoryCache` (`Map`) accumulate entries indefinitely as a user browses mountains across a session without evicting oldest entries.
- **Solution:**
  - Enforced a maximum of `MAX_WEATHER_CACHE_ENTRIES = 25` in `useWeatherStore` (`data`) and `MAX_BADGE_CACHE_ENTRIES = 50` in `badgeMemoryCache` using LRU eviction when inserting new keys.

#### - [x] Task 1.2: Clean Up `onRefresh` Unmount Safety in `WeatherScreen.tsx`
- **Status:** ✅ Completed
- **Files:**
  - `src/features/Home/screens/WeatherScreen.tsx`
  - `src/components/WeatherWidget.tsx`
- **Problem:**
  - `onRefresh` in `WeatherScreen.tsx` called `setRefreshing(false)` after awaiting async location + weather refetch without checking if the screen remained mounted.
- **Solution:**
  - Added `isMountedRef` lifecycle tracking and `try / finally` guard in `WeatherScreen.tsx` (`onRefresh`), passing `refreshLocation(true)` on manual pull-to-refresh.

#### - [x] Task 1.3: Add Web Refresh Button Across Weather Surfaces
- **Status:** ✅ Completed
- **Files:**
  - `src/features/Home/screens/HomeScreen.tsx`
  - `src/features/Home/components/WeatherSection.tsx`
  - `src/features/Home/screens/WeatherScreen.tsx`
  - `src/components/WeatherWidget.tsx`
- **Problem:**
  - React Native Web does not support touch pull-to-refresh (`<RefreshControl>`), and browser reload (`F5`) reads from the 60-minute `AsyncStorage` cache rather than forcing a live API fetch.
- **Solution:**
  - Added a clickable `refresh-cw` icon button next to the `"Updated ..."` timestamp on Web across the Home Weather Banner (`WeatherSection.tsx`), Local Weather Screen (`WeatherScreen.tsx`), and Per-Mountain Weather Tab (`WeatherWidget.tsx`) to trigger `refreshLocation(true)` + `refetch()`.

---

### Phase 2: Location System (`src/hooks/useLocation.ts` & `locationStoreCreator.ts`)

#### - [x] Task 2.1: Fix Browser Permission Listener Leak & Uncleared `Promise.race` Timeout in `useLocation.ts`
- **Status:** ✅ Completed
- **Files:**
  - `src/hooks/useLocation.ts`
- **Problem:**
  - `navigator.permissions.query({ name: 'geolocation' })` assigned `status.onchange` on the browser's singleton `PermissionStatus` object without removing it (`status.onchange = null`) on component unmount.
  - The 3.5-second `setTimeout` inside `Promise.race([positionPromise, timeoutPromise])` was never cleared with `clearTimeout` when `positionPromise` resolved early.
- **Solution:**
  - Tracked the resolved `PermissionStatus` instance in the effect scope and reset `activeStatus.onchange = null` in the `useEffect` cleanup.
  - Stored `timeoutId` in `Promise.race` and cleared it in a `finally` block as soon as the race settled.

#### - [x] Task 2.2: Add In-Memory Session Cache & Cross-System GPS Reuse (`useHikeStore` ↔ `useLocation.ts`)
- **Status:** ✅ Completed
- **Files:**
  - `src/hooks/useLocation.ts`
- **Problem:**
  - Navigating from `HomeScreen` to `WeatherScreen` mounted a second `useLocation()` instance that re-ran hardware GPS + reverse geocoding from scratch.
  - Furthermore, if the user already had a fresh live GPS fix in `useHikeStore.getState().currentLocation` (from `TrackHikerGPSFlow`), `useLocation()` ignored it and queried hardware GPS again.
- **Solution:**
  - Added a module-level `memoryLocationCache` (5-minute TTL) in `src/hooks/useLocation.ts` so `HomeScreen` ↔ `WeatherScreen` transitions resolve in `0ms` without duplicate GPS/geocoding calls (while still allowing manual `refreshLocation(true)`).
  - Reuses `useHikeStore.getState().currentLocation` if recorded within the last 5 minutes before falling back to `Location.getCurrentPositionAsync()`.

#### - [x] Task 2.3: Clean Group Location State on `unsubscribeFromGroupLocations` in `locationStoreCreator.ts`
- **Status:** ✅ Completed
- **Files:**
  - `src/core/models/Location/stores/locationStoreCreator.ts`
- **Problem:**
  - `unsubscribeFromGroupLocations(groupId)` removed the Firestore listener but left stale `state.groupLocations[groupId]` arrays in memory after unsubscribing.
- **Solution:**
  - Deleted `state.groupLocations[groupId]` when `unsubscribeFromGroupLocations(groupId)` is invoked.

---

### Phase 3: Map & GPS System (`TrackHikerGPSFlow`, `TrailMap`, `NavigationScreen`, `HikeRecordingScreen`)

#### - [x] Task 3.1: Fix Async Unmount Race Condition in `TrackHikerGPSFlow.ts`
- **Status:** ✅ Completed
- **Files:**
  - `src/core/flows/TrackHikerGPSFlow.ts`
- **Problem:**
  - In `initForegroundGps()`, `await Location.hasServicesEnabledAsync()` and `await Location.requestForegroundPermissionsAsync()` did not check `if (globalActiveInstances <= 0)` after resolving, allowing `Alert.alert("GPS Disabled")` to fire even after the user had navigated away from the map.
- **Solution:**
  - Guarded `initForegroundGps()` after `hasServicesEnabledAsync()`, `enableNetworkProviderAsync()`, and `requestForegroundPermissionsAsync()` with `if (globalActiveInstances <= 0) { return; }` (with `globalInitPromise = null` cleaned up in `finally`).

#### - [x] Task 3.2: Stabilize 10-Second LKL Ticker Dependency in `TrailMap.native.tsx` & `TrailMap.web.tsx`
- **Status:** ✅ Completed
- **Files:**
  - `src/features/Map/TrailMap.native.tsx`
  - `src/features/Map/TrailMap.web.tsx`
- **Problem:**
  - `TrailMap.native.tsx` depended on `[hikerLocations]` array reference instead of `[hasHikers]`, resetting the 10s interval on every 3s Firestore ping, while `TrailMap.web.tsx` kept its 10s interval ticking even when `hasHikers` was false.
- **Solution:**
  - Gated the 10-second LKL interval on `[hasHikers]` (`Boolean(hikerLocations && hikerLocations.length > 0)`) in both `TrailMap.native.tsx` and `TrailMap.web.tsx`.

#### - [x] Task 3.3: Clean Up Style-Swap `idle` Listener & Abort Stale GeoJSON `fetch` in `TrailMap.web.tsx`
- **Status:** ✅ Completed
- **Files:**
  - `src/features/Map/TrailMap.web.tsx`
- **Problem:**
  - In `TrailMap.web.tsx` (lines 536–555), `map.once("idle", handleIdleStyle)` had no cleanup return (`return () => { map.off("idle", handleIdleStyle); }`).
  - In `TrailMap.web.tsx` (lines 763–781), `fetch(fitTarget)` had no `AbortController`, so switching trails rapidly or unmounting mid-fetch could trigger stale `map.fitBounds()` calls.
- **Solution:**
  - Returned `() => { map.off("idle", handleIdleStyle); }` from the style-swap `useEffect`.
  - Attached an `AbortController` to `fetch(fitTarget)` and aborted it in the `useEffect` cleanup.

#### - [x] Task 3.4: Clear `toastTimeoutRef` & `copiedCoords` Timers on Unmount in `NavigationScreen.tsx` & `HikeRecordingScreen.tsx`
- **Status:** ✅ Completed
- **Files:**
  - `src/features/Navigation/screens/NavigationScreen.tsx`
  - `src/features/Navigation/screens/HikeRecordingScreen.tsx`
- **Problem:**
  - `toastTimeoutRef.current` in both `NavigationScreen.tsx` and `HikeRecordingScreen.tsx` was never cleared when the component unmounted.
  - `setTimeout(() => setCopiedCoords(false), 3000)` in `HikeRecordingScreen.tsx` was untracked and not cleared on unmount.
- **Solution:**
  - Added unmount cleanup effects for `toastTimeoutRef` in `NavigationScreen.tsx` and `HikeRecordingScreen.tsx`, and tracked/cleaned up `copiedCoordsTimeoutRef` in `HikeRecordingScreen.tsx`.
