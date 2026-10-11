import NetInfo, { NetInfoSubscription } from "@react-native-community/netinfo";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
    Alert,
    AppState,
    Linking,
    NativeEventSubscription,
    PermissionsAndroid,
    Platform,
} from "react-native";
import { useHikeStore } from "@/src/core/models/Hike/Hike";
import { newLocation } from "@/src/core/models/Location/Location";
import { exportHikeData } from "@/src/core/utility/hikeStorage";
import { LOCATION_TASK } from "@/src/core/utility/locationTask";

let globalActiveInstances = 0;
let globalAppStateSub: NativeEventSubscription | null = null;
let globalNetInfoSub: NetInfoSubscription | null = null;
let globalLastAppState = "active";
let globalIsBackgroundTrackingRunning = false;
let globalIsBackgroundStarting = false;
const onlineListeners = new Set<(online: boolean) => void>();

// Singleton foreground GPS state & listeners to prevent duplicate watchPositionAsync instances
let globalLocationSub: Location.LocationSubscription | null = null;
let globalIsInitializingForeground = false;
let globalUserLocation: [number, number] | null = null;
let globalPermissionGranted = false;
let globalGpsTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
let globalIsGpsLost = false;
const GPS_TIMEOUT_MS = 180000;

const userLocationListeners = new Set<(loc: [number, number] | null) => void>();
const permissionListeners = new Set<(granted: boolean) => void>();

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
 * @property {[number, number][][]} routeCoordinates - Multi-segment breadcrumb path of the current session as array of segments `[lon, lat][][]`.
 * @property {Function} exportHikeData - Utility to trigger a file export of the recorded hike data.
 * @property {() => Promise<void>} onStartGps - Starts the GPS tracking session (foreground and background).
 * @property {() => Promise<void>} onEndGps - Stops the GPS tracking session and cleans up subscriptions.
 */
export const TrackHikerGPSFlow = () => {
    const addCoordinate = useHikeStore((state) => state.addCoordinate);
    const updateHikeStore = useHikeStore((state) => state.updateHikeStore);
    const routeCoordinates = useHikeStore((state) => state.walkedRoute);

    const [permissionGranted, setPermissionGranted] = useState(globalPermissionGranted);
    const [isOnline, setIsOnline] = useState(true);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(globalUserLocation);

    const setGpsError = (msg: string | null) => updateHikeStore({ gpsError: msg });

    /**
     * MODE 1: FOREGROUND PRE-WARMING (SINGLETON)
     * Gets GPS lock and updates the blue dot on the map.
     * Shares single watchPositionAsync across all callers.
     */
    const initForegroundGps = async () => {
        if (Platform.OS === "web") return;
        if (globalLocationSub) {
            setPermissionGranted(true);
            if (globalUserLocation) setUserLocation(globalUserLocation);
            return;
        }
        if (globalIsInitializingForeground) return;

        globalIsInitializingForeground = true;
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
            globalPermissionGranted = true;
            permissionListeners.forEach((fn) => fn(true));

            globalLocationSub = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    distanceInterval: 0,
                    timeInterval: 2000,
                },
                (location) => {
                    const accuracy = location.coords.accuracy;

                    // Quality gate: strictly reject invalid or inaccurate fixes (> 20m)
                    if (accuracy == null || accuracy <= 0 || accuracy > 20) return;

                    const lat = location.coords.latitude;
                    const lon = location.coords.longitude;
                    const alt = location.coords.altitude;
                    const timestamp = new Date(location.timestamp).toISOString();

                    if (globalIsGpsLost) {
                        globalIsGpsLost = false;
                        setGpsError(null);
                        const { active, currentHike } = useHikeStore.getState();
                        if (active && currentHike?.status === 'started') {
                            addCoordinate(newLocation({
                                latitude: lat,
                                longitude: lon,
                                altitude: alt ?? undefined,
                                timestamp: new Date(timestamp),
                                status: 'GPS_SIGNAL_RESTORED',
                            }));
                        }
                    }

                    // Reset heartbeat timer only for valid accepted fixes
                    if (globalGpsTimeoutTimer) clearTimeout(globalGpsTimeoutTimer);
                    globalGpsTimeoutTimer = setTimeout(() => {
                        globalIsGpsLost = true;
                        setGpsError("GPS signal lost. Searching for satellites...");
                        const { active, currentHike } = useHikeStore.getState();
                        if (active && currentHike?.status === 'started') {
                            addCoordinate(newLocation({
                                latitude: lat,
                                longitude: lon,
                                altitude: alt ?? undefined,
                                timestamp: new Date(),
                                status: 'GPS_SIGNAL_LOST',
                            }));
                        }
                    }, GPS_TIMEOUT_MS);

                    // Always update the Blue Dot position across all listeners
                    globalUserLocation = [lon, lat];
                    userLocationListeners.forEach((fn) => fn([lon, lat]));

                    const latestCoord = newLocation({
                        latitude: lat,
                        longitude: lon,
                        altitude: alt ?? undefined,
                        timestamp: new Date(timestamp),
                        status: 'ACTIVE',
                    });

                    // Continuous Pre-Hike GPS Availability: always update currentLocation for Emergency SOS & SMS (Finding 5)
                    useHikeStore.getState().setCurrentLocation(latestCoord);

                    // Global Store Integration: record breadcrumbs when hike is started, stream live location when started or paused (Finding 4)
                    const { active, currentHike } = useHikeStore.getState();
                    if (active && currentHike && (currentHike.status === 'started' || currentHike.status === 'paused')) {
                        addCoordinate(latestCoord);
                    }
                },
            );
        } catch (err: unknown) {
            console.error("Failed to start location tracking:", err);
            const message = err instanceof Error ? err.message : String(err);
            setGpsError("Failed to initialize GPS: " + message);
        } finally {
            globalIsInitializingForeground = false;
        }
    };

    /**
     * MODE 2: BACKGROUND TRACKING
     * Starts the TaskManager so tracking continues when screen is off.
     */
    const startBackgroundTracking = async () => {
        if (Platform.OS === "web") return;
        if (globalIsBackgroundTrackingRunning || globalIsBackgroundStarting) {
            console.log("[TrackHikerGPSFlow] Background tracking already active or initializing. Skipping duplicate request.");
            return;
        }

        globalIsBackgroundStarting = true;
        try {
            if (Platform.OS === "android" && Platform.Version >= 33) {
                await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
            }

            const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
            if (bgStatus === "granted") {
                await Location.startLocationUpdatesAsync(LOCATION_TASK, {
                    accuracy: Location.Accuracy.High,
                    distanceInterval: 10,
                    timeInterval: 5000,
                    deferredUpdatesInterval: 5000,
                    showsBackgroundLocationIndicator: true,
                    foregroundService: {
                        notificationTitle: "Thrail Hike Tracking Active",
                        notificationBody: "Recording your trail coordinates and elevation...",
                        notificationColor: "#2E7D32",
                    },
                });
                globalIsBackgroundTrackingRunning = true;
                console.log("✅ Background tracking active via TaskManager");
            } else {
                console.warn("Background location permission denied");
            }
        } catch (err) {
            console.error("Failed to start background tracking task:", err);
        } finally {
            globalIsBackgroundStarting = false;
        }
    };

    const stopBackgroundTracking = async () => {
        if (Platform.OS === "web") return;
        try {
            const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
            if (hasStarted) {
                await Location.stopLocationUpdatesAsync(LOCATION_TASK);
            }
            globalIsBackgroundTrackingRunning = false;
            console.log("✅ Background task stopped");
        } catch (err) {
            console.warn("Failed to stop background tracking task:", err);
        }
    };

    // Set up listeners on mount and clean up on unmount
    useEffect(() => {
        if (Platform.OS === "web") return;

        const handleOnlineChange = (online: boolean) => setIsOnline(online);
        const handleLocationChange = (loc: [number, number] | null) => setUserLocation(loc);
        const handlePermissionChange = (granted: boolean) => setPermissionGranted(granted);

        onlineListeners.add(handleOnlineChange);
        userLocationListeners.add(handleLocationChange);
        permissionListeners.add(handlePermissionChange);

        globalActiveInstances++;

        if (globalActiveInstances === 1) {
            globalNetInfoSub = NetInfo.addEventListener((state) => {
                const reach = state.isInternetReachable === null ? true : !!state.isInternetReachable;
                onlineListeners.forEach((fn) => fn(reach));
            });

            globalAppStateSub = AppState.addEventListener(
                "change",
                (nextState) => {
                    if ((nextState === "background" || nextState === "inactive") && globalLastAppState === "active") {
                        globalLastAppState = nextState;
                        console.log('[TrackHikerGPSFlow] App transitioned to background/inactive');
                    }
                    if (nextState === "active" && globalLastAppState !== "active") {
                        globalLastAppState = "active";
                        console.log('[TrackHikerGPSFlow] App transitioned to active foreground');
                    }
                },
            );
        }

        return () => {
            onlineListeners.delete(handleOnlineChange);
            userLocationListeners.delete(handleLocationChange);
            permissionListeners.delete(handlePermissionChange);
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
                if (globalLocationSub) {
                    globalLocationSub.remove();
                    globalLocationSub = null;
                }
                if (globalGpsTimeoutTimer) {
                    clearTimeout(globalGpsTimeoutTimer);
                    globalGpsTimeoutTimer = null;
                }
            }

            // Only stop background tracking if no hike is actively recording
            const { active, currentHike } = useHikeStore.getState();
            if (!active || !currentHike || currentHike.status !== 'started') {
                stopBackgroundTracking();
            }
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