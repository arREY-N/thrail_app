import MapLibreGL, { UserTrackingMode } from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

// Load trail data
const rawMapData = require("../assets/map_data/trails.json");

const trailsGeoJSON = {
  type: "FeatureCollection",
  features: rawMapData.geometries.map((geometry: any) => ({
    type: "Feature",
    geometry,
    properties: {},
  })),
};

const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY;

// MapLibreGL.setAccessToken(null);

const TrailMap = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    (async () => {
      // 1. Ask for permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "We need your location to show where you are!",
        );
        return;
      }
      setPermissionGranted(true);

      // 2. Just try to wake up GPS silently (we won't wait for it)
      Location.getCurrentPositionAsync({}).catch((e) => console.log(e));
    })();
  }, []);

  useEffect(() => {
    fetch(
      `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${MAPTILER_KEY}`,
    )
      .then((r) => console.log("MapTiler status:", r.status))
      .catch((e) => console.log("MapTiler fetch error:", e));
  }, []);

  const hikingTrailStyle = {
    lineColor: "#228B22",
    lineWidth: 3,
    lineCap: "round",
    lineJoin: "round",
  };

  return (
    <View style={styles.page}>
      <MapLibreGL.MapView
        style={styles.map}
        mapStyle={`https://api.maptiler.com/maps/outdoor-v2/style.json?key=${MAPTILER_KEY}`}
        attributionEnabled={true}
        logoEnabled={true}
        logoPosition={{ bottom: 16, left: 16 }}
        attributionPosition={{ bottom: 16, right: 16 }}
      >
        <MapLibreGL.Camera
          zoomLevel={14}
          minZoomLevel={10}
          maxZoomLevel={18}
          animationMode="flyTo"
          animationDuration={2000}
          followUserLocation={true}
          followUserMode={UserTrackingMode.Follow}
        />

        {/* 3. ALWAYS render the Blue Dot component if we have permission.
               It will appear on its own when the GPS signal arrives. */}
        {permissionGranted && (
          <MapLibreGL.UserLocation
            visible={true}
            animated={true}
            showsUserHeadingIndicator={true}
          />
        )}

        <MapLibreGL.ShapeSource id="trailSource" shape={trailsGeoJSON as any}>
          <MapLibreGL.LineLayer
            id="layer-hiking"
            style={hikingTrailStyle as any}
          />
        </MapLibreGL.ShapeSource>
      </MapLibreGL.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1, height: "100%", width: "100%" },
  map: { flex: 1 },
});

export default TrailMap;
