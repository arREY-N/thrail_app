import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import CustomFAB from "@/src/components/CustomFAB";
import CustomFilterModal from "@/src/components/CustomFilterModal";
import CustomHeader from "@/src/components/CustomHeader";
import CustomText from "@/src/components/CustomText";
import MountainCard from "@/src/components/MountainCard";
import ResponsiveScrollView from "@/src/components/ResponsiveScrollView";
import ScreenWrapper from "@/src/components/ScreenWrapper";

import { Colors } from "@/src/constants/colors";
import { ITrail } from "@/src/core/models/Trail/Trail.types";
import { fetchTrailWeatherBadges, TrailWeatherBadge } from "@/src/core/utility/weatherHelpers";
import { useBreakpoints } from "@/src/hooks/useBreakpoints";

const CATEGORIES = ["All", "Recommended", "Nearby", "Discover", "Challenge"];
const PROVINCES = ['Rizal', 'Batangas', 'Laguna', 'Cavite', 'Quezon'];
const ELEVATIONS = ['< 500 masl', '500 - 1000 masl', '> 1000 masl'];

/**
 * Props for the ExploreScreen component.
 */
export interface ExploreScreenProps {
    /** The complete list of available trails */
    trails: ITrail[];
    /** Callback fired when a trail is selected */
    onViewMountain: (id: string) => void;
    /** Callback fired when the group/FAB action is pressed */
    onGroupPress: () => void;
    /** Function to calculate or retrieve the rating for a specific trail */
    getItemRating: (id: string) => number | string;
    /** Whether the trails list is currently loading */
    isLoading: boolean;
}

/**
 * Interface defining the active filters state.
 */
interface ActiveFilters {
    provinces: string[];
    elevation: string | null;
}

/**
 * Screen displaying the full exploration view, including search, categorisation,
 * filtering, and a responsive grid of trails.
 */
const ExploreScreen = ({ trails, onViewMountain, onGroupPress, getItemRating, isLoading }: ExploreScreenProps) => {
    const [weatherMap, setWeatherMap] = useState<Record<string, TrailWeatherBadge>>({});
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isFilterModalVisible, setIsFilterModalVisible] = useState<boolean>(false);
    
    const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
        provinces: [],
        elevation: null,
    });

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

    useEffect(() => {
        if (!trails || trails.length === 0) return;
        fetchTrailWeatherBadges(trails).then(setWeatherMap);
    }, [trails]);

    const filteredTrails = useMemo(() => {
        let result = filterTrailsByCategory(trails, selectedCategory);

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
    }, [selectedCategory, trails, searchQuery, activeFilters]);

    const shouldCenterGrid = filteredTrails.length > 0 && filteredTrails.length < numColumns;

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

                <ResponsiveScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        isWideScreen && styles.scrollContentWide
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[
                        styles.listContainer, 
                        { 
                            gap,
                            justifyContent: shouldCenterGrid ? 'center' : 'flex-start'
                        }
                    ]}>
                        {isLoading && filteredTrails.length === 0 ? (
                            <View style={styles.loaderContainer}>
                                <ActivityIndicator size="large" color={Colors.PRIMARY} />
                            </View>
                        ) : filteredTrails.length > 0 ? (
                            filteredTrails.map((t) => (
                                <MountainCard
                                    rating={getItemRating(t.id)}
                                    key={t.id}
                                    item={t}
                                    onPress={() => onViewMountain(t.id)}
                                    onLikePress={() => console.log("Like", t.general?.name)}
                                    style={{ width: cardWidth }}
                                    weatherBadge={weatherMap[t.id] ?? null}
                                />
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <CustomText style={{ color: Colors.TEXT_SECONDARY }}>
                                    {searchQuery || activeFilters.provinces.length > 0 || activeFilters.elevation
                                        ? "No trails match your current filters and search." 
                                        : `No trails found for "${selectedCategory}".`}
                                </CustomText>
                            </View>
                        )}
                    </View>
                </ResponsiveScrollView>

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

const filterTrailsByCategory = (trails: ITrail[], category: string): ITrail[] => {
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
        case "All":
        default:
            return trails;
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
    },
    scrollContent: {
        paddingTop: 0,
        paddingBottom: 40,
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
        paddingTop: 40,
        alignItems: "center",
        width: "100%",
    },
});

export default ExploreScreen;
