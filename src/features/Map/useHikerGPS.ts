// useHikerGPS.ts
import NetInfo from "@react-native-community/netinfo";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Alert, Linking } from "react-native";

export const useHikerGPS = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );

  const [userHeading, setUserHeading] = useState<number>(0);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    let headingSubscription: Location.LocationSubscription | null = null;

    const unsubcribeNetwork =NetInfo.addEventListener((state) => {
      console.log("Network changed! Is online?", state.isInternetReachable);
      setIsOnline(!!state.isInternetReachable);
    });
    
    (async () => {
      // 1. Permission Check
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

      // 2. The Mountain-Optimized Tracker
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5,
          timeInterval: 5000,
        },
        (location) => {
          const currentCoords: [number, number] = [
            location.coords.longitude,
            location.coords.latitude,
          ];
          console.log("Hiker moved 5m! New Coords:", currentCoords);
          setUserLocation(currentCoords);
        },
      );

      // This constantly updates as the user spins their phone around
      headingSubscription = await Location.watchHeadingAsync((headingObj) => {
        console.log("Compass Angle:", headingObj.magHeading);
        setUserHeading(headingObj.magHeading);
      });
    })();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      if (headingSubscription) {
        headingSubscription.remove();
        unsubcribeNetwork();
      }
    };
  }, []);

  // Return the data so the map can use it!
  return { permissionGranted, isOnline, userLocation, userHeading };
};
