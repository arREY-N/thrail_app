import { MaterialIcons } from "@expo/vector-icons";
import MapLibreGL from "@maplibre/maplibre-react-native";
import { useAssets } from "expo-asset";
import React, { useRef, useState } from "react";
import {
  Alert,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { buildOfflineStyle } from "./offlineStyle";
import { onlineStyle } from "./onlineStyle";
import { useHikerGPS } from "./useHikerGPS";

// Load trail data
const rawMapData = require("../../assets/map_data/trails.json");
const trailsGeoJSON = {
  type: "FeatureCollection",
  features: rawMapData.geometries.map((geometry: any) => ({
    type: "Feature",
    geometry,
    properties: {},
  })),
};

const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY;

const TrailMap = () => {
  // Notice: We don't need userHeading here anymore! MapLibre handles it natively.
  const { userLocation, permissionGranted, isOnline, exportHikeData } =
    useHikerGPS();

  const [forceOffline, setForceOffline] = useState(true);
  // NEW: State to track if the camera should be locked onto the user
  const [isFollowing, setIsFollowing] = useState(true);
  const lastZoomRef = useRef<number>(16);
  const cameraRef = useRef<any>(null);
  const [assets] = useAssets([
    require("../../assets/tiles/thrail-offline-map.pmtiles"),
  ]);

  if (!assets || !assets[0]?.localUri) {
    return (
      <View style={styles.centered as any}>
        <Text>Loading Map Data...</Text>
      </View>
    );
  }

  const centerOnUser = () => {
    // if (!userLocation) {
    //   Alert.alert(
    //     "Waiting for GPS",
    //     "We haven't found your exact location yet.",
    //   );
    //   return;
    // }
    cameraRef.current?.setCamera({
      centerCoordinate: userLocation,
      zoomLevel: 18,
      animationMode: "flyTo",
      animationDuration: 500,
    });
    setIsFollowing(true);
  };

  const offlineTileUrl = `pmtiles://${assets[0].localUri}`;
  const actuallyOffline = forceOffline || !isOnline;

  return (
    <View style={styles.page as any}>
      {/* --- STATUS BAR --- */}
      <TouchableOpacity
        style={[
          styles.statusBar as any,
          { backgroundColor: actuallyOffline ? "#d9534f" : "#5cb85c" },
        ]}
        onPress={() => setForceOffline(!forceOffline)}
      >
        <Text style={styles.statusText as any}>
          {actuallyOffline
            ? "📶 OFFLINE MODE (Tap to switch)"
            : "🌐 ONLINE: MapTiler (Tap to simulate Offline)"}
        </Text>
      </TouchableOpacity>

      {/* --- MAIN MAP --- */}
      <MapLibreGL.MapView
        style={styles.map as any}
        logoEnabled={true}
        attributionEnabled={true}
        mapStyle={
          actuallyOffline
            ? buildOfflineStyle(offlineTileUrl, MAPTILER_KEY as string)
            : onlineStyle
        }
        // NEW: If the user touches the screen to pan, stop following them!
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
          // NEW: Use followUserLocation instead of centerCoordinate!
          followUserMode={
            isFollowing
              ? MapLibreGL.UserTrackingMode.FollowWithHeading
              : undefined
          }
          followUserLocation={isFollowing}
        />

        <MapLibreGL.ShapeSource id="trailSource" shape={trailsGeoJSON as any}>
          <MapLibreGL.LineLayer
            id="layer-hiking"
            style={mapStyles.trailLine as any}
          />
        </MapLibreGL.ShapeSource>

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
  statusBar: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 44,
    paddingBottom: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  statusText: { color: "white", fontWeight: "bold", fontSize: 14 },
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
};

export default TrailMap;
