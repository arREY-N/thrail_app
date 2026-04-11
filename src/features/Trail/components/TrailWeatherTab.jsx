import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import WeatherWidget from '@/src/components/WeatherWidget';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

// Fallback coordinate table keyed by mountain name substring (lowercase).
// Used when the Firestore trail document does not carry lat/lng fields.
const MOUNTAIN_COORDS = {
  tagapo: { lat: 14.3392772, lon: 121.2325293 },
  marami: { lat: 14.1986108, lon: 120.6858334 },
  batulao: { lat: 14.0399434, lon: 120.8023782 },
  makiling: { lat: 14.1352241, lon: 121.1944517 },
  maculot: { lat: 13.9208682, lon: 121.0516961 },
};

/** Resolve coordinates for a trail from the fallback lookup table. */
const resolveCoords = (trailName) => {
    const lower = (trailName ?? '').toLowerCase();
    for (const [keyword, coords] of Object.entries(MOUNTAIN_COORDS)) {
        if (lower.includes(keyword)) return coords;
    }
    return null;
};

const TrailWeatherTab = ({ latitude, longitude, trail }) => {
    // Use explicit props if valid numbers; otherwise fall back to name-based lookup.
    const resolvedCoords = useMemo(() => {
        if (typeof latitude === 'number' && typeof longitude === 'number') {
            return { lat: latitude, lon: longitude };
        }
        const trailName = trail?.general?.name ?? '';
        return resolveCoords(trailName);
    }, [latitude, longitude, trail]);

    if (!resolvedCoords) {
        return (
            <View style={[styles.tabContent, styles.noCoords]}>
                <CustomIcon
                    library="Feather"
                    name="map-pin"
                    size={32}
                    color={Colors.GRAY_MEDIUM}
                />
                <CustomText style={styles.noCoordsText}>
                    Weather data is not available for this trail yet.
                </CustomText>
            </View>
        );
    }

    return (
        <View style={styles.tabContent}>
            <WeatherWidget latitude={resolvedCoords.lat} longitude={resolvedCoords.lon} />
        </View>
    );
};

const styles = StyleSheet.create({
    tabContent: {
        gap: 20,
    },
    noCoords: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        gap: 12,
    },
    noCoordsText: {
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        fontSize: 15,
    },
});

export default TrailWeatherTab;