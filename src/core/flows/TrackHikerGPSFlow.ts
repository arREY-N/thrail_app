import NetInfo from "@react-native-community/netinfo";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    AppState,
    Linking,
    PermissionsAndroid,
    Platform,
} from "react-native";
// NOTE: `loadWalkedPathCoords` (which uses parseCSV) is intentionally NOT imported anymore
import { useHikeStore } from "@/src/core/models/Hike/Hike";
import { newLocation } from "@/src/core/models/Location/Location";
import { exportHikeData } from "@/src/core/utility/hikeStorage";
import { LOCATION_TASK } from "@/src/core/utility/locationTask";


// ✅ Background task must be defined outside the hook at the top level (mobile only)
if (Platform.OS !== "web") {
    TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
        const addCoordinate = useHikeStore.getState().addCoordinate;

        if (error) {
            console.error("[TrackHikerGPSFlow] Background location task error:", error);
            return;
        }
        try {
            const { locations } = data;
            if (!locations || locations.length === 0) return;
            const location = locations[0];

            const lat = location.coords.latitude;
            const lon = location.coords.longitude;
            const alt = location.coords.altitude ?? 0;
            const timestamp = new Date(location.timestamp).toISOString();
            console.log('calling from background task');
            await addCoordinate(newLocation({
                latitude: lat,
                longitude: lon,
                altitude: alt,
                timestamp: new Date(timestamp),
                status: 'APP_BACKGROUNDED',
            }));
        } catch (err) {
            console.error("[TrackHikerGPSFlow] Failed to log background coordinate:", err);
        }
    });
}


let globalActiveInstances = 0;
let globalAppStateSub: any = null;
let globalNetInfoSub: any = null;
let globalLastAppState = "active";
const onlineListeners = new Set<(online: boolean) => void>();

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
export const TrackHikerGPSFlow = () => {
    const addCoordinate = useHikeStore((state) => state.addCoordinate);
    const updateHikeStore = useHikeStore((state) => state.updateHikeStore);

    const [permissionGranted, setPermissionGranted] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);

    const setGpsError = (msg: string | null) => updateHikeStore({ gpsError: msg });

    const locationSubscription = useRef<Location.LocationSubscription | null>(null);
    const gpsTimeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isGpsLost = useRef(false);
    const GPS_TIMEOUT_MS = 180000;

    /**
     * MODE 1: FOREGROUND PRE-WARMING
     * Gets GPS lock and updates the blue dot on the map.
x     * Will ONLY record data and draw the red line if the global store says active === true.
     */
    const initForegroundGps = async () => {
        if (Platform.OS === "web") return;
        if (locationSubscription.current) return;

        try {
            let isGpsEnabled = await Location.hasServicesEnabledAsync();
            if (!isGpsEnabled) {
                if (Platform.OS === "android") {
                    try {
                        await Location.enableNetworkProviderAsync();
                        isGpsEnabled = await Location.hasServicesEnabledAsync();
                    } catch (e) {
                        console.warn("Failed to enable network provider:", e);
                    }
                }
            }

            if (!isGpsEnabled) {
                setGpsError("Device GPS is turned off. Please enable it in your phone settings.");
                Alert.alert(
                    "GPS Disabled",
                    "Your device's GPS services are turned off. Please enable them to track your hike.",
                    [
                        { text: "Cancel", style: "cancel" },
                        {
                            text: "Open Settings",
                            onPress: () => {
                                if (Platform.OS === "android") {
                                    Linking.sendIntent("android.settings.LOCATION_SOURCE_SETTINGS");
                                } else {
                                    Linking.openSettings();
                                }
                            },
                        },
                    ]
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
                        addCoordinate(newLocation({
                            latitude: lat,
                            longitude: lon,
                            altitude: alt,
                            timestamp: new Date(timestamp),
                            status: 'GPS_SIGNAL_RESTORED',
                        }));
                    }

                    if (gpsTimeoutTimer.current) clearTimeout(gpsTimeoutTimer.current);
                    gpsTimeoutTimer.current = setTimeout(() => {
                        isGpsLost.current = true;
                        setGpsError("GPS signal lost. Searching for satellites...");
                        addCoordinate(newLocation({
                            latitude: lat,
                            longitude: lon,
                            altitude: alt,
                            timestamp: new Date(),
                            status: 'GPS_SIGNAL_LOST',
                        }));
                    }, GPS_TIMEOUT_MS);

                    if (location.coords.accuracy && location.coords.accuracy > 20) return;

                    // Always update the Blue Dot position
                    setUserLocation([lon, lat]);
                    setRouteCoordinates((prev) => [...prev, [lon, lat]]);

                    console.log('logging from TrackHikerGPSFlow');
                    // Global Store Integration
                    addCoordinate(newLocation({
                        latitude: lat,
                        longitude: lon,
                        altitude: alt,
                        timestamp: new Date(timestamp),
                        status: 'ACTIVE',
                    }));
                },
            );
        } catch (err: any) {
            console.error("Failed to start location tracking:", err);
            setGpsError("Failed to initialize GPS: " + (err?.message || String(err)));
        }
    };

    /**
     * MODE 2: BACKGROUND TRACKING
     * Starts the TaskManager so tracking continues when screen is off.
     */
    const startBackgroundTracking = async () => {
        if (Platform.OS === "web") return;
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
            } else {
                console.warn("Background location permission was not granted.");
            }
        } catch (err) {
            console.error("Background tracking failed to start:", err);
        }
    };

    /**
     * Stops the background TaskManager.
     */
    const stopBackgroundTracking = async () => {
        if (Platform.OS === "web") return;
        try {
            await Location.stopLocationUpdatesAsync(LOCATION_TASK);
            console.log("✅ Background task stopped");
        } catch (err) {
            console.warn("Failed to stop background tracking task:", err);
        }
    };

    // Set up listeners on mount and clean up on unmount
    useEffect(() => {
        if (Platform.OS === "web") return;

        const handleOnlineChange = (online: boolean) => setIsOnline(online);
        onlineListeners.add(handleOnlineChange);

        globalActiveInstances++;

        if (globalActiveInstances === 1) {
            globalNetInfoSub = NetInfo.addEventListener((state) => {
                const reach = !!state.isInternetReachable;
                onlineListeners.forEach((fn) => fn(reach));
            });

            globalAppStateSub = AppState.addEventListener(
                "change",
                (nextState) => {
                    const addCoord = useHikeStore.getState().addCoordinate;

                    if ((nextState === "background" || nextState === "inactive") && globalLastAppState === "active") {
                        globalLastAppState = nextState;
                        const timestamp = new Date().toISOString();
                        addCoord(newLocation({
                            latitude: 0,
                            longitude: 0,
                            altitude: 0,
                            timestamp: new Date(timestamp),
                            status: 'APP_BACKGROUNDED',
                        }));
                    }
                    if (nextState === "active" && globalLastAppState !== "active") {
                        globalLastAppState = "active";
                        const timestamp = new Date().toISOString();
                        addCoord(newLocation({
                            latitude: 0,
                            longitude: 0,
                            altitude: 0,
                            timestamp: new Date(timestamp),
                            status: 'APP_RESUMED',
                        }));
                    }
                },
            );
        }

        return () => {
            onlineListeners.delete(handleOnlineChange);
            globalActiveInstances = Math.max(0, globalActiveInstances - 1);

            if (globalActiveInstances === 0) {
                if (globalAppStateSub) {
                    globalAppStateSub.remove();
                    globalAppStateSub = null;
                }
                if (globalNetInfoSub) {
                    globalNetInfoSub();
                    globalNetInfoSub = null;
                }
            }

            if (locationSubscription.current) {
                locationSubscription.current.remove();
                locationSubscription.current = null;
            }
            if (gpsTimeoutTimer.current) clearTimeout(gpsTimeoutTimer.current);
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