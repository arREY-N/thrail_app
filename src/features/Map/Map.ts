/**
 * @file Map.ts
 * @description Public facade for the Map feature-module.
 * Exposes core interfaces, custom hooks, presentation components,
 * editing modals, role-adaptive screens, and map asset utilities.
 */

// TYPES & INTERFACES
export * from '@/src/features/Map/interfaces/Map.types';

// UTILITIES & PIN CONFIG
export {
    PIN_COLOR_SWATCHES,
    PIN_ICON_OPTIONS,
    PIN_TYPES,
    getPinConfig,
} from '@/src/features/Map/utils/pinConfig';
export type { PinType } from '@/src/features/Map/utils/pinConfig';

export {
    fallbackMapAsset,
    getStaticMapAsset,
    trailMapAssets,
} from '@/src/features/Map/utils/trailMapAssets';

// STYLES & OFFLINE LANDMARK DATA
export { buildOfflineStyle } from '@/src/features/Map/styles/offlineStyle';
export { onlineStyle } from '@/src/features/Map/styles/onlineStyle';
export { OSM_MOUNTAIN_LANDMARKS_GEOJSON } from '@/src/features/Map/styles/osmMountainLandmarksData';
export type {
    IOsmLandmarkFeature,
    IOsmLandmarkFeatureCollection,
    IOsmLandmarkProperties,
} from '@/src/features/Map/styles/osmMountainLandmarksData';

// HOOKS
export { useTrailMapEditor } from '@/src/features/Map/hooks/useTrailMapEditor';
export type {
    TrailMapEditorHookResult,
    UseTrailMapEditorParams,
} from '@/src/features/Map/hooks/useTrailMapEditor';

// MODALS
export { default as EditPointModal } from '@/src/features/Map/modals/EditPointModal';
export { default as PointDetailsModal } from '@/src/features/Map/modals/PointDetailsModal';

// COMPONENTS
export { default as StaticTrailMap } from '@/src/features/Map/components/StaticTrailMap';
export type { StaticTrailMapProps } from '@/src/features/Map/components/StaticTrailMap';
export { default as WaypointPinMarker } from '@/src/features/Map/components/WaypointPinMarker';
export type { WaypointPinMarkerProps } from '@/src/features/Map/components/WaypointPinMarker';
export { default as MapZoomControls } from '@/src/features/Map/components/MapZoomControls';
export type { MapZoomControlsProps } from '@/src/features/Map/components/MapZoomControls';

// VECTOR MAPS (Note: kept at feature root for Expo/Metro native & web platform-file resolution)
export { default as TrailMap } from '@/src/features/Map/TrailMap';
export type { TrailMapProps, TrailMapRef } from '@/src/features/Map/TrailMap';

// OFFLINE & FIREBASE TRAIL ROUTES MANAGER
export {
    MOUNTAIN_TRAIL_REGISTRY,
    deleteOfflineMountain,
    downloadMountainForOffline,
    getOrDownloadAllMountainsGeoJson,
    getOrDownloadTrailGeoJson,
    isMountainDownloadedOffline,
    readGeoJsonFromUri,
    resolveMountainId,
    resolveMountainIdByCoords,
} from '@/src/features/Map/services/TrailOfflineManager';
export type {
    IMountainTrailManifest,
    SupportedMountainId,
} from '@/src/features/Map/services/TrailOfflineManager';

// SCREENS
export { default as TrailMapEditorScreen } from '@/src/features/SuperAdmin/screens/tabs/TrailMapEditorScreen';
export type { TrailMapEditorScreenProps } from '@/src/features/SuperAdmin/screens/tabs/TrailMapEditorScreen';
