# Thrail GPS + Map Audit (for agent re-verification)

## How to use this file

Re-check every item below against the real code. For each item, report one of: **CONFIRMED**, **NOT AN ISSUE** (with the reason), or **NEEDS MORE INFO** (say which file or function you need). Do not assume an item is correct just because it is listed here. This audit was written from reading three files only, so anything touching other files is marked **[UNVERIFIED]**.

Files covered:

- `TrailMap.native.tsx` (React Native + `@maplibre/maplibre-react-native` v11-style API, offline PMTiles)
- `TrackHikerGPSFlow.ts` (expo-location hook; foreground watcher, background task control, heartbeat)
- `locationTask.ts` (expo-task-manager background task)

Files **not** seen (check them where noted): `useHikeStore` (`Hike.ts`: `addCoordinate`, `walkedRoute`, `setCurrentLocation`, persistence), `Location.ts` (`newLocation`), `offlineStyle.ts`, `resolveOfflineFonts.ts`, `hikeStorage.ts`, the app root layout / entry file.

---

## 0. Original problem: blue dot drifts while standing still

**Cause (verified in code):**

- Raw GPS noise (about 3-10 m, worse under canopy and in mountains) cannot be removed, only filtered.
- The blue dot is rendered by `<UserLocation>` and `trackUserLocation` in `TrailMap`. Those use MapLibre's **own native location engine**, not `TrackHikerGPSFlow`. Filtering in the flow never reaches the dot.
- `<UserLocation animated />` glides between noisy fixes, so drift looks like slow wandering.
- `Camera trackUserLocation="default"` follows that noisy dot, so the map itself shakes.
- Breadcrumbs: every fix is appended, so standing still draws a zigzag and inflates distance.

**Recommended fix:**

1. One filtered location stream (single source of truth).
2. Remove `<UserLocation>` and `trackUserLocation`. Render the dot from the filtered coordinate (`Marker` or a circle `Layer`). Keep an accuracy circle if wanted.
3. When `isFollowing`, move the camera from the filtered coordinate with a short animation, only when it changes.
4. Use the same filter before `addCoordinate`.

Reference filter (tune the numbers on a real device):

```ts
const MAX_ACCURACY_M = 20;      // reject worse fixes
const STILL_SPEED_MS = 0.6;     // below this = treated as standing

function acceptFix(prev, next) {
  if (next.accuracy == null || next.accuracy <= 0 || next.accuracy > MAX_ACCURACY_M) return false;
  if (!prev) return true;
  const d = haversineMeters(prev.coord, next.coord);
  const gate = Math.max(next.accuracy * 0.5, 5);
  if (d < gate && (next.speed ?? 0) < STILL_SPEED_MS) return false; // inside noise radius, not moving
  return true;
}
// Optional low-pass for display only: smoothed = prev + 0.3 * (new - prev)
```

---

## 1. CRITICAL

### C1. Background tracking stops on unmount
- **File:** `TrackHikerGPSFlow.ts`, cleanup in the mount `useEffect` (about line 297: `stopBackgroundTracking()`).
- **Problem:** Any component using the hook calls `stopBackgroundTracking()` when it unmounts, regardless of whether a hike is active. Leaving the map screen mid-hike stops recording.
- **Fix:** Remove it from the unmount cleanup. Stop the task only from an explicit "end hike" action.
- **Verify:** Start a hike, navigate away from the map, confirm the task keeps running (`Location.hasStartedLocationUpdatesAsync`).

### C2. Duplicate watchers and duplicate breadcrumbs
- **File:** `TrackHikerGPSFlow.ts`, `initForegroundGps` (guard at line 71, assignment at line 118).
- **Problem (a):** The `if (locationSubscription.current) return` guard runs before the first `await`, but the ref is set only after `watchPositionAsync` resolves. Concurrent calls both pass.
- **Problem (b):** Every component calling `TrackHikerGPSFlow()` gets its own ref, state, and watcher, and each calls `addCoordinate`. The `globalActiveInstances` code shows multiple instances are expected.
- **Fix:** Make the watcher a module-level singleton (or move it into the store or a service) with an `initializing` flag. Hook instances only subscribe to state.
- **Verify:** Count how many components call `TrackHikerGPSFlow()`. Log how many `addCoordinate` calls happen per fix.

### C3. No stationary or quality filter on recorded points
- **File:** `TrackHikerGPSFlow.ts`, `watchPositionAsync` options (lines 118-123) and callback (lines 161-181).
- **Problem:** `distanceInterval: 0` plus `timeInterval: 2000` means a point every 2 s, drift included. Zigzag line, inflated distance and elevation.
- **Fix:** Apply `acceptFix` (section 0) before `setUserLocation`, `setCurrentLocation`, and `addCoordinate`. Consider `distanceInterval: 3-5`.

### C4. `mapStyle` object rebuilt on every render
- **File:** `TrailMap.native.tsx`, `activeStyle = actuallyOffline ? buildOfflineStyle(...) : onlineStyle`.
- **Problem:** The component re-renders on every GPS fix (store `walkedRoute` changes), producing a new style object each time. This can cause style reloads, flicker, or lost layers.
- **Fix:** `useMemo(() => buildOfflineStyle(offlineTileUrl, fontBaseDir), [offlineTileUrl, fontBaseDir])`. Memoize the whole `activeStyle`.
- **Verify:** Log renders and watch for style reloads (`onDidFinishLoadingMap` or style events firing repeatedly).

### C5. 15 s timeout includes the first-run 35 MB copy
- **File:** `TrailMap.native.tsx`, `loadAssets` (`Promise.race` with the 15000 ms timer).
- **Problem:** On a slow phone the PMTiles copy can exceed 15 s. The error path then deletes the partial file on retry, so the copy may never complete.
- **Fix:** Longer or no timeout for the copy. Show progress. Do not delete a file that is still being written.

### C6. Background task has no hike-state guard
- **File:** `locationTask.ts`, lines 33-62.
- **Problem:** It calls `addCoordinate` for every location, without checking `active` or `currentHike.status` (the foreground code checks `started` / `paused`). Points can be recorded when no hike is active or when it is paused.
- **Fix:** Read `useHikeStore.getState()` inside the task and apply the same guard as the foreground path.

### C7. Foreground and background both record the same points
- **Files:** `locationTask.ts` and `TrackHikerGPSFlow.ts`.
- **Problem:** When the app is foregrounded, the foreground watcher and the background task are both running and both call `addCoordinate`. Duplicates, and the status `APP_BACKGROUNDED` is stamped on points taken in the foreground.
- **Fix options:** (a) dedupe by timestamp (and a small distance) inside `addCoordinate`; (b) pause the foreground watcher while the background task runs, or the reverse. Choose one owner per app state.
- **Verify [UNVERIFIED]:** Whether `addCoordinate` already dedupes.

### C8. Background task has no accuracy filter
- **File:** `locationTask.ts`. The payload type does not even include `accuracy`.
- **Problem:** Foreground rejects accuracy > 25 m, and the background accepts everything. Bad fixes enter the track.
- **Fix:** Add `accuracy?: number | null` to the type and apply the shared filter.

---

## 2. SERIOUS

### S1. Fake altitude of 0
- **Files:** `TrackHikerGPSFlow.ts` line 127; `locationTask.ts` line 38 (`altitude ?? 0`).
- **Problem:** Missing altitude is stored as 0 m. On a mountain this corrupts elevation data and stats.
- **Fix:** Store `null` and let `newLocation` and consumers handle it. **[UNVERIFIED]:** whether `newLocation` accepts null altitude.

### S2. Accuracy check has gaps
- **File:** `TrackHikerGPSFlow.ts` line 161: `if (accuracy && accuracy > 25) return;`
- **Problem:** `accuracy` of 0 or null passes the check. 25 m is loose for trail recording.
- **Fix:** Reject null, 0, and values over about 15-20 m for breadcrumbs.

### S3. Heartbeat resets on fixes that are later rejected
- **File:** `TrackHikerGPSFlow.ts` lines 145-159 run before the accuracy check at line 161.
- **Problem:** A stream of junk fixes keeps the "GPS alive" timer happy, so "GPS lost" never fires even though no usable fix exists.
- **Fix:** Reset the timer only for accepted fixes (or track "last good fix" separately).

### S4. Heartbeat does not exist in background
- **Files:** `locationTask.ts` / `TrackHikerGPSFlow.ts`.
- **Problem:** GPS-lost detection is a JS `setTimeout` in the hook, which is unreliable once the app is backgrounded. The background task never updates it.
- **Fix:** Compute "signal lost" from the last accepted fix timestamp (store it) rather than from a live timer. Evaluate on resume and in the UI ticker.

### S5. Background task does not update `currentLocation` (SOS)
- **Problem:** The foreground path calls `setCurrentLocation(latestCoord)` for Emergency SOS/SMS. The background task never does, so SOS can use a stale location.
- **Fix:** Call `setCurrentLocation` in the task for the latest accepted fix.

### S6. Task definition might not be loaded in a headless launch
- **File:** `locationTask.ts`; `defineTask` runs at module load.
- **Problem:** It is only imported indirectly (through `TrackHikerGPSFlow` for the `LOCATION_TASK` constant). If the OS wakes the app headless, the task must be defined at the global scope of the entry bundle.
- **Fix:** Import `locationTask` explicitly in the app entry / root layout. **[UNVERIFIED]:** check the entry file.

### S7. Store hydration in a headless task
- **Problem:** If the OS kills and restarts the app process for a background update, `useHikeStore.getState()` may be a fresh empty state (`active=false`, no `currentHike`). With fix C6 the points would then be dropped.
- **Fix:** Ensure the store persists and rehydrates before the task reads it. **[UNVERIFIED]:** persistence setup in `Hike.ts`.

### S8. Batch ordering and dedupe in the background task
- **File:** `locationTask.ts`, loop at line 35.
- **Problem:** Batched locations can arrive late or out of order. The loop appends sequentially with `await` and no sort or dedupe.
- **Fix:** Sort by timestamp, skip entries older than the last stored point, then append.

### S9. Stale offline tiles after app update
- **File:** `TrailMap.native.tsx`, `isPmtilesValid`, `MIN_PMTILES_SIZE_BYTES`, `resolveOfflineMap`.
- **Problem:** Validation is size plus magic header only, and the minimum size is hardcoded. A new bundled PMTiles file never replaces an older cached one that passes the check.
- **Fix:** Store a version or hash alongside the cached file and recopy when it differs. Also note the file is stored twice (bundle plus documentDirectory, about 70 MB).

### S10. Toggling offline remounts the whole map
- **File:** `TrailMap.native.tsx`, `loadAssets` effect and early returns.
- **Problem:** Changing `actuallyOffline` sets `loadState` back to "loading" and returns `<LoadingScreen/>`, destroying `<Map>`. `mapReady` is never reset to `false`, so the `hasInitialCoords` camera effect does not re-run on remount. Camera position is lost.
- **Fix:** Reset `mapReady` when the map unmounts, or keep the map mounted and swap style only.

### S11. Rescue card shows stale data
- **File:** `TrailMap.native.tsx`, `selectedHiker` state and `isSelectedLkl`.
- **Problem:** `selectedHiker` is a snapshot object. Coordinates, time, and LKL status do not update when the hiker moves. `isSelectedLkl` uses `Date.now()` at render with no ticker.
- **Fix:** Store `selectedId`, derive the hiker from `hikerLocations`, and add a periodic tick. Close the card if the hiker disappears.

### S12. Hiker marker animation can jump
- **File:** `AnimatedHikerMarker` in `TrailMap.native.tsx`.
- **Problem:** `prevCoordsRef` updates only when an animation completes. If a new update interrupts one, the new animation starts from the old target, not the current interpolated position. Also, `animation.start(cb)` fires its callback on `stop()` with `finished: false` and the callback ignores that flag, snapping to the old target.
- **Fix:** Track the current interpolated coordinate in a ref, start from it, and check `finished` in the callback.

### S13. Pause may not create a gap in the route
- **File:** `TrackHikerGPSFlow.ts` lines 178-181 call `addCoordinate` for `started` and `paused`.
- **Problem:** If the store appends paused points to `walkedRoute`, the MultiLineString gap logic in `TrailMap` will not show a gap.
- **Verify [UNVERIFIED]:** How `addCoordinate` handles `paused` (live-stream only vs. route append).

---

## 3. MODERATE

- **M1. Performance:** `TrailMap` subscribes to the full `walkedRoute`. The whole route is re-sent to MapLibre and the component re-renders every fix. Consider throttling, appending incrementally, or keeping the route in a ref and updating the source imperatively.
- **M2. Marker re-render cost:** `AnimatedHikerMarker` calls `setCoords` on every animation frame (about 70 renders per update per hiker) and re-renders a React child view inside `<Marker>`. Prefer a native-driven GeoJSON circle or symbol layer, or throttle the animation.
- **M3. Double press handlers:** `<Marker onPress>` and inner `<TouchableOpacity onPress>` both fire or compete. Keep one. The `key` prop inside the memoized component is useless.
- **M4. Camera follow conflicts:** `centerOnUser` calls `flyCamera` and also enables `trackUserLocation`. Resolved by section 0 (own follow logic).
- **M5. LKL threshold mismatch:** the UI uses 2 minutes and the flow uses 180 s. Remote updates may be throttled, so a false "Signal Lost" is possible. Align the thresholds.
- **M6. `isInternetReachable` null:** `!!state.isInternetReachable` treats `null` (unknown, at startup) as offline. Handle `null` separately.
- **M7. Notification permission ignored:** `POST_NOTIFICATIONS` result (line 205) is not checked. The foreground service notification may silently fail on Android 13+.
- **M8. Stale `globalIsBackgroundTrackingRunning`:** module-level flag can disagree with reality. Use `Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)`.
- **M9. Rescue share needs internet:** the Google Maps link is useless offline. Keep raw coordinates first (already done), consider adding a `geo:` link.
- **M10. Max zoom vs. tile data:** `Camera maxZoom={20}` and `centerOnUser` zoom 18 may exceed the PMTiles max zoom (blurry overzoom). **[UNVERIFIED]:** check the tileset's max zoom.
- **M11. Async ordering in background loop:** `await addCoordinate` per point; if it writes CSV each time, this is sequential I/O. **[UNVERIFIED]:** check `addCoordinate`.

---

## 4. CLEANUP

- AppState listener in `TrackHikerGPSFlow.ts` only logs; `globalLastAppState` is unused. Delete it or use it to re-sync the watcher on resume.
- `lastZoomRef` and `lastCenterRef` in `TrailMap` are written but never read; the `[0, 0]` fallback writes junk.
- `useImperativeHandle` has no dependency array.
- Comment "< ~0.1m" in `AnimatedHikerMarker` is wrong: `distSq < 1e-9` is about 3.5 m.
- Comment says "red line" but the line is orange (`#FF5722`). Stray `x` at the start of line 67 in `TrackHikerGPSFlow.ts`. Stale comment about `loadWalkedPathCoords` at line 12.
- The ISO-string round trip (`new Date(new Date(ts).toISOString())`) in both the flow and the task is pointless; use `new Date(ts)`.
- Coordinate validation exists in three places (`isValidCoordinate` in `TrailMap`, the task's inline check, and none in the flow). Move to one shared util used everywhere, including the (0,0) Null Island rejection.
- `validSegments` has a legacy flat-array branch; type the store as `[number, number][][]` and delete it.

---

## 5. Suggested fix order

1. C1, C2, C7 (recording correctness: no stopping, no duplicates)
2. C3, C8, S2, shared filter + dot rendering from section 0 (drift)
3. C6, S5, S6, S7, S8 (background task correctness)
4. C4, C5, S9, S10 (map stability and offline assets)
5. S1, S3, S4, S11, S12, S13
6. Moderate and cleanup items

## 6. Verification checklist (real device, outdoors)

- Stand still 5 min: dot stable, no breadcrumb zigzag, distance does not grow.
- Walk, pause, resume: gap appears in the line.
- Lock the screen for 10+ min while walking: no gaps, no duplicate points, SOS location is current.
- Leave the map screen mid-hike and return: recording continues.
- Toggle offline/online: map keeps camera position.
- Kill and relaunch the app mid-hike: background points are still recorded.
