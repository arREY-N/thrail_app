/**
 * @file ExploreScreen.tsx
 * @description Pure presentation screen for the Explore tab. Displays search, dynamic filter selections, categories tabs, and a responsive grid of trails.
 */

import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, FlatList, StyleSheet, View } from "react-native";

import CustomFAB from "@/src/components/CustomFAB";
import CustomFilterModal from "@/src/components/CustomFilterModal";
import CustomHeader from "@/src/components/CustomHeader";
import CustomIcon from "@/src/components/CustomIcon";
import CustomText from "@/src/components/CustomText";
import MountainCard from "@/src/components/MountainCard";
import ScreenWrapper from "@/src/components/ScreenWrapper";

import { Colors } from "@/src/constants/colors";
import { Offer } from "@/src/core/models/Offer/Offer";
import { ITrail } from "@/src/core/models/Trail/interfaces/Trail.types";
import { fetchTrailWeatherBadges, TrailWeatherBadge } from "@/src/core/utility/weatherHelpers";
import { useBreakpoints } from "@/src/hooks/useBreakpoints";

const CATEGORIES = ["All", "Recommended", "Offers", "Nearby", "Discover", "Challenge"];
const PROVINCES = ['Rizal', 'Batangas', 'Laguna', 'Cavite', 'Quezon'];
const ELEVATIONS = ['< 500 masl', '500 - 1000 masl', '> 1000 masl'];

/**
 * Props for the ExploreScreen component.
 * 
 * @param trails - The complete list of available trails.
 * @param onViewMountain - Callback fired when a trail is selected.
 * @param onGroupPress - Callback fired when the group/FAB action is pressed.
 * @param getItemRating - Function to calculate or retrieve the rating for a specific trail.
 * @param isLoading - Whether the trails list is currently loading.
 * @param initialCategory - The initial category to select.
 * @param offers - List of active offers passed from the controller.
 */
export interface ExploreScreenProps {
    trails: ITrail[];
    onViewMountain: (id: string) => void;
    onGroupPress: () => void;
    getItemRating: (id: string) => number | string;
    isLoading: boolean;
    initialCategory?: string;
    offers?: Offer[];
}

/**
 * Interface defining the active filters state.
 */
interface ActiveFilters {
    provinces: string[];
    elevation: string | null;
}

/**
 * ExploreScreen — The primary discovery view containing category tabs, 
 * Province/Elevation filters, search queries, and a responsive grid layout.
 */
const ExploreScreen: React.FC<ExploreScreenProps> = ({
    trails,
    onViewMountain,
    onGroupPress,
    getItemRating,
    isLoading,
    initialCategory = "All",
    offers = []
}) => {
    const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isFilterModalVisible, setIsFilterModalVisible] = useState<boolean>(false);

    const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
        provinces: [],
        elevation: null,
    });

    // Header animated scroll visibility states
    const [headerVisible, setHeaderVisible] = useState<boolean>(true);
    const lastOffsetY = useRef<number>(0);
    const animatedHeaderHeight = useRef(new Animated.Value(1)).current; // 1 = visible, 0 = hidden

    useEffect(() => {
        if (initialCategory) {
            setSelectedCategory(initialCategory);
        }
    }, [initialCategory]);

    useEffect(() => {
        Animated.timing(animatedHeaderHeight, {
            toValue: headerVisible ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [headerVisible]);

    const translateY = animatedHeaderHeight.interpolate({
        inputRange: [0, 1],
        outputRange: [-260, 0], // Fully slide header off-screen vertically
    });

    useFocusEffect(
        useCallback(() => {
            setHeaderVisible(true);
        }, [])
    );

    const { width, isDesktop, isTablet } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;

    const MAX_WIDTH = 1400;
    const effectiveWidth = Math.min(width, MAX_WIDTH);
    const containerPadding = 16;
    const gap = 16;
    const availableWidth = effectiveWidth - containerPadding * 2;

    let numColumns = 1;
    if (availableWidth >= 1300) numColumns = 4;
    else if (availableWidth >= 950) numColumns = 3;
    else if (availableWidth >= 650) numColumns = 2;

    const cardWidth = (availableWidth - gap * (numColumns - 1)) / numColumns;

    const filteredTrails = useMemo(() => {
        let result = filterTrailsByCategory(trails, selectedCategory, offers);

        if (searchQuery.trim().length > 0) {
            const query = searchQuery.toLowerCase();
            result = result.filter((t: ITrail) =>
                t.general?.name?.toLowerCase().includes(query) ||
                t.general?.province?.some((p: string) => p.toLowerCase().includes(query))
            );
        }

        if (activeFilters.provinces.length > 0) {
            result = result.filter((t: ITrail) => {
                const targetProvinces = Array.isArray(t.general?.province)
                    ? t.general.province
                    : [t.general?.province || t.general?.address || ""];

                return activeFilters.provinces.some((filterProv: string) =>
                    targetProvinces.some((p: string) => p.toLowerCase().includes(filterProv.toLowerCase()))
                );
            });
        }

        if (activeFilters.elevation) {
            result = result.filter((t: ITrail) => {
                const elevRaw = t.geography?.masl || t.difficulty?.elevation || "0";
                const elev = parseInt(String(elevRaw).replace(/[^0-9]/g, ''), 10) || 0;

                if (activeFilters.elevation === '< 500 masl') return elev < 500;
                if (activeFilters.elevation === '500 - 1000 masl') return elev >= 500 && elev <= 1000;
                if (activeFilters.elevation === '> 1000 masl') return elev > 1000;
                return true;
            });
        }

        return result;
    }, [selectedCategory, trails, searchQuery, activeFilters, offers]);

    const shouldCenterGrid = filteredTrails.length > 0 && filteredTrails.length < numColumns;

    // Retrieve active upcoming offers count for the trail card badge
    const getTrailOffersCount = (trailId: string) => {
        const now = new Date();
        return offers.filter(o => o.trail?.id === trailId && o.date && new Date(o.date).getTime() > now.getTime()).length;
    };

    const filterSections = [
        {
            id: 'provinces',
            title: 'Province',
            type: 'pill' as const,
            multiSelect: true,
            options: PROVINCES.map(p => ({ label: p, value: p }))
        },
        {
            id: 'elevation',
            title: 'Elevation Range',
            type: 'pill' as const,
            multiSelect: false,
            options: ELEVATIONS.map(e => ({ label: e, value: e }))
        }
    ];

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <View style={styles.container}>
                <Animated.View style={[
                    styles.headerAnimatedWrapper,
                    { transform: [{ translateY }] }
                ]}>
                    <CustomHeader
                        title="Explore"
                        showDefaultIcons={true}
                        hasSearch={true}
                        searchProps={{
                            searchPlaceholder: "Search mountains or locations...",
                            searchValue: searchQuery,
                            onSearchChange: setSearchQuery,
                            rightIconLibrary: "Ionicons",
                            rightIconName: "filter",
                            onRightButtonPress: () => setIsFilterModalVisible(true),
                            tabs: CATEGORIES,
                            activeTab: selectedCategory,
                            onTabSelect: setSelectedCategory,
                        }}
                    />
                </Animated.View>

                <FlatList
                    key={`explore-grid-${numColumns}`}
                    data={filteredTrails}
                    keyExtractor={(item) => item.id}
                    numColumns={numColumns}
                    contentContainerStyle={[
                        styles.scrollContent,
                        isWideScreen && styles.scrollContentWide,
                        { paddingTop: 215 } // Matches CommunityScreen exact layout
                    ]}
                    columnWrapperStyle={numColumns > 1 ? { gap } : undefined}
                    ItemSeparatorComponent={() => <View style={{ height: gap }} />}
                    showsVerticalScrollIndicator={false}
                    scrollEventThrottle={16}
                    onScroll={Animated.event(
                        [],
                        {
                            useNativeDriver: false,
                            listener: (event: any) => {
                                const currentOffsetY = event.nativeEvent.contentOffset.y;
                                if (currentOffsetY <= 0) {
                                    setHeaderVisible(true);
                                    return;
                                }
                                const diff = currentOffsetY - lastOffsetY.current;
                                if (diff > 15 && headerVisible) {
                                    setHeaderVisible(false);
                                } else if (diff < -15 && !headerVisible) {
                                    setHeaderVisible(true);
                                }
                                lastOffsetY.current = currentOffsetY;
                            }
                        }
                    )}
                    ListEmptyComponent={() => (
                        <View style={[styles.listContainer, { justifyContent: 'center' }]}>
                            {isLoading ? (
                                <View style={styles.loaderContainer}>
                                    <ActivityIndicator size="large" color={Colors.PRIMARY} />
                                </View>
                            ) : (
                                <View style={styles.emptyState}>
                                    <CustomIcon
                                        library="Ionicons"
                                        name="trail-sign-outline"
                                        size={48}
                                        color={Colors.GRAY_MEDIUM}
                                    />
                                    <CustomText style={styles.emptyStateText}>
                                        {searchQuery || activeFilters.provinces.length > 0 || activeFilters.elevation
                                            ? "No trails match your current filters and search."
                                            : `No trails found for "${selectedCategory}".`}
                                    </CustomText>
                                </View>
                            )}
                        </View>
                    )}
                    renderItem={({ item: t }) => (
                        <MountainCard
                            rating={getItemRating(t.id)}
                            item={t}
                            onPress={() => onViewMountain(t.id)}
                            onLikePress={() => console.log("Like", t.general?.name)}
                            style={{ width: cardWidth }}
                            offersCount={getTrailOffersCount(t.id)}
                        />
                    )}
                />

                <CustomFilterModal
                    visible={isFilterModalVisible}
                    onClose={() => setIsFilterModalVisible(false)}
                    title="Filters"
                    sections={filterSections}
                    initialValues={activeFilters}
                    defaultValues={{ provinces: [], elevation: null }}
                    onApply={(values) => setActiveFilters(values as ActiveFilters)}
                />

                <CustomFAB onPress={onGroupPress} />

            </View>
        </ScreenWrapper>
    );
};

const filterTrailsByCategory = (trails: ITrail[], category: string, offers: Offer[] = []): ITrail[] => {
    if (!trails) return [];

    switch (category) {
        case "Recommended":
            return trails.filter((t: ITrail) => (t.general?.rating || 0) >= 4.6);
        case "Nearby":
            return trails.filter((t: ITrail) => {
                const address = t.general?.address || "";
                const provinceData = t.general?.province || [];
                const isRizal = provinceData.some((p: string) => p.includes("Rizal"));
                return address.includes("Rizal") || isRizal;
            });
        case "Discover":
            return trails.slice(0, 3);
        case "Challenge":
            return trails.filter((t: ITrail) => {
                const elevRaw = t.geography?.masl || t.difficulty?.elevation || "0";
                const elev = parseInt(String(elevRaw).replace(/[^0-9]/g, ''), 10) || 0;
                const len = Number(t.difficulty?.length || 0);
                return elev > 600 || len > 10;
            });
        case "Offers": {
            const now = new Date();
            const upcomingOffers = offers.filter(o => o.date && new Date(o.date).getTime() > now.getTime());
            const ids = upcomingOffers.map(o => o.trail?.id).filter(Boolean);
            return trails.filter((t: ITrail) => ids.includes(t.id));
        }
        case "All":
        default:
            return trails;
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
        position: 'relative',
    },
    headerAnimatedWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    scrollContent: {
        paddingBottom: 64,
        paddingHorizontal: 16,
    },
    scrollContentWide: {
        maxWidth: 1400,
        width: '100%',
        alignSelf: 'center',
    },
    listContainer: {
        paddingBottom: 0,
        flexDirection: "row",
        flexWrap: "wrap",
    },
    loaderContainer: {
        width: '100%',
        paddingVertical: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyState: {
        paddingVertical: 60,
        alignItems: 'center',
        justifyContent: 'center',
        width: "100%",
        opacity: 0.8,
        gap: 8,
    },
    emptyStateText: {
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

export default ExploreScreen;
