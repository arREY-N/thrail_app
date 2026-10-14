/**
 * @file MyBookingsSkeleton.tsx
 * @description Shimmer skeleton placeholder cards mirroring the exact layout of BookingCard.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import SkeletonEffect from '@/src/components/SkeletonEffect';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';

interface MyBookingsSkeletonProps {
    /** Number of skeleton cards to render (default: 3) */
    count?: number;
}

const MyBookingsSkeleton: React.FC<MyBookingsSkeletonProps> = ({ count = 3 }) => {
    return (
        <View style={styles.container}>
            {Array.from({ length: count }).map((_, index) => (
                <View key={`skeleton-card-${index}`} style={styles.cardContainer}>
                    {/* Top Row: Trail Name & Status Pill */}
                    <View style={styles.topRow}>
                        <SkeletonEffect style={styles.trailNameSkeleton} />
                        <SkeletonEffect style={styles.statusPillSkeleton} />
                    </View>

                    {/* Middle Row: Business & Date */}
                    <View style={styles.middleRow}>
                        <View style={styles.infoWrapper}>
                            <SkeletonEffect style={styles.iconSkeleton} />
                            <SkeletonEffect style={styles.infoTextSkeleton} />
                        </View>
                        <View style={styles.infoWrapper}>
                            <SkeletonEffect style={styles.iconSkeleton} />
                            <SkeletonEffect style={styles.dateTextSkeleton} />
                        </View>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Bottom Row: Price & Action */}
                    <View style={styles.bottomRow}>
                        <View style={styles.priceCol}>
                            <SkeletonEffect style={styles.priceLabelSkeleton} />
                            <SkeletonEffect style={styles.priceValueSkeleton} />
                        </View>
                        <View style={styles.actionCol}>
                            <SkeletonEffect style={styles.updateLabelSkeleton} />
                            <SkeletonEffect style={styles.actionButtonSkeleton} />
                        </View>
                    </View>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    cardContainer: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(3),
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    trailNameSkeleton: {
        width: 150,
        height: 20,
        borderRadius: 6,
    },
    statusPillSkeleton: {
        width: 90,
        height: 24,
        borderRadius: 12,
    },
    middleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 14,
    },
    infoWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    iconSkeleton: {
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    infoTextSkeleton: {
        width: 90,
        height: 14,
        borderRadius: 4,
    },
    dateTextSkeleton: {
        width: 80,
        height: 14,
        borderRadius: 4,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginBottom: 14,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    priceCol: {
        gap: 6,
    },
    priceLabelSkeleton: {
        width: 65,
        height: 12,
        borderRadius: 4,
    },
    priceValueSkeleton: {
        width: 95,
        height: 22,
        borderRadius: 6,
    },
    actionCol: {
        alignItems: 'flex-end',
        gap: 6,
    },
    updateLabelSkeleton: {
        width: 70,
        height: 12,
        borderRadius: 4,
    },
    actionButtonSkeleton: {
        width: 90,
        height: 18,
        borderRadius: 4,
    },
});

export default MyBookingsSkeleton;
