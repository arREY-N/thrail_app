/**
 * @file BusinessProfileSkeleton.tsx
 * @description Shimmering skeleton loader mirroring BusinessScreen (BusinessHeroCard + sticky 3-tab pill bar + MountainCardSkeleton grid/carousel).
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import MountainCardSkeleton from '@/src/components/MountainCardSkeleton';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import SkeletonEffect from '@/src/components/SkeletonEffect';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

/**
 * Props for the BusinessProfileSkeleton component.
 *
 * @param contentMaxWidth - Responsive maxWidth matching BusinessScreen layout.
 * @param effectiveContentWidth - Resolved numeric width for calculating 2-column grid card widths.
 * @param cardWidth - Dynamic card width for the horizontal featured carousel skeleton.
 */
interface BusinessProfileSkeletonProps {
    contentMaxWidth: number | `${number}%`;
    effectiveContentWidth: number;
    cardWidth: number;
}

/**
 * BusinessProfileSkeleton — Layout-mirroring skeleton for cold initial load of BusinessScreen.
 *
 * @param props - BusinessProfileSkeletonProps
 * @returns React.JSX.Element
 */
const BusinessProfileSkeleton = ({
    contentMaxWidth,
    effectiveContentWidth,
    cardWidth,
}: BusinessProfileSkeletonProps): React.JSX.Element => {
    const { isDesktop, isTablet } = useBreakpoints();
    const isWide = isDesktop || isTablet;

    const responsiveAlignStyle = {
        maxWidth: contentMaxWidth,
        alignSelf: 'center' as const,
        width: '100%' as const,
    };

    const availableWidth = Math.max(280, effectiveContentWidth - 32);
    const gap = 16;
    const useTwoColumnGrid = isWide && availableWidth >= 560;
    const gridCardWidth = useTwoColumnGrid
        ? Math.floor((availableWidth - gap) / 2)
        : undefined;

    return (
        <ResponsiveScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* 1. Hero Banner + 3-Column Specs Bar Skeleton */}
            <View style={styles.heroWrapper}>
                <SkeletonEffect style={styles.bannerSkeleton} />

                <View style={[styles.specsContainer, responsiveAlignStyle]}>
                    <View style={styles.specsCard}>
                        {[0, 1, 2].map((index) => (
                            <React.Fragment key={`spec-skel-${index}`}>
                                {index > 0 && <View style={styles.specDivider} />}
                                <View style={styles.specItem}>
                                    <SkeletonEffect style={styles.specIconSkeleton} />
                                    <SkeletonEffect style={styles.specLabelSkeleton} />
                                    <SkeletonEffect style={styles.specValueSkeleton} />
                                </View>
                            </React.Fragment>
                        ))}
                    </View>
                </View>
            </View>

            {/* 2. Sticky 3-Tab Pill Bar Skeleton */}
            <View style={styles.tabsBar}>
                <View style={[styles.floatingTabsContainer, responsiveAlignStyle]}>
                    <SkeletonEffect style={styles.tabPillSkeleton} />
                    <SkeletonEffect style={styles.tabPillSkeleton} />
                    <SkeletonEffect style={styles.tabPillSkeleton} />
                </View>
            </View>

            {/* 3. Offers Content Skeleton (Featured + Catalog) */}
            <View style={[styles.tabContentContainer, responsiveAlignStyle]}>
                <View style={styles.sectionBlock}>
                    <View style={styles.sectionHeader}>
                        <SkeletonEffect style={styles.sectionTitleSkeleton} />
                        <SkeletonEffect style={styles.sectionSubtitleSkeleton} />
                    </View>

                    <View style={styles.horizontalRow}>
                        <MountainCardSkeleton
                            style={{
                                width: cardWidth,
                                marginRight: 16,
                            }}
                        />
                        <MountainCardSkeleton
                            style={{
                                width: cardWidth,
                            }}
                        />
                    </View>
                </View>

                <View style={styles.sectionBlock}>
                    <View style={styles.sectionHeader}>
                        <SkeletonEffect style={styles.sectionTitleSkeleton} />
                        <SkeletonEffect style={styles.sectionSubtitleSkeleton} />
                    </View>

                    <View style={useTwoColumnGrid ? styles.catalogGrid : styles.catalogList}>
                        {[0, 1].map((index) => (
                            <MountainCardSkeleton
                                key={`catalog-skel-${index}`}
                                style={
                                    useTwoColumnGrid && gridCardWidth
                                        ? { width: gridCardWidth }
                                        : styles.listCard
                                }
                            />
                        ))}
                    </View>
                </View>
            </View>
        </ResponsiveScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: 32,
    },
    heroWrapper: {
        width: '100%',
        gap: 16,
    },
    bannerSkeleton: {
        height: 260,
        width: '100%',
        borderRadius: 0,
    },
    specsContainer: {
        paddingHorizontal: 16,
    },
    specsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(1, 0.05),
    },
    specItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    specDivider: {
        width: 1,
        height: 28,
        backgroundColor: Colors.GRAY_LIGHT,
    },
    specIconSkeleton: {
        width: 18,
        height: 18,
        borderRadius: 9,
    },
    specLabelSkeleton: {
        width: 44,
        height: 12,
        borderRadius: 6,
    },
    specValueSkeleton: {
        width: 60,
        height: 14,
        borderRadius: 6,
    },
    tabsBar: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 12,
    },
    floatingTabsContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        padding: 4,
        borderRadius: 20,
        gap: 8,
    },
    tabPillSkeleton: {
        flex: 1,
        height: 34,
        borderRadius: 16,
    },
    tabContentContainer: {
        paddingTop: 8,
    },
    sectionBlock: {
        marginBottom: 20,
    },
    sectionHeader: {
        paddingHorizontal: 16,
        marginBottom: 12,
        gap: 6,
    },
    sectionTitleSkeleton: {
        width: 210,
        height: 20,
        borderRadius: 8,
    },
    sectionSubtitleSkeleton: {
        width: 260,
        height: 12,
        borderRadius: 6,
    },
    horizontalRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        overflow: 'hidden',
    },
    catalogList: {
        paddingHorizontal: 16,
        gap: 16,
    },
    catalogGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 16,
    },
    listCard: {
        width: '100%',
    },
});

export default BusinessProfileSkeleton;
