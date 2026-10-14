import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { FALLBACK_COORDINATES } from '@/src/constants/constants';

interface UseLocationProps {
    propLatitude?: number;
    propLongitude?: number;
    propLocationName?: string;
}

export const useLocation = (props?: UseLocationProps) => {
    const { propLatitude, propLongitude, propLocationName } = props || {};
    const hasExplicitCoords = propLatitude !== undefined && propLongitude !== undefined;
    const isWeb = Platform.OS === 'web';
    
    const [coords, setCoords] = useState<{latitude: number, longitude: number} | null>(
        hasExplicitCoords 
            ? { latitude: propLatitude!, longitude: propLongitude! } 
            : isWeb
                ? FALLBACK_COORDINATES
                : null
    );
    const [resolvedName, setResolvedName] = useState<string | null>(
        propLocationName || (isWeb ? "Metro Manila" : null)
    );
    const [geocodedName, setGeocodedName] = useState<string | null>(
        isWeb ? "National Capital Region, Philippines" : null
    );
    const [isLocating, setIsLocating] = useState<boolean>(
        isWeb || hasExplicitCoords ? false : (!propLocationName)
    );

    // 1. Fetch coordinates if missing (Native only)
    useEffect(() => {
        if (hasExplicitCoords || isWeb) {
            return;
        }

        let isMounted = true;

        (async () => {
            try {
                let { status } = await Location.getForegroundPermissionsAsync();
                if (status !== 'granted') {
                    const req = await Location.requestForegroundPermissionsAsync();
                    if (req.status !== 'granted') {
                        if (isMounted) {
                            setCoords(FALLBACK_COORDINATES);
                            setIsLocating(false);
                        }
                        return;
                    }
                }
                
                let location = await Location.getLastKnownPositionAsync({});
                if (!location) location = await Location.getCurrentPositionAsync({});
                
                if (isMounted) {
                    setCoords({ 
                        latitude: location.coords.latitude, 
                        longitude: location.coords.longitude 
                    });
                }
            } catch {
                if (isMounted) {
                    setCoords(FALLBACK_COORDINATES);
                    setIsLocating(false);
                }
            }
        })();

        return () => { isMounted = false; };
    }, [hasExplicitCoords, propLatitude, propLongitude, isWeb]);

    // 2. Reverse Geocode when coords are available (Native only)
    useEffect(() => {
        if (isWeb) return;

        const effLat = propLatitude !== undefined ? propLatitude : coords?.latitude;
        const effLon = propLongitude !== undefined ? propLongitude : coords?.longitude;

        if (effLat === undefined || effLon === undefined) return;

        let isMounted = true;

        (async () => {
            try {
                const geocodeResult = await Location.reverseGeocodeAsync({ 
                    latitude: effLat, 
                    longitude: effLon 
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
            } catch {
                if (isMounted) {
                    if (!propLocationName) setResolvedName("Current Location");
                    setGeocodedName("Location unavailable");
                }
            } finally {
                if (isMounted) setIsLocating(false);
            }
        })();

        return () => { isMounted = false; };
    }, [propLatitude, propLongitude, coords, propLocationName, isWeb]);

    return {
        latitude: propLatitude !== undefined ? propLatitude : coords?.latitude,
        longitude: propLongitude !== undefined ? propLongitude : coords?.longitude,
        locationName: propLocationName || resolvedName || (isLocating ? "Locating..." : "Current Location"),
        geocodedName,
        isLocating
    };
};


