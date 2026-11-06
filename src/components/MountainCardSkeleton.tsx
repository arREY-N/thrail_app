/**
 * @file MountainCardSkeleton.tsx
 * @description Skeleton loader component mirroring the exact layout, dimensions, and border radius of MountainCard across Mobile and Web.
 */

import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import SkeletonEffect from '@/src/components/SkeletonEffect';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';

/**
 * Props for the MountainCardSkeleton component.
 *
 * @param style - Custom style for the card container (e.g. dynamic responsive width).
 */
interface MountainCardSkeletonProps {
    style?: StyleProp<ViewStyle>;
}

/**
 * MountainCardSkeleton — Shimmering skeleton loader mirroring MountainCard on both Mobile and Web.
 *
 * @param props - MountainCardSkeletonProps
 * @returns React.JSX.Element
 */
const MountainCardSkeleton: React.FC<MountainCardSkeletonProps> = ({ style }) => {
    const flattenedStyle = StyleSheet.flatten(style);
    const cardWidth = flattenedStyle?.width;
    const isNarrow = typeof cardWidth === 'number' && cardWidth < 300;
    const isWeb = Platform.OS === 'web';

    return (
        <View
            style={[
                isWeb ? styles.cardContainerWeb : styles.cardContainer,
                style,
            ]}
        >
            {/* Image Hero Section Skeleton */}
            <View style={isWeb ? styles.imageContainerWeb : styles.imageContainer}>
                <SkeletonEffect style={styles.imageSkeleton} />

                {/* Top Left Rating Badge Skeleton */}
                <View style={styles.topLeftPosition}>
                    <SkeletonEffect style={styles.glassPillSkeleton} />
                </View>

                {/* Bottom Title & Location Overlay Skeleton */}
                <View style={styles.overlayContainer}>
                    <SkeletonEffect style={styles.titleSkeleton} />
                    <SkeletonEffect style={styles.locationSkeleton} />
                </View>
            </View>

            {/* Bottom 3-Column Stats Container Skeleton */}
            <View
                style={[
                    isWeb ? styles.statsContainerWeb : styles.statsContainer,
                    isNarrow && styles.statsContainerNarrow,
                ]}
            >
                <View style={[styles.statBox, isNarrow && styles.statBoxNarrow]}>
                    <SkeletonEffect style={styles.statValueSkeleton} />
                    <SkeletonEffect style={styles.statLabelSkeleton} />
                </View>
                {!isNarrow && <View style={styles.verticalDivider} />}
                <View style={[styles.statBox, isNarrow && styles.statBoxNarrow]}>
                    <SkeletonEffect style={styles.statValueSkeleton} />
                    <SkeletonEffect style={styles.statLabelSkeleton} />
                </View>
                {!isNarrow && <View style={styles.verticalDivider} />}
                <View style={[styles.statBox, isNarrow && styles.statBoxNarrow]}>
                    <SkeletonEffect style={styles.statValueSkeleton} />
                    <SkeletonEffect style={styles.statLabelSkeleton} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        width: 280,
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(4, 0.1, Colors.SHADOW, { radius: 6 }),
    },
    cardContainerWeb: {
        width: 290,
        backgroundColor: Colors.WHITE,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(2),
    },
    imageContainer: {
        height: 180,
        width: '100%',
        position: 'relative',
        backgroundColor: Colors.GRAY_LIGHT,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    imageContainerWeb: {
        width: '100%',
        aspectRatio: 16 / 10,
        position: 'relative',
        backgroundColor: Colors.GRAY_LIGHT,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    imageSkeleton: {
        width: '100%',
        height: '100%',
    },
    topLeftPosition: {
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 2,
    },
    glassPillSkeleton: {
        width: 50,
        height: 26,
        borderRadius: 16,
    },
    overlayContainer: {
        position: 'absolute',
        left: 16,
        bottom: 16,
        zIndex: 2,
        gap: 6,
    },
    titleSkeleton: {
        width: 140,
        height: 18,
        borderRadius: 4,
    },
    locationSkeleton: {
        width: 90,
        height: 12,
        borderRadius: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 16,
        backgroundColor: Colors.WHITE,
    },
    statsContainerWeb: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.WHITE,
        height: 58,
    },
    statsContainerNarrow: {
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'space-around',
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statBoxNarrow: {
        flex: 0,
        minWidth: '40%',
        marginVertical: 4,
    },
    statValueSkeleton: {
        width: 44,
        height: 16,
        borderRadius: 4,
        marginBottom: 4,
    },
    statLabelSkeleton: {
        width: 36,
        height: 10,
        borderRadius: 4,
    },
    verticalDivider: {
        width: 1,
        height: 24,
        backgroundColor: Colors.GRAY_LIGHT,
    },
});

export default MountainCardSkeleton;
