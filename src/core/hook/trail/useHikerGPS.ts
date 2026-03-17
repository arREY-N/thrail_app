import NetInfo from "@react-native-community/netinfo";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { useEffect, useState } from "react";
import {
  Alert,
  AppState,
  Linking,
  PermissionsAndroid,
  Platform,
} from "react-native";
import { exportHikeData, loadWalkedPathCoords, saveToCSV } from "../../utility/hikeStorage";

const LOCATION_TASK = "background-location-task";

// ✅ Background task must be defined outside the hook at the top level
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
  if (error) return;
  const { locations } = data;
  const location = locations[0];

  const lat = location.coords.latitude;
  const lon = location.coords.longitude;
  const alt = location.coords.altitude ?? 0;
  const timestamp = new Date(location.timestamp).toISOString();

  await saveToCSV(lat, lon, alt, timestamp);
});

export const useHikerGPS = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [walkedPath, setWalkedPath] = useState<[number, number][]>([]);

  const loadWalkedPath = async () => {
    const coords = await loadWalkedPathCoords();
    setWalkedPath(coords);
  };

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const GPS_TIMEOUT_MS = 180000; // 3 minutes
    let gpsTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
    let isGpsLost = false;

    const unsubscribeNetwork = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isInternetReachable);
    });

    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextState) => {
        if (nextState === "background" || nextState === "inactive") {
          const timestamp = new Date().toISOString();
          saveToCSV("APP_BACKGROUNDED", "", "", timestamp);
        }
        if (nextState === "active") {
          const timestamp = new Date().toISOString();
          saveToCSV("APP_RESUMED", "", "", timestamp);
          loadWalkedPath(); // Refresh path when returning to app
        }
      },
    );

    // Initial load of the path
    loadWalkedPath();

    (async () => {
      // ✅ Foreground permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location Required", "Please enable GPS in settings.", [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]);
        return;
      }
      setPermissionGranted(true);

      if (Platform.OS === "android" && Platform.Version >= 33) {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
      }

      // ✅ Background permission
      const { status: bgStatus } =
        await Location.requestBackgroundPermissionsAsync();
      if (bgStatus !== "granted") {
        console.log("Background location not granted");
      } else {
        // ✅ Start background task only if permission granted
        await Location.startLocationUpdatesAsync(LOCATION_TASK, {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5,
          timeInterval: 5000,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: "Thrail is recording your hike",
            notificationBody: "GPS is active in the background",
            notificationColor: "#228B22",
          },
        });
        console.log("✅ Background task started");
      }

      // ✅ Foreground location tracking
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 0,
          timeInterval: 2000,
        },
        (location) => {
          const lat = location.coords.latitude;
          const lon = location.coords.longitude;
          const alt = location.coords.altitude ?? 0; // ✅ altitude
          const timestamp = new Date(location.timestamp).toISOString();

          console.log(
            `📍 Location Updated: ${lat}, ${lon}, ${alt}m at ${timestamp}`,
          );

          if (isGpsLost) {
            isGpsLost = false;
            saveToCSV("GPS_SIGNAL_RESTORED", "", "", timestamp);
          }

          if (gpsTimeoutTimer) clearTimeout(gpsTimeoutTimer);
          gpsTimeoutTimer = setTimeout(() => {
            isGpsLost = true;
            const lostTimestamp = new Date().toISOString();
            saveToCSV("GPS_SIGNAL_LOST", "", "", lostTimestamp);
          }, GPS_TIMEOUT_MS);

          if (location.coords.accuracy && location.coords.accuracy > 20) {
            console.log("⚠️ GPS accuracy too low, skipping...");
            return;
          }

          setUserLocation([lon, lat]);
          setWalkedPath((prev) => [...prev, [lon, lat]]);
          saveToCSV(lat, lon, alt, timestamp); // ✅ includes altitude
        },
      );
    })();

    return () => {
      appStateSubscription.remove();
      if (locationSubscription) locationSubscription.remove();
      if (gpsTimeoutTimer) clearTimeout(gpsTimeoutTimer);
      Location.stopLocationUpdatesAsync(LOCATION_TASK); // ✅ stop background task on unmount
      unsubscribeNetwork();
    };
  }, []);

  return {
    permissionGranted,
    isOnline,
    userLocation,
    walkedPath,
    exportHikeData,
  };
};
