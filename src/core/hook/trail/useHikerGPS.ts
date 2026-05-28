import NetInfo from "@react-native-community/netinfo";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { useEffect, useRef, useState } from "react";
import { Alert, AppState, Linking, PermissionsAndroid, Platform } from "react-native";

import { Location as LocationModel } from "@/src/core/models/Location/Location";
import { useHikesStore } from "@/src/core/stores/hikeStores/hikesStore";
import { HikeState } from "@/src/core/stores/hikeStores/hikeStoreCreator";
import { exportHikeData, saveToCSV } from "../../utility/hikeStorage";
import { LOCATION_TASK } from "../../utility/locationTask";

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
  const addCoordinate = useHikesStore((state: HikeState) => state.addCoordinate);
  const updateHikeStore = useHikesStore((state: HikeState) => state.updateHikeStore);
  
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  
  const setGpsError = (msg: string | null) => updateHikeStore({ gpsError: msg });

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const gpsTimeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appStateSubscription = useRef<any>(null);
  const unsubscribeNetwork = useRef<any>(null);
  const isGpsLost = useRef(false);
  const GPS_TIMEOUT_MS = 180000;

  /**
   * MODE 1: FOREGROUND PRE-WARMING
   * Gets GPS lock and updates the blue dot on the map.
   * Will ONLY record data and draw the red line if the global store says active === true.
   */
  const initForegroundGps = async () => {
    if (locationSubscription.current) return;

    unsubscribeNetwork.current = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isInternetReachable);
    });

    appStateSubscription.current = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background" || nextState === "inactive") {
        saveToCSV("APP_BACKGROUNDED", "", "", new Date().toISOString());
      }
      if (nextState === "active") {
        saveToCSV("APP_RESUMED", "", "", new Date().toISOString());
      }
    });

    try {
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

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location Required", "Please enable GPS in settings.", [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]);
        return;
      }
      setPermissionGranted(true);

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 0,
          timeInterval: 2000,
        },
        (location) => {
          const lat = location.coords.latitude;
          const lon = location.coords.longitude;
          const alt = location.coords.altitude ?? 0;
          const timestamp = new Date(location.timestamp).toISOString();

          if (isGpsLost.current) {
            isGpsLost.current = false;
            setGpsError(null);
            saveToCSV("GPS_SIGNAL_RESTORED", "", "", timestamp);
          }

          if (gpsTimeoutTimer.current) clearTimeout(gpsTimeoutTimer.current);
          gpsTimeoutTimer.current = setTimeout(() => {
            isGpsLost.current = true;
            setGpsError("GPS signal lost. Searching for satellites...");
            saveToCSV("GPS_SIGNAL_LOST", "", "", new Date().toISOString());
          }, GPS_TIMEOUT_MS);

          if (location.coords.accuracy && location.coords.accuracy > 20) return;

          // Always update the Blue Dot position
          setUserLocation([lon, lat]);

          // ✅ CRITICAL FIX: Only draw line and save data if explicitly recording
          const isRecording = useHikesStore.getState().active;
          if (isRecording) {
            setRouteCoordinates((prev) => [...prev, [lon, lat]]);
            saveToCSV(lat, lon, alt, timestamp);
            
            addCoordinate(new LocationModel({
              latitude: lat,
              longitude: lon,
              altitude: alt,
              timestamp: new Date(timestamp),
            }));
          }
        }
      );
    } catch (err: any) {
      console.error("Failed to start location tracking:", err);
      setGpsError("Failed to initialize GPS: " + err.message);
    }
  };

  /**
   * MODE 2: BACKGROUND TRACKING
   * Starts the TaskManager so tracking continues when screen is off.
   */
  const startBackgroundTracking = async () => {
    try {
      if (Platform.OS === "android" && Platform.Version >= 33) {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }

      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus === "granted") {
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
    } catch (err) {
      console.log("Background tracking failed", err);
    }
  };

  /**
   * Stops the background TaskManager.
   */
  const stopBackgroundTracking = async () => {
    try {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK);
      console.log("✅ Background task stopped");
    } catch (err) {
      // Safely ignore if not running
    }
  };

  // Clean up listeners on unmount
  useEffect(() => {
    return () => {
      if (appStateSubscription.current) appStateSubscription.current.remove();
      if (locationSubscription.current) locationSubscription.current.remove();
      if (gpsTimeoutTimer.current) clearTimeout(gpsTimeoutTimer.current);
      if (unsubscribeNetwork.current) unsubscribeNetwork.current();
      stopBackgroundTracking();
    };
  }, []);

  return {
    permissionGranted,
    isOnline,
    userLocation,
    routeCoordinates,
    exportHikeData,
    initForegroundGps,
    startBackgroundTracking,
    stopBackgroundTracking,
  };
};