/**
 * @file BusinessReviewCardSkeleton.tsx
 * @description Shimmering skeleton loader mirroring the exact layout of BusinessReviewCard.
 * Follows the Doherty Threshold UX principle during async business review fetching.
 */

import React from 'react';
import {
    StyleSheet,
    View,
} from 'react-native';

import SkeletonEffect from '@/src/components/SkeletonEffect';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';

/**
 * BusinessReviewCardSkeleton — Skeleton loading card matching BusinessReviewCard geometry.
 *
 * @returns React.JSX.Element rendering the skeleton placeholder card
 */
const BusinessReviewCardSkeleton = (): React.JSX.Element => {
    return (
        <View style={styles.card}>
            {/* Header Row */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <SkeletonEffect style={styles.avatarSkeleton} />
                    <View style={styles.userInfo}>
                        <SkeletonEffect style={styles.userNameSkeleton} />
                        <SkeletonEffect style={styles.dateSkeleton} />
                    </View>
                </View>
                <SkeletonEffect style={styles.ratingBadgeSkeleton} />
            </View>

            {/* 5-Star Visual Row */}
            <SkeletonEffect style={styles.starsSkeleton} />

            {/* Review Text Body */}
            <View style={styles.textBody}>
                <SkeletonEffect style={styles.textLine1} />
                <SkeletonEffect style={styles.textLine2} />
            </View>

            {/* Context Footer */}
            <View style={styles.footerDivider} />
            <View style={styles.footerRow}>
                <SkeletonEffect style={styles.trailChipSkeleton} />
                <SkeletonEffect style={styles.hikeDateSkeleton} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        padding: 16,
        ...GlobalStyles.dropShadow(2, 0.05, Colors.SHADOW, { radius: 8 }),
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: 12,
    },
    avatarSkeleton: {
        width: 44,
        height: 44,
        borderRadius: 999,
    },
    userInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    userNameSkeleton: {
        width: 120,
        height: 16,
        borderRadius: 4,
        marginBottom: 6,
    },
    dateSkeleton: {
        width: 90,
        height: 12,
        borderRadius: 4,
    },
    ratingBadgeSkeleton: {
        width: 54,
        height: 26,
        borderRadius: 999,
    },
    starsSkeleton: {
        width: 88,
        height: 14,
        borderRadius: 4,
        marginBottom: 8,
    },
    textBody: {
        width: '100%',
        gap: 6,
        marginBottom: 12,
    },
    textLine1: {
        width: '100%',
        height: 14,
        borderRadius: 4,
    },
    textLine2: {
        width: '75%',
        height: 14,
        borderRadius: 4,
    },
    footerDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        width: '100%',
        marginBottom: 12,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    trailChipSkeleton: {
        width: 112,
        height: 24,
        borderRadius: 8,
    },
    hikeDateSkeleton: {
        width: 96,
        height: 14,
        borderRadius: 4,
    },
});

export default React.memo(BusinessReviewCardSkeleton);
