/**
 * @file RegionalBarChart.tsx
 * @description Horizontal Progress Bar Chart component displaying Regional Trail Counts with right-aligned numeric badges.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { Trail } from '@/src/core/models/Trail/Trail';
import { GlobalStyles } from '@/src/constants/globalStyles';

/**
 * Props for the RegionalBarChart component.
 * 
 * @param trails - Array of trail objects.
 */
interface Props {
    trails?: Trail[];
}

/**
 * RegionalBarChart component displaying regional trail distribution.
 * 
 * @param props - Component properties.
 * @returns {React.ReactElement} The rendered regional bar chart component.
 */
const RegionalBarChart = ({ trails = [] }: Props): React.JSX.Element => {
    const totalTrails = trails.length;

    // Calculate province counts for all 5 CALABARZON provinces
    const regionCounts: Record<string, number> = {
        'Rizal Province': 0,
        'Batangas Province': 0,
        'Laguna Province': 0,
        'Cavite Province': 0,
        'Quezon Province': 0,
    };

    trails.forEach((trail) => {
        const provinces = trail.general?.province || [];
        provinces.forEach((p) => {
            const pLower = p.toLowerCase();
            if (pLower.includes('rizal')) { regionCounts['Rizal Province'] += 1; }
            else if (pLower.includes('batangas')) { regionCounts['Batangas Province'] += 1; }
            else if (pLower.includes('laguna')) { regionCounts['Laguna Province'] += 1; }
            else if (pLower.includes('cavite')) { regionCounts['Cavite Province'] += 1; }
            else if (pLower.includes('quezon')) { regionCounts['Quezon Province'] += 1; }
        });
    });

    const maxRegionCount = Math.max(...Object.values(regionCounts), 1);
    const entries = Object.entries(regionCounts);

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.cardHeader}>
                <CustomText variant="h3" style={styles.cardTitle}>
                    Regional Trail Counts
                </CustomText>
                <CustomText variant="caption" style={styles.cardSubtitle}>
                    Registered trails per province ({totalTrails} Trails)
                </CustomText>
            </View>

            {/* Horizontal Bar Chart List */}
            <View style={styles.barList}>
                {entries.map(([region, count], idx) => {
                    const barPct = Math.round((count / maxRegionCount) * 100);

                    return (
                        <View key={idx} style={styles.barItem}>
                            <View style={styles.barLabelHeader}>
                                <CustomText variant="body" style={styles.barName} numberOfLines={1}>
                                    {region}
                                </CustomText>
                            </View>
                            <View style={styles.barTrackRow}>
                                <View style={styles.barTrack}>
                                    <View style={[styles.barFill, { width: `${Math.max(barPct, 6)}%` }]} />
                                </View>

                                {/* Right-Aligned Numeric Count Badge */}
                                <CustomText variant="caption" style={styles.barCountText}>
                                    {count} {count === 1 ? 'Trail' : 'Trails'}
                                </CustomText>
                            </View>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.WHITE,
        borderRadius: 14,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        flex: 1,
        minWidth: 280,
        justifyContent: 'space-between',
        ...GlobalStyles.dropShadow(2),
    },
    cardHeader: {
        marginBottom: 8,
    },
    cardTitle: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        fontSize: 16,
        marginBottom: 2,
    },
    cardSubtitle: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
    },
    barList: {
        gap: 8,
        paddingVertical: 2,
    },
    barItem: {
        gap: 2,
    },
    barLabelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    barName: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    barTrackRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    barTrack: {
        flex: 1,
        height: 8,
        backgroundColor: Colors.BACKGROUND,
        borderRadius: 4,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: Colors.CHART_PRIMARY,
        borderRadius: 4,
    },
    barCountText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        minWidth: 50,
        textAlign: 'right',
    },
});

export default RegionalBarChart;
