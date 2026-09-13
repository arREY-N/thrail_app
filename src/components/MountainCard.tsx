/**
 * @file MountainCard.tsx
 * @description A card component to present mountain information, ratings, dynamic route type icons, and active promo offers.
 */

import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
    Platform,
    Pressable,
    StyleProp,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";

import CustomIcon from "@/src/components/CustomIcon";
import CustomImage from "@/src/components/CustomImage";
import CustomText from "@/src/components/CustomText";
import { Colors } from "@/src/constants/colors";
import { GlobalStyles } from "@/src/constants/globalStyles";
import { TrailWeatherBadge } from "@/src/core/utility/weatherHelpers";
import {
    formatRouteType,
    getHeroImageSource,
    isUsingMapFallback,
} from "@/src/features/Trail/utils/TrailDetailsHelpers";
import { IconLibrary } from "@/src/types/ui.types";

/**
 * Props for the MountainCard component.
 *
 * @param item - The mountain data object.
 * @param onPress - Callback fired when the card is pressed.
 * @param onDownload - Callback fired when the download button is pressed.
 * @param onLikePress - Callback fired when the like button is pressed.
 * @param style - Custom style for the card container.
 * @param rating - Optional override for the rating.
 * @param offersCount - Number of active upcoming offers on this trail.
 */
interface MountainCardProps {
  item?: any;
  onPress?: () => void;
  onDownload?: () => void;
  onLikePress?: () => void;
  style?: StyleProp<ViewStyle>;
  weatherBadge?: React.ReactNode | TrailWeatherBadge | null;
  rating?: number | string;
  offersCount?: number;
}

/**
 * Helper to process mountain data for display.
 */
const getMountainData = (item: any, rating?: number | string) => {
  const name = item?.general?.name || "Unnamed Mountain";

  let location = "Unknown Location";
  if (item?.general?.province && item.general.province.length > 0) {
    location = item.general.province[0];
  } else if (item?.general?.address) {
    location = item.general.address;
  }

  const displayLength = item?.difficulty?.length
    ? `${item.difficulty.length} km`
    : "--";
  const displayElev = item?.difficulty?.elevation
    ? `${item.difficulty.elevation} masl`
    : "--";
  const displayRoute = formatRouteType(item?.difficulty?.circularity);
  const score = rating
    ? Number(rating).toFixed(1)
    : item?.general?.rating
      ? Number(item.general.rating).toFixed(1)
      : "N/A";
  const heroImage = getHeroImageSource(item);
  const isMapFallback = isUsingMapFallback(item);

  return {
    name,
    location,
    displayLength,
    displayElev,
    displayRoute,
    score,
    heroImage,
    isMapFallback,
  };
};

/**
 * Dynamic route icon selector.
 * Resolves appropriate visual cues depending on the path topology of the trail.
 */
const getRouteIconInfo = (routeType: string) => {
  const route = (routeType || "").toLowerCase();
  if (route.includes("circular") || route.includes("loop")) {
    return { icon: "repeat", lib: "Feather" as const };
  }
  if (
    route.includes("out") ||
    route.includes("back") ||
    route.includes("return")
  ) {
    return { icon: "swap-horizontal-outline", lib: "Ionicons" as const };
  }
  // Point to Point uses Feather flag (as per user approved feedback!)
  return { icon: "flag", lib: "Feather" as const };
};

/**
 * Helper component to render a single stat item.
 */
const StatItem = ({
  label,
  value,
  icon,
  lib,
  iconColor = Colors.PRIMARY,
  isNarrow = false,
}: {
  label: string;
  value: string;
  icon: string;
  lib: IconLibrary;
  iconColor?: string;
  isNarrow?: boolean;
}) => (
  <View style={[styles.statBox, isNarrow && styles.statBoxNarrow]}>
    <View style={styles.statTopRow}>
      <CustomIcon library={lib} name={icon} size={14} color={iconColor} />
      <CustomText
        variant="caption"
        style={styles.statValue}
        numberOfLines={1}
        adjustsFontSizeToFit={true}
        minimumFontScale={0.75}
      >
        {value}
      </CustomText>
    </View>
    <CustomText
      variant="caption"
      style={styles.statLabel}
      numberOfLines={1}
      adjustsFontSizeToFit={true}
      minimumFontScale={0.75}
    >
      {label}
    </CustomText>
  </View>
);

/**
 * MountainCard — A dynamic card component displaying key mountain details
 * including distance, elevation, and route type over a hero image.
 */
const MountainCard: React.FC<MountainCardProps> = ({
  item = {},
  onPress,
  onDownload,
  onLikePress,
  style,
  weatherBadge,
  rating,
  offersCount = 0,
}) => {
  const {
    name,
    location,
    displayLength,
    displayElev,
    displayRoute,
    score,
    heroImage,
    isMapFallback,
  } = getMountainData(item, rating);

  // Resolve route icon dynamics
  const routeIconInfo = getRouteIconInfo(displayRoute);

  // Responsive styling for limited widths (e.g. nested lists or narrow viewports)
  const flattenedStyle = StyleSheet.flatten(style);
  const cardWidth = flattenedStyle?.width;
  const isNarrow = typeof cardWidth === "number" && cardWidth < 300;

  if (Platform.OS === "web") {
    return (
      <Pressable
        style={({ hovered }) => [
          styles.cardContainerWeb,
          hovered && styles.cardContainerWebHovered,
          style,
        ]}
        onPress={onPress}
      >
        <View style={styles.imageContainerWeb}>
          <CustomImage
            source={heroImage}
            style={styles.cardImage}
            resizeMode="cover"
          />
          {isMapFallback && <View style={styles.mapDarkenOverlay} />}
          {/* Rating Badge */}
          <View style={[styles.glassPill, styles.topLeftPosition]}>
            <View style={styles.badgeSection}>
              <CustomIcon
                library="Ionicons"
                name="star"
                size={13}
                color={Colors.YELLOW}
              />
              <CustomText variant="caption" style={styles.badgeText}>
                {score}
              </CustomText>
            </View>
          </View>

          {offersCount > 0 && (
            <View
              style={[
                styles.glassPill,
                styles.topRightPosition,
                { backgroundColor: Colors.PRIMARY },
              ]}
            >
              <View style={styles.badgeSection}>
                <CustomIcon
                  library="Ionicons"
                  name="pricetag"
                  size={12}
                  color={Colors.WHITE}
                />
                <CustomText
                  variant="caption"
                  style={[
                    styles.badgeText,
                    { color: Colors.WHITE, fontWeight: "bold" },
                  ]}
                >
                  {offersCount} {offersCount === 1 ? "Offer" : "Offers"}
                </CustomText>
              </View>
            </View>
          )}

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.6)", "rgba(0,0,0,0.75)"]}
            style={styles.gradientOverlayWeb}
          >
            <View style={styles.headerContent}>
              <View style={styles.textContainer}>
                <CustomText
                  variant="body"
                  style={styles.titleWeb}
                  numberOfLines={1}
                >
                  {name}
                </CustomText>
                <View style={styles.locationRow}>
                  <CustomIcon
                    library="FontAwesome6"
                    name="location-dot"
                    size={10}
                    color={Colors.TEXT_INVERSE}
                  />
                  <CustomText
                    variant="caption"
                    style={styles.location}
                    numberOfLines={1}
                  >
                    {location}
                  </CustomText>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View
          style={[
            styles.statsContainerWeb,
            isNarrow && styles.statsContainerNarrow,
          ]}
        >
          <StatItem
            label="Distance"
            value={displayLength}
            icon="map-outline"
            lib="Ionicons"
            isNarrow={isNarrow}
          />
          {!isNarrow && <View style={styles.verticalDivider} />}
          <StatItem
            label="Elevation"
            value={displayElev}
            icon="trending-up"
            lib="Feather"
            isNarrow={isNarrow}
          />
          {!isNarrow && <View style={styles.verticalDivider} />}
          <StatItem
            label="Route"
            value={displayRoute}
            icon={routeIconInfo.icon}
            lib={routeIconInfo.lib}
            isNarrow={isNarrow}
          />
        </View>
      </Pressable>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.cardContainer,
        style,
        Platform.select({
          web: {
            cursor: "pointer",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          } as const,
        }),
      ]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        <CustomImage
          source={heroImage}
          style={styles.cardImage}
          resizeMode="cover"
        />

        {/* Automatically darkens map images so the white text stays readable */}
        {isMapFallback && <View style={styles.mapDarkenOverlay} />}

        <View style={[styles.glassPill, styles.topLeftPosition]}>
          <View style={styles.badgeSection}>
            <CustomIcon
              library="Ionicons"
              name="star"
              size={14}
              color={Colors.YELLOW}
            />
            <CustomText variant="caption" style={styles.badgeText}>
              {score}
            </CustomText>
          </View>
        </View>

        {/* Offer indicator badge in top right */}
        {offersCount > 0 && (
          <View
            style={[
              styles.glassPill,
              styles.topRightPosition,
              { backgroundColor: Colors.PRIMARY },
            ]}
          >
            <View style={styles.badgeSection}>
              <CustomIcon
                library="Ionicons"
                name="pricetag"
                size={12}
                color={Colors.WHITE}
              />
              <CustomText
                variant="caption"
                style={[
                  styles.badgeText,
                  { color: Colors.WHITE, fontWeight: "bold" },
                ]}
              >
                {offersCount} {offersCount === 1 ? "Offer" : "Offers"}
              </CustomText>
            </View>
          </View>
        )}

        <LinearGradient
          colors={["transparent", `${Colors.BLACK}80`, `${Colors.BLACK}F2`]}
          style={styles.gradientOverlay}
        >
          <View style={styles.headerContent}>
            <View style={styles.textContainer}>
              <CustomText variant="body" style={styles.title} numberOfLines={1}>
                {name}
              </CustomText>

              <View style={styles.locationRow}>
                <CustomIcon
                  library="FontAwesome6"
                  name="location-dot"
                  size={10}
                  color={Colors.TEXT_INVERSE}
                />
                <CustomText
                  variant="caption"
                  style={styles.location}
                  numberOfLines={1}
                >
                  {location}
                </CustomText>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      <View
        style={[styles.statsContainer, isNarrow && styles.statsContainerNarrow]}
      >
        <StatItem
          label="Distance"
          value={displayLength}
          icon="map-outline"
          lib="Ionicons"
          isNarrow={isNarrow}
        />
        {!isNarrow && <View style={styles.verticalDivider} />}
        <StatItem
          label="Elevation"
          value={displayElev}
          icon="trending-up"
          lib="Feather"
          isNarrow={isNarrow}
        />
        {!isNarrow && <View style={styles.verticalDivider} />}
        <StatItem
          label="Route"
          value={displayRoute}
          icon={routeIconInfo.icon}
          lib={routeIconInfo.lib}
          isNarrow={isNarrow}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: 280,
    backgroundColor: Colors.WHITE,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
    ...GlobalStyles.dropShadow(4, 0.1, Colors.SHADOW, { radius: 6 }),
  },
  imageContainer: {
    height: Platform.OS === "web" ? 160 : 180,
    width: "100%",
    position: "relative",
    backgroundColor: Colors.GRAY_LIGHT,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.GRAY_LIGHT,
  },
  mapDarkenOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: `${Colors.BLACK}33`,
  },
  glassPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: `${Colors.BLACK}99`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${Colors.WHITE}33`,
  },
  badgeSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badgeText: {
    color: Colors.WHITE,
    fontWeight: "bold",
    marginTop: -3,
  },
  topLeftPosition: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 2,
  },
  topRightPosition: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 2,
  },
  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "65%",
    justifyContent: "flex-end",
    padding: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: "bold",
    color: Colors.TEXT_INVERSE,
    marginBottom: -4,
    ...Platform.select({
      ios: {
        textShadowColor: Colors.SHADOW,
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
      },
      android: {
        textShadowColor: Colors.SHADOW,
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
      },
      web: {
        textShadow: `0px 1px 4px ${Colors.BLACK}80`,
      },
    }),
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
    gap: 8,
  },
  location: {
    color: Colors.TEXT_INVERSE,
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: Colors.WHITE,
  },
  statsContainerNarrow: {
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-around",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statBoxNarrow: {
    flex: 0,
    minWidth: "40%",
    marginVertical: 4,
  },
  statTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  statValue: {
    fontWeight: "900",
    color: Colors.TEXT_PRIMARY,
    marginBottom: 0,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 10,
    color: Colors.TEXT_SECONDARY,
    textTransform: "uppercase",
    fontWeight: "700",
    marginTop: 2,
    textAlign: "center",
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.GRAY_LIGHT,
  },
  cardContainerWeb: {
    width: 290,
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
    ...GlobalStyles.dropShadow(2),
  },
  cardContainerWebHovered: {
    borderColor: Colors.PRIMARY,
    transform: [{ translateY: -4 }, { scale: 1.015 }],
    ...GlobalStyles.dropShadow(6, 0.15, Colors.SHADOW, { radius: 10 }),
  },
  imageContainerWeb: {
    width: "100%",
    aspectRatio: 16 / 10,
    position: "relative",
    backgroundColor: Colors.GRAY_LIGHT,
    overflow: "hidden",
  },
  gradientOverlayWeb: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "65%",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titleWeb: {
    fontWeight: "700",
    color: Colors.TEXT_INVERSE,
    fontSize: 15,
    minHeight: 20,
    marginBottom: 2,
  },
  statsContainerWeb: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.WHITE,
    height: 58,
  },
});

export default MountainCard;
