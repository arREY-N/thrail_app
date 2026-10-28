import { MaterialIcons } from "@expo/vector-icons";
import {
  Camera,
  CameraRef,
  GeoJSONSource,
  Layer,
  Map,
  Marker,
  StyleSpecification,
} from "@maplibre/maplibre-react-native";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import React, { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Animated, Easing, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import LoadingScreen from "@/src/app/loading";
import { TrackHikerGPSFlow } from "@/src/core/flows/TrackHikerGPSFlow";
import { resolveOfflineFonts } from "@/src/utils/resolveOfflineFonts";
import { resolveOfflineSprites } from "@/src/utils/resolveOfflineSprites";
import {
  getOrDownloadAllMountainsGeoJson,
  getOrDownloadTrailGeoJson,
  MOUNTAIN_TRAIL_REGISTRY,
  resolveMountainId,
  resolveMountainIdByCoords,
} from "./services/TrailOfflineManager";
import { buildOfflineStyle } from "./styles/offlineStyle";
import { onlineStyle } from "./styles/onlineStyle";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const offlineMapTileAsset = require("../../assets/tiles/thrail-offline-map.pmtiles");

// Expected archive size is ~35.4MB (35,443,673 bytes).
// Require at least 34MB (~96%) to reject incomplete writes.
const MIN_PMTILES_SIZE_BYTES = 34_000_000;

/**
 * Validates PMTiles archive integrity by checking both file size
 * and the PMTiles v3 magic header ("PMTiles" ASCII string at byte offset 0).
 */
async function isPmtilesValid(uri: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists || !info.size || info.size < MIN_PMTILES_SIZE_BYTES) {
      return false;
    }
    // On Android expo-file-system, position & length are ONLY respected when encoding is Base64.
    // UTF8 encoding ignores position/length and attempts to read the entire 35MB file into a string.
    try {
      const base64Header = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
        position: 0,
        length: 7,
      });
      // Base64 of ASCII "PMTiles" (0x50, 0x4D, 0x54, 0x69, 0x6C, 0x65, 0x73) is "UE1UaWxlcw=="
      if (base64Header === "UE1UaWxlcw==" || base64Header.startsWith("UE1UaWxl")) {
        return true;
      }
    } catch (readErr) {
      console.warn("⚠️ Failed reading PMTiles header via Base64, falling back to size verification:", readErr);
    }
    // Fallback: If header read failed or unsupported, file existence and verified size (>= 34MB) suffices
    return info.size >= MIN_PMTILES_SIZE_BYTES;
  } catch (error) {
    console.warn("⚠️ Error verifying PMTiles:", error);
    return false;
  }
}

interface LegacyCameraRef {
  setCamera?: (options: {
    centerCoordinate: [number, number];
    zoomLevel?: number;
    heading?: number;
    pitch?: number;
    animationDuration: number;
    animationMode: string;
  }) => void;
}

interface RegionChangeEvent {
  properties?: {
    isUserInteraction?: boolean;
    zoomLevel?: number;
    heading?: number;
    bearing?: number;
  };
  geometry?: {
    coordinates?: [number, number];
  };
  nativeEvent?: {
    userInteraction?: boolean;
    zoom?: number;
    bearing?: number;
    center?: [number, number];
  };
}

type LoadState = "loading" | "ready" | "error";

export interface HikerLocation {
  id: string;
  latitude: number;
  longitude: number;
  hikerName?: string;
  timestamp?: Date | string | number;
  altitude?: number | null;
  status?: string;
}

/**
 * Validates coordinate numbers to ensure they are finite, non-NaN,
 * and within standard geographic limits (-90 to +90 lat, -180 to +180 lon).
 * Correctly permits 0-valued coordinates (e.g. at the equator/prime meridian).
 */
function isValidCoordinate(lat?: number | null, lon?: number | null): boolean {
  if (typeof lat !== "number" || typeof lon !== "number") return false;
  if (isNaN(lat) || isNaN(lon) || !isFinite(lat) || !isFinite(lon)) return false;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return false;
  return true;
}

/**
 * Returns elapsed minutes between a recorded timestamp and a reference time.
 */
function getElapsedMinutes(timestamp?: Date | string | number, currentTimeMs = Date.now()): number {
  if (!timestamp) return 0;
  const timeMs = timestamp instanceof Date ? timestamp.getTime() : new Date(timestamp).getTime();
  if (isNaN(timeMs)) return 0;
  const elapsedMs = Math.max(0, currentTimeMs - timeMs);
  return Math.floor(elapsedMs / (1000 * 60));
}

/**
 * Formats relative time elapsed since the last location report.
 */
function formatTimeAgo(timestamp?: Date | string | number, currentTimeMs = Date.now()): string {
  const mins = getElapsedMinutes(timestamp, currentTimeMs);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m ago`;
}

/**
 * Formats recorded timestamp for emergency rescue coordinates display.
 */
function formatRecordedTime(timestamp?: Date | string | number): string {
  if (!timestamp) return "Unknown";
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (isNaN(date.getTime())) return "Unknown";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

interface AnimatedHikerMarkerProps {
  hiker: HikerLocation;
  onPress: (hiker: HikerLocation) => void;
}

/**
 * Smoothly interpolates hiker marker coordinates on the map over ~1200ms
 * upon receiving remote location updates. Automatically transitions to
 * Last Known Location (LKL) state if no updates are received for >= 2 minutes.
 */
const AnimatedHikerMarker: React.FC<AnimatedHikerMarkerProps> = memo(({ hiker, onPress }) => {
  const [coords, setCoords] = useState<[number, number]>([hiker.longitude, hiker.latitude]);
  const prevCoordsRef = useRef<[number, number]>([hiker.longitude, hiker.latitude]);
  const animValue = useRef(new Animated.Value(1)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const [now, setNow] = useState(Date.now());

  // Periodic ticker ensuring LKL state transitions even if device battery died
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Smoothly interpolate coordinate movements across updates
  useEffect(() => {
    const prev = prevCoordsRef.current;
    const targetLon = hiker.longitude;
    const targetLat = hiker.latitude;

    const dLon = targetLon - prev[0];
    const dLat = targetLat - prev[1];
    const distSq = dLon * dLon + dLat * dLat;

    // If movement is negligible (< ~0.000001 deg, ~3m) or huge (> ~0.05 deg, initial load or warp), snap directly
    if (distSq < 0.000000001 || distSq > 0.0025) {
      prevCoordsRef.current = [targetLon, targetLat];
      setCoords([targetLon, targetLat]);
      return;
    }

    if (animRef.current) {
      animRef.current.stop();
    }

    const startLon = prev[0];
    const startLat = prev[1];

    animValue.setValue(0);
    let lastRenderTime = 0;

    // Throttle React state re-renders to ~12 FPS (every 80ms) to prevent JS bridge congestion
    const listenerId = animValue.addListener(({ value }) => {
      const currentTime = Date.now();
      if (currentTime - lastRenderTime >= 80 || value >= 0.99) {
        lastRenderTime = currentTime;
        const currentLon = startLon + (targetLon - startLon) * value;
        const currentLat = startLat + (targetLat - startLat) * value;
        setCoords([currentLon, currentLat]);
      }
    });

    const animation = Animated.timing(animValue, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    });

    animRef.current = animation;
    animation.start(({ finished }) => {
      if (finished) {
        prevCoordsRef.current = [targetLon, targetLat];
        setCoords([targetLon, targetLat]);
      }
      animValue.removeListener(listenerId);
      animRef.current = null;
    });

    return () => {
      animValue.removeListener(listenerId);
      if (animRef.current) {
        animRef.current.stop();
      }
    };
  }, [hiker.longitude, hiker.latitude, animValue]);

  const initials = hiker.hikerName
    ? hiker.hikerName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
    : "?";

  // LKL condition: 2 or more minutes since last recorded update
  const elapsedMinutes = getElapsedMinutes(hiker.timestamp, now);
  const isLkl = elapsedMinutes >= 2;
  const timeAgoText = formatTimeAgo(hiker.timestamp, now);

  return (
    <Marker
      key={`hiker-${hiker.id}`}
      id={`hiker-${hiker.id}`}
      lngLat={coords}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onPress(hiker)}
        style={styles.hikerMarkerContainer}
      >
        <View style={[styles.hikerMarkerCircle, isLkl && styles.hikerMarkerCircleLkl]}>
          <Text style={styles.hikerMarkerInitials}>{initials}</Text>
          {isLkl && (
            <View style={styles.hikerMarkerLklBadge}>
              <MaterialIcons name="warning" size={9} color="#FFFFFF" />
            </View>
          )}
        </View>

        <View style={[styles.hikerMarkerLabel, isLkl && styles.hikerMarkerLabelLkl]}>
          <Text
            style={[styles.hikerMarkerLabelText, isLkl && styles.hikerMarkerLabelTextLkl]}
            numberOfLines={1}
          >
            {isLkl ? `⚠️ Signal Lost • ${timeAgoText}` : hiker.hikerName || "Hiker"}
          </Text>
        </View>
      </TouchableOpacity>
    </Marker>
  );
});

AnimatedHikerMarker.displayName = "AnimatedHikerMarker";

interface AnimatedUserLocationMarkerProps {
  lngLat: [number, number];
  heading: number | null;
  mapBearing: number;
}

/**
 * Smoothly interpolates the user's Blue Dot coordinate over ~550ms and renders
 * a Google Maps-style directional heading beam & pointer synchronized with
 * the device magnetometer (`heading - mapBearing`).
 */
const AnimatedUserLocationMarker: React.FC<AnimatedUserLocationMarkerProps> = memo(
  ({ lngLat, heading, mapBearing }) => {
    const [coords, setCoords] = useState<[number, number]>(lngLat);
    const animValue = useRef(
      new Animated.ValueXY({ x: lngLat[0], y: lngLat[1] })
    ).current;
    const prevTarget = useRef<[number, number]>(lngLat);

    useEffect(() => {
      const listenerId = animValue.addListener((val) => {
        if (isValidCoordinate(val.y, val.x)) {
          setCoords([val.x, val.y]);
        }
      });
      return () => {
        animValue.removeListener(listenerId);
      };
    }, [animValue]);

    useEffect(() => {
      const [targetLon, targetLat] = lngLat;
      if (!isValidCoordinate(targetLat, targetLon)) return;

      const [prevLon, prevLat] = prevTarget.current;
      const dLon = Math.abs(targetLon - prevLon);
      const dLat = Math.abs(targetLat - prevLat);
      if (dLon < 1e-7 && dLat < 1e-7) return;

      prevTarget.current = [targetLon, targetLat];

      // Snap immediately on initial jump > ~1km; otherwise glide smoothly over 550ms
      if (dLon > 0.01 || dLat > 0.01) {
        animValue.setValue({ x: targetLon, y: targetLat });
        setCoords([targetLon, targetLat]);
        return;
      }

      Animated.timing(animValue, {
        toValue: { x: targetLon, y: targetLat },
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }, [lngLat, animValue]);

    const hasHeading = typeof heading === "number" && !isNaN(heading) && heading >= 0;
    const relativeRotation = hasHeading
      ? (((heading - mapBearing) % 360) + 360) % 360
      : 0;

    return (
      <Marker id="user-location-marker" anchor="center" lngLat={coords}>
        <View style={styles.userLocationMarkerContainer} pointerEvents="none">
          <View style={styles.userLocationHalo} />

          {hasHeading && (
            <View
              style={[
                styles.userLocationHeadingWrapper,
                { transform: [{ rotate: `${relativeRotation.toFixed(1)}deg` }] },
              ]}
            >
              {/* Soft outer directional fan */}
              <View style={styles.userLocationHeadingConeOuter} />
              {/* Crisp inner directional pointer */}
              <View style={styles.userLocationHeadingArrow} />
            </View>
          )}

          <View style={styles.userLocationDot} />
        </View>
      </Marker>
    );
  }
);

AnimatedUserLocationMarker.displayName = "AnimatedUserLocationMarker";

export interface TrailMapProps {
  initialLon?: number | string | (number | string)[];
  initialLat?: number | string | (number | string)[];
  mountainId?: string;
  trailFileName?: string;
  geoJsonPath?: string;
  showControls?: boolean;
  showRecenter?: boolean;
  bottomInset?: number;
  compassPosition?: { top: number; left: number } | { top: number; right: number } | { bottom: number; right: number } | { bottom: number; left: number };
  attributionPosition?: { top: number; left: number } | { top: number; right: number } | { bottom: number; right: number } | { bottom: number; left: number };
  hikerLocations?: HikerLocation[];
  currentUserId?: string;
  isOffline?: boolean;
}

export interface TrailMapRef {
  centerOnUser: () => void;
  centerOnCoordinate: (lon: number, lat: number) => void;
  flyTo?: (options: { center: [number, number]; zoom?: number; duration?: number }) => void;
  toggleOffline: () => void;
  exportHikeData: () => void;
  startBackgroundTracking: () => Promise<void>;
  stopBackgroundTracking: () => Promise<void>;
}

const TrailMap = memo(forwardRef<TrailMapRef, TrailMapProps>(({
  initialLon,
  initialLat,
  mountainId,
  trailFileName,
  geoJsonPath,
  showControls = true,
  showRecenter = false,
  bottomInset = 280,
  compassPosition,
  attributionPosition,
  hikerLocations = [],
  currentUserId
}, ref) => {
  const resolvedAttributionPosition = attributionPosition || { bottom: bottomInset, left: 16 };
  const resolvedCompassPosition = compassPosition || { bottom: bottomInset + 36, left: 16 };
  const {
    userLocation,
    userHeading,
    routeCoordinates,
    permissionGranted,
    isOnline,
    exportHikeData,
    initForegroundGps,
    startBackgroundTracking,
    stopBackgroundTracking,
  } = TrackHikerGPSFlow();

  const [mapBearing, setMapBearing] = useState<number>(0);

  const lonStr = Array.isArray(initialLon) ? initialLon[0] : initialLon;
  const latStr = Array.isArray(initialLat) ? initialLat[0] : initialLat;
  const parsedLon = Number(lonStr);
  const parsedLat = Number(latStr);
  const hasInitialCoords = !!(lonStr && latStr && !isNaN(parsedLon) && !isNaN(parsedLat));

  const [forceOffline, setForceOffline] = useState(true);
  const [isFollowing, setIsFollowing] = useState(!hasInitialCoords);
  const [mapReady, setMapReady] = useState(false);
  const [offlineTileUrl, setOfflineTileUrl] = useState<string>("");
  const [contextGeoJsonUrl, setContextGeoJsonUrl] = useState<string | null>(null);
  const [activeGeoJsonUrl, setActiveGeoJsonUrl] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [fontBaseDir, setFontBaseDir] = useState<string>("");
  const [spriteBaseUri, setSpriteBaseUri] = useState<string>("");
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedHiker, setSelectedHiker] = useState<HikerLocation | null>(null);

  // Dynamic live hiker derivation: ensures rescue card stays continuously fresh as hiker moves
  const liveSelectedHiker = useMemo(() => {
    if (!selectedHiker) return null;
    return hikerLocations.find((h) => h.id === selectedHiker.id) || selectedHiker;
  }, [selectedHiker, hikerLocations]);

  const isSelectedLkl = liveSelectedHiker ? getElapsedMinutes(liveSelectedHiker.timestamp) >= 2 : false;

  const handleHikerPress = useCallback((clicked: HikerLocation) => {
    setSelectedHiker(clicked);
  }, []);

  // Multi-segment breadcrumb handling (supports multiple pause/resume intervals with clean gaps)
  const validSegments: [number, number][][] = useMemo(() => {
    if (!routeCoordinates || !Array.isArray(routeCoordinates) || routeCoordinates.length === 0) {
      return [];
    }
    // Handle backwards compatibility if routeCoordinates is legacy flat array: [[lon, lat], [lon, lat], ...]
    if (typeof routeCoordinates[0]?.[0] === "number") {
      const flat = routeCoordinates as unknown as [number, number][];
      return flat.length >= 2 ? [flat] : [];
    }
    // Multi-segment format: [ [[lon, lat], [lon, lat]], [[lon, lat], [lon, lat]] ]
    return (routeCoordinates as unknown as [number, number][][]).filter(
      (seg) => Array.isArray(seg) && seg.length >= 2
    );
  }, [routeCoordinates]);

  const cameraRef = useRef<CameraRef | null>(null);
  const lastZoomRef = useRef<number>(hasInitialCoords ? 12 : 16);
  const lastCenterRef = useRef<[number, number] | null>(null);
  const isFollowingRef = useRef<boolean>(isFollowing);
  isFollowingRef.current = isFollowing;
  const lastRecenterMsRef = useRef<number>(0);

  // Helper for cross-version camera flyTo animation (long-distance overview transitions)
  const flyCamera = useCallback((center: [number, number], zoom: number, duration = 800) => {
    if (!cameraRef.current) return;
    lastZoomRef.current = zoom;
    lastCenterRef.current = center;
    if (cameraRef.current.flyTo) {
      cameraRef.current.flyTo({ center, zoom, duration });
    } else {
      const legacyCam = cameraRef.current as unknown as LegacyCameraRef;
      legacyCam.setCamera?.({
        centerCoordinate: center,
        zoomLevel: zoom,
        animationDuration: duration,
        animationMode: "flyTo",
      });
    }
  }, []);

  // Helper for smooth cubic easeTo animation (used for Recenter & live GPS follow without parabolic zoom bounce)
  const easeCamera = useCallback((
    center: [number, number],
    options?: { zoom?: number; duration?: number; bearing?: number; pitch?: number }
  ) => {
    if (!cameraRef.current) return;
    const duration = options?.duration ?? 500;
    if (options?.zoom !== undefined) {
      lastZoomRef.current = options.zoom;
    }
    lastCenterRef.current = center;
    if (cameraRef.current.easeTo) {
      cameraRef.current.easeTo({
        center,
        duration,
        ...(options?.zoom !== undefined ? { zoom: options.zoom } : {}),
        ...(options?.bearing !== undefined ? { bearing: options.bearing } : {}),
        ...(options?.pitch !== undefined ? { pitch: options.pitch } : {}),
      });
    } else {
      const legacyCam = cameraRef.current as unknown as LegacyCameraRef;
      legacyCam.setCamera?.({
        centerCoordinate: center,
        ...(options?.zoom !== undefined ? { zoomLevel: options.zoom } : {}),
        ...(options?.bearing !== undefined ? { heading: options.bearing } : {}),
        ...(options?.pitch !== undefined ? { pitch: options.pitch } : {}),
        animationDuration: duration,
        animationMode: "easeTo",
      });
    }
  }, []);

  // ✅ Pre-warm GPS on mount so the blue dot appears instantly
  useEffect(() => {
    initForegroundGps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actuallyOffline = forceOffline || !isOnline;
  const actuallyOfflineRef = useRef(actuallyOffline);
  actuallyOfflineRef.current = actuallyOffline;

  const currentStyleMode: "offline" | "online" = actuallyOffline ? "offline" : "online";
  const currentStyleModeRef = useRef<"offline" | "online">(currentStyleMode);
  currentStyleModeRef.current = currentStyleMode;

  const [loadedStyleMode, setLoadedStyleMode] = useState<"offline" | "online" | null>(null);
  const isStyleReady = loadedStyleMode === currentStyleMode;

  useEffect(() => {
    let isMounted = true;
    let timer: NodeJS.Timeout | null = null;

    async function resolveGeoJson() {
      try {
        const hasExplicitTrail = !!(
          (geoJsonPath && typeof geoJsonPath === "string" && geoJsonPath.trim().length > 0) ||
          trailFileName
        );

        const targetMountain =
          resolveMountainId(mountainId) ||
          (hasInitialCoords
            ? resolveMountainIdByCoords(parsedLat, parsedLon)
            : null);

        let activeUri: string | null = null;
        let contextUri: string | null = null;

        if (hasExplicitTrail) {
          // 1. Resolve Active Selected Trail immediately
          if (geoJsonPath && typeof geoJsonPath === "string" && geoJsonPath.trim().length > 0) {
            activeUri = await getOrDownloadTrailGeoJson(geoJsonPath.trim());
          } else if (targetMountain && trailFileName) {
            activeUri = await getOrDownloadTrailGeoJson(
              targetMountain,
              trailFileName,
            );
          }

          if (isMounted && activeUri) {
            setActiveGeoJsonUrl(activeUri);
          }

          // 2. Resolve Context Trail Network in the background (non-blocking)
          (async () => {
            try {
              let ctxUri: string | null = null;
              if (targetMountain && MOUNTAIN_TRAIL_REGISTRY[targetMountain]?.allFile) {
                ctxUri = await getOrDownloadTrailGeoJson(
                  targetMountain,
                  MOUNTAIN_TRAIL_REGISTRY[targetMountain].allFile,
                );
              }
              if (!ctxUri) {
                ctxUri = await getOrDownloadAllMountainsGeoJson();
              }
              if (isMounted && ctxUri && ctxUri !== activeUri) {
                setContextGeoJsonUrl(ctxUri);
              }
            } catch (ctxErr) {
              console.warn("⚠️ Non-critical: Failed to resolve background context trail network:", ctxErr);
            }
          })();
        } else {
          // Overview mode: no specific trail selected
          if (targetMountain && MOUNTAIN_TRAIL_REGISTRY[targetMountain]?.allFile) {
            contextUri = await getOrDownloadTrailGeoJson(
              targetMountain,
              MOUNTAIN_TRAIL_REGISTRY[targetMountain].allFile,
            );
          }
          if (!contextUri) {
            contextUri = await getOrDownloadAllMountainsGeoJson();
          }
          if (isMounted) {
            setContextGeoJsonUrl(contextUri);
          }
        }
      } catch (err) {
        console.warn("⚠️ Failed to resolve trail GeoJSON layers from offline cache or Firebase trail_routes/:", err);
      }
    }

    async function resolveOfflineMap() {
      const fileUri = `${FileSystem.documentDirectory ?? ""}thrail-offline-map.pmtiles`;
      const isCachedValid = await isPmtilesValid(fileUri);

      if (isCachedValid) {
        console.log("✅ Offline map cache is healthy & verified.");
        if (isMounted) setOfflineTileUrl(`pmtiles://${fileUri}`);
        return;
      }

      // If corrupted or truncated file exists, clean it up before re-copying
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        console.warn("⚠️ Existing PMTiles cache failed integrity check (corrupt or partial). Deleting...");
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      }

      const [asset] = await Asset.loadAsync(offlineMapTileAsset);
      if (!asset) {
        throw new Error("Unable to load offline map asset from module.");
      }

      const sourceUri = asset.localUri || asset.uri;
      if (!sourceUri) {
        throw new Error("Offline map asset source URI could not be resolved.");
      }

      console.log(`📦 Copying offline map asset from: ${sourceUri}`);

      if (sourceUri.startsWith("http://") || sourceUri.startsWith("https://")) {
        // Dev environment (asset served over HTTP via Metro bundler)
        await FileSystem.downloadAsync(sourceUri, fileUri);
      } else {
        // Production release APK/AAB or standalone bundle (asset:// or file://)
        await FileSystem.copyAsync({ from: sourceUri, to: fileUri });
      }

      const isCopiedValid = await isPmtilesValid(fileUri);
      if (!isCopiedValid) {
        throw new Error("Offline map copy completed, but file failed integrity verification (PMTiles magic header or size check failed).");
      }

      console.log(`✅ Offline map installed and verified successfully.`);
      if (isMounted) setOfflineTileUrl(`pmtiles://${fileUri}`);
    }

    async function loadAssets() {
      if (isMounted) setLoadState("loading");

      try {
        // Item 9: Wrap asset loading in a 15-second timeout to prevent indefinite freeze on filesystem locks
        const timeoutPromise = new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            reject(new Error("Map asset extraction timed out after 15 seconds. Please check device storage and retry."));
          }, 15000);
        });

        const tasks: Promise<unknown>[] = [
          resolveGeoJson(),
          resolveOfflineMap().catch((err) => {
            console.warn("⚠️ Offline map preparation warning:", err);
            if (actuallyOfflineRef.current) throw err;
          }),
          resolveOfflineFonts()
            .then((dir) => {
              if (isMounted) setFontBaseDir(dir);
            })
            .catch((err) => {
              console.warn("⚠️ Offline fonts preparation warning:", err);
              if (actuallyOfflineRef.current) throw err;
            }),
          resolveOfflineSprites()
            .then((uri) => {
              if (isMounted) setSpriteBaseUri(uri);
            })
            .catch((err) => {
              console.warn("⚠️ Offline sprites preparation warning:", err);
            }),
        ];

        await Promise.race([
          Promise.all(tasks),
          timeoutPromise,
        ]);

        if (isMounted) {
          setLoadState("ready");
        }
      } catch (err) {
        console.error("❌ Failed to load map assets:", err);
        if (isMounted) {
          setLoadState("error");
        }
      } finally {
        if (timer) clearTimeout(timer);
      }
    }

    loadAssets();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [reloadKey, geoJsonPath, mountainId, trailFileName, hasInitialCoords, parsedLat, parsedLon]);

  useEffect(() => {
    if (!mapReady || !hasInitialCoords) return;
    isFollowingRef.current = false;
    setIsFollowing(false);
    flyCamera([parsedLon, parsedLat], 14, 800);
  }, [hasInitialCoords, parsedLon, parsedLat, mapReady, flyCamera]);

  // Smooth camera follow on filtered GPS position without MapLibre native engine drift or zoom bounce
  useEffect(() => {
    if (!isFollowingRef.current || !userLocation || !mapReady) return;
    if (!isValidCoordinate(userLocation[1], userLocation[0])) return;
    // Skip redundant follow animation while a manual Recenter easeTo animation is in flight
    if (Date.now() - lastRecenterMsRef.current < 550) return;

    // Omit `zoom` so native MapLibre strictly preserves the user's current zoom level
    easeCamera(userLocation as [number, number], { duration: 500 });
  }, [userLocation, mapReady, easeCamera]);

  const centerOnUser = useCallback(() => {
    if (userLocation && isValidCoordinate(userLocation[1], userLocation[0])) {
      lastRecenterMsRef.current = Date.now();
      const currentZoom = lastZoomRef.current;

      let targetZoom: number | undefined;
      if (!isFollowingRef.current) {
        // Re-engaging follow: only zoom in if currently zoomed out past trail level (< 16)
        targetZoom = currentZoom < 16 ? 16.5 : undefined;
      } else {
        // Already following: tapping Recenter again toggles between standard trail zoom (16.5) and close detail (17.5)
        targetZoom = currentZoom < 17.2 ? 17.5 : 16.5;
      }

      easeCamera(userLocation as [number, number], {
        zoom: targetZoom,
        bearing: 0,
        pitch: 0,
        duration: 500,
      });
      setMapBearing(0);
    }
    isFollowingRef.current = true;
    setIsFollowing(true);
  }, [userLocation, easeCamera]);

  const centerOnCoordinate = useCallback((lon: number, lat: number) => {
    isFollowingRef.current = false;
    setIsFollowing(false);
    flyCamera([lon, lat], 17, 800);
  }, [flyCamera]);

  const handleRegionWillChange = (event: RegionChangeEvent) => {
    const newBearing =
      event.properties?.bearing ??
      event.properties?.heading ??
      event.nativeEvent?.bearing;
    if (typeof newBearing === "number" && !isNaN(newBearing)) {
      setMapBearing(newBearing);
    }

    const isUser = event.properties?.isUserInteraction ?? event.nativeEvent?.userInteraction;
    if (!isUser) return;

    const newZoom = event.properties?.zoomLevel ?? event.nativeEvent?.zoom ?? lastZoomRef.current;
    const coords = event.geometry?.coordinates ?? event.nativeEvent?.center;

    lastZoomRef.current = newZoom;
    if (coords && isValidCoordinate(coords[1], coords[0])) {
      lastCenterRef.current = [coords[0], coords[1]];
    }

    // Any manual touch interaction (pan, pinch-to-zoom, rotate) disengages camera follow
    isFollowingRef.current = false;
    setIsFollowing(false);
  };

  const handleRegionDidChange = (event: RegionChangeEvent) => {
    const newZoom = event.properties?.zoomLevel ?? event.nativeEvent?.zoom;
    const coords = event.geometry?.coordinates ?? event.nativeEvent?.center;
    const newBearing =
      event.properties?.bearing ??
      event.properties?.heading ??
      event.nativeEvent?.bearing;

    if (typeof newZoom === "number" && !isNaN(newZoom)) {
      lastZoomRef.current = newZoom;
    }
    if (coords && isValidCoordinate(coords[1], coords[0])) {
      lastCenterRef.current = [coords[0], coords[1]];
    }
    if (typeof newBearing === "number" && !isNaN(newBearing)) {
      setMapBearing(newBearing);
    }
  };

  const handleStyleLoaded = useCallback(() => {
    setMapReady(true);
    requestAnimationFrame(() => {
      setLoadedStyleMode(currentStyleModeRef.current);
    });
  }, []);

  // ✅ Expose these functions up to the HikeRecordingScreen
  useImperativeHandle(ref, () => ({
    centerOnUser,
    centerOnCoordinate,
    flyTo: (options: { center: [number, number]; zoom?: number; duration?: number }) => {
      isFollowingRef.current = false;
      setIsFollowing(false);
      flyCamera(options.center, options.zoom ?? 17, options.duration ?? 800);
    },
    toggleOffline: () => {
      // Unmount custom GeoJSON sources/layers before swapping mapStyle to prevent
      // native MLRNLayer.setBelowLayerID(null) NullPointerException & C++ style peer conflicts
      setLoadedStyleMode(null);
      requestAnimationFrame(() => {
        setForceOffline((v: boolean) => !v);
      });
    },
    exportHikeData,
    startBackgroundTracking,
    stopBackgroundTracking,
  }));

  // Memoize offline style generation to avoid allocating a new layer JSON tree on every render
  const activeStyle: StyleSpecification | string = useMemo(() => {
    return actuallyOffline
      ? (buildOfflineStyle(offlineTileUrl, fontBaseDir, spriteBaseUri) as unknown as StyleSpecification)
      : onlineStyle;
  }, [actuallyOffline, offlineTileUrl, fontBaseDir, spriteBaseUri]);

  // Memoize GeoJSON Feature for walked path MultiLineString to prevent re-serializing on unrelated renders
  const walkedPathGeoJson = useMemo(() => {
    if (validSegments.length === 0) return null;
    return {
      type: "Feature" as const,
      geometry: { type: "MultiLineString" as const, coordinates: validSegments },
      properties: {},
    };
  }, [validSegments]);

  // If offline mode is active but offline assets failed or are incomplete, show error UI instead of falling back to onlineStyle
  if (loadState === "error" || (actuallyOffline && loadState === "ready" && (!offlineTileUrl || !fontBaseDir || !spriteBaseUri))) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="cloud-off" size={48} color="#d9534f" />
        <Text style={styles.errorText}>Failed to load map assets.{"\n"}Check storage or try again.</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoadState("loading");
            setReloadKey((k) => k + 1);
          }}
        >
          <Text style={styles.retryButtonText}>Retry Setup</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loadState === "loading" || (actuallyOffline && (!offlineTileUrl || !fontBaseDir || !spriteBaseUri))) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.page}>
      <Map
        style={styles.map}
        logo={false}
        attribution={showControls}
        attributionPosition={resolvedAttributionPosition}
        compass={showControls}
        compassPosition={resolvedCompassPosition}
        compassHiddenFacingNorth={true}
        mapStyle={activeStyle}
        onDidFinishLoadingStyle={handleStyleLoaded}
        onDidFinishLoadingMap={handleStyleLoaded}
        onDidFailLoadingMap={() => {
          if (!actuallyOfflineRef.current) {
            console.warn("⚠️ Online map style failed to load; falling back to offline map.");
            setLoadedStyleMode(null);
            setForceOffline(true);
          }
        }}
        onRegionWillChange={handleRegionWillChange}
        onRegionDidChange={handleRegionDidChange}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{
            center: hasInitialCoords ? [parsedLon, parsedLat] : [120.9842, 14.5995],
            zoom: hasInitialCoords ? 12 : 16,
          }}
          minZoom={10}
          maxZoom={20}
        />

        {/* Context Trail Network Layer (Muted background if active trail is selected, standard if not) */}
        {isStyleReady && contextGeoJsonUrl && (
          <GeoJSONSource
            key={`contextTrailSource-${currentStyleMode}`}
            id={`contextTrailSource-${currentStyleMode}`}
            data={contextGeoJsonUrl}
          >
            <Layer
              key={`layer-context-casing-${currentStyleMode}`}
              id={`layer-context-casing-${currentStyleMode}`}
              type="line"
              {...(actuallyOffline ? { beforeId: "roads_labels_minor" } : {})}
              paint={{
                "line-color": "#FFFFFF",
                "line-width": activeGeoJsonUrl ? 4 : 6,
                "line-opacity": activeGeoJsonUrl ? 0.2 : 0.55,
              }}
              layout={{
                "line-cap": "round",
                "line-join": "round",
              }}
            />
            <Layer
              key={`layer-context-hiking-${currentStyleMode}`}
              id={`layer-context-hiking-${currentStyleMode}`}
              type="line"
              {...(actuallyOffline ? { beforeId: "roads_labels_minor" } : {})}
              paint={{
                "line-color": activeGeoJsonUrl ? "#94A3B8" : "#16A34A",
                "line-width": activeGeoJsonUrl ? 2.5 : 4,
                "line-opacity": activeGeoJsonUrl ? 0.55 : 0.88,
              }}
              layout={{
                "line-cap": "round",
                "line-join": "round",
              }}
            />
          </GeoJSONSource>
        )}

        {/* Active Highlight Trail Layer (Prominent foreground route) */}
        {isStyleReady && activeGeoJsonUrl && (
          <GeoJSONSource
            key={`activeTrailSource-${currentStyleMode}`}
            id={`activeTrailSource-${currentStyleMode}`}
            data={activeGeoJsonUrl}
          >
            <Layer
              key={`layer-active-casing-${currentStyleMode}`}
              id={`layer-active-casing-${currentStyleMode}`}
              type="line"
              {...(actuallyOffline ? { beforeId: "roads_labels_minor" } : {})}
              paint={{
                "line-color": "#FFFFFF",
                "line-width": 8.5,
                "line-opacity": 0.95,
              }}
              layout={{
                "line-cap": "round",
                "line-join": "round",
              }}
            />
            <Layer
              key={`layer-active-hiking-${currentStyleMode}`}
              id={`layer-active-hiking-${currentStyleMode}`}
              type="line"
              {...(actuallyOffline ? { beforeId: "roads_labels_minor" } : {})}
              paint={{
                "line-color": "#16A34A",
                "line-width": 5.5,
                "line-opacity": 1.0,
              }}
              layout={{
                "line-cap": "round",
                "line-join": "round",
              }}
            />
          </GeoJSONSource>
        )}

        {/* ✅ Orange solid line rendered as MultiLineString to prevent pause/resume gap snapping */}
        {isStyleReady && walkedPathGeoJson && (
          <GeoJSONSource
            key={`walkedPathSource-${currentStyleMode}`}
            id={`walkedPathSource-${currentStyleMode}`}
            data={walkedPathGeoJson}
          >
            <Layer
              key={`layer-walked-path-${currentStyleMode}`}
              id={`layer-walked-path-${currentStyleMode}`}
              type="line"
              {...(actuallyOffline ? { beforeId: "roads_labels_minor" } : {})}
              paint={{
                "line-color": "#FF5722",
                "line-width": 4,
                "line-opacity": 0.9,
              }}
              layout={{
                "line-cap": "round",
                "line-join": "round",
              }}
            />
          </GeoJSONSource>
        )}

        {/* Single-Source Kalman-Filtered Blue Dot + Live Compass Heading Cone */}
        {permissionGranted && userLocation && isValidCoordinate(userLocation[1], userLocation[0]) && (
          <AnimatedUserLocationMarker
            lngLat={userLocation}
            heading={userHeading}
            mapBearing={mapBearing}
          />
        )}

        {/* Render group hikers with smooth animated coordinate interpolation & LKL state */}
        {hikerLocations && hikerLocations.map((hiker: HikerLocation) => {
          // Strictly validate coordinates and skip current user
          if (!hiker || !isValidCoordinate(hiker.latitude, hiker.longitude)) return null;
          if (currentUserId && hiker.id === currentUserId) return null;

          // Ghost pin filter: retain pins for the active hike day (24 hours TTL).
          // Allows search & rescue and group members to view Last Known Location (LKL) pins during prolonged dead zones.
          const timestampMs = hiker.timestamp instanceof Date
            ? hiker.timestamp.getTime()
            : new Date(hiker.timestamp || 0).getTime();
          if (timestampMs > 0 && (Date.now() - timestampMs) > 24 * 60 * 60 * 1000) {
            return null;
          }

          return (
            <AnimatedHikerMarker
              key={`hiker-${hiker.id}`}
              hiker={hiker}
              onPress={handleHikerPress}
            />
          );
        })}
      </Map>

      {/* Rescue Coordinates Card Overlay (Interactive Search & Rescue Inspection) */}
      {liveSelectedHiker && (
        <View style={[styles.rescueCardContainer, { bottom: bottomInset + 12 }]} pointerEvents="box-none">
          <View style={styles.rescueCard}>
            <View style={styles.rescueCardHeader}>
              <View style={styles.rescueCardTitleGroup}>
                <View style={[styles.rescueCardIndicator, isSelectedLkl ? styles.bgAmber : styles.bgEmerald]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rescueCardHikerName} numberOfLines={1}>
                    {liveSelectedHiker.hikerName || "Group Hiker"}
                  </Text>
                  <Text style={styles.rescueCardStatusSub}>
                    {isSelectedLkl
                      ? `⚠️ Last Known Location • ${formatTimeAgo(liveSelectedHiker.timestamp)}`
                      : "🟢 Live Signal • Active"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setSelectedHiker(null)}
                style={styles.rescueCardCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="close" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.rescueGrid}>
              <View style={styles.rescueGridCol}>
                <Text style={styles.rescueGridLabel}>LATITUDE</Text>
                <Text style={styles.rescueGridValue}>{liveSelectedHiker.latitude.toFixed(6)}</Text>
              </View>
              <View style={styles.rescueGridCol}>
                <Text style={styles.rescueGridLabel}>LONGITUDE</Text>
                <Text style={styles.rescueGridValue}>{liveSelectedHiker.longitude.toFixed(6)}</Text>
              </View>
              <View style={styles.rescueGridCol}>
                <Text style={styles.rescueGridLabel}>ALTITUDE</Text>
                <Text style={styles.rescueGridValue}>
                  {liveSelectedHiker.altitude != null ? `${Math.round(liveSelectedHiker.altitude)} m` : "—"}
                </Text>
              </View>
              <View style={styles.rescueGridCol}>
                <Text style={styles.rescueGridLabel}>RECORDED</Text>
                <Text style={styles.rescueGridValue}>{formatRecordedTime(liveSelectedHiker.timestamp)}</Text>
              </View>
            </View>

            <View style={styles.rescueActions}>
              <TouchableOpacity
                style={styles.rescueShareBtn}
                onPress={() => {
                  const name = liveSelectedHiker.hikerName || "Hiker";
                  const latStr = liveSelectedHiker.latitude.toFixed(6);
                  const lonStr = liveSelectedHiker.longitude.toFixed(6);
                  const timeStr = formatRecordedTime(liveSelectedHiker.timestamp);
                  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${latStr},${lonStr}`;
                  Share.share({
                    title: `Emergency Rescue Coordinates: ${name}`,
                    message: `[THRAIL SEARCH & RESCUE]\nHiker: ${name}\nStatus: ${isSelectedLkl ? "LAST KNOWN LOCATION (Signal Lost)" : "LIVE SIGNAL"}\nCoordinates: ${latStr}, ${lonStr}\nRecorded: ${timeStr}\nMap: ${mapUrl}`,
                  });
                }}
              >
                <MaterialIcons name="share" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.rescueShareBtnText}>Dispatch Coordinates</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rescueCenterBtn}
                onPress={() => {
                  isFollowingRef.current = false;
                  setIsFollowing(false);
                  easeCamera([liveSelectedHiker.longitude, liveSelectedHiker.latitude], {
                    zoom: 16.5,
                    duration: 700,
                  });
                }}
              >
                <MaterialIcons name="my-location" size={16} color="#1E293B" style={{ marginRight: 4 }} />
                <Text style={styles.rescueCenterBtnText}>Focus</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}));

TrailMap.displayName = "TrailMap";

const styles = StyleSheet.create({
  page: { flex: 1, height: "100%", width: "100%" },
  map: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  errorText: { marginTop: 16, fontSize: 15, color: "#555", textAlign: "center", lineHeight: 22 },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#2E7D32",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },

  userLocationMarkerContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationHalo: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(37, 99, 235, 0.20)',
  },
  userLocationHeadingWrapper: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  userLocationHeadingConeOuter: {
    position: 'absolute',
    top: 2,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderTopWidth: 26,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(37, 99, 235, 0.32)',
  },
  userLocationHeadingArrow: {
    position: 'absolute',
    top: 12,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5.5,
    borderRightWidth: 5.5,
    borderBottomWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#2563EB',
  },
  userLocationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },

  hikerMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hikerMarkerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E65100', // Predefined Avatar BG color (Orange800)
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  hikerMarkerCircleLkl: {
    backgroundColor: '#D97706', // Amber 600 for Last Known Location
    borderColor: '#FEF3C7',
  },
  hikerMarkerLklBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#B45309',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  hikerMarkerInitials: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  hikerMarkerLabel: {
    marginTop: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.85)', // Sleek dark slate frosted-style pill
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  hikerMarkerLabelLkl: {
    backgroundColor: 'rgba(180, 83, 9, 0.95)', // Deep amber pill for LKL
    borderColor: 'rgba(254, 243, 199, 0.3)',
    borderWidth: 1,
  },
  hikerMarkerLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF', // High-contrast crisp white text
    letterSpacing: 0.2,
  },
  hikerMarkerLabelTextLkl: {
    color: '#FFFBEB',
  },

  rescueCardContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
  },
  rescueCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  rescueCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rescueCardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rescueCardIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  bgAmber: {
    backgroundColor: '#F59E0B',
  },
  bgEmerald: {
    backgroundColor: '#10B981',
  },
  rescueCardHikerName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  rescueCardStatusSub: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  rescueCardCloseBtn: {
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  rescueGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  rescueGridCol: {
    alignItems: 'center',
    flex: 1,
  },
  rescueGridLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  rescueGridValue: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '600',
  },
  rescueActions: {
    flexDirection: 'row',
    gap: 8,
  },
  rescueShareBtn: {
    flex: 1,
    backgroundColor: '#E65100',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  rescueShareBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rescueCenterBtn: {
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  rescueCenterBtnText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default TrailMap;