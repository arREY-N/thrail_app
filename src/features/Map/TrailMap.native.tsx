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
import { useHikerGPS } from "../../core/hook/trail/useHikerGPS";
import { buildOfflineStyle } from "./offlineStyle";
import { onlineStyle } from "./onlineStyle";

// Natively resolve the .geojson asset without loading a 21MB object into Javascript memory
const rawMapDataAsset = require("../../assets/map_data/trails_3D_final.geojson");
const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY;
const TrailMap = ({ initialLon, initialLat }: any) => {
  // Notice: We don't need userHeading here anymore! MapLibre handles it natively.
  const {
    userLocation,
    routeCoordinates,
    permissionGranted,
    isOnline,
    exportHikeData,
  } = useHikerGPS();

  const [forceOffline, setForceOffline] = useState(true);
  const [isFollowing, setIsFollowing] = useState(true);
  const lastZoomRef = useRef<number>(16);
  const cameraRef = useRef<any>(null);

  const [offlineTileUrl, setOfflineTileUrl] = useState<string>("");
  const [geoJsonUrl, setGeoJsonUrl] = useState<string | null>(null);

  useEffect(() => {
    async function resolveGeoJson() {
      try {
        const geoAsset = Asset.fromModule(rawMapDataAsset);
        await geoAsset.downloadAsync();
        if (geoAsset.localUri) {
          setGeoJsonUrl(geoAsset.localUri);
        }
      } catch (e) {
        console.warn("Failed to load map geojson asset:", e);
      }
    }

    async function resolveOfflineMap() {
      try {
        const fileUri = `${FileSystem.documentDirectory}thrail-offline-map.pmtiles`;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);

        if (fileInfo.exists) {
          if (fileInfo.size && fileInfo.size > 30000000) {
            console.log("✅ Offline map cache is healthy! Bypassing download.");
            setOfflineTileUrl(`pmtiles://${fileUri}`);
            return;
          } else {
            console.log("⚠️ Found corrupted/incomplete map cache. Deleting and retrying...");
            await FileSystem.deleteAsync(fileUri, { idempotent: true });
          }
        }

        console.log("⬇️ Starting cache process for offline map...");
        const asset = Asset.fromModule(
          require("../../assets/tiles/thrail-offline-map.pmtiles"),
        );
        await asset.downloadAsync();

        if (asset.localUri) {
          await FileSystem.copyAsync({ from: asset.localUri, to: fileUri });
          console.log("✅ Successfully copied map to Document Directory!");
          setOfflineTileUrl(`pmtiles://${fileUri}`);
        } else {
          throw new Error("Asset failed to generate a localUri");
        }
      } catch (error) {
        console.warn("CRITICAL: Failed to cache the offline map:", error);
      }
    }

    // Run them in parallel!
    Promise.all([resolveGeoJson(), resolveOfflineMap()]);
  }, []);

  // Fly to Trail
  useEffect(() => {
    const parsedLon = Number(initialLon);
    const parsedLat = Number(initialLat);

    if (initialLon && initialLat && !isNaN(parsedLon) && !isNaN(parsedLat)) {
      const timer = setTimeout(() => {
        setIsFollowing(false);
        cameraRef.current?.setCamera({
          centerCoordinate: [parsedLon, parsedLat],
          zoomLevel: 14,
          animationDuration: 1000,
          animationMode: "flyTo",
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialLon, initialLat]);

  const centerOnUser = () => {
    cameraRef.current?.setCamera({
      centerCoordinate: userLocation,
      zoomLevel: 18,
      animationMode: "flyTo",
      animationDuration: 500,
    });
    setIsFollowing(true);
  };

  const actuallyOffline = forceOffline || !isOnline;
  const isDownloadingOfflineMap = actuallyOffline && offlineTileUrl === "";

  if (isDownloadingOfflineMap || !geoJsonUrl) {
    return <LoadingScreen />;
  }

  const activeStyle = actuallyOffline
    ? buildOfflineStyle(offlineTileUrl, MAPTILER_KEY as string)
    : onlineStyle;

  return (
    <View style={styles.page as any}>
      {/* --- FLOATING STATUS PILL --- */}
      <View style={styles.topControlContainer as any}>
        <TouchableOpacity
          style={styles.statusPill as any}
          onPress={() => setForceOffline(!forceOffline)}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name={actuallyOffline ? "cloud-off" : "public"}
            size={18}
            color={actuallyOffline ? "#d9534f" : "#4A6B2A"}
          />
          <Text
            style={[
              styles.statusText as any,
              { color: actuallyOffline ? "#d9534f" : "#4A6B2A" },
            ]}
          >
            {actuallyOffline ? "Offline Mode" : "Online: MapTiler"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* --- MAIN MAP --- */}
      <MapLibreGL.MapView
        style={styles.map as any}
        logoEnabled={true}
        attributionEnabled={true}
        mapStyle={activeStyle}
        onRegionWillChange={(event) => {
          if (event.properties.isUserInteraction) {
            const newZoom = event.properties.zoomLevel;
            const isZoomOnly = Math.abs(newZoom - lastZoomRef.current) > 0.1;
            lastZoomRef.current = newZoom;

            if (isZoomOnly) {
              setIsFollowing(false);
            }
          }
        }}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{ zoomLevel: 16 }}
          minZoomLevel={10}
          maxZoomLevel={20}
          animationMode="flyTo"
          animationDuration={500}
          followUserMode={
            isFollowing
              ? MapLibreGL.UserTrackingMode.FollowWithCourse
              : undefined
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
              geometry: {
                type: "LineString",
                coordinates: routeCoordinates,
              },
              properties: {},
            }}
          >
            <MapLibreGL.LineLayer
              id="layer-walked-path"
              style={mapStyles.walkedPathStyle as any}
            />
          </MapLibreGL.ShapeSource>
        )}

        {/* --- NATIVE COMPASS BLUE DOT (Zero Glitching!) --- */}
        {permissionGranted && (
          <MapLibreGL.UserLocation
            visible={true}
            renderMode={MapLibreGL.UserLocationRenderMode.Native}
            showsUserHeadingIndicator={true}
            androidRenderMode="compass" // Adds the smooth directional cone
          />
        )}
      </MapLibreGL.MapView>

      {/* --- FLOATING BUTTON --- */}
      <TouchableOpacity
        style={styles.recenterButton as any}
        onPress={centerOnUser}
      >
        {/* NEW: The icon turns Blue when it's actively tracking you, and dark grey when you are panning around */}
        <MaterialIcons
          name="my-location"
          size={24}
          color={isFollowing ? "#0084FF" : "#333"}
        />
      </TouchableOpacity>

      {/* --- EXPORT CSV BUTTON --- */}
      <TouchableOpacity style={styles.exportButton} onPress={exportHikeData}>
        <MaterialIcons name="save-alt" size={24} color="#333" />
      </TouchableOpacity>
    </View>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  page: { flex: 1, height: "100%", width: "100%" },
  map: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  topControlContainer: {
    position: "absolute",
    top: Platform.OS === "android" ? StatusBar.currentHeight! + 10 : 54,
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
  downloadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(248, 244, 240, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5, // Behind the top pill but above the map
  },
  downloadCard: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    width: "80%",
  },
  downloadText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 12,
    textAlign: "center",
  },
  downloadSubText: {
    fontSize: 13,
    color: "#666",
    marginTop: 6,
    textAlign: "center",
  },
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
    lineColor: "#FF5722", // Deep Vibrant Orange for user's recorded path
    lineWidth: 4,
    lineCap: "round",
    lineJoin: "round",
    lineDasharray: [2, 2], // Dashed to distinguish from solid map trails
  },
};

export default TrailMap;
