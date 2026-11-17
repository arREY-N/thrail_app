/**
 * @file BusinessReviewCardSkeleton.tsx
 * @description Shimmering skeleton loader mirroring the compact layout of BusinessReviewCard.
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
            {/* Header Row: Avatar + Username/Date • Mountain + Rating & Like Pills */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <SkeletonEffect style={styles.avatarSkeleton} />
                    <View style={styles.userInfo}>
                        <SkeletonEffect style={styles.userNameSkeleton} />
                        <SkeletonEffect style={styles.dateSkeleton} />
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <SkeletonEffect style={styles.ratingBadgeSkeleton} />
                    <SkeletonEffect style={styles.likeBadgeSkeleton} />
                </View>
            </View>

            {/* Review Text Body */}
            <View style={styles.textBody}>
                <SkeletonEffect style={styles.textLine1} />
                <SkeletonEffect style={styles.textLine2} />
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
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
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
        width: 160,
        height: 12,
        borderRadius: 4,
    },
    ratingBadgeSkeleton: {
        width: 52,
        height: 26,
        borderRadius: 12,
    },
    likeBadgeSkeleton: {
        width: 46,
        height: 26,
        borderRadius: 12,
    },
    textBody: {
        width: '100%',
        gap: 6,
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
});

export default React.memo(BusinessReviewCardSkeleton);
