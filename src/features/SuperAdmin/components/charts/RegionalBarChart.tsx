/**
 * @file RegionalBarChart.tsx
 * @description Horizontal Progress Bar Chart component displaying Regional Trail Counts with right-aligned numeric badges.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Trail } from '@/src/core/models/Trail/Trail';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

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
    const { isMobile } = useBreakpoints();
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

    const regions = [
        { label: 'Rizal Province', count: regionCounts['Rizal Province'] },
        { label: 'Batangas Province', count: regionCounts['Batangas Province'] },
        { label: 'Laguna Province', count: regionCounts['Laguna Province'] },
        { label: 'Cavite Province', count: regionCounts['Cavite Province'] },
        { label: 'Quezon Province', count: regionCounts['Quezon Province'] },
    ];

    const maxCount = Math.max(...regions.map(r => r.count), 1);

    return (
        <View style={[styles.card, !isMobile && styles.cardDesktop]}>
            {/* Header */}
            <View style={styles.cardHeader}>
                <CustomText variant="h3" style={styles.cardTitle}>
                    Trail Distribution
                </CustomText>
                <CustomText variant="caption" style={styles.cardSubtitle}>
                    Active routes by CALABARZON province ({totalTrails} Trails)
                </CustomText>
            </View>

            {/* Horizontal Progress Bars */}
            <View style={styles.barList}>
                {regions.map((region, idx) => {
                    const percentage = maxCount > 0 ? (region.count / maxCount) * 100 : 0;
                    return (
                        <View key={idx} style={styles.barItem}>
                            <View style={styles.barLabelHeader}>
                                <CustomText variant="caption" style={styles.barName}>
                                    {region.label}
                                </CustomText>
                            </View>
                            <View style={styles.barTrackRow}>
                                <View style={styles.barTrack}>
                                    <View style={[styles.barFill, { width: `${percentage}%` }]} />
                                </View>
                                <CustomText variant="caption" style={styles.barCountText}>
                                    {region.count} route{region.count !== 1 ? 's' : ''}
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
        width: '100%',
        minWidth: 280,
        justifyContent: 'space-between',
        ...GlobalStyles.dropShadow(2),
    },
    cardDesktop: {
        flex: 1,
        minWidth: 300,
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
