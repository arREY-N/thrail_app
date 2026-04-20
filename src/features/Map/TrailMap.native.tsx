import { MaterialIcons } from "@expo/vector-icons";
import MapLibreGL from "@maplibre/maplibre-react-native";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import React, { useEffect, useRef, useState } from "react";
import {
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import LoadingScreen from "@/src/app/loading";
import { resolveOfflineFonts } from "@/src/utils/resolveOfflineFonts";
import { useHikerGPS } from "../../core/hook/trail/useHikerGPS";
import { buildOfflineStyle } from "./offlineStyle";
import { onlineStyle } from "./onlineStyle";

const rawMapDataAsset = require("../../assets/map_data/trails_3D_final_v2.geojson");
const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY;

// Minimum valid PMTiles size — adjust if your file is smaller
const MIN_PMTILES_SIZE_BYTES = 18_000_000;

type LoadState = "loading" | "ready" | "error";

/**
 * The primary map interface for native platforms (iOS/Android).
 * Handles dual-mode map rendering (Online/Offline), GPS tracking,
 * breadcrumb visualization, and automated asset caching.
 *
 * @component
 * @param {Object} props
 * @param {number|number[]|string|string[]} [props.initialLon] - Starting longitude. If provided, the map will fly to this location on mount.
 * @param {number|number[]|string|string[]} [props.initialLat] - Starting latitude. If provided, the map will fly to this location on mount.
 */
const TrailMap = ({ initialLon, initialLat }: any) => {
  const {
    userLocation,
    routeCoordinates,
    permissionGranted,
    isOnline,
    exportHikeData,
  } = useHikerGPS();

  const lonStr = Array.isArray(initialLon) ? initialLon[0] : initialLon;
  const latStr = Array.isArray(initialLat) ? initialLat[0] : initialLat;
  const parsedLon = Number(lonStr);
  const parsedLat = Number(latStr);
  const hasInitialCoords = !!(
    lonStr &&
    latStr &&
    !isNaN(parsedLon) &&
    !isNaN(parsedLat)
  );

  const [forceOffline, setForceOffline] = useState(true);
  const [isFollowing, setIsFollowing] = useState(!hasInitialCoords);
  const [mapReady, setMapReady] = useState(false);
  const [offlineTileUrl, setOfflineTileUrl] = useState<string>("");
  const [geoJsonUrl, setGeoJsonUrl] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [fontBaseDir, setFontBaseDir] = useState<string>("");

  const cameraRef = useRef<any>(null);
  const lastZoomRef = useRef<number>(16);
  // Track the last region center to detect panning vs zooming
  const lastCenterRef = useRef<[number, number] | null>(null);

  /**
   * Resolves map assets on mount:
   * 1. Downloads/locates the trail GeoJSON.
   * 2. Checks/caches the offline PMTiles tileset in the device's document directory.
   */
  useEffect(() => {
    /** Downloads and localizes the trail GeoJSON asset */
    async function resolveGeoJson() {
      const geoAsset = Asset.fromModule(rawMapDataAsset);
      await geoAsset.downloadAsync();
      if (geoAsset.localUri) setGeoJsonUrl(geoAsset.localUri);
    }

    /**
     * Ensures the offline PMTiles file is cached in persistent storage.
     * Validates cache health and re-downloads if necessary.
     */
    async function resolveOfflineMap() {
      const fileUri = `${FileSystem.documentDirectory}thrail-offline-map.pmtiles`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (
        fileInfo.exists &&
        fileInfo.size &&
        fileInfo.size > MIN_PMTILES_SIZE_BYTES
      ) {
        console.log("✅ Offline map cache is healthy.");
        setOfflineTileUrl(`pmtiles://${fileUri}`);
        return;
      }

      if (fileInfo.exists) {
        console.log("⚠️ Stale/corrupt cache found, re-downloading...");
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      }

      console.log("⬇️ Caching offline map...");
      const asset = Asset.fromModule(
        require("../../assets/tiles/thrail-offline-map.pmtiles"),
      );

      if (asset.localUri) {
        await FileSystem.copyAsync({ from: asset.localUri, to: fileUri });
      } else {
        // Retry logic for unstable development connections (e.g. emulator downloading 35MB from Metro)
        let downloadSuccess = false;
        let retries = 3;
        let lastError;

        while (!downloadSuccess && retries > 0) {
          try {
            console.log(`Downloading offline map... attempts left: ${retries}`);
            await FileSystem.downloadAsync(asset.uri, fileUri);
            downloadSuccess = true;
          } catch (e) {
            lastError = e;
            retries -= 1;
            console.warn(`⚠️ Download failed. Retries left: ${retries}`, e);
            if (retries > 0) {
              await new Promise((r) => setTimeout(r, 2000));
            }
          }
        }

        if (!downloadSuccess) {
          throw (
            lastError ||
            new Error("Failed to download offline map after retries.")
          );
        }
      }

      console.log("✅ Offline map cached.");
      setOfflineTileUrl(`pmtiles://${fileUri}`);
    }

    Promise.all([
      resolveGeoJson(),
      resolveOfflineMap(),
      resolveOfflineFonts().then(setFontBaseDir),
    ])
      .then(() => setLoadState("ready"))
      .catch((err) => {
        console.error("❌ Failed to load map assets:", err);
        setLoadState("error");
      });
  }, []);

  // Fly to trail on map ready
  useEffect(() => {
    if (!mapReady || !hasInitialCoords) return;
    setIsFollowing(false);
    cameraRef.current?.setCamera({
      centerCoordinate: [parsedLon, parsedLat],
      zoomLevel: 14,
      animationDuration: 800,
      animationMode: "flyTo",
    });
  }, [hasInitialCoords, parsedLon, parsedLat, mapReady]);

  /**
   * Animates the camera to the user's current location and enables follow mode.
   */
  const centerOnUser = () => {
    cameraRef.current?.setCamera({
      centerCoordinate: userLocation,
      zoomLevel: 18,
      animationMode: "flyTo",
      animationDuration: 500,
    });
    setIsFollowing(true);
  };

  // ✅ Fixed: unfollow on PAN, not zoom
  /**
   * Handles map movement events. Disables follow mode only if the user
   * performs a pan interaction, allowing zoom gestures to maintain focus.
   *
   * @param {Object} event - The MapLibre region change event.
   */
  const handleRegionWillChange = (event: any) => {
    if (!event.properties.isUserInteraction) return;

    const newZoom = event.properties.zoomLevel;
    const [newLon, newLat] = event.geometry.coordinates;
    const zoomChanged = Math.abs(newZoom - lastZoomRef.current) > 0.1;
    const centerChanged = lastCenterRef.current
      ? Math.abs(newLon - lastCenterRef.current[0]) > 0.0001 ||
        Math.abs(newLat - lastCenterRef.current[1]) > 0.0001
      : false;

    lastZoomRef.current = newZoom;
    lastCenterRef.current = [newLon, newLat];

    // Only unfollow if the user actually panned (center moved without zoom change)
    if (centerChanged && !zoomChanged) {
      setIsFollowing(false);
    }
  };

  const actuallyOffline = forceOffline || !isOnline;

  // --- Loading / Error gates ---
  if (loadState === "error") {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="cloud-off" size={48} color="#d9534f" />
        <Text style={styles.errorText}>
          Failed to load map.{"\n"}Please restart the app.
        </Text>
      </View>
    );
  }

  if (
    loadState === "loading" ||
    !geoJsonUrl ||
    (actuallyOffline && !offlineTileUrl)
  ) {
    return <LoadingScreen />;
  }

  const activeStyle = actuallyOffline
    ? buildOfflineStyle(offlineTileUrl, fontBaseDir) // ✅ No maptilerKey needed offline
    : onlineStyle;

  return (
    <View style={styles.page}>
      {/* STATUS PILL */}
      <View style={styles.topControlContainer}>
        <TouchableOpacity
          style={styles.statusPill}
          onPress={() => setForceOffline((v) => !v)}
          activeOpacity={0.8}
          accessibilityLabel="Toggle offline mode"
          accessibilityHint="Double tap to switch between online and offline map"
        >
          <MaterialIcons
            name={actuallyOffline ? "cloud-off" : "public"}
            size={18}
            color={actuallyOffline ? "#d9534f" : "#4A6B2A"}
          />
          <Text
            style={[
              styles.statusText,
              { color: actuallyOffline ? "#d9534f" : "#4A6B2A" },
            ]}
          >
            {actuallyOffline ? "Offline Mode" : "Online: MapTiler"}
          </Text>
        </TouchableOpacity>
      </View>

      <MapLibreGL.MapView
        style={styles.map}
        logoEnabled={true}
        attributionEnabled={true}
        mapStyle={activeStyle as any}
        compassEnabled={true}
        compassViewPosition={1}
        compassViewMargins={{
          x: 20,
          y:
            Platform.OS === "android"
              ? (StatusBar.currentHeight ?? 24) + 50
              : 70,
        }}
        onDidFinishLoadingMap={() => setMapReady(true)}
        onRegionWillChange={handleRegionWillChange}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{
            zoomLevel: hasInitialCoords ? 12 : 16,
            centerCoordinate: hasInitialCoords
              ? [parsedLon, parsedLat]
              : undefined,
          }}
          minZoomLevel={10}
          maxZoomLevel={20}
          animationMode="flyTo"
          animationDuration={500}
          // ✅ Use Follow (not FollowWithCourse) to avoid heading jitter when stationary
          followUserMode={
            isFollowing ? MapLibreGL.UserTrackingMode.Follow : undefined
          }
          followUserLocation={isFollowing}
        />

        {geoJsonUrl && (
          <MapLibreGL.ShapeSource id="trailSource" url={geoJsonUrl}>
            <MapLibreGL.LineLayer
              id="layer-hiking"
              style={mapStyles.trailLine as any}
            />
          </MapLibreGL.ShapeSource>
        )}

        {routeCoordinates.length >= 2 && (
          <MapLibreGL.ShapeSource
            id="walkedPathSource"
            shape={{
              type: "Feature",
              geometry: { type: "LineString", coordinates: routeCoordinates },
              properties: {},
            }}
          >
            <MapLibreGL.LineLayer
              id="layer-walked-path"
              style={mapStyles.walkedPathStyle as any}
            />
          </MapLibreGL.ShapeSource>
        )}

        {permissionGranted && (
          <MapLibreGL.UserLocation
            visible={true}
            renderMode={MapLibreGL.UserLocationRenderMode.Native}
            showsUserHeadingIndicator={true}
            androidRenderMode="compass"
          />
        )}
      </MapLibreGL.MapView>

      {/* RECENTER */}
      <TouchableOpacity style={styles.recenterButton} onPress={centerOnUser}>
        <MaterialIcons
          name="my-location"
          size={24}
          color={isFollowing ? "#0084FF" : "#333"}
        />
      </TouchableOpacity>

      {/* EXPORT */}
      <TouchableOpacity style={styles.exportButton} onPress={exportHikeData}>
        <MaterialIcons name="save-alt" size={24} color="#333" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1, height: "100%", width: "100%" },
  map: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
  },
  topControlContainer: {
    position: "absolute",
    top: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 10 : 54,
    width: "100%",
    alignItems: "center",
    zIndex: 10,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    gap: 8,
  },
  statusText: { fontWeight: "700", fontSize: 13, letterSpacing: 0.5 },
  recenterButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "white",
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  exportButton: {
    position: "absolute",
    bottom: 90,
    right: 20,
    backgroundColor: "white",
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

const mapStyles = {
  trailLine: {
    lineColor: "#228B22",
    lineWidth: 4,
    lineCap: "round",
    lineJoin: "round",
  },
  walkedPathStyle: {
    lineColor: "#FF5722",
    lineWidth: 4,
    lineCap: "round",
    lineJoin: "round",
    lineDasharray: [2, 2],
  },
};

export default TrailMap;
