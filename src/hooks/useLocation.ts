import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { FALLBACK_COORDINATES } from '@/src/constants/constants';

interface UseLocationProps {
    propLatitude?: number;
    propLongitude?: number;
    propLocationName?: string;
}

export const useLocation = (props?: UseLocationProps) => {
    const { propLatitude, propLongitude, propLocationName } = props || {};
    
    const [coords, setCoords] = useState<{latitude: number, longitude: number} | null>(
        propLatitude !== undefined && propLongitude !== undefined 
            ? { latitude: propLatitude, longitude: propLongitude } 
            : null
    );
    const [resolvedName, setResolvedName] = useState<string | null>(propLocationName || null);
    const [geocodedName, setGeocodedName] = useState<string | null>(null);
    const [isLocating, setIsLocating] = useState<boolean>(!propLatitude || !propLocationName);

    // 1. Fetch coords if completely missing
    useEffect(() => {
        if (propLatitude !== undefined && propLongitude !== undefined) return;

        let isMounted = true;
        (async () => {
            try {
                let { status } = await Location.getForegroundPermissionsAsync();
                if (status !== 'granted') {
                    if (isMounted) {
                        setCoords(FALLBACK_COORDINATES);
                        setIsLocating(false);
                    }
                    return;
                }
                
                let location = await Location.getLastKnownPositionAsync({});
                if (!location) location = await Location.getCurrentPositionAsync({});
                
                if (isMounted) {
                    setCoords({ 
                        latitude: location.coords.latitude, 
                        longitude: location.coords.longitude 
                    });
                }
            } catch (err) {
                if (isMounted) setCoords(FALLBACK_COORDINATES);
            }
        })();

        return () => { isMounted = false; };
    }, [propLatitude, propLongitude]);

    // 2. Reverse Geocode if we have coords
    useEffect(() => {
        const effLat = propLatitude !== undefined ? propLatitude : coords?.latitude;
        const effLon = propLongitude !== undefined ? propLongitude : coords?.longitude;

        if (effLat !== undefined && effLon !== undefined) {
            let isMounted = true;
            (async () => {
                try {
                    const geocodeResult = await Location.reverseGeocodeAsync({ 
                        latitude: effLat, 
                        longitude: effLon 
                    });
                    if (geocodeResult && geocodeResult.length > 0) {
                        const loc = geocodeResult[0];
                        // loc.name contains specific landmarks or point of interests (like mountains/trails)
                        const nameToUse = loc.name || loc.city || loc.subregion || loc.region || 'Current Location';
                        const geoDetails = [loc.city || loc.subregion, loc.region].filter(Boolean).join(', ');
                        
                        if (isMounted) {
                            if (!propLocationName) setResolvedName(nameToUse);
                            setGeocodedName(geoDetails || nameToUse);
                        }
                    } else if (isMounted) {
                        if (!propLocationName) setResolvedName("Current Location");
                    }
                } catch (err) {
                    if (isMounted) {
                        if (!propLocationName) setResolvedName("Current Location");
                        setGeocodedName("Location unavailable");
                    }
                } finally {
                    if (isMounted) setIsLocating(false);
                }
            })();
            return () => { isMounted = false; };
        }
    }, [propLatitude, propLongitude, coords, propLocationName]);

    return {
        latitude: propLatitude !== undefined ? propLatitude : coords?.latitude,
        longitude: propLongitude !== undefined ? propLongitude : coords?.longitude,
        locationName: propLocationName || resolvedName || (isLocating ? "Locating..." : "Current Location"),
        geocodedName,
        isLocating
    };
};
