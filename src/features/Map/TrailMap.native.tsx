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
  const { userLocation, permissionGranted, isOnline, userHeading } =
    useHikerGPS();

  const [forceOffline, setForceOffline] = useState(false);
  const cameraRef = useRef<any>(null);
  const [assets] = useAssets([
    require("../../assets/tiles/thrail-offline-map.pmtiles"),
  ]);

  const centerOnUser = () => {
    if (userLocation && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: userLocation,
        zoomLevel: 16,
        animationDuration: 1000,
      });
    } else {
      Alert.alert(
        "Waiting for GPS",
        "We haven't found your exact location yet.",
      );
    }
  };

  if (!assets || !assets[0]?.localUri) {
    return (
      <View style={styles.centered as any}>
        <Text>Loading Map Data...</Text>
      </View>
    );
  }

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
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{
            zoomLevel: 16,
            centerCoordinate: userLocation || undefined,
          }}
          minZoomLevel={10}
          maxZoomLevel={20}
          animationMode="flyTo"
          animationDuration={500}
        />

        <MapLibreGL.ShapeSource id="trailSource" shape={trailsGeoJSON as any}>
          <MapLibreGL.LineLayer
            id="layer-hiking"
            style={mapStyles.trailLine as any}
          />
        </MapLibreGL.ShapeSource>

        {/* --- CUSTOM COMPASS BLUE DOT --- */}
        {userLocation && permissionGranted && (
          <MapLibreGL.MarkerView
            id="user-location-marker"
            coordinate={userLocation}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            {/* The wrapper view that literally rotates based on the compass! */}
            <View
              style={{
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
                transform: [{ rotate: `${userHeading}deg` }], // Spins the icon!
              }}
            >
              {/* The Pointer Triangle (The "Front") */}
              <View
                style={{
                  width: 0,
                  height: 0,
                  borderLeftWidth: 6,
                  borderRightWidth: 6,
                  borderBottomWidth: 12,
                  borderLeftColor: "transparent",
                  borderRightColor: "transparent",
                  borderBottomColor: "#0084FF", // Matches the blue dot
                  marginBottom: -4, // Pulls the triangle down to connect to the dot
                  zIndex: 2,
                }}
              />

              {/* The Classic Blue Dot */}
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: "#0084FF",
                  borderWidth: 3,
                  borderColor: "#FFFFFF",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 3,
                  elevation: 5,
                  zIndex: 3,
                }}
              />
            </View>
          </MapLibreGL.MarkerView>
        )}
      </MapLibreGL.MapView>

      {/* --- FLOATING BUTTON --- */}
      <TouchableOpacity
        style={styles.recenterButton as any}
        onPress={centerOnUser}
      >
        <MaterialIcons name="my-location" size={24} color="#333" />
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
});

const mapStyles = {
  trailLine: {
    lineColor: "#228B22",
    lineWidth: 4,
    lineCap: "round",
    lineJoin: "round",
  },
  userHalo: {
    circleRadius: 14,
    circleColor: "#FFFFFF",
    circleOpacity: 0.5,
    circlePitchAlignment: "map",
  },
  userDot: {
    circleRadius: 8,
    circleColor: "#0084FF",
    circleStrokeWidth: 2,
    circleStrokeColor: "#FFFFFF",
    circlePitchAlignment: "map",
  },
};

export default TrailMap;
