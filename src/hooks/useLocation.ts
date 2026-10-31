import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import { useAuthStore } from '@/src/core/models/User/User';

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

    const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
        hasExplicitCoords ? { latitude: propLatitude!, longitude: propLongitude! } : null
    );
    const [resolvedName, setResolvedName] = useState<string | null>(propLocationName || null);
    const [geocodedName, setGeocodedName] = useState<string | null>(null);
    const [isLocating, setIsLocating] = useState<boolean>(!hasExplicitCoords && !propLocationName);
    const [isProfileFallback, setIsProfileFallback] = useState<boolean>(false);

    const isMountedRef = useRef(true);
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Helper: Fall back to authenticated user profile address from Firebase Firestore
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

        // If made-up address or no address set in profile, do NOT use hardcoded Manila
        if (isMountedRef.current) {
            setCoords(null);
            setResolvedName(null);
            setGeocodedName(null);
            setIsProfileFallback(false);
            setIsLocating(false);
        }
    }, []);

    // Main location resolver function
    const resolveLocation = useCallback(async () => {
        if (hasExplicitCoords) return;

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
            try {
                const positionPromise = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));
                location = await Promise.race([positionPromise, timeoutPromise]);
            } catch (posErr) {
                console.warn('[useLocation] getCurrentPositionAsync error:', posErr);
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
        try {
            navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((status) => {
                status.onchange = () => {
                    if (status.state === 'granted') {
                        resolveLocation();
                    }
                };
            }).catch(() => {});
        } catch {}
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

        let isMounted = true;

        (async () => {
            try {
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
                        }
                    } else if (isMounted) {
                        if (!propLocationName) setResolvedName("Current Location");
                        setGeocodedName("Current Location");
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
                            if (isMounted) {
                                if (!propLocationName) setResolvedName(cityName || "Current Location");
                                setGeocodedName(details || cityName || "Current Location");
                            }
                            return;
                        }
                    } catch {
                        // Network error or blocked -> fallback to Current Location
                    }
                    if (isMounted) {
                        if (!propLocationName) setResolvedName("Current Location");
                        setGeocodedName("Current Location");
                    }
                }
            } catch {
                if (isMounted) {
                    if (!propLocationName) setResolvedName("Current Location");
                    setGeocodedName("Current Location");
                }
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [propLatitude, propLongitude, coords, propLocationName, isProfileFallback]);

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



