# Agent Task: Audit & Robustness Review — Thrail Map System

## Context (give this to the agent verbatim)

Thrail is a React Native / Expo hiking app covering 36 mountains in CALABARZON, Philippines. The map stack:

- **Renderer:** MapLibre GL (`@maplibre/maplibre-react-native`)
- **Tiles:** PMTiles — a single ~50MB archive bundled into the app, cropped to the relevant PH region, copied to local storage on first launch, read via `pmtiles://<local-path>`. This is the **primary, user-facing mode**. It must work fully offline, with zero network dependency, every time.
- **Online mode exists ONLY as an internal test harness** — to verify the offline pipeline actually reflects reality (i.e. "does this look the same as if we were fetching live tiles"). It is not a shipped feature and should not be treated as one. It uses **MapTiler** (free tier) as the tile source, chosen because the project deliberately prioritizes free/no-cost tooling throughout — this constraint should inform any proposed fix (no paid services, no infra that costs money at scale).
- **Trail paths:** GeoJSON bundled as a static asset, generated ahead of time via an `osmnx`/`overpy` pipeline (not fetched at runtime).
- **Live hiker locations:** Firestore `onSnapshot`-driven positions of other hikers in the same group/session, rendered as `<Marker>` components on top of the offline map, tied to the app's booking feature.

The relevant component is `TrailMap.native.tsx` (attach it below / point the agent at its path).

## Objective

Do **not** propose an architecture rewrite. The task is to find and fix bugs, and harden what exists, within the current bundled-offline-PMTiles design. Flag anything that *would* require an architecture change separately, as out-of-scope, rather than folding it into the fix list.

---

## Part 1 — Structural analysis

Read through the map component(s) and answer explicitly:

1. **Load sequencing.** Trace every `Promise`/`async` call involved in getting the map to `"ready"`. For each one, determine: does it run unconditionally, or only when actually needed for the current mode (offline vs. the MapTiler test mode)? Flag any work being done for a mode that isn't active.
2. **State machine.** Enumerate every distinct state the map component can be in (loading, ready, error, offline-active, online-test-active, GPS-permission-pending, etc.) and check: is every state reachable, and does every state have a defined UI? Look for states that can silently hang (e.g. a promise that never resolves or rejects) or race (two state updates from unrelated effects landing out of order).
3. **File integrity checks.** The current check for the PMTiles file is size-only (`fileInfo.size > MIN_PMTILES_SIZE_BYTES`). Assess whether this is sufficient, and if not, propose a stronger-but-still-cheap check (e.g. reading the PMTiles header/magic bytes, which is fast and doesn't require parsing the whole file).
4. **Asset resolution fallback chain.** There's a primary path (`Asset.downloadAsync` → `localUri` → `copyAsync`) and a manual fallback (`FileSystem.downloadAsync(asset.uri, ...)` with retries). Determine whether `asset.uri` for a `require()`'d bundled asset is actually a resolvable target for `downloadAsync` in a **production build** on both Android and iOS — don't assume, check MapLibre/Expo asset resolution behavior for release builds specifically, since this differs from dev/Expo Go behavior.
5. **Live marker rendering.** Check whether Firestore position updates cause markers to jump/snap vs. animate smoothly. Identify where interpolation could be added (e.g. animating between last-known and new coordinate over the update interval, rather than re-rendering at the raw new position).
6. **Booking coupling.** Identify where `hikerLocations` is populated upstream of this component, and trace how it relates to booking state (session start/end, cancellation, hiker leaving mid-session). Check for: hikers who remain visible after a booking ends/cancels, or hikers missing from the map despite a valid active booking.
7. **Coordinate validation.** Review falsy-checks like `if (!hiker.latitude || !hiker.longitude)` — these incorrectly treat `0` as invalid. Flag any other loose truthiness checks on numeric geo values.
8. **Camera/follow logic.** Review the "follow user" vs "user panned manually" logic (`isFollowing`, `handleRegionWillChange`) for any conditions where follow state gets stuck on or stuck off incorrectly.

For each finding, output: **what's wrong → why it matters → concrete fix**, ordered by user-facing impact (a demo-visible glitch outranks an internal inefficiency).

---

## Part 2 — Edge cases & robustness testing

Design and (where feasible) execute test cases for:

**Storage / filesystem**
- Device storage full during first-launch PMTiles copy
- App killed mid-copy (leaves a partial file at the target path) — does the size-check correctly detect and clean this up on next launch?
- PMTiles file manually deleted by the user via device storage settings while app is installed
- Corrupted file that happens to pass the size check (truncate-and-pad a valid file to test this)

**Permissions & GPS**
- Location permission denied entirely
- Location permission granted but GPS radio off / no fix acquired for an extended period
- Permission revoked mid-session (user backgrounds app, revokes in Settings, returns)

**Connectivity (for the live-hiker/booking feature specifically)**
- Firestore listener active, then connection drops — does it recover on reconnect without duplicate/stale markers?
- Two hikers' devices with significant clock/GPS drift — does the map show implausible jumps?
- Booking cancelled server-side while the hiker is still actively sharing location — confirm the marker is removed, not orphaned

**Device/platform variance**
- Low-end Android device (repeat the class of bug already found on the Samsung A35 — missing `downloadAsync`, `assetBundlePatterns` misconfig) on at least one additional low-RAM device profile
- Cold start with no cached PMTiles copy at all (fresh install) vs. warm start with valid cache
- iOS-specific asset resolution differences from Android (if iOS is in scope)

**Online test-mode (MapTiler)**
- Confirm this mode never triggers the offline-copy logic (see Part 1, finding 1) — it should be a lightweight, independent path
- Confirm MapTiler free-tier rate limits aren't silently hit during testing in a way that masks real offline bugs

For each test case, specify: **setup steps → expected behavior → how to detect failure** (log line, crash, visual glitch, etc.), so these can be turned into a repeatable manual or automated checklist.

---

## Constraints for any proposed solution

- No paid services or infrastructure — this project runs entirely on free tiers (Firebase free tier, MapTiler free tier, Expo free tier, OSM/OpenFreeMap data).
- No architecture changes (e.g. do not propose moving to downloadable per-region packs, remote-hosted PMTiles, or a tile server) — that has been deliberately deferred as future work given the project deadline.
- Fixes should be scoped to be completable individually — prefer several small, verifiable patches over one large refactor.

---

## Output format requested from the agent

1. Numbered findings table (Part 1): `# | Component/File | Issue | Impact | Fix`
2. Edge case checklist (Part 2) in the setup/expected/failure-signal format above
3. A short prioritized action list at the end — top 5 items to fix first, given a near-term (Oct–Nov) deadline and limited remaining time
