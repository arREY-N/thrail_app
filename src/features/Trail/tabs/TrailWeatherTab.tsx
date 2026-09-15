import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import WeatherWidget from '@/src/components/WeatherWidget';
import { Colors } from '@/src/constants/colors';
import { ITrail } from '@/src/core/models/Trail/Trail';
import { resolveCoordsForTrail } from '@/src/core/utility/weatherHelpers';

export interface TrailWeatherTabProps {
    latitude?: number | null;
    longitude?: number | null;
    trail?: ITrail | null;
}

const TrailWeatherTab: React.FC<TrailWeatherTabProps> = ({ latitude, longitude, trail }) => {
    // Use explicit props if valid numbers; otherwise fall back to name-based lookup.
    const resolvedCoords = useMemo(() => {
        if (typeof latitude === 'number' && typeof longitude === 'number') {
            return { lat: latitude, lon: longitude };
        }
        return resolveCoordsForTrail(trail ?? {});
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
            <WeatherWidget
                latitude={resolvedCoords.lat}
                longitude={resolvedCoords.lon}
                trailName={trail?.general?.name}
            />
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