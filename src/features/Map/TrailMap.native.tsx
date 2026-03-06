import MapLibreGL, { UserTrackingMode } from "@maplibre/maplibre-react-native";
import { useAssets } from "expo-asset";
import * as Location from "expo-location";
import * as Network from "expo-network";
import React, { useEffect, useState } from "react";
import {
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

  const [assets] = useAssets([
    require("../../assets/tiles/thrail-offline-map.pmtiles"),
  ]);

  useEffect(() => {
    (async () => {
      // 1. Ask for permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setPermissionGranted(true);
        Location.getCurrentPositionAsync({}).catch((e) => console.log(e));
      }

      const networkState = await Network.getNetworkStateAsync();
      setIsOnline(!!networkState.isInternetReachable);
    })();
  }, []);

  if (!assets || !assets[0]?.localUri) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading Map Data...</Text>
      </View>
    );
  }

  const offlineTileUrl = `pmtiles://${assets[0].localUri}`;

  // Determine which map we are currently using
  const actuallyOffline = forceOffline || !isOnline;

  return (
    <View style={styles.page}>
      {/* / Network Status / Test Toggle Bar / */}
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
        // Conditionally swap the base style!
        mapStyle={
          actuallyOffline
            ? buildOfflineStyle(offlineTileUrl, MAPTILER_KEY as string)
            : onlineStyle
        }
      >
        <MapLibreGL.Camera
          zoomLevel={12}
          minZoomLevel={10}
          maxZoomLevel={16}
          animationMode="flyTo"
          animationDuration={2000}
          followUserLocation={true}
          followUserMode={UserTrackingMode.Follow}
        />

        {/* --- OSM TRAILS (Always visible, online or offline) --- */}
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
    // Add dynamic padding for the notch/system status bar
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
