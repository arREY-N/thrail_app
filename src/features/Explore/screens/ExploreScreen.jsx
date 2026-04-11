import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import CustomHeader from '@/src/components/CustomHeader';
import CustomSearchHeader from '@/src/components/CustomSearchHeader'; // Standardized Component
import CustomText from '@/src/components/CustomText';
import MountainCard from '@/src/components/MountainCard';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import FilterModal from "@/src/features/Explore/components/FilterModal";

import { Colors } from "@/src/constants/colors";
import { fetchWeatherFromApi } from "@/src/core/repositories/weatherRepository";
import { getWeatherInfoUI } from "@/src/core/utility/weatherHelpers";
import { useBreakpoints } from "@/src/hooks/useBreakpoints";

// Hardcoded coordinates for known mountains (used for weather badge testing).
// Key is lowercased mountain name substring for fuzzy matching against Firestore data.
const MOUNTAIN_COORDS = {
  tagapo: { lat: 14.3392772, lon: 121.2325293 },
  marami: { lat: 14.1986108, lon: 120.6858334 },
  batulao: { lat: 14.0399434, lon: 120.8023782 },
  makiling: { lat: 14.1352241, lon: 121.1944517 },
  maculot: { lat: 13.9208682, lon: 121.0516961 },
};

/** Resolve coordinates for a trail from the hardcoded lookup table. */
const resolveCoordsForTrail = (trail) => {
  const name = (trail?.general?.name ?? "").toLowerCase();
  for (const [keyword, coords] of Object.entries(MOUNTAIN_COORDS)) {
    if (name.includes(keyword)) return coords;
  }
  return null;
};

const ExploreScreen = ({ trails, onViewMountain }) => {
  // weatherMap: { [trailId]: { icon: string, temperature: number } }
  const [weatherMap, setWeatherMap] = useState({});
  const { width } = useBreakpoints();

  const containerPadding = 16;
  const gap = 16;
  const availableWidth = width - containerPadding * 2;

  let numColumns = 1;
  if (width >= 1200) numColumns = 4;
  else if (width >= 900) numColumns = 3;
  else if (width >= 600) numColumns = 2;

  const cardWidth = (availableWidth - gap * (numColumns - 1)) / numColumns;

  // Batch-fetch weather for every trail that has resolvable coordinates.
  // Promise.allSettled ensures one network failure never blocks the rest.
  useEffect(() => {
    if (!trails || trails.length === 0) return;

    const fetchAll = async () => {
      // Build an array of { id, lat, lon } only for mountains we have coords for.
      const targets = trails.reduce((acc, trail) => {
        const coords = resolveCoordsForTrail(trail);
        if (coords) acc.push({ id: trail.id, ...coords });
        return acc;
      }, []);

      if (targets.length === 0) return;

      const results = await Promise.allSettled(
        targets.map(({ lat, lon }) => fetchWeatherFromApi(lat, lon)),
      );

      const nextMap = {};
      results.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value) {
          const { icon } = getWeatherInfoUI(result.value.weatherCode);
          nextMap[targets[index].id] = {
            icon,
            temperature: result.value.temperature,
          };
        }
        // 'rejected' results are silently skipped — card renders without badge.
      });

      setWeatherMap(nextMap);
    };

    fetchAll();
  }, [trails]);

  const categories = ["All", "Recommended", "Nearby", "Discover", "Challenge"];
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const filteredTrails = useMemo(() => {
    let categoryFiltered = filterTrailsByCategory(trails, selectedCategory);

    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      categoryFiltered = categoryFiltered.filter(
        (t) =>
          t.general?.name?.toLowerCase().includes(query) ||
          t.general?.province?.some((p) => p.toLowerCase().includes(query)),
      );
    }
    return categoryFiltered;
  }, [selectedCategory, trails, searchQuery]);

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <View style={styles.container}>
                
                <CustomHeader 
                    title="Explore"
                    showDefaultIcons={true} 
                />

                <CustomSearchHeader 
                    searchPlaceholder="Search mountains or locations..."
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                    rightIconLibrary="Ionicons"
                    rightIconName="filter"
                    onRightButtonPress={() => setIsFilterModalVisible(true)}
                    tabs={categories}
                    activeTab={selectedCategory}
                    onTabSelect={setSelectedCategory}
                />

        <ResponsiveScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.listContainer, { gap }]}>
            {filteredTrails.length > 0 ? (
              filteredTrails.map((t) => (
                <MountainCard
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
                  {`No trails found for "${selectedCategory}".`}
                </CustomText>
              </View>
            )}
          </View>
        </ResponsiveScrollView>

        <FilterModal
          visible={isFilterModalVisible}
          onClose={() => setIsFilterModalVisible(false)}
          onApply={(filters) => {
            console.log("Applied Filters:", filters);
          }}
        />
      </View>
    </ScreenWrapper>
  );
};

const filterTrailsByCategory = (trails, category) => {
  if (!trails) return [];

    switch (category) {
        case 'Recommended':
            return trails.filter(t => (t.score || 0) >= 4.6);
        
        case 'Nearby':
            return trails.filter(t => {
                const address = t.address || "";
                const provinceData = t.province;
                const isRizal = Array.isArray(provinceData) 
                    ? provinceData.includes('Rizal') 
                    : (provinceData || "").includes('Rizal');

                return address.includes('Rizal') || isRizal;
            });

        case 'Discover':
            return trails.slice(0, 3); 
        
        case 'Challenge':
            return trails.filter(t => {
                const elev = Number(t.masl || 0);
                const len = Number(t.length || 0);
                return elev > 600 || len > 10;
            });

        case 'All':
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
    paddingBottom: 32,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  emptyState: {
    paddingTop: 40,
    alignItems: "center",
    width: "100%",
  },
});

export default ExploreScreen;
