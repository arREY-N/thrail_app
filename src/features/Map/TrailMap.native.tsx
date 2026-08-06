import { MaterialIcons } from "@expo/vector-icons";
import MapLibreGL from "@maplibre/maplibre-react-native";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

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

const TrailMap = forwardRef(({ initialLon, initialLat, showControls = true, showRecenter = false, bottomInset = 280, hikerLocations = [], currentUserId }: any, ref) => {
  const {
    userLocation,
    routeCoordinates,
    permissionGranted,
    isOnline,
    exportHikeData,
    initForegroundGps,
    startBackgroundTracking,
    stopBackgroundTracking,
  } = useHikerGPS();

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

  const cameraRef = useRef<any>(null);
  const lastZoomRef = useRef<number>(16);
  const lastCenterRef = useRef<[number, number] | null>(null);

  // ✅ Pre-warm GPS on mount so the blue dot appears instantly
  useEffect(() => {
    initForegroundGps();
  }, []);

  useEffect(() => {
    async function resolveGeoJson() {
      const geoAsset = Asset.fromModule(rawMapDataAsset);
      await geoAsset.downloadAsync();
      if (geoAsset.localUri) setGeoJsonUrl(geoAsset.localUri);
    }

    async function resolveOfflineMap() {
      const fileUri = `${FileSystem.documentDirectory ?? ""}thrail-offline-map.pmtiles`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (fileInfo.exists && fileInfo.size && fileInfo.size > MIN_PMTILES_SIZE_BYTES) {
        console.log("✅ Offline map cache is healthy.");
        setOfflineTileUrl(`pmtiles://${fileUri}`);
        return;
      }

      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      }

      const asset = Asset.fromModule(require("../../assets/tiles/thrail-offline-map.pmtiles"));

      try {
        await asset.downloadAsync();
      } catch (e) {
        console.warn("⚠️ asset.downloadAsync() failed, falling back...");
      }

      if (asset.localUri) {
        await FileSystem.copyAsync({ from: asset.localUri, to: fileUri });
      } else {
        let downloadSuccess = false;
        let retries = 3;
        while (!downloadSuccess && retries > 0) {
          try {
            await FileSystem.downloadAsync(asset.uri, fileUri);
            downloadSuccess = true;
          } catch (e) {
            retries -= 1;
            if (retries > 0) await new Promise((r) => setTimeout(r, 2000));
          }
        }
      }
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
  }, []);

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

  const centerOnUser = () => {
    cameraRef.current?.setCamera({
      centerCoordinate: userLocation,
      zoomLevel: 18,
      animationMode: "flyTo",
      animationDuration: 500,
    });
    setIsFollowing(true);
  };

  const centerOnCoordinate = (lon: number, lat: number) => {
    setIsFollowing(false);
    cameraRef.current?.setCamera({
      centerCoordinate: [lon, lat],
      zoomLevel: 17,
      animationMode: "flyTo",
      animationDuration: 800,
    });
  };

  const handleRegionWillChange = (event: any) => {
    if (!event.properties.isUserInteraction) return;

    const newZoom = event.properties.zoomLevel;
    const [newLon, newLat] = event.geometry.coordinates;
    const zoomChanged = Math.abs(newZoom - lastZoomRef.current) > 0.1;
    const centerChanged = lastCenterRef.current
      ? Math.abs(newLon - lastCenterRef.current[0]) > 0.0001 || Math.abs(newLat - lastCenterRef.current[1]) > 0.0001
      : false;

    lastZoomRef.current = newZoom;
    lastCenterRef.current = [newLon, newLat];

    if (centerChanged && !zoomChanged) {
      setIsFollowing(false);
    }
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
        <Text style={styles.errorText}>Failed to load map.{"\n"}Please restart the app.</Text>
      </View>
    );
  }

  if (loadState === "loading" || !geoJsonUrl || (actuallyOffline && !offlineTileUrl)) {
    return <LoadingScreen />;
  }

  const activeStyle: any = (actuallyOffline && offlineTileUrl && fontBaseDir)
    ? buildOfflineStyle(offlineTileUrl, fontBaseDir)
    : onlineStyle;

  return (
    <View style={styles.page}>
      <MapLibreGL.MapView
        style={styles.map}
        logoEnabled={true}
        attributionEnabled={true}
        logoPosition={{ bottom: bottomInset, left: 16 }}
        attributionPosition={{ bottom: bottomInset, left: 100 }}
        compassEnabled={true}
        compassViewPosition={3}
        compassViewMargins={{ x: 16, y: bottomInset + 120 }}
        mapStyle={activeStyle as any}
        onDidFinishLoadingMap={() => setMapReady(true)}
        onRegionWillChange={handleRegionWillChange}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{
            zoomLevel: hasInitialCoords ? 12 : 16,
            centerCoordinate: hasInitialCoords ? [parsedLon, parsedLat] : [120.9842, 14.5995],
          }}
          minZoomLevel={10}
          maxZoomLevel={20}
          animationMode="flyTo"
          animationDuration={500}
          followUserMode={isFollowing && permissionGranted ? MapLibreGL.UserTrackingMode.Follow : undefined}
          followUserLocation={isFollowing && permissionGranted}
        />

        {geoJsonUrl && (
          <MapLibreGL.ShapeSource id="trailSource" url={geoJsonUrl}>
            <MapLibreGL.LineLayer id="layer-hiking" style={mapStyles.trailLine as any} />
          </MapLibreGL.ShapeSource>
        )}

        {/* ✅ Red dashed line will only draw when routeCoordinates actually receives data */}
        {routeCoordinates.length >= 2 && (
          <MapLibreGL.ShapeSource
            id="walkedPathSource"
            shape={{
              type: "Feature",
              geometry: { type: "LineString", coordinates: routeCoordinates },
              properties: {},
            }}
          >
            <MapLibreGL.LineLayer id="layer-walked-path" style={mapStyles.walkedPathStyle as any} />
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

        {/* Render other group hikers on the map */}
        {hikerLocations && hikerLocations.map((hiker: any) => {
          // Skip if coordinate is invalid or is the current user
          if (!hiker || !hiker.latitude || !hiker.longitude) return null;
          if (currentUserId && hiker.id === currentUserId) return null;

          const initials = hiker.hikerName 
            ? hiker.hikerName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() 
            : '?';

          return (
            <MapLibreGL.PointAnnotation
              key={`hiker-${hiker.id}`}
              id={`hiker-${hiker.id}`}
              coordinate={[hiker.longitude, hiker.latitude]}
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
            </MapLibreGL.PointAnnotation>
          );
        })}
      </MapLibreGL.MapView>
    </View>
  );
});

const styles = StyleSheet.create({
  page: { flex: 1, height: "100%", width: "100%" },
  map: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  errorText: { marginTop: 16, fontSize: 15, color: "#555", textAlign: "center", lineHeight: 22 },

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

const mapStyles = {
  trailLine: { lineColor: "#228B22", lineWidth: 4, lineCap: "round", lineJoin: "round" },
  walkedPathStyle: { lineColor: "#FF5722", lineWidth: 4, lineCap: "round", lineJoin: "round", lineDasharray: [2, 2] },
};

export default TrailMap;