/**
 * @file BusinessOffersTab.tsx
 * @description Renders Tab 1 (Offers) of the Business Profile screen.
 * Displays Top 3 Featured Upcoming trail packages (with web drag scroll and scroll fades)
 * followed by a province-filterable catalog using CustomFilterTabs.
 */

import React, { useMemo, useRef, useState } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

import CustomFilterTabs, { FilterTabItem } from '@/src/components/CustomFilterTabs';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import MountainCard from '@/src/components/MountainCard';
import { Colors } from '@/src/constants/colors';
import { ITrail } from '@/src/core/models/Trail/Trail';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { useWebDragScroll } from '@/src/hooks/useWebDragScroll';

/**
 * Props for the BusinessOffersTab component.
 *
 * @param featuredTrails - Top 3 soonest bookable upcoming trail packages.
 * @param allTrails - All unique trails with active offers from this business.
 * @param onMountainPress - Callback when a mountain card is tapped (opens TrailScreen).
 * @param onDownloadPress - Callback to download offline trail assets.
 * @param getItemRating - Function returning rating for a given trail ID.
 * @param getTrailOffersCount - Function returning active offers count for a trail ID.
 * @param cardWidth - Dynamic card width for horizontal carousel.
 * @param contentWidth - Constrained container width for grid calculation.
 */
interface Props {
    featuredTrails: ITrail[];
    allTrails: ITrail[];
    onMountainPress: (trailId: string) => void;
    onDownloadPress: (trailId: string) => void;
    getItemRating: (trailId: string) => number;
    getTrailOffersCount: (trailId: string) => number;
    cardWidth: number;
    contentWidth: number;
}

/**
 * BusinessOffersTab — Tab content presenting featured upcoming tours and province-filtered packages.
 *
 * @param props - Component props
 * @returns React.JSX.Element rendering the offers tab content
 */
const BusinessOffersTab = ({
    featuredTrails,
    allTrails,
    onMountainPress,
    onDownloadPress,
    getItemRating,
    getTrailOffersCount,
    cardWidth,
    contentWidth,
}: Props): React.JSX.Element => {
    const { isDesktop, isTablet } = useBreakpoints();
    const isWide = isDesktop || isTablet;

    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    const featuredScrollRef = useRef<ScrollView>(null);
    const hasFeatured = featuredTrails.length > 0;
    useWebDragScroll(featuredScrollRef, hasFeatured, featuredTrails);

    // Extract dynamic unique province list from all active trails
    const uniqueProvinces = useMemo(() => {
        const provinces = new Set<string>();
        allTrails.forEach((t) => {
            const provs = t.general?.province;
            if (Array.isArray(provs)) {
                provs.forEach((p: string) => {
                    if (typeof p === 'string' && p.trim()) {
                        provinces.add(p.trim());
                    }
                });
            } else if (typeof provs === 'string' && (provs as string).trim()) {
                provinces.add((provs as string).trim());
            }
        });
        return Array.from(provinces);
    }, [allTrails]);

    // Build province-only filter tab options with dynamic counters for CustomFilterTabs
    const filterTabs = useMemo((): FilterTabItem[] => {
        const tabs: FilterTabItem[] = [
            {
                id: 'All',
                label: 'All',
                count: allTrails.length,
            },
        ];

        uniqueProvinces.forEach((prov) => {
            const provCount = allTrails.filter((t) => {
                if (Array.isArray(t.general?.province)) {
                    return t.general.province.includes(prov);
                }
                return t.general?.province === prov;
            }).length;

            tabs.push({
                id: prov,
                label: prov,
                count: provCount,
            });
        });

        return tabs;
    }, [allTrails, uniqueProvinces]);

    // Filter trails according to active province tab
    const filteredTrails = useMemo(() => {
        if (selectedCategory === 'All') {
            return allTrails;
        }
        return allTrails.filter((t) => {
            if (Array.isArray(t.general?.province)) {
                return t.general.province.includes(selectedCategory);
            }
            return t.general?.province === selectedCategory;
        });
    }, [allTrails, selectedCategory]);

    // Exact responsive 2-column grid calculation on wide screens
    const availableWidth = Math.max(280, contentWidth - 32);
    const gap = 16;
    const useTwoColumnGrid = isWide && availableWidth >= 560;
    const gridCardWidth = useTwoColumnGrid
        ? Math.floor((availableWidth - gap) / 2)
        : undefined;

    return (
        <View style={styles.container}>
            {/* 1. TOP 3 FEATURED UPCOMING SECTION */}
            {hasFeatured && (
                <View style={styles.sectionBlock}>
                    <View style={styles.sectionHeader}>
                        <CustomText variant="subtitle" style={styles.sectionTitle}>
                            Featured Upcoming Packages
                        </CustomText>
                        <CustomText variant="caption" style={styles.sectionSubtitle}>
                            Soonest departures with available hiker slots
                        </CustomText>
                    </View>

                    <View style={styles.carouselWrapper}>
                        <ScrollView
                            ref={featuredScrollRef}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.horizontalList}
                            style={styles.scrollViewStyle}
                        >
                            {featuredTrails.map((trail) => (
                                <MountainCard
                                    key={`featured-${trail.id}`}
                                    rating={getItemRating(trail.id)}
                                    item={trail}
                                    onPress={() => onMountainPress(trail.id)}
                                    onDownload={() => onDownloadPress(trail.id)}
                                    style={{
                                        width: cardWidth,
                                        marginRight: 16,
                                    }}
                                    offersCount={getTrailOffersCount(trail.id)}
                                />
                            ))}
                        </ScrollView>
                    </View>
                </View>
            )}

            {/* 2. ALL PACKAGES WITH PROVINCE FILTER TABS */}
            <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                    <CustomText variant="subtitle" style={styles.sectionTitle}>
                        All Tour Offerings
                    </CustomText>
                    <CustomText variant="caption" style={styles.sectionSubtitle}>
                        Tap any trail to view terrain specs, weather, and book
                    </CustomText>
                </View>

                {/* Shared CustomFilterTabs (Provinces Only) */}
                <CustomFilterTabs
                    tabs={filterTabs}
                    activeTab={selectedCategory}
                    onTabSelect={setSelectedCategory}
                    variant="pill"
                    fadeBackgroundColor={Colors.BACKGROUND}
                    containerStyle={styles.filterTabsContainer}
                    chipScrollStyle={styles.filterTabsScroll}
                />

                {/* Catalog Grid / List */}
                {filteredTrails.length > 0 ? (
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
                ) : (
                    <View style={styles.emptyContainer}>
                        <CustomIcon
                            library="Ionicons"
                            name="trail-sign-outline"
                            size={44}
                            color={Colors.GRAY_MEDIUM}
                        />
                        <CustomText variant="caption" style={styles.emptyText}>
                            No active hiking packages scheduled under this location.
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
    sectionTitle: {
        fontSize: 20,
        marginBottom: 2,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    carouselWrapper: {
        position: 'relative',
        width: '100%',
    },
    horizontalList: {
        paddingTop: 12,
        paddingBottom: 16,
        paddingHorizontal: 16,
    },
    scrollViewStyle: {
        width: '100%',
        ...Platform.select({
            web: {
                paddingBottom: 4,
                marginBottom: -4,
            },
        }),
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
    emptyContainer: {
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        padding: 32,
        marginHorizontal: 16,
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
});

export default BusinessOffersTab;
