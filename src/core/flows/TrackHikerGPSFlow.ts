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
import { sharedGpsKalmanFilter, smoothCompassHeading } from "@/src/core/utility/gpsKalmanFilter";
import { exportHikeData } from "@/src/core/utility/hikeStorage";
import { LOCATION_TASK } from "@/src/core/utility/locationTask";

let globalActiveInstances = 0;
let globalAppStateSub: NativeEventSubscription | null = null;
let globalNetInfoSub: NetInfoSubscription | null = null;
let globalLastAppState = "active";
let globalLastReach = true;
let globalIsBackgroundTrackingRunning = false;
let globalIsBackgroundStarting = false;
const onlineListeners = new Set<(online: boolean) => void>();

// Singleton foreground GPS & Compass Heading state & listeners
let globalLocationSub: Location.LocationSubscription | null = null;
let globalHeadingSub: Location.LocationSubscription | null = null;
let globalInitPromise: Promise<void> | null = null;
let globalUserLocation: [number, number] | null = null;
let globalUserHeading: number | null = null;
let globalLastHeadingEmitMs = 0;
let globalPermissionGranted = false;
let globalGpsTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
let globalIsGpsLost = false;
const GPS_TIMEOUT_MS = 180000;

const userLocationListeners = new Set<(loc: [number, number] | null) => void>();
const userHeadingListeners = new Set<(heading: number | null) => void>();
const permissionListeners = new Set<(granted: boolean) => void>();

/**
 * Returns true if the foreground watchPositionAsync subscription is active and the app is in the foreground.
 */
export const isForegroundGpsActive = (): boolean => {
    return globalLocationSub !== null && AppState.currentState === "active";
};

/**
 * Broadcasts a filtered [longitude, latitude] coordinate to all mounted map subscribers.
 */
export const emitFilteredUserLocation = (lon: number, lat: number): boolean => {
    const hasCoordChanged =
        !globalUserLocation ||
        Math.abs(globalUserLocation[0] - lon) > 1e-7 ||
        Math.abs(globalUserLocation[1] - lat) > 1e-7;

    if (hasCoordChanged) {
        const nextLoc: [number, number] = [lon, lat];
        globalUserLocation = nextLoc;
        userLocationListeners.forEach((fn) => fn(nextLoc));
    }
    return hasCoordChanged;
};

/**
 * Standalone background location controls.
 * Decoupled from the stateful TrackHikerGPSFlow hook to prevent unnecessary
 * re-render cascades in components that only need to start/stop tracking.
 */
export const startBackgroundLocationTracking = async (): Promise<void> => {
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

export const stopBackgroundLocationTracking = async (): Promise<void> => {
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

/**
 * A comprehensive hook that manages real-time and background GPS tracking for hikers.
 */
export const TrackHikerGPSFlow = () => {
    const addCoordinate = useHikeStore((state) => state.addCoordinate);
    const updateHikeStore = useHikeStore((state) => state.updateHikeStore);
    const routeCoordinates = useHikeStore((state) => state.walkedRoute);

    const [permissionGranted, setPermissionGranted] = useState(globalPermissionGranted);
    const [isOnline, setIsOnline] = useState(true);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(globalUserLocation);
    const [userHeading, setUserHeading] = useState<number | null>(globalUserHeading);

    const setGpsError = (msg: string | null) => updateHikeStore({ gpsError: msg });

    const handleRawFix = (location: Location.LocationObject) => {
        // If the app is in the background, let the background locationTask process exclusively
        if (AppState.currentState !== "active") {
            return;
        }

        const { active: isHikeActive, currentHike: activeHike } = useHikeStore.getState();
        const isHikeRecording = isHikeActive && activeHike && (activeHike.status === "started" || activeHike.status === "paused");

        // If no UI instances are active and no hike is recording, discard fix to avoid orphaned state
        if (globalActiveInstances <= 0 && !isHikeRecording) {
            return;
        }

        const filtered = sharedGpsKalmanFilter.process({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude,
            accuracy: location.coords.accuracy,
            speed: location.coords.speed,
            heading: location.coords.heading,
            timestamp: location.timestamp || Date.now(),
        });

        // Indoor & coarse positioning fallback: if Kalman filter rejected gross scatter > 120m,
        // still allow coarse UI Blue Dot repositioning if accuracy is plausible (<= 200m)
        // so the indicator doesn't freeze on the street outside.
        if (!filtered) {
            if (
                typeof location.coords.latitude === "number" &&
                typeof location.coords.longitude === "number" &&
                !isNaN(location.coords.latitude) &&
                !isNaN(location.coords.longitude) &&
                typeof location.coords.accuracy === "number" &&
                location.coords.accuracy <= 200
            ) {
                emitFilteredUserLocation(location.coords.longitude, location.coords.latitude);
            }
            return;
        }

        const lat = filtered.latitude;
        const lon = filtered.longitude;
        const alt = filtered.altitude;
        const timestamp = new Date(filtered.timestamp).toISOString();

        if (globalIsGpsLost) {
            globalIsGpsLost = false;
            setGpsError(null);
            if (isHikeRecording) {
                useHikeStore.getState().logHikeEvent('GPS_SIGNAL_RESTORED', {
                    latitude: lat,
                    longitude: lon,
                    altitude: alt ?? undefined,
                });
                addCoordinate(newLocation({
                    latitude: lat,
                    longitude: lon,
                    altitude: alt ?? undefined,
                    accuracy: filtered.accuracy,
                    speed: filtered.speed,
                    timestamp: new Date(timestamp),
                    status: 'GPS_SIGNAL_RESTORED',
                }));
            }
        }

        // Reset heartbeat timer only for valid accepted fixes and only when active instances or hike is running
        if (globalGpsTimeoutTimer) clearTimeout(globalGpsTimeoutTimer);
        if (globalActiveInstances > 0 || isHikeRecording) {
            globalGpsTimeoutTimer = setTimeout(() => {
                globalIsGpsLost = true;
                setGpsError("GPS signal lost. Searching for satellites...");
                const { active, currentHike } = useHikeStore.getState();
                if (active && currentHike && (currentHike.status === 'started' || currentHike.status === 'paused')) {
                    useHikeStore.getState().logHikeEvent('GPS_SIGNAL_LOST', {
                        latitude: lat,
                        longitude: lon,
                        altitude: alt ?? undefined,
                    });
                    addCoordinate(newLocation({
                        latitude: lat,
                        longitude: lon,
                        altitude: alt ?? undefined,
                        accuracy: filtered.accuracy,
                        speed: filtered.speed,
                        timestamp: new Date(),
                        status: 'GPS_SIGNAL_LOST',
                    }));
                }
            }, GPS_TIMEOUT_MS);
        }

        // Emit Blue Dot coordinate updates whenever position changes
        const hasCoordChanged = emitFilteredUserLocation(lon, lat);

        const latestCoord = newLocation({
            latitude: lat,
            longitude: lon,
            altitude: alt ?? undefined,
            accuracy: filtered.accuracy,
            speed: filtered.speed,
            timestamp: new Date(timestamp),
            status: 'ACTIVE',
        });

        // Continuous Pre-Hike GPS Availability: update currentLocation when coordinates change or on initial fix
        if (hasCoordChanged || !useHikeStore.getState().currentLocation) {
            useHikeStore.getState().setCurrentLocation(latestCoord);
        }

        // Global Store Integration: record breadcrumbs when hike is started, stream live location when started or paused
        if (isHikeRecording) {
            addCoordinate(latestCoord);
        }
    };

    /**
     * MODE 1: FOREGROUND PRE-WARMING (SINGLETON)
     * Gets GPS lock and updates the blue dot and compass heading on the map.
     * Shares single watchPositionAsync and watchHeadingAsync across all callers.
     */
    const initForegroundGps = async (): Promise<void> => {
        if (Platform.OS === "web") return;
        if (globalLocationSub) {
            setPermissionGranted(true);
            if (globalUserLocation) setUserLocation(globalUserLocation);
            if (globalUserHeading !== null) setUserHeading(globalUserHeading);
            return;
        }
        if (globalInitPromise) {
            await globalInitPromise;
            setPermissionGranted(globalPermissionGranted);
            if (globalUserLocation) setUserLocation(globalUserLocation);
            if (globalUserHeading !== null) setUserHeading(globalUserHeading);
            if (globalLocationSub || globalActiveInstances <= 0) {
                return;
            }
        }

        const runInit = async () => {
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

                // Seed initial location immediately if available so the blue dot renders without delay
                if (!globalUserLocation) {
                    Location.getLastKnownPositionAsync()
                        .then((lastPos) => {
                            if (lastPos && !globalUserLocation && globalActiveInstances > 0) {
                                handleRawFix(lastPos);
                            }
                        })
                        .catch(() => {});
                }

                // Start singleton compass/magnetometer heading watcher for directional user indicator
                if (!globalHeadingSub && globalActiveInstances > 0) {
                    try {
                        const headingSub = await Location.watchHeadingAsync((headingData) => {
                            const rawHeading =
                                headingData.trueHeading >= 0
                                    ? headingData.trueHeading
                                    : headingData.magHeading;
                            if (typeof rawHeading !== "number" || isNaN(rawHeading) || rawHeading < 0) {
                                return;
                            }

                            const smoothed = smoothCompassHeading(globalUserHeading, rawHeading, 0.28, 1.5);
                            const nowMs = Date.now();
                            const angularDiff =
                                globalUserHeading === null
                                    ? 999
                                    : Math.abs(((smoothed - globalUserHeading + 540) % 360) - 180);

                            if (globalUserHeading === null || (angularDiff >= 1.5 && nowMs - globalLastHeadingEmitMs >= 80)) {
                                globalUserHeading = smoothed;
                                globalLastHeadingEmitMs = nowMs;
                                userHeadingListeners.forEach((fn) => fn(smoothed));
                            }
                        });

                        if (globalActiveInstances <= 0) {
                            headingSub.remove();
                            globalHeadingSub = null;
                        } else {
                            globalHeadingSub = headingSub;
                        }
                    } catch (headingErr) {
                        console.warn("Compass heading subscription warning:", headingErr);
                    }
                }

                if (globalActiveInstances <= 0) {
                    return;
                }

                const locSub = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.BestForNavigation,
                        distanceInterval: 0,
                        timeInterval: 1000,
                    },
                    handleRawFix,
                );

                if (globalActiveInstances <= 0) {
                    locSub.remove();
                    globalLocationSub = null;
                    return;
                }
                globalLocationSub = locSub;
            } catch (err: unknown) {
                console.error("Failed to start location tracking:", err);
                const message = err instanceof Error ? err.message : String(err);
                setGpsError("Failed to initialize GPS: " + message);
            } finally {
                globalInitPromise = null;
            }
        };

        globalInitPromise = runInit();
        await globalInitPromise;
    };

    const startBackgroundTracking = startBackgroundLocationTracking;
    const stopBackgroundTracking = stopBackgroundLocationTracking;

    // Set up listeners on mount and clean up on unmount
    useEffect(() => {
        if (Platform.OS === "web") return;

        const handleOnlineChange = (online: boolean) => setIsOnline(online);
        const handleLocationChange = (loc: [number, number] | null) => setUserLocation(loc);
        const handleHeadingChange = (heading: number | null) => setUserHeading(heading);
        const handlePermissionChange = (granted: boolean) => setPermissionGranted(granted);

        onlineListeners.add(handleOnlineChange);
        userLocationListeners.add(handleLocationChange);
        userHeadingListeners.add(handleHeadingChange);
        permissionListeners.add(handlePermissionChange);

        // Immediately sync any state that resolved between initial render and effect mount
        if (globalPermissionGranted) setPermissionGranted(true);
        if (globalUserLocation) setUserLocation(globalUserLocation);
        if (globalUserHeading !== null) setUserHeading(globalUserHeading);

        globalActiveInstances++;

        if (globalActiveInstances === 1) {
            globalNetInfoSub = NetInfo.addEventListener((state) => {
                const reach = state.isInternetReachable === null ? true : !!state.isInternetReachable;
                const wasOffline = !globalLastReach;
                globalLastReach = reach;
                onlineListeners.forEach((fn) => fn(reach));
                if (reach && wasOffline) {
                    console.log('[TrackHikerGPSFlow] Internet restored, syncing offline data...');
                    useHikeStore.getState().syncOfflineData();
                }
            });

            globalAppStateSub = AppState.addEventListener(
                "change",
                (nextState) => {
                    if ((nextState === "background" || nextState === "inactive") && globalLastAppState === "active") {
                        globalLastAppState = nextState;
                        console.log('[TrackHikerGPSFlow] App transitioned to background/inactive');
                        useHikeStore.getState().logHikeEvent('APP_BACKGROUNDED');
                    }
                    if (nextState === "active" && globalLastAppState !== "active") {
                        globalLastAppState = "active";
                        console.log('[TrackHikerGPSFlow] App transitioned to active foreground');
                        useHikeStore.getState().logHikeEvent('APP_RESUMED');
                        if (globalLastReach) {
                            useHikeStore.getState().syncOfflineData();
                        }
                    }
                },
            );
        }

        return () => {
            onlineListeners.delete(handleOnlineChange);
            userLocationListeners.delete(handleLocationChange);
            userHeadingListeners.delete(handleHeadingChange);
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
                if (globalHeadingSub) {
                    globalHeadingSub.remove();
                    globalHeadingSub = null;
                }
                if (globalGpsTimeoutTimer) {
                    clearTimeout(globalGpsTimeoutTimer);
                    globalGpsTimeoutTimer = null;
                }
            }

            // Only stop background tracking if no hike is actively recording
            const { active, currentHike } = useHikeStore.getState();
            if (!active || !currentHike || currentHike.status !== 'started') {
                stopBackgroundLocationTracking();
            }
        };
    }, []);

    return {
        permissionGranted,
        isOnline,
        userLocation,
        userHeading,
        routeCoordinates,
        exportHikeData,
        initForegroundGps,
        startBackgroundTracking,
        stopBackgroundTracking,
    };
};
