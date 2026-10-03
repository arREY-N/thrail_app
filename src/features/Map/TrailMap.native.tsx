import { MaterialIcons } from "@expo/vector-icons";
import {
  Camera,
  CameraRef,
  GeoJSONSource,
  Layer,
  LineLayerStyle,
  Map,
  Marker,
  StyleSpecification,
  UserLocation,
} from "@maplibre/maplibre-react-native";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { forwardRef, memo, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Animated, Easing, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import LoadingScreen from "@/src/app/loading";
import { TrackHikerGPSFlow } from "@/src/core/flows/TrackHikerGPSFlow";
import { resolveOfflineFonts } from "@/src/utils/resolveOfflineFonts";
import { buildOfflineStyle } from "./offlineStyle";
import { onlineStyle } from "./onlineStyle";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const rawMapDataAsset = require("../../assets/map_data/trails_3D_final_v2.geojson");
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
    // Read the first 7 bytes to check the PMTiles v3 magic header
    const header = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8,
      position: 0,
      length: 7,
    });
    return header === "PMTiles";
  } catch (error) {
    console.warn("⚠️ Error verifying PMTiles header:", error);
    return false;
  }
}

interface LegacyCameraRef {
  setCamera?: (options: {
    centerCoordinate: [number, number];
    zoomLevel: number;
    animationDuration: number;
    animationMode: string;
  }) => void;
}

interface RegionChangeEvent {
  properties?: {
    isUserInteraction?: boolean;
    zoomLevel?: number;
  };
  geometry?: {
    coordinates?: [number, number];
  };
  nativeEvent?: {
    userInteraction?: boolean;
    zoom?: number;
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

    // If movement is negligible (< ~0.1m) or huge (> ~0.05 degrees, initial load or warp), snap directly
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
    const listenerId = animValue.addListener(({ value }) => {
      const currentLon = startLon + (targetLon - startLon) * value;
      const currentLat = startLat + (targetLat - startLat) * value;
      setCoords([currentLon, currentLat]);
    });

    const animation = Animated.timing(animValue, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    });

    animRef.current = animation;
    animation.start(() => {
      prevCoordsRef.current = [targetLon, targetLat];
      setCoords([targetLon, targetLat]);
      animValue.removeListener(listenerId);
      animRef.current = null;
    });

    return () => {
      animValue.removeListener(listenerId);
      if (animRef.current) {
        animRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hiker.longitude, hiker.latitude]);

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
      onPress={() => onPress(hiker)}
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

export interface TrailMapProps {
  initialLon?: number | string | (number | string)[];
  initialLat?: number | string | (number | string)[];
  showControls?: boolean;
  showRecenter?: boolean;
  bottomInset?: number;
  hikerLocations?: HikerLocation[];
  currentUserId?: string;
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

const TrailMap = forwardRef<TrailMapRef, TrailMapProps>(({ initialLon, initialLat, showControls = true, showRecenter = false, bottomInset = 280, hikerLocations = [], currentUserId }, ref) => {
  const {
    userLocation,
    routeCoordinates,
    permissionGranted,
    isOnline,
    exportHikeData,
    initForegroundGps,
    startBackgroundTracking,
    stopBackgroundTracking,
  } = TrackHikerGPSFlow();

  const lonStr = Array.isArray(initialLon) ? initialLon[0] : initialLon;
  const latStr = Array.isArray(initialLat) ? initialLat[0] : initialLat;
  const parsedLon = Number(lonStr);
  const parsedLat = Number(latStr);
  const hasInitialCoords = !!(lonStr && latStr && !isNaN(parsedLon) && !isNaN(parsedLat));

  const [forceOffline, setForceOffline] = useState(true);
  const [isFollowing, setIsFollowing] = useState(!hasInitialCoords);
  const [mapReady, setMapReady] = useState(false);
  const [offlineTileUrl, setOfflineTileUrl] = useState<string>("");
  const [geoJsonUrl, setGeoJsonUrl] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [fontBaseDir, setFontBaseDir] = useState<string>("");
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedHiker, setSelectedHiker] = useState<HikerLocation | null>(null);
  const isSelectedLkl = selectedHiker ? getElapsedMinutes(selectedHiker.timestamp) >= 2 : false;

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
  const lastZoomRef = useRef<number>(16);
  const lastCenterRef = useRef<[number, number] | null>(null);

  // Helper for cross-version camera flyTo animation
  const flyCamera = (center: [number, number], zoom: number, duration = 800) => {
    if (!cameraRef.current) return;
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
  };

  // ✅ Pre-warm GPS on mount so the blue dot appears instantly
  useEffect(() => {
    initForegroundGps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actuallyOffline = forceOffline || !isOnline;

  useEffect(() => {
    let isMounted = true;
    let timer: NodeJS.Timeout | null = null;

    async function resolveGeoJson() {
      const [geoAsset] = await Asset.loadAsync(rawMapDataAsset);
      const uri = geoAsset.localUri || geoAsset.uri;
      if (uri && isMounted) setGeoJsonUrl(uri);
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

        const tasks: Promise<unknown>[] = [resolveGeoJson()];

        // Item 7: Guard offline copying in online mode.
        // Only resolve heavy offline PMTiles (~34MB) and glyph fonts when offline mode is active.
        if (actuallyOffline) {
          tasks.push(resolveOfflineMap());
          tasks.push(resolveOfflineFonts().then((dir) => {
            if (isMounted) setFontBaseDir(dir);
          }));
        }

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
  }, [reloadKey, actuallyOffline]);

  useEffect(() => {
    if (!mapReady || !hasInitialCoords) return;
    setIsFollowing(false);
    flyCamera([parsedLon, parsedLat], 14, 800);
  }, [hasInitialCoords, parsedLon, parsedLat, mapReady]);

  const centerOnUser = () => {
    if (userLocation) {
      flyCamera(userLocation as [number, number], 18, 500);
    }
    setIsFollowing(true);
  };

  const centerOnCoordinate = (lon: number, lat: number) => {
    setIsFollowing(false);
    flyCamera([lon, lat], 17, 800);
  };

  const handleRegionWillChange = (event: RegionChangeEvent) => {
    const isUser = event.properties?.isUserInteraction ?? event.nativeEvent?.userInteraction;
    if (!isUser) return;

    const newZoom = event.properties?.zoomLevel ?? event.nativeEvent?.zoom ?? lastZoomRef.current;
    const [newLon, newLat] = event.geometry?.coordinates ?? event.nativeEvent?.center ?? [0, 0];

    lastZoomRef.current = newZoom;
    lastCenterRef.current = [newLon, newLat];

    // Any manual touch interaction (pan, pinch-to-zoom, rotate) disengages camera follow
    setIsFollowing(false);
  };

  // ✅ Expose these functions up to the HikeRecordingScreen
  useImperativeHandle(ref, () => ({
    centerOnUser,
    centerOnCoordinate,
    flyTo: (options: { center: [number, number]; zoom?: number; duration?: number }) => {
      setIsFollowing(false);
      flyCamera(options.center, options.zoom ?? 17, options.duration ?? 800);
    },
    toggleOffline: () => setForceOffline((v: boolean) => !v),
    exportHikeData,
    startBackgroundTracking,
    stopBackgroundTracking,
  }));

  // Item 6: If offline mode is active but offline assets failed or are incomplete, show error UI instead of falling back to onlineStyle
  if (loadState === "error" || (actuallyOffline && loadState === "ready" && (!offlineTileUrl || !fontBaseDir))) {
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

  if (loadState === "loading" || !geoJsonUrl || (actuallyOffline && (!offlineTileUrl || !fontBaseDir))) {
    return <LoadingScreen />;
  }

  // Item 6: Prevent silent fallback to onlineStyle when offline.
  // When actuallyOffline is true, activeStyle strictly uses buildOfflineStyle and never requests MapTiler over the network.
  const activeStyle: StyleSpecification | string = actuallyOffline
    ? (buildOfflineStyle(offlineTileUrl, fontBaseDir) as unknown as StyleSpecification)
    : onlineStyle;

  return (
    <View style={styles.page}>
      <Map
        style={styles.map}
        logoPosition={{ bottom: bottomInset, left: 16 }}
        attributionPosition={{ bottom: bottomInset, left: 100 }}
        mapStyle={activeStyle}
        onDidFinishLoadingMap={() => setMapReady(true)}
        onRegionWillChange={handleRegionWillChange}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{
            center: hasInitialCoords ? [parsedLon, parsedLat] : [120.9842, 14.5995],
            zoom: hasInitialCoords ? 12 : 16,
          }}
          minZoom={10}
          maxZoom={20}
          trackUserLocation={isFollowing && permissionGranted ? "default" : undefined}
        />

        {geoJsonUrl && (
          <GeoJSONSource id="trailSource" data={geoJsonUrl}>
            <Layer id="layer-hiking" type="line" style={mapStyles.trailLine} />
          </GeoJSONSource>
        )}

        {/* ✅ Orange solid line rendered as MultiLineString to prevent pause/resume gap snapping */}
        {validSegments.length > 0 && (
          <GeoJSONSource
            id="walkedPathSource"
            data={{
              type: "Feature",
              geometry: { type: "MultiLineString", coordinates: validSegments },
              properties: {},
            }}
          >
            <Layer id="layer-walked-path" type="line" style={mapStyles.walkedPathStyle} />
          </GeoJSONSource>
        )}

        {permissionGranted && (
          <UserLocation
            heading={true}
            accuracy={true}
            animated={true}
          />
        )}

        {/* Render group hikers with smooth animated coordinate interpolation & LKL state */}
        {hikerLocations && hikerLocations.map((hiker: HikerLocation) => {
          // Strictly validate coordinates and skip current user
          if (!hiker || !isValidCoordinate(hiker.latitude, hiker.longitude)) return null;
          if (currentUserId && hiker.id === currentUserId) return null;

          return (
            <AnimatedHikerMarker
              key={`hiker-${hiker.id}`}
              hiker={hiker}
              onPress={(clicked) => setSelectedHiker(clicked)}
            />
          );
        })}
      </Map>

      {/* Rescue Coordinates Card Overlay (Interactive Search & Rescue Inspection) */}
      {selectedHiker && (
        <View style={[styles.rescueCardContainer, { bottom: bottomInset + 12 }]} pointerEvents="box-none">
          <View style={styles.rescueCard}>
            <View style={styles.rescueCardHeader}>
              <View style={styles.rescueCardTitleGroup}>
                <View style={[styles.rescueCardIndicator, isSelectedLkl ? styles.bgAmber : styles.bgEmerald]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rescueCardHikerName} numberOfLines={1}>
                    {selectedHiker.hikerName || "Group Hiker"}
                  </Text>
                  <Text style={styles.rescueCardStatusSub}>
                    {isSelectedLkl
                      ? `⚠️ Last Known Location • ${formatTimeAgo(selectedHiker.timestamp)}`
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
                <Text style={styles.rescueGridValue}>{selectedHiker.latitude.toFixed(6)}</Text>
              </View>
              <View style={styles.rescueGridCol}>
                <Text style={styles.rescueGridLabel}>LONGITUDE</Text>
                <Text style={styles.rescueGridValue}>{selectedHiker.longitude.toFixed(6)}</Text>
              </View>
              <View style={styles.rescueGridCol}>
                <Text style={styles.rescueGridLabel}>ALTITUDE</Text>
                <Text style={styles.rescueGridValue}>
                  {selectedHiker.altitude != null ? `${Math.round(selectedHiker.altitude)} m` : "—"}
                </Text>
              </View>
              <View style={styles.rescueGridCol}>
                <Text style={styles.rescueGridLabel}>RECORDED</Text>
                <Text style={styles.rescueGridValue}>{formatRecordedTime(selectedHiker.timestamp)}</Text>
              </View>
            </View>

            <View style={styles.rescueActions}>
              <TouchableOpacity
                style={styles.rescueShareBtn}
                onPress={() => {
                  const name = selectedHiker.hikerName || "Hiker";
                  const latStr = selectedHiker.latitude.toFixed(6);
                  const lonStr = selectedHiker.longitude.toFixed(6);
                  const timeStr = formatRecordedTime(selectedHiker.timestamp);
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
                  flyCamera([selectedHiker.longitude, selectedHiker.latitude], 16, 1000);
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
});

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

const mapStyles: {
  trailLine: LineLayerStyle;
  walkedPathStyle: LineLayerStyle;
} = {
  trailLine: { lineColor: "#228B22", lineWidth: 4, lineCap: "round", lineJoin: "round" },
  walkedPathStyle: { lineColor: "#FF5722", lineWidth: 4, lineCap: "round", lineJoin: "round" },
};

export default TrailMap;