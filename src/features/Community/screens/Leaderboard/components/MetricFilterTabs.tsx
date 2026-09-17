/**
 * @file MetricFilterTabs.tsx
 * @description Tab selector allowing hikers to filter the leaderboard by Distance (km), Elevation (m), or Hikes Count.
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

export type LeaderboardMetric = 'distance' | 'elevation' | 'hikes';

/**
 * Interface representing the properties for MetricFilterTabs.
 * 
 * @param activeMetric - Currently active ranking metric ('distance' | 'elevation' | 'hikes')
 * @param onMetricChange - Callback when a new metric tab is selected
 */
interface MetricFilterTabsProps {
    activeMetric: LeaderboardMetric;
    onMetricChange: (metric: LeaderboardMetric) => void;
}

const METRIC_OPTIONS: { key: LeaderboardMetric; label: string; unit: string }[] = [
    { key: 'distance', label: 'Distance', unit: 'km' },
    { key: 'elevation', label: 'Elevation', unit: 'm' },
    { key: 'hikes', label: 'Hikes', unit: 'count' },
];

/**
 * MetricFilterTabs — Segmented filter pill bar for switching leaderboard metric views.
 * 
 * @param props - MetricFilterTabsProps
 * @returns {React.JSX.Element} The rendered tab selector.
 */
const MetricFilterTabs = ({
    activeMetric,
    onMetricChange,
}: MetricFilterTabsProps): React.JSX.Element => {
    return (
        <View style={styles.container}>
            {METRIC_OPTIONS.map((option) => {
                const isActive = activeMetric === option.key;
                return (
                    <TouchableOpacity
                        key={option.key}
                        style={[
                            styles.tabButton,
                            isActive && styles.tabButtonActive,
                        ]}
                        onPress={() => onMetricChange(option.key)}
                        activeOpacity={0.75}
                    >
                        <CustomText
                            variant="caption"
                            style={[
                                styles.tabText,
                                isActive && styles.tabTextActive,
                            ]}
                            numberOfLines={1}
                        >
                            {option.label} ({option.unit})
                        </CustomText>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 2,
        backgroundColor: Colors.BACKGROUND,
        gap: 8,
        width: '100%',
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 20,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    tabButtonActive: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    tabText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
        fontSize: 12,
        textAlign: 'center',
    },
    tabTextActive: {
        color: Colors.WHITE,
        fontWeight: '700',
    },
});

export default MetricFilterTabs;
