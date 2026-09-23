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
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
}

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

  useEffect(() => {
    async function resolveGeoJson() {
      const [geoAsset] = await Asset.loadAsync(rawMapDataAsset);
      const uri = geoAsset.localUri || geoAsset.uri;
      if (uri) setGeoJsonUrl(uri);
    }

    async function resolveOfflineMap() {
      const fileUri = `${FileSystem.documentDirectory ?? ""}thrail-offline-map.pmtiles`;
      const isCachedValid = await isPmtilesValid(fileUri);

      if (isCachedValid) {
        console.log("✅ Offline map cache is healthy & verified.");
        setOfflineTileUrl(`pmtiles://${fileUri}`);
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
      setOfflineTileUrl(`pmtiles://${fileUri}`);
    }

    Promise.all([
      resolveGeoJson(),
      resolveOfflineMap(),
      resolveOfflineFonts().then((dir) => setFontBaseDir(dir)),
    ])
      .then(() => setLoadState("ready"))
      .catch((err) => {
        console.error("❌ Failed to load map assets:", err);
        setLoadState("error");
      });
  }, [reloadKey]);

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
    toggleOffline: () => setForceOffline((v: boolean) => !v),
    exportHikeData,
    startBackgroundTracking,
    stopBackgroundTracking,
  }));

  const actuallyOffline = forceOffline || !isOnline;

  if (loadState === "error") {
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

  if (loadState === "loading" || !geoJsonUrl || (actuallyOffline && !offlineTileUrl)) {
    return <LoadingScreen />;
  }

  const activeStyle: StyleSpecification | string = (actuallyOffline && offlineTileUrl && fontBaseDir)
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

        {/* ✅ Red dashed line will only draw when routeCoordinates actually receives data */}
        {routeCoordinates.length >= 2 && (
          <GeoJSONSource
            id="walkedPathSource"
            data={{
              type: "Feature",
              geometry: { type: "LineString", coordinates: routeCoordinates },
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

        {/* Render other group hikers on the map */}
        {hikerLocations && hikerLocations.map((hiker: HikerLocation) => {
          // Skip if coordinate is invalid or is the current user
          if (!hiker || !hiker.latitude || !hiker.longitude) return null;
          if (currentUserId && hiker.id === currentUserId) return null;

          const initials = hiker.hikerName
            ? hiker.hikerName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
            : '?';

          return (
            <Marker
              key={`hiker-${hiker.id}`}
              id={`hiker-${hiker.id}`}
              lngLat={[hiker.longitude, hiker.latitude]}
            >
              <View style={styles.hikerMarkerContainer}>
                <View style={styles.hikerMarkerCircle}>
                  <Text style={styles.hikerMarkerInitials}>{initials}</Text>
                </View>
                {hiker.hikerName && (
                  <View style={styles.hikerMarkerLabel}>
                    <Text style={styles.hikerMarkerLabelText} numberOfLines={1}>
                      {hiker.hikerName}
                    </Text>
                  </View>
                )}
              </View>
            </Marker>
          );
        })}
      </Map>
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
  hikerMarkerLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF', // High-contrast crisp white text
    letterSpacing: 0.2,
  },
});

const mapStyles: {
  trailLine: LineLayerStyle;
  walkedPathStyle: LineLayerStyle;
} = {
  trailLine: { lineColor: "#228B22", lineWidth: 4, lineCap: "round", lineJoin: "round" },
  walkedPathStyle: { lineColor: "#FF5722", lineWidth: 4, lineCap: "round", lineJoin: "round", lineDasharray: [2, 2] },
};

export default TrailMap;