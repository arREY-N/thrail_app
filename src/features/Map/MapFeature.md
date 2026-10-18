# Map Feature Module (`src/features/Map/`)

> **Architectural Pattern:** Canonical Thrail Feature-Module Architecture (Frontend-Scoped)  
> **Facade Entrypoint:** `@/src/features/Map/Map`  
> **Scope:** Static 4:3 Trail Maps, Interactive Waypoint Pin Editing, MapLibre Vector Tiles, and Offline Styles  

---

## 1. Directory Structure

```text
src/features/Map/
├── Map.ts                            <- Public Facade (single import entrypoint)
├── MapFeature.md                     <- Feature documentation
├── interfaces/
│   └── Map.types.ts                  <- Core type definitions & waypoint contracts
├── styles/
│   ├── offlineStyle.ts               <- MapLibre offline style specs
│   └── onlineStyle.ts                <- MapLibre online style specs
├── utils/
│   ├── pinConfig.ts                  <- Pin color swatches, icon options, getPinConfig resolver
│   └── trailMapAssets.ts             <- 4:3 static map asset resolution
├── hooks/
│   └── useTrailMapEditor.ts          <- Encapsulated data flow, point synchronization, and save handling
├── modals/
│   ├── EditPointModal.tsx            <- Add/Edit waypoint pin dialog (migrated from SuperAdmin)
│   └── PointDetailsModal.tsx         <- Waypoint inspection sheet (migrated from SuperAdmin)
├── components/
│   ├── StaticTrailMap.tsx            <- 4:3 static map canvas container
│   ├── WaypointPinMarker.tsx         <- Memoized percentage-positioned waypoint pin marker
│   └── MapZoomControls.tsx           <- Floating center-right zoom (+, -, reset) and pin toggle panel
├── TrailMap.native.tsx               <- Native vector map (platform-split)
└── TrailMap.tsx                      <- Web/fallback vector map (platform-split)
```

---

## 2. Public API Contracts (via `Map.ts`)

External features, screens, and controllers MUST import all map utilities, types, components, modals, and hooks exclusively through `@/src/features/Map/Map`:

```typescript
import {
    StaticTrailMap,
    TrailMapEditorScreen,
    useTrailMapEditor,
    IWaypointPoint,
    PinType,
    getPinConfig,
} from '@/src/features/Map/Map';
```

---

## 3. Core Hook: `useTrailMapEditor`

Encapsulates data hydration, working draft synchronization, dirty checking, validation, and persistence:

```typescript
export interface UseTrailMapEditorParams {
    trailId: string | null | undefined;
}

export interface TrailMapEditorHookResult {
    activeTrail: Trail | null;
    isLoading: boolean;
    isSaving: boolean;
    isDirty: boolean;
    setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
    hasAttemptedSave: boolean;
    setHasAttemptedSave: React.Dispatch<React.SetStateAction<boolean>>;
    offlinePoints: (IOfflinePoint | IWaypointPoint)[];
    onPointsChange: (points: (IOfflinePoint | IWaypointPoint)[]) => void;
    onSave: (showToast?: (message: string, type?: 'success' | 'warning' | 'info' | 'error') => void) => Promise<boolean>;
    resetDirty: () => void;
}
```

### Usage in Route Controllers

```tsx
export default function MapEditorController(): React.JSX.Element {
    const { trailId: rawTrailId } = useLocalSearchParams();
    const trailId = Array.isArray(rawTrailId) ? rawTrailId[0] : rawTrailId;
    const { onBackPress } = useAppNavigation();

    const editor = useTrailMapEditor({ trailId });

    return (
        <TrailMapEditorScreen
            {...editor}
            onBackPress={onBackPress}
            isSuperadminShell={false}
        />
    );
}
```

---

## 4. Component Architecture

1. **`StaticTrailMap`**:
   - Preserves intrinsic 4:3 aspect ratio (`800x600`).
   - Supports 2D free pan & zoom via `ResumableZoom` (`panMode="free"`, `pinchMode="clamp"`).
   - Suppresses tap-to-add on pan displacement > 8px to prevent accidental pin additions during drag.
   - Decomposes into:
     - `WaypointPinMarker`: Memoized percentage-positioned pin with touch event stopPropagation and dynamic z-index.
     - `MapZoomControls`: Floating center-right 4-button panel (+, -, reset, pin visibility toggle).
     - `EditPointModal`: Add/Edit waypoint metadata dialog with mobile keyboard avoidance and color/icon swatches.
     - `PointDetailsModal`: Waypoint inspection sheet.

2. **`TrailMap` (Vector Tiles)**:
   - Platform-split: `TrailMap.native.tsx` handles native MapLibre GL with Protomaps offline styles.
   - `TrailMap.tsx` provides clean web fallback avoiding native binary crashes.
