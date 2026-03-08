import MapLibreGL, { UserTrackingMode } from "@maplibre/maplibre-react-native";
import { useAssets } from "expo-asset";
import * as Location from "expo-location";
import * as Network from "expo-network";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { buildOfflineStyle } from "./offlineStyle";
import { onlineStyle } from "./onlineStyle";

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
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [forceOffline, setForceOffline] = useState(false);

  // State to hold the active coordinates for your Firebase database
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );

  const [assets] = useAssets([
    require("../../assets/tiles/thrail-offline-map.pmtiles"),
  ]);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    (async () => {
      // 1. Ask for permission with the strict Settings fallback
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Location Required",
          "Thrail needs your GPS to track your hike. Please enable it in your phone settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }

      setPermissionGranted(true);

      // 2. The Mountain-Optimized Tracker for Database Logging
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5, // MAGIC NUMBER: Only update if they walk 5 meters
          timeInterval: 5000, // Check no faster than every 5 seconds
        },
        (location) => {
          const currentCoords: [number, number] = [
            location.coords.longitude,
            location.coords.latitude,
          ];
          console.log("Hiker moved 5m! New Coords:", currentCoords);
          setUserLocation(currentCoords);

          // TODO: Write your Firebase logic here to save currentCoords to the database!
        },
      );

      // 3. Initial Network Check
      const networkState = await Network.getNetworkStateAsync();
      setIsOnline(!!networkState.isInternetReachable);
    })();

    // Cleanup the GPS watcher when they leave the map screen
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  if (!assets || !assets[0]?.localUri) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading Map Data...</Text>
      </View>
    );
  }

  const offlineTileUrl = `pmtiles://${assets[0].localUri}`;
  const actuallyOffline = forceOffline || !isOnline;

  return (
    <View style={styles.page}>
      {/* Network Status / Test Toggle Bar */}
      <TouchableOpacity
        style={[
          styles.statusBar,
          { backgroundColor: actuallyOffline ? "#d9534f" : "#5cb85c" },
        ]}
        onPress={() => setForceOffline(!forceOffline)}
      >
        <Text style={styles.statusText}>
          {actuallyOffline
            ? "📶 OFFLINE MODE (Tap to switch)"
            : "🌐 ONLINE: MapTiler (Tap to simulate Offline)"}
        </Text>
      </TouchableOpacity>

      <MapLibreGL.MapView
        style={styles.map}
        logoEnabled={true}
        attributionEnabled={true}
        mapStyle={
          actuallyOffline
            ? buildOfflineStyle(offlineTileUrl, MAPTILER_KEY as string)
            : onlineStyle
        }
      >
        <MapLibreGL.Camera
          zoomLevel={16}
          minZoomLevel={10}
          maxZoomLevel={16}
          animationMode="flyTo"
          animationDuration={2000}
          followUserLocation={true}
          followUserMode={UserTrackingMode.Follow}
        />

        {/* --- CUSTOM THESIS TRAILS --- */}
        <MapLibreGL.ShapeSource id="trailSource" shape={trailsGeoJSON as any}>
          <MapLibreGL.LineLayer
            id="layer-hiking"
            style={
              {
                lineColor: "#228B22",
                lineWidth: 4,
                lineCap: "round",
                lineJoin: "round",
              } as any
            }
          />
        </MapLibreGL.ShapeSource>

        {permissionGranted && (
          <MapLibreGL.UserLocation
            visible={true}
            animated={true}
            showsUserHeadingIndicator={true}
            minDisplacement={5}
          />
        )}
      </MapLibreGL.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1, height: "100%", width: "100%" },
  map: { flex: 1 },
  statusBar: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 44,
    paddingBottom: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  statusText: { color: "white", fontWeight: "bold", fontSize: 14 },
});

export default TrailMap;
