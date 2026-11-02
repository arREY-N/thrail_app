import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/src/core/models/User/User';
import { useHikeStore } from '@/src/core/models/Hike/Hike';

export const LAST_KNOWN_LOCATION_KEY = '@thrail_last_known_location';
const MEMORY_LOCATION_TTL_MS = 5 * 60 * 1000; // 5 minutes session cache

export interface CachedLastKnownLocation {
    latitude: number;
    longitude: number;
    resolvedName: string | null;
    geocodedName: string | null;
    timestamp: number;
}

let memoryLocationCache: CachedLastKnownLocation | null = null;

function isMemoryLocationFresh(cache: CachedLastKnownLocation | null): cache is CachedLastKnownLocation {
    if (!cache) return false;
    return Date.now() - cache.timestamp < MEMORY_LOCATION_TTL_MS;
}

async function persistLastKnownLocation(data: CachedLastKnownLocation): Promise<void> {
    memoryLocationCache = data;
    try {
        await AsyncStorage.setItem(LAST_KNOWN_LOCATION_KEY, JSON.stringify(data));
    } catch {
        // Ignore AsyncStorage write failure
    }
}

interface UseLocationProps {
    propLatitude?: number;
    propLongitude?: number;
    propLocationName?: string;
}

/**
 * Attempts forward geocoding of a user-provided address string using Open-Meteo Geocoding API.
 * Validates that the address is a real, resolvable location in the Philippines.
 * Returns null if the address is bogus, made-up, or cannot be resolved.
 */
async function geocodeAddressInPhilippines(address: string): Promise<{ latitude: number; longitude: number; name: string } | null> {
    const clean = address.trim();
    if (!clean || clean.length < 2) return null;

    try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(clean)}&count=1&countryCode=PH`;
        const res = await fetch(url);
        if (!res.ok) return null;

        const data = await res.json();
        if (Array.isArray(data.results) && data.results.length > 0) {
            const match = data.results[0];
            // Strictly enforce Philippines: country_code must be PH
            const isPH = match.country_code?.toUpperCase() === 'PH' || match.country?.toLowerCase() === 'philippines';
            if (isPH && typeof match.latitude === 'number' && typeof match.longitude === 'number') {
                return {
                    latitude: match.latitude,
                    longitude: match.longitude,
                    name: match.name || clean,
                };
            }
        }
    } catch {
        // Fall through to null on network or parsing error
    }
    return null;
}

/**
 * Resolves approximate coordinates using client IP address on Web.
 * Essential for desktop browsers where HTML5 Geolocation returns POSITION_UNAVAILABLE
 * due to lack of GPS hardware or Ethernet wired connection.
 */
async function getApproximateLocationFromIP(): Promise<{ latitude: number; longitude: number; city: string; region: string } | null> {
    try {
        const res = await fetch('https://ipwho.is/');
        if (res.ok) {
            const data = await res.json();
            if (data.success && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
                return {
                    latitude: data.latitude,
                    longitude: data.longitude,
                    city: data.city || data.region || 'Current Location',
                    region: data.region || data.country || '',
                };
            }
        }
    } catch {
        // Fall through to secondary provider
    }

    try {
        const res2 = await fetch('https://freeipapi.com/api/json');
        if (res2.ok) {
            const data2 = await res2.json();
            if (typeof data2.latitude === 'number' && typeof data2.longitude === 'number') {
                return {
                    latitude: data2.latitude,
                    longitude: data2.longitude,
                    city: data2.cityName || data2.regionName || 'Current Location',
                    region: data2.regionName || data2.countryName || '',
                };
            }
        }
    } catch {
        // Fall through to null
    }

    return null;
}

export const useLocation = (props?: UseLocationProps) => {
    const { propLatitude, propLongitude, propLocationName } = props || {};
    const hasExplicitCoords = propLatitude !== undefined && propLongitude !== undefined;
    const isWeb = Platform.OS === 'web';

    const hasFreshMemCache = !hasExplicitCoords && isMemoryLocationFresh(memoryLocationCache);

    const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
        hasExplicitCoords
            ? { latitude: propLatitude!, longitude: propLongitude! }
            : hasFreshMemCache
                ? { latitude: memoryLocationCache!.latitude, longitude: memoryLocationCache!.longitude }
                : null
    );
    const [resolvedName, setResolvedName] = useState<string | null>(
        propLocationName || (hasFreshMemCache ? memoryLocationCache!.resolvedName : null)
    );
    const [geocodedName, setGeocodedName] = useState<string | null>(
        hasFreshMemCache ? memoryLocationCache!.geocodedName : null
    );
    const [isLocating, setIsLocating] = useState<boolean>(!hasExplicitCoords && !propLocationName && !hasFreshMemCache);
    const [isProfileFallback, setIsProfileFallback] = useState<boolean>(false);

    const isMountedRef = useRef(true);
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Helper: Fall back to authenticated user profile address from Firebase Firestore or cached last-known location
    const tryFallbackToFirebaseProfile = useCallback(async () => {
        const profile = useAuthStore.getState().profile;
        const profileAddress = (profile?.address || '').trim();

        if (profileAddress) {
            const geocoded = await geocodeAddressInPhilippines(profileAddress);
            if (geocoded && isMountedRef.current) {
                setCoords({ latitude: geocoded.latitude, longitude: geocoded.longitude });
                setResolvedName(geocoded.name);
                setGeocodedName(`${geocoded.name} (From Profile)`);
                setIsProfileFallback(true);
                setIsLocating(false);
                return;
            }
        }

        // If profile.address is empty or fails to geocode, read @thrail_last_known_location from AsyncStorage
        try {
            const cachedLocStr = await AsyncStorage.getItem(LAST_KNOWN_LOCATION_KEY);
            if (cachedLocStr) {
                const cachedLoc: CachedLastKnownLocation = JSON.parse(cachedLocStr);
                if (typeof cachedLoc?.latitude === 'number' && typeof cachedLoc?.longitude === 'number' && isMountedRef.current) {
                    memoryLocationCache = cachedLoc;
                    setCoords({ latitude: cachedLoc.latitude, longitude: cachedLoc.longitude });
                    if (!propLocationName && cachedLoc.resolvedName) {
                        setResolvedName(cachedLoc.resolvedName);
                    }
                    if (cachedLoc.geocodedName) {
                        setGeocodedName(cachedLoc.geocodedName);
                    }
                    setIsProfileFallback(false);
                    setIsLocating(false);
                    return;
                }
            }
        } catch {
            // Ignore parse errors
        }

        // If made-up address or no address set in profile and no cached location, do NOT use hardcoded Manila
        if (isMountedRef.current) {
            setCoords(null);
            setResolvedName(null);
            setGeocodedName(null);
            setIsProfileFallback(false);
            setIsLocating(false);
        }
    }, [propLocationName]);

    // Main location resolver function
    const resolveLocation = useCallback(async (forceRefresh = false) => {
        if (hasExplicitCoords) return;

        // Fast-path: Reuse in-memory session cache when navigating between HomeScreen and WeatherScreen
        if (!forceRefresh && isMemoryLocationFresh(memoryLocationCache)) {
            if (isMountedRef.current) {
                setCoords({ latitude: memoryLocationCache.latitude, longitude: memoryLocationCache.longitude });
                if (!propLocationName && memoryLocationCache.resolvedName) {
                    setResolvedName(memoryLocationCache.resolvedName);
                }
                if (memoryLocationCache.geocodedName) {
                    setGeocodedName(memoryLocationCache.geocodedName);
                }
                setIsProfileFallback(false);
                setIsLocating(false);
            }
            return;
        }

        // Fast-path: Reuse live GPS fix from Map/Hike engine (useHikeStore) if recorded within last 5 minutes
        if (!forceRefresh) {
            const liveHikeLoc = useHikeStore.getState().currentLocation;
            if (
                liveHikeLoc &&
                typeof liveHikeLoc.latitude === 'number' &&
                typeof liveHikeLoc.longitude === 'number' &&
                !isNaN(liveHikeLoc.latitude) &&
                !isNaN(liveHikeLoc.longitude)
            ) {
                const locTimeMs = liveHikeLoc.timestamp instanceof Date
                    ? liveHikeLoc.timestamp.getTime()
                    : new Date(liveHikeLoc.timestamp || 0).getTime();
                if (locTimeMs > 0 && Date.now() - locTimeMs < MEMORY_LOCATION_TTL_MS) {
                    if (isMountedRef.current) {
                        setCoords({ latitude: liveHikeLoc.latitude, longitude: liveHikeLoc.longitude });
                        setIsProfileFallback(false);
                        setIsLocating(false);
                    }
                    return;
                }
            }
        }

        setIsLocating(true);

        // 1. Web Platform Geolocation
        if (isWeb) {
            const handleWebFallback = async () => {
                // Try IP-based location before giving up (crucial for desktop PCs without GPS/Wi-Fi)
                const ipLoc = await getApproximateLocationFromIP();
                if (ipLoc && isMountedRef.current) {
                    setCoords({ latitude: ipLoc.latitude, longitude: ipLoc.longitude });
                    const details = [ipLoc.city, ipLoc.region && ipLoc.region !== ipLoc.city ? ipLoc.region : null]
                        .filter(Boolean)
                        .join(', ');
                    if (!propLocationName) setResolvedName(ipLoc.city);
                    setGeocodedName(details || ipLoc.city);
                    setIsProfileFallback(false);
                    setIsLocating(false);
                    persistLastKnownLocation({
                        latitude: ipLoc.latitude,
                        longitude: ipLoc.longitude,
                        resolvedName: propLocationName || ipLoc.city,
                        geocodedName: details || ipLoc.city,
                        timestamp: Date.now(),
                    });
                    return;
                }
                await tryFallbackToFirebaseProfile();
            };

            if (typeof navigator !== 'undefined' && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        if (!isMountedRef.current) return;
                        const lat = position.coords.latitude;
                        const lon = position.coords.longitude;
                        setCoords({ latitude: lat, longitude: lon });
                        setIsProfileFallback(false);
                        setIsLocating(false);
                    },
                    async (err) => {
                        console.warn('[useLocation] Web geolocation error:', err.code, err.message);
                        await handleWebFallback();
                    },
                    { timeout: 10000, enableHighAccuracy: false, maximumAge: 60000 }
                );
            } else {
                await handleWebFallback();
            }
            return;
        }

        // 2. Native Mobile Platform (iOS / Android)
        try {
            // Verify if device location services (GPS) are enabled
            const isServicesEnabled = await Location.hasServicesEnabledAsync();
            if (!isServicesEnabled) {
                await tryFallbackToFirebaseProfile();
                return;
            }

            let { status } = await Location.getForegroundPermissionsAsync();
            if (status !== 'granted') {
                const req = await Location.requestForegroundPermissionsAsync();
                if (req.status !== 'granted') {
                    // Permission denied on Native -> Fall back to Firebase profile
                    await tryFallbackToFirebaseProfile();
                    return;
                }
            }

            // 1. Fresh GPS fix with a 3.5s timeout (captures emulator coordinate updates and live movement)
            let location: Location.LocationObject | null = null;
            let timeoutId: ReturnType<typeof setTimeout> | null = null;
            try {
                const positionPromise = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                const timeoutPromise = new Promise<null>((resolve) => {
                    timeoutId = setTimeout(() => resolve(null), 3500);
                });
                location = await Promise.race([positionPromise, timeoutPromise]);
            } catch (posErr) {
                console.warn('[useLocation] getCurrentPositionAsync error:', posErr);
            } finally {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
            }

            // 2. Fall back to last known cached position if fresh fix timed out (~10ms)
            if (!location) {
                location = await Location.getLastKnownPositionAsync({});
            }

            if (location && isMountedRef.current) {
                setCoords({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });
                setIsProfileFallback(false);
            } else {
                await tryFallbackToFirebaseProfile();
            }
        } catch {
            await tryFallbackToFirebaseProfile();
        } finally {
            if (isMountedRef.current) {
                setIsLocating(false);
            }
        }
    }, [hasExplicitCoords, isWeb, propLocationName, tryFallbackToFirebaseProfile]);

    // Initial load: Defer to prevent calling setState synchronously within the effect
    useEffect(() => {
        const timer = setTimeout(() => {
            resolveLocation();
        }, 0);
        return () => {
            clearTimeout(timer);
        };
    }, [resolveLocation]);

    // Web permission change listener: Auto-resolve location when user clicks "Allow" in browser dialog
    useEffect(() => {
        if (!isWeb || typeof navigator === 'undefined' || !navigator.permissions) return;
        let activeStatus: PermissionStatus | null = null;
        let cancelled = false;
        try {
            navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((status) => {
                if (cancelled) return;
                activeStatus = status;
                status.onchange = () => {
                    if (status.state === 'granted' && isMountedRef.current) {
                        resolveLocation(true);
                    }
                };
            }).catch(() => {});
        } catch {}
        return () => {
            cancelled = true;
            if (activeStatus) {
                activeStatus.onchange = null;
            }
        };
    }, [isWeb, resolveLocation]);

    // Listen to AppState resume: If user toggled GPS on in system settings and resumes app, refresh location
    useEffect(() => {
        if (hasExplicitCoords || isWeb) return;

        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                resolveLocation();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => {
            subscription.remove();
        };
    }, [hasExplicitCoords, isWeb, resolveLocation]);

    // Reverse geocode when coords become available from live GPS
    useEffect(() => {
        if (isProfileFallback) return;

        const effLat = propLatitude !== undefined ? propLatitude : coords?.latitude;
        const effLon = propLongitude !== undefined ? propLongitude : coords?.longitude;

        if (effLat === undefined || effLon === undefined) return;

        // If memory cache already matches these ~1km coordinates and state already holds the cached name, skip network call
        if (
            memoryLocationCache &&
            memoryLocationCache.resolvedName &&
            memoryLocationCache.resolvedName !== "Current Location" &&
            Math.abs(memoryLocationCache.latitude - effLat) < 0.01 &&
            Math.abs(memoryLocationCache.longitude - effLon) < 0.01 &&
            resolvedName === memoryLocationCache.resolvedName
        ) {
            return;
        }

        let isMounted = true;

        (async () => {
            try {
                // Fast-path: Reuse cached reverse-geocoded name if within ~1km of the memory-cached coordinates
                if (
                    memoryLocationCache &&
                    memoryLocationCache.resolvedName &&
                    memoryLocationCache.resolvedName !== "Current Location" &&
                    Math.abs(memoryLocationCache.latitude - effLat) < 0.01 &&
                    Math.abs(memoryLocationCache.longitude - effLon) < 0.01
                ) {
                    const cachedResolved = memoryLocationCache.resolvedName;
                    const cachedGeo = memoryLocationCache.geocodedName || cachedResolved;
                    await Promise.resolve();
                    if (isMounted) {
                        if (!propLocationName) setResolvedName(cachedResolved);
                        setGeocodedName(cachedGeo);
                    }
                    return;
                }
                // Helper to preserve existing or cached city name when offline reverse-geocoding fails
                const fallbackToCachedOrDefaultName = async () => {
                    try {
                        const cachedLocStr = await AsyncStorage.getItem(LAST_KNOWN_LOCATION_KEY);
                        if (cachedLocStr) {
                            const cachedLoc: CachedLastKnownLocation = JSON.parse(cachedLocStr);
                            if (cachedLoc?.resolvedName && cachedLoc.resolvedName !== "Current Location") {
                                if (isMounted) {
                                    if (!propLocationName) setResolvedName((prev) => prev || cachedLoc.resolvedName);
                                    setGeocodedName((prev) => prev || cachedLoc.geocodedName || cachedLoc.resolvedName);
                                }
                                return;
                            }
                        }
                    } catch {
                        // Ignore cache read error
                    }
                    if (isMounted) {
                        if (!propLocationName) setResolvedName((prev) => prev || "Current Location");
                        setGeocodedName((prev) => prev || "Current Location");
                    }
                };

                if (Platform.OS !== 'web') {
                    const geocodeResult = await Location.reverseGeocodeAsync({
                        latitude: effLat,
                        longitude: effLon,
                    });
                    if (geocodeResult && geocodeResult.length > 0) {
                        const loc = geocodeResult[0];
                        const nameToUse = loc.name || loc.city || loc.subregion || loc.region || 'Current Location';
                        const geoDetails = [loc.city || loc.subregion, loc.region].filter(Boolean).join(', ');

                        if (isMounted) {
                            if (!propLocationName) setResolvedName(nameToUse);
                            setGeocodedName(geoDetails || nameToUse);
                            persistLastKnownLocation({
                                latitude: effLat,
                                longitude: effLon,
                                resolvedName: propLocationName || nameToUse,
                                geocodedName: geoDetails || nameToUse,
                                timestamp: Date.now(),
                            });
                        }
                    } else {
                        await fallbackToCachedOrDefaultName();
                    }
                } else {
                    // On Web: Attempt lightweight client reverse geocoding or fallback gracefully
                    try {
                        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${effLat}&longitude=${effLon}&localityLanguage=en`);
                        if (res.ok) {
                            const data = await res.json();
                            const cityName = data.city || data.locality || data.principalSubdivision;
                            const regionName = data.principalSubdivision;
                            const details = [cityName, regionName && regionName !== cityName ? regionName : null].filter(Boolean).join(', ');
                            if (isMounted && cityName) {
                                if (!propLocationName) setResolvedName(cityName);
                                setGeocodedName(details || cityName);
                                persistLastKnownLocation({
                                    latitude: effLat,
                                    longitude: effLon,
                                    resolvedName: propLocationName || cityName,
                                    geocodedName: details || cityName,
                                    timestamp: Date.now(),
                                });
                                return;
                            }
                        }
                    } catch {
                        // Network error or blocked -> fallback to cached location name
                    }
                    await fallbackToCachedOrDefaultName();
                }
            } catch {
                try {
                    const cachedLocStr = await AsyncStorage.getItem(LAST_KNOWN_LOCATION_KEY);
                    if (cachedLocStr) {
                        const cachedLoc: CachedLastKnownLocation = JSON.parse(cachedLocStr);
                        if (cachedLoc?.resolvedName && isMounted) {
                            if (!propLocationName) setResolvedName((prev) => prev || cachedLoc.resolvedName);
                            setGeocodedName((prev) => prev || cachedLoc.geocodedName || cachedLoc.resolvedName);
                            return;
                        }
                    }
                } catch {}
                if (isMounted) {
                    if (!propLocationName) setResolvedName((prev) => prev || "Current Location");
                    setGeocodedName((prev) => prev || "Current Location");
                }
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [propLatitude, propLongitude, coords, propLocationName, isProfileFallback, resolvedName]);

    return {
        latitude: propLatitude !== undefined ? propLatitude : coords?.latitude,
        longitude: propLongitude !== undefined ? propLongitude : coords?.longitude,
        locationName: propLocationName || resolvedName || (isLocating ? "Locating..." : "Location Unavailable"),
        geocodedName,
        isLocating,
        isProfileFallback,
        refreshLocation: resolveLocation,
    };
};



