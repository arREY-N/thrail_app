# Offline Map Enhancement Report: Protomaps Light v4 Integration & Seamless Trail Stacking

**Project:** Thrail Mobile Application (`thrail_app`)  
**Target Platform:** Android (MapLibre Native / React Native Expo)  
**Date:** October 20, 2026  
**Status:** Completed & Verified  

---

## 1. Executive Summary

The offline map engine was modernized to the official **Protomaps Light (v4 specification)**, replacing a basic vector tile style with a 71-layer cartographic design. Offline sprite sheets (POI icons and road shields) and PBF font glyphs were integrated directly from the device's local storage. In addition, the GeoJSON trail layer stacking was re-architected using `beforeId` to prevent GPS tracks and curated trails from obscuring basemap typography and landmark icons.

### Key Outcomes:
- **100% Offline Protomaps v4 Aesthetics:** Complete road casings, multi-level bridges and tunnels, subtle landcover pastels, and soft gray trail paths.
- **Offline Sprites & Shields:** Local sprite sheets (`light.json`, `light.png`, `@2x` variants) bundled and dynamically served to MapLibre without external network requests.
- **Label & Landmark Visibility:** Mountain summits (*Mt. Batulao*, *Mt. Tawag*), provincial roads (*Tagaytay–Nasugbu Road*, *Diokno Highway*), and local barangays render with crisp text halos and town icons.
- **Seamless Trail Stacking:** Curated trails and recorded GPS paths render **underneath** basemap text labels via `beforeId="roads_labels_minor"`, styled with a subtle contrast casing.
- **Zero Warnings & Lint Compliance:** Eliminated legacy `@maplibre/maplibre-react-native` `style` prop warnings and achieved 0 ESLint errors.

---

## 2. Architecture & Layer Hierarchy

### 2.1 Rendering Stack Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Overlay Markers: User Blue Dot, Group Hikers, Callouts     │ (React Native Views)
├─────────────────────────────────────────────────────────────┤
│  Top Labels & Symbols: Places, Mountain Peaks, POIs, Roads  │ (offlineStyle: symbol)
├─────────────────────────────────────────────────────────────┤
│  ▲ BEFORE_ID INSERTION POINT ("roads_labels_minor")         │
├─────────────────────────────────────────────────────────────┤
│  GeoJSON Walked GPS Path (Orange, line-opacity: 0.9)        │ (TrailMap: layer-walked-path)
│  GeoJSON Curated Trail Line (Green, line-opacity: 0.88)     │ (TrailMap: layer-hiking)
│  GeoJSON Trail Casing (White, width: 6, line-opacity: 0.55) │ (TrailMap: layer-hiking-casing)
├─────────────────────────────────────────────────────────────┤
│  Base Vector Features: Roads, Bridges, Tunnels, Buildings   │ (offlineStyle: line/fill)
│  Waterbodies & Waterways: Lakes, Streams, Oceans            │ (offlineStyle: fill/line)
│  Landcover & Landuse: Forests, Grasslands, Parks            │ (offlineStyle: fill)
│  Background & Earth: #e2dfda                                │ (offlineStyle: fill)
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Changes by File

### 3.1 [`src/assets/sprites/`](file:///d:/thrail_app/src/assets/sprites/)
Bundled official Protomaps Light v4 vector sprite sheets directly into the offline app asset repository:
- `light.json`: Metadata dictionary defining coordinates, dimensions, and pixel ratios for 50+ POI and road shield icons (e.g., `peak`, `townspot`, `train_station`, `generic_shield-1char..5char`, `US:I-*`, `NL:S-road-*`).
- `light.png`: 1x resolution sprite sheet texture.
- `light_2x.json`: High-DPI (2x) sprite metadata dictionary.
- `light_2x.png`: High-DPI (2x) sprite sheet texture (renamed from `light@2x.png` to avoid Metro bundler density resolution collisions).

---

### 3.2 [`src/types/assets.d.ts`](file:///d:/thrail_app/src/types/assets.d.ts)
Created TypeScript declarations for static image and JSON imports to ensure strict type compliance without using `any`:
```typescript
declare module "*.png" {
  const value: number;
  export default value;
}

declare module "*.json" {
  const value: unknown;
  export default value;
}
```

---

### 3.3 [`src/utils/resolveOfflineSprites.ts`](file:///d:/thrail_app/src/utils/resolveOfflineSprites.ts)
Created an asynchronous sprite resolver that unpacks bundled sprite assets to the app's document directory:
- Writes `light.json` and `light@2x.json` to `${FileSystem.documentDirectory}sprites/`.
- Resolves and copies `light.png` and `light@2x.png` to disk using `expo-asset` and `expo-file-system`.
- Supports both development mode (served over HTTP by Metro bundler) and production release builds (`file://` or `asset://`).
- Returns the base URI format expected by MapLibre Native (`file:///.../sprites/light`), which automatically appends `.json`, `.png`, `@2x.json`, and `@2x.png`.
- Implements in-memory caching (`spritesResolvedCache`) to eliminate redundant I/O operations across renders.

---

### 3.4 [`src/features/Map/styles/offlineStyle.ts`](file:///d:/thrail_app/src/features/Map/styles/offlineStyle.ts)
Replaced the basic placeholder style with the complete 71-layer **Protomaps Light (v4 specification)**:

1. **Sprite & Glyph Configuration:**
   - Dynamically resolves `sprite` from `spriteBaseUri` (local `file:///` path) with fallback to CDN.
   - Glyphs resolved from device filesystem using `NotoSansMedium` and `NotoSansRegular`.
2. **Road Hierarchy with Casings & Bridge/Tunnel Depths:**
   - Multi-layer casing (`roads_casing_*`) and fill (`roads_fill_*`) structure for motorways, major roads, medium roads, minor roads, and service roads.
   - Dedicated styling for bridges (`is_bridge: true`) and tunnels (`is_tunnel: true`).
   - Trail paths styled with official Protomaps soft gray (`#ebebeb`) and exponential zoom width curves.
3. **Symbol & Typography Optimizations:**
   - **Provincial Road Labels:** Added `"medium_road"` to `roads_labels_major` filter to properly label Philippine provincial highways (*Tagaytay–Nasugbu Road*, *Diokno Highway*, *Lian–Calatagan Road*).
   - **Minor Road & Trail Labels:** Lowered `roads_labels_minor` `minzoom` from 15 to 12 so rural trails and streets appear at normal hiking exploration zoom levels.
   - **Mountain Peak Placement:** Configured `mountain_peaks` with `"icon-ignore-placement": true` and `"text-ignore-placement": true` to guarantee summits like *Mt. Batulao* are never hidden by MapLibre collision detection.
   - **Town & Locality Icons:** Configured `places_locality` with `"icon-allow-overlap": true` and `"text-optional": true` to display town dot sprites (`townspot`) reliably.
4. **Style Spec Compliance:**
   - Fully validated against `@maplibre/maplibre-gl-style-spec` with **0 errors**.

---

### 3.5 [`src/features/Map/TrailMap.native.tsx`](file:///d:/thrail_app/src/features/Map/TrailMap.native.tsx)

1. **Pipeline Integration:**
   - Imported `resolveOfflineSprites` and integrated sprite extraction into `loadAssets()`.
   - Stored `spriteBaseUri` in component state and passed it into `buildOfflineStyle(offlineTileUrl, fontBaseDir, spriteBaseUri)`.
   - Updated loading gatekeeper to ensure the map only mounts when tiles, fonts, and sprites are fully initialized.
2. **Eliminated Deprecation Warnings:**
   - Converted `<Layer id="layer-hiking">` and `<Layer id="layer-walked-path">` from deprecated `style={mapStyles...}` to modern MapLibre RN `paint` and `layout` props.
   - Cleaned up obsolete `LineLayerStyle` and `mapStyles` objects.
3. **Seamless Trail Layer Stacking (`beforeId`):**
   - Configured `beforeId={actuallyOffline ? "roads_labels_minor" : undefined}` on both `layer-hiking` and `layer-walked-path`.
   - Injected a soft white halo casing layer (`layer-hiking-casing`, width 6, opacity 0.55) underneath the green hiking line (`layer-hiking`, width 4, opacity 0.88).
   - Prevents trails from obscuring road names, trail names, and icons while ensuring the trail pops against both dark green vegetation and pale ground.

---

## 4. Diagnostic & Resolution Log

| Issue / Warning | Root Cause | Solution Applied |
|---|---|---|
| `Unable to resolve module light@2x.png` | Metro bundler interprets `@2x` as an automatic density asset suffix, causing resolution conflict when imported explicitly. | Renamed source assets to `light_2x.png` and `light_2x.json` while extracting them to disk as `light@2x.png`. |
| `The style prop is deprecated. Use paint and layout props instead.` | `@maplibre/maplibre-react-native` deprecated single `style` prop on `<Layer>` in favor of standard MapLibre style spec `paint` and `layout` props. | Refactored `<Layer>` props in `TrailMap.native.tsx` to explicit `paint={{ ... }}` and `layout={{ ... }}` objects. |
| `[Mbgl] Invalid geometry in line layer` | Planetiler tile clipping at tile borders creates zero-length/collapsed line fragments in vector tiles. Non-fatal native engine warning. | Verified vector tile data integrity. Confirmed MapLibre safely drops degenerate segments without rendering interruption. |
| Missing road and trail names | Camera zoom (14) was below minor roads `minzoom` (15); provincial roads were classified as `medium_road` which was missing from the major roads filter. | Lowered minor roads `minzoom` to 12; included `medium_road` in `roads_labels_major` filter. |
| Trail line covering map labels | Vector overlay layers placed at the top of the MapLibre view hierarchy obscure basemap text underneath. | Applied `beforeId="roads_labels_minor"` to inject trail lines below the label layer stack. |

---

## 5. Verification Checklist

- [x] **Offline Independence:** Verified map renders completely without internet connection using local PMTiles, fonts, and sprites.
- [x] **Visual Verification:** Confirmed via Android emulator screencaps that road labels (*Samson Road*, *Abbey Road*), barangay icons, and trail names (*Batulao Toy Trail*) render clearly.
- [x] **Layer Stacking:** Confirmed text labels float on top of the green GeoJSON hiking trail.
- [x] **Linting & Code Quality:** ESLint executed on modified files with **0 errors, 0 warnings**.
- [x] **Spec Validation:** Offline style JSON validated against `@maplibre/maplibre-gl-style-spec` with **0 errors**.
