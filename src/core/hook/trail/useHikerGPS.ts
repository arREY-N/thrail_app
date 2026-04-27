import NetInfo from "@react-native-community/netinfo";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { useEffect, useState, useRef } from "react";
import {
  Alert,
  AppState,
  Linking,
  PermissionsAndroid,
  Platform,
} from "react-native";
import { exportHikeData, saveToCSV } from "../../utility/hikeStorage";
import { LOCATION_TASK } from "../../utility/locationTask";
// NOTE: `loadWalkedPathCoords` (which uses parseCSV) is intentionally NOT imported anymore
import { Location as LocationModel } from "@/src/core/models/Location/Location";
import { useHikesStore } from "@/src/core/stores/hikeStores/hikesStore";
import { HikeState } from "@/src/core/stores/hikeStores/hikeStoreCreator";

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

/**
 * A comprehensive hook that manages real-time and background GPS tracking for hikers.
 *
 * This hook serves as the central location engine for the app, handling:
 * 1. **Service Validation**: Checks if device GPS hardware is enabled.
 * 2. **Permission Management**: Orchestrates Foreground and Background permission requests.
 * 3. **Dual-Mode Tracking**: 
 *    - Foreground: Uses `watchPositionAsync` for low-latency UI updates (map markers).
 *    - Background: Uses `startLocationUpdatesAsync` via a TaskManager task to track progress while the screen is off.
 * 4. **Signal Monitoring**: Detects GPS signal loss (heartbeat) and manages error states in the global store.
 * 5. **Data Persistence**: Automatically logs coordinates to local CSV storage and updates the global Hike store.
 *
 * @returns {Object} An object containing GPS state and control functions.
 * @property {boolean} permissionGranted - True if location permissions (foreground) have been authorized.
 * @property {boolean} isOnline - Real-time network reachability status.
 * @property {[number, number] | null} userLocation - Current `[longitude, latitude]` for immediate map centering.
 * @property {[number, number][]} routeCoordinates - Breadcrumb path of the current session as `[lon, lat]` array.
 * @property {Function} exportHikeData - Utility to trigger a file export of the recorded hike data.
 * @property {() => Promise<void>} onStartGps - Starts the GPS tracking session (foreground and background).
 * @property {() => Promise<void>} onEndGps - Stops the GPS tracking session and cleans up subscriptions.
 */
export const useHikerGPS = () => {
  const addCoordinate = useHikesStore((state: HikeState) => state.addCoordinate);
  const updateHikeStore = useHikesStore((state: HikeState) => state.updateHikeStore);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [walkedPath, setWalkedPath] = useState<[number, number][]>([]);
  
  // Set global store GPS error
  const setGpsError = (msg: string | null) => updateHikeStore({ gpsError: msg });


  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const gpsTimeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appStateSubscription = useRef<any>(null);
  const unsubscribeNetwork = useRef<any>(null);
  const isGpsLost = useRef(false);
  const GPS_TIMEOUT_MS = 180000;

  /* 
   * --- DEPRECATED CSV PARSING LOGIC ---
   * We commented out `loadWalkedPath` and the `parseCSV` logic because it was confusing and is no longer needed.
   * Previously, this function read the raw CSV file to draw the blue line on the map.
   * Now, the red line is drawn purely from the live React state (`walkedPath`) that starts empty 
   * and fills up in real-time as you walk, while `addCoordinate` sends the data to your global store!
   */
  // const loadWalkedPath = async () => {
  //   const coords = await loadWalkedPathCoords();
  //   setWalkedPath(coords);
  // };

  /**
   * Initializes and starts GPS tracking.
   * 
   * This includes:
   * - Checking device GPS hardware status.
   * - Requesting foreground and background permissions.
   * - Starting background location updates via Expo TaskManager.
   * - Subscribing to real-time foreground updates for UI display.
   * - Monitoring network status and app state.
   * 
   * @async
   * @returns {Promise<void>}
   */

  const onStartGps = async () => {
    // Prevent multiple subscriptions
    if (locationSubscription.current) return;

    unsubscribeNetwork.current = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isInternetReachable);
    });

    appStateSubscription.current = AppState.addEventListener(
      "change",
      (nextState) => {
        if (nextState === "background" || nextState === "inactive") {
          const timestamp = new Date().toISOString();
          saveToCSV("APP_BACKGROUNDED", "", "", timestamp);
        }
        if (nextState === "active") {
          const timestamp = new Date().toISOString();
          saveToCSV("APP_RESUMED", "", "", timestamp);
        }
      },
    );

    try {
      // ✅ Check if GPS services are actually enabled on device
      const isGpsEnabled = await Location.hasServicesEnabledAsync();
      if (!isGpsEnabled) {
        setGpsError("Device GPS is turned off. Please enable it in your phone settings.");
        Alert.alert(
          "GPS Disabled",
          "Your device's GPS services are turned off. Please enable them to track your hike.",
          [{ text: "OK", style: "default" }]
        );
        return;
      }

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
      locationSubscription.current = await Location.watchPositionAsync(
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

          if (isGpsLost.current) {
            isGpsLost.current = false;
            setGpsError(null);
            saveToCSV("GPS_SIGNAL_RESTORED", "", "", timestamp);
          }

          if (gpsTimeoutTimer.current) clearTimeout(gpsTimeoutTimer.current);
          gpsTimeoutTimer.current = setTimeout(() => {
            isGpsLost.current = true;
            setGpsError("GPS signal lost. Searching for satellites...");
            const lostTimestamp = new Date().toISOString();
            saveToCSV("GPS_SIGNAL_LOST", "", "", lostTimestamp);
          }, GPS_TIMEOUT_MS);

          if (location.coords.accuracy && location.coords.accuracy > 20) {
            console.log("⚠️ GPS accuracy too low, skipping...");
            return;
          }

          setUserLocation([lon, lat]);
          setRouteCoordinates((prev) => [...prev, [lon, lat]]);
          saveToCSV(lat, lon, alt, timestamp); // ✅ includes altitude

          // Global Store Integration
          addCoordinate(new LocationModel({
            latitude: lat,
            longitude: lon,
            altitude: alt,
            timestamp: new Date(timestamp),
          }));
        },
      );
    } catch (err: any) {
      console.error("Failed to start location tracking:", err);
      setGpsError("Failed to initialize GPS: " + err.message);
    }
  };

  /**
   * Stops all active GPS tracking and cleans up listeners.
   * 
   * This handles:
   * - Removing app state and network listeners.
   * - Stopping foreground location watching.
   * - Stopping the background location task.
   * - Clearing any active GPS signal timeout timers.
   * 
   * @async
   * @returns {Promise<void>}
   */

  const onEndGps = async () => {
    if (appStateSubscription.current) {
      appStateSubscription.current.remove();
      appStateSubscription.current = null;
    }
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    if (gpsTimeoutTimer.current) {
      clearTimeout(gpsTimeoutTimer.current);
      gpsTimeoutTimer.current = null;
    }
    if (unsubscribeNetwork.current) {
      unsubscribeNetwork.current();
      unsubscribeNetwork.current = null;
    }

    try {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK);
      console.log("✅ Background task stopped");
    } catch (err) {
      console.log("Background task wasn't running or already stopped.");
    }
  };

  // Clean up on unmount just in case
  useEffect(() => {
    return () => {
      onEndGps();
    };
  }, []);

  return {
    permissionGranted,
    isOnline,
    userLocation,
    routeCoordinates,
    exportHikeData,
    onStartGps,
    onEndGps,
  };
};
