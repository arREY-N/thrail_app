/**
 * @file WeatherSection.tsx
 * @description A clean, minimalist weather section component displaying local weather, condition text, day/night extremes, and location metadata with symmetrical alignment.
 */

import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import CustomIcon from "@/src/components/CustomIcon";
import CustomText from "@/src/components/CustomText";
import SkeletonEffect from "@/src/components/SkeletonEffect";

import { Colors } from "@/src/constants/colors";
import { GlobalStyles } from "@/src/constants/globalStyles";
import { ProcessedWeatherData } from "@/src/core/types/weather";
import {
  formatLastUpdatedLabel,
  formatWeatherDisplay,
} from "@/src/core/utility/weatherHelpers";
import { IconLibrary } from "@/src/types/ui.types";

/**
 * Props for the WeatherSection component.
 *
 * @param weatherData - The processed weather data to display
 * @param loading - Whether the weather data is currently loading
 * @param locationName - The fallback location name to display if geocoding is unavailable
 * @param error - Any error that occurred during weather fetching
 * @param onPress - Callback fired when the weather section is pressed
 * @param onReload - Callback fired to retry/reload weather fetching
 * @param isRefreshing - Whether pull-to-refresh is currently active
 */
export interface WeatherSectionProps {
  weatherData: ProcessedWeatherData | null | undefined;
  loading: boolean;
  locationName?: string;
  error?: Error | string | null;
  onPress: () => void;
  onReload?: () => void;
  isRefreshing?: boolean;
}

/**
 * Weather section component rendering a balanced, symmetrical 2-column card layout.
 *
 * @param props - WeatherSectionProps
 * @returns React.JSX.Element
 */
const WeatherSection = ({
  weatherData,
  loading,
  locationName,
  error,
  onPress,
  onReload,
  isRefreshing = false,
}: WeatherSectionProps): React.JSX.Element => {
  const display = formatWeatherDisplay(weatherData);
  const lastUpdatedLabel = formatLastUpdatedLabel(weatherData?.lastUpdated);
  const displayLocationText = locationName || "Unknown location";

  // 1. Loading / Locating / Refreshing State
  if ((loading && !weatherData) || isRefreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.headerMetaRow}>
          <View style={styles.skeletonLocRow}>
            <SkeletonEffect style={styles.skeletonIconSmall} />
            <SkeletonEffect style={styles.skeletonLocText} />
          </View>
          <SkeletonEffect style={styles.skeletonUpdatedText} />
        </View>

        <View style={styles.contentRow}>
          <View style={styles.leftCol}>
            <SkeletonEffect style={styles.skeletonTemp} />
            <SkeletonEffect style={styles.skeletonConditionText} />
          </View>
          <View style={styles.rightCol}>
            <SkeletonEffect style={styles.skeletonHeroIcon} />
            <SkeletonEffect style={styles.skeletonHiLoText} />
          </View>
        </View>
      </View>
    );
  }

  // 2. Error / Connection Failed State
  if (error && !weatherData) {
    return (
      <View style={[styles.container, styles.centerStateContainer]}>
        <CustomIcon
          library="Ionicons"
          name="cloud-offline-outline"
          size={32}
          color={Colors.ERROR}
        />
        <CustomText variant="caption" style={styles.errorText}>
          Unable to load weather data.
        </CustomText>
      </View>
    );
  }

  // 3. Unavailable / No Data State
  if (!weatherData && !loading && !error) {
    return (
      <View style={[styles.container, styles.centerStateContainer]}>
        <CustomIcon
          library="Ionicons"
          name="location-outline"
          size={32}
          color={Colors.GRAY_MEDIUM}
        />
        <CustomText variant="caption" style={styles.emptyStateText}>
          Location services disabled or weather stats unavailable.
        </CustomText>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }) => [
        styles.container,
        hovered && styles.containerHovered,
      ]}
    >
      {/* Top Header Row: Location Pin + Location Name (Left) & Quiet Relative Time (Right) */}
      <View style={styles.headerMetaRow}>
        <View style={styles.locationContainer}>
          <CustomIcon
            library="FontAwesome6"
            name="location-dot"
            size={13}
            color={Colors.PRIMARY}
          />
          <CustomText style={styles.locationText} numberOfLines={1}>
            {displayLocationText}
          </CustomText>
        </View>

        {lastUpdatedLabel && (
          <CustomText style={styles.updatedText}>{lastUpdatedLabel}</CustomText>
        )}
      </View>

      {/* Symmetrical 2-Column Main Content */}
      <View style={styles.contentRow}>
        {/* Left Column: Top Temp (28°C) & Bottom Condition (Partly Cloudy) */}
        <View style={styles.leftCol}>
          <View style={styles.tempBlock}>
            <CustomText style={styles.tempValueText}>
              {display.hasData ? display.temperature : "--"}
            </CustomText>
            <CustomText style={styles.tempUnitText}>°C</CustomText>
          </View>

          <View style={styles.bottomAlignWrapper}>
            {display.hasData && (
              <CustomText style={styles.conditionText} numberOfLines={1}>
                {display.condition}
              </CustomText>
            )}
          </View>
        </View>

        {/* Right Column: Top Weather Icon & Bottom Day/Night Readings */}
        <View style={styles.rightCol}>
          <View style={styles.iconAlignWrapper}>
            <CustomIcon
              library={display.library as IconLibrary}
              name={display.hasData ? display.icon : "partly-sunny-outline"}
              size={48}
              color={display.hasData ? Colors.PRIMARY : Colors.GRAY_MEDIUM}
            />
          </View>

          <View style={styles.bottomAlignWrapper}>
            {display.hasData && (
              <View style={styles.dayNightRow}>
                <View style={styles.hiLoItem}>
                  <CustomIcon
                    library="Ionicons"
                    name="sunny"
                    size={13}
                    color={Colors.WEATHER_SUN}
                  />
                  <CustomText style={styles.hiLoText}>
                    Day {display.dayTemp}°
                  </CustomText>
                </View>

                <CustomText style={styles.hiLoDivider}>•</CustomText>

                <View style={styles.hiLoItem}>
                  <CustomIcon
                    library="Ionicons"
                    name="moon"
                    size={13}
                    color={Colors.WEATHER_MOON}
                  />
                  <CustomText style={styles.hiLoText}>
                    Night {display.nightTemp}°
                  </CustomText>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 5,
    marginTop: 8,
    // marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: Colors.WHITE,
    borderRadius: 24,
    elevation: 3,
    ...GlobalStyles.dropShadow(3),
    ...(Platform.OS === "web" && { cursor: "pointer" as const }),
  },
  containerHovered: {
    opacity: 0.7,
  },
  centerStateContainer: {
    justifyContent: "center",
    alignItems: "center",
    minHeight: 130,
    gap: 10,
  },
  errorText: {
    color: Colors.ERROR,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  emptyStateText: {
    color: Colors.TEXT_SECONDARY,
    fontWeight: "500",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  headerMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  locationText: {
    color: Colors.TEXT_SECONDARY,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 16,
    flexShrink: 1,
  },
  updatedText: {
    fontSize: 12,
    color: Colors.TEXT_PLACEHOLDER,
    fontWeight: "500",
    lineHeight: 16,
  },
  contentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    gap: 8,
  },
  leftCol: {
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 6,
  },
  tempBlock: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  tempValueText: {
    fontSize: 44,
    fontWeight: "900",
    color: Colors.TEXT_PRIMARY,
    lineHeight: 44,
    letterSpacing: -1.5,
  },
  tempUnitText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.TEXT_PRIMARY,
    lineHeight: 20,
    marginLeft: 2,
  },
  rightCol: {
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 6,
  },
  iconAlignWrapper: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomAlignWrapper: {
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  conditionText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.PRIMARY,
    textTransform: "capitalize",
    lineHeight: 18,
  },
  dayNightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hiLoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hiLoText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.TEXT_SECONDARY,
    lineHeight: 16,
  },
  hiLoDivider: {
    fontSize: 10,
    color: Colors.GRAY_MEDIUM,
    lineHeight: 14,
  },

  // Skeleton Layout Mirrors
  skeletonLocRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  skeletonIconSmall: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  skeletonLocText: {
    width: 110,
    height: 14,
    borderRadius: 4,
  },
  skeletonUpdatedText: {
    width: 60,
    height: 12,
    borderRadius: 4,
  },
  skeletonTemp: {
    width: 80,
    height: 44,
    borderRadius: 8,
  },
  skeletonConditionText: {
    width: 80,
    height: 14,
    borderRadius: 4,
  },
  skeletonHeroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  skeletonHiLoText: {
    width: 110,
    height: 14,
    borderRadius: 4,
  },
});

export default WeatherSection;
