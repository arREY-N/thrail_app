/**
 * @file BusinessOffersTab.tsx
 * @description Renders Tab 1 (Offers) of the Business Profile screen.
 * Displays a province-filterable All Tour Offerings catalog using CustomFilterTabs,
 * sorted by upcoming departure date (ascending soonest-first by default, with a toggle to flip order)
 * and supporting MountainCardSkeleton loading placeholders.
 */

import React, { useMemo, useState } from 'react';
import {
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomFilterTabs from '@/src/components/CustomFilterTabs';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ListEndIndicator from '@/src/components/ListEndIndicator';
import MountainCard from '@/src/components/MountainCard';
import MountainCardSkeleton from '@/src/components/MountainCardSkeleton';
import SkeletonEffect from '@/src/components/SkeletonEffect';
import { Colors } from '@/src/constants/colors';
import { ITrail } from '@/src/core/models/Trail/Trail';
import {
    buildProvinceFilterTabs,
    BusinessOfferSortOrder,
    filterTrailsByProvince,
    sortBusinessTrailsByDate,
} from '@/src/features/Business/utils/businessHelpers';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

/**
 * Props for the BusinessOffersTab component.
 *
 * @param allTrails - All unique trails with active offers from this business.
 * @param onMountainPress - Callback when a mountain card is tapped (opens TrailScreen).
 * @param onDownloadPress - Callback to download offline trail assets.
 * @param getItemRating - Function returning rating for a given trail ID.
 * @param getTrailOffersCount - Function returning active offers count for a trail ID.
 * @param getTrailEarliestOfferTime - Function returning earliest offer departure timestamp (ms) for a trail ID.
 * @param contentWidth - Constrained container width for grid calculation.
 * @param isLoading - Whether offers or trails are currently loading.
 */
interface Props {
    allTrails: ITrail[];
    onMountainPress: (trailId: string) => void;
    onDownloadPress: (trailId: string) => void;
    getItemRating: (trailId: string) => number;
    getTrailOffersCount: (trailId: string) => number;
    getTrailEarliestOfferTime?: (trailId: string) => number;
    contentWidth: number;
    isLoading?: boolean;
}

/**
 * BusinessOffersTab — Tab content presenting province-filtered and date-sorted active tour offerings.
 *
 * @param props - Component props
 * @returns React.JSX.Element rendering the offers tab content
 */
const BusinessOffersTab = ({
    allTrails,
    onMountainPress,
    onDownloadPress,
    getItemRating,
    getTrailOffersCount,
    getTrailEarliestOfferTime,
    contentWidth,
    isLoading = false,
}: Props): React.JSX.Element => {
    const { isDesktop, isTablet } = useBreakpoints();
    const isWide = isDesktop || isTablet;

    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [sortOrder, setSortOrder] = useState<BusinessOfferSortOrder>('asc');

    // Build sorted province filter tab options with dynamic counters for CustomFilterTabs
    const filterTabs = useMemo(() => buildProvinceFilterTabs(allTrails), [allTrails]);

    const activeCategory = useMemo(() => {
        return filterTabs.some((t) => t.id === selectedCategory) ? selectedCategory : 'All';
    }, [filterTabs, selectedCategory]);

    // Filter trails by province and apply Upcoming asc/desc sort
    const filteredTrails = useMemo(() => {
        const filtered = filterTrailsByProvince(allTrails, activeCategory);
        if (!getTrailEarliestOfferTime) {
            return sortOrder === 'asc' ? filtered : [...filtered].reverse();
        }
        return sortBusinessTrailsByDate(
            filtered,
            getTrailEarliestOfferTime,
            getTrailOffersCount,
            sortOrder
        );
    }, [allTrails, activeCategory, getTrailEarliestOfferTime, getTrailOffersCount, sortOrder]);

    // Exact responsive 2-column grid calculation on wide screens
    const availableWidth = Math.max(280, contentWidth - 32);
    const gap = 16;
    const useTwoColumnGrid = isWide && availableWidth >= 560;
    const gridCardWidth = useTwoColumnGrid
        ? Math.floor((availableWidth - gap) / 2)
        : undefined;

    if (isLoading && allTrails.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.sectionBlock}>
                    <View style={styles.sectionHeader}>
                        <SkeletonEffect style={styles.sectionTitleSkeleton} />
                        <SkeletonEffect style={styles.sectionSubtitleSkeleton} />
                    </View>

                    <View style={styles.filterPillsSkeletonRow}>
                        <SkeletonEffect style={styles.filterPillSkeletonWide} />
                        <SkeletonEffect style={styles.filterPillSkeleton} />
                        <SkeletonEffect style={styles.filterPillSkeleton} />
                    </View>

                    <View style={useTwoColumnGrid ? styles.catalogGrid : styles.catalogList}>
                        {[0, 1, 2, 3].map((index) => (
                            <MountainCardSkeleton
                                key={`offer-skel-${index}`}
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
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionTitleGroup}>
                            <CustomText variant="subtitle" style={styles.sectionTitle}>
                                All Tour Offerings
                                {filteredTrails.length > 0 && (
                                    <CustomText style={styles.sectionTitleCounter}>
                                        {` (${filteredTrails.length})`}
                                    </CustomText>
                                )}
                            </CustomText>
                            <CustomText variant="caption" style={styles.sectionSubtitle}>
                                Tap any trail to view terrain specs, weather, and book
                            </CustomText>
                        </View>

                        {filteredTrails.length > 0 && (
                            <TouchableOpacity
                                style={styles.sortButton}
                                onPress={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                                activeOpacity={0.7}
                            >
                                <CustomText style={styles.sortButtonText}>
                                    Upcoming
                                </CustomText>
                                <CustomIcon
                                    library="Feather"
                                    name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                                    size={14}
                                    color={Colors.PRIMARY}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Shared CustomFilterTabs (Shown when business has active offerings) */}
                {allTrails.length > 0 && (
                    <CustomFilterTabs
                        tabs={filterTabs}
                        activeTab={activeCategory}
                        onTabSelect={setSelectedCategory}
                        variant="pill"
                        fadeBackgroundColor={Colors.BACKGROUND}
                        containerStyle={styles.filterTabsContainer}
                        chipScrollStyle={styles.filterTabsScroll}
                    />
                )}

                {/* Catalog Grid / List */}
                {filteredTrails.length > 0 ? (
                    <>
                        <View style={useTwoColumnGrid ? styles.catalogGrid : styles.catalogList}>
                            {filteredTrails.map((trail) => (
                                <MountainCard
                                    key={`catalog-${trail.id}`}
                                    rating={getItemRating(trail.id)}
                                    item={trail}
                                    onPress={() => onMountainPress(trail.id)}
                                    onDownload={() => onDownloadPress(trail.id)}
                                    style={
                                        useTwoColumnGrid && gridCardWidth
                                            ? { width: gridCardWidth }
                                            : styles.listCard
                                    }
                                    offersCount={getTrailOffersCount(trail.id)}
                                />
                            ))}
                        </View>
                        <ListEndIndicator
                            label="No more offers to show."
                            maxWidth="100%"
                            style={styles.endIndicator}
                        />
                    </>
                ) : (
                    <View style={styles.emptyContainer}>
                        <CustomIcon
                            library="Ionicons"
                            name="trail-sign-outline"
                            size={44}
                            color={Colors.GRAY_MEDIUM}
                        />
                        <CustomText variant="caption" style={styles.emptyText}>
                            {allTrails.length > 0
                                ? 'No active hiking offers scheduled under this location.'
                                : 'No active hiking offers scheduled at the moment.'}
                        </CustomText>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingBottom: 24,
    },
    sectionBlock: {
        marginBottom: 20,
    },
    sectionHeader: {
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    sectionTitleGroup: {
        flex: 1,
        minWidth: 0,
    },
    sectionTitle: {
        fontSize: 20,
        marginBottom: 2,
    },
    sectionTitleCounter: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 20,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
        flexShrink: 0,
        ...Platform.select({
            web: {
                cursor: 'pointer',
            },
        }),
    },
    sortButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
    },
    filterTabsContainer: {
        marginTop: 4,
        marginBottom: 14,
    },
    filterTabsScroll: {
        paddingHorizontal: 16,
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
    endIndicator: {
        marginTop: 16,
        paddingHorizontal: 16,
    },
    emptyContainer: {
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        padding: 32,
        marginHorizontal: 16,
        marginTop: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        gap: 10,
    },
    emptyText: {
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    sectionTitleSkeleton: {
        width: 210,
        height: 20,
        borderRadius: 8,
        marginBottom: 6,
    },
    sectionSubtitleSkeleton: {
        width: 250,
        height: 12,
        borderRadius: 6,
    },
    filterPillsSkeletonRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
        marginTop: 4,
        marginBottom: 14,
    },
    filterPillSkeletonWide: {
        width: 72,
        height: 32,
        borderRadius: 16,
    },
    filterPillSkeleton: {
        width: 96,
        height: 32,
        borderRadius: 16,
    },
});

export default BusinessOffersTab;
