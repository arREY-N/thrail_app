import NetInfo from "@react-native-community/netinfo";
import {
  documentDirectory,
  getInfoAsync,
  readAsStringAsync,
  StorageAccessFramework,
  writeAsStringAsync,
} from "expo-file-system/legacy"; // 1. Import the file system
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Alert, AppState, Linking } from "react-native";

// 2. Define where the file will live on the phone
const CSV_FILE_URI = (documentDirectory as string) + "thrail_current_hike.csv";

export const useHikerGPS = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [userHeading, setUserHeading] = useState<number>(0);

  // 3. NEW: The CSV Save Function
  const saveToCSV = async (
    lat: number | string,
    lon: number | string,
    timestamp: string,
  ) => {
    const newRow = `${timestamp},${lat},${lon}\n`;

    try {
      const fileInfo = await getInfoAsync(CSV_FILE_URI);
      let currentContent = "";

      if (!fileInfo.exists) {
        currentContent = "timestamp,latitude,longitude\n";
      } else {
        currentContent = await readAsStringAsync(CSV_FILE_URI);
      }

      await writeAsStringAsync(CSV_FILE_URI, currentContent + newRow);
      console.log("💾 Saved to CSV:", newRow.trim());
    } catch (error) {
      console.log("Error saving to CSV:", error);
    }
  };

  // 5. NEW: Direct Save to Phone Storage
  const exportHikeData = async () => {
    try {
      const fileInfo = await getInfoAsync(CSV_FILE_URI);

      if (!fileInfo.exists) {
        Alert.alert("No Data", "You haven't recorded any hiking data yet!");
        return;
      }

      const permissions =
        await StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (permissions.granted) {
        const fileContent = await readAsStringAsync(CSV_FILE_URI);

        const newFileUri = await StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          "thrail_hike_data.csv",
          "text/csv",
        );

        await writeAsStringAsync(newFileUri, fileContent);
        Alert.alert(
          "Success!",
          "CSV file saved directly to your phone storage!",
        );
      }
    } catch (error) {
      console.log("Error saving file to device:", error);
      Alert.alert("Error", "Could not save the file to your device.");
    }
  };

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    let headingSubscription: Location.LocationSubscription | null = null;

    const GPS_TIMEOUT_MS = 180000;
    let gpsTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
    let isGpsLost = false;

    const unsubscribeNetwork = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isInternetReachable);
    });

    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextState) => {
        if (nextState === "background" || nextState === "inactive") {
          const timestamp = new Date().toLocaleString();
          saveToCSV("APP_BACKGROUNDED", "", timestamp);
        }
        if (nextState === "active") {
          const timestamp = new Date().toLocaleString();
          saveToCSV("APP_RESUMED", "", timestamp);
        }
      },
    );

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location Required", "Please enable GPS in settings.", [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]);
        return;
      }
      setPermissionGranted(true);

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5,
          timeInterval: 5000,
        },
        (location) => {
          const lat = location.coords.latitude;
          const lon = location.coords.longitude;
          const timestamp = new Date(location.timestamp).toLocaleString(); // Get the exact millisecond time

          console.log(`📍 Location Updated: ${lat}, ${lon} at ${timestamp}`);

          if (isGpsLost) {
            isGpsLost = false;
            saveToCSV("GPS_SIGNAL_RESTORED", "", timestamp);
          }

          // ✅ Reset timeout timer on every successful reading
          if (gpsTimeoutTimer) clearTimeout(gpsTimeoutTimer);
          gpsTimeoutTimer = setTimeout(() => {
            isGpsLost = true;
            const lostTimestamp = new Date().toLocaleString();
            saveToCSV("GPS_SIGNAL_LOST", "", lostTimestamp);
          }, GPS_TIMEOUT_MS);

          if (location.coords.accuracy && location.coords.accuracy > 20) {
            console.log("⚠️ GPS accuracy too low, skipping...");
            return;
          }

          setUserLocation([lon, lat]);

          // 4. FIRE THE CSV FUNCTION EVERY 5 METERS
          saveToCSV(lat, lon, timestamp);
        },
      );

      headingSubscription = await Location.watchHeadingAsync((headingObj) => {
        setUserHeading(headingObj.magHeading);
      });
    })();

    return () => {
      appStateSubscription.remove();
      if (locationSubscription) locationSubscription.remove();
      if (headingSubscription) headingSubscription.remove();
      if (gpsTimeoutTimer) clearTimeout(gpsTimeoutTimer);
      unsubscribeNetwork();
    };
  }, []);

  // Make sure exportHikeData is added to this list!
  return {
    permissionGranted,
    isOnline,
    userLocation,
    userHeading,
    exportHikeData,
  };
};
