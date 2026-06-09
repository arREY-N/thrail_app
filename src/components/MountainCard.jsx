import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, Platform, StyleSheet, TouchableOpacity, View } from "react-native";

import CustomIcon from "@/src/components/CustomIcon";
import CustomText from "@/src/components/CustomText";
import { Colors } from "@/src/constants/colors";
import { formatRouteType, getHeroImageSource, isUsingMapFallback } from "@/src/features/Trail/utils/TrailDetailsHelpers";

const MountainCard = ({
    item = {},
    onPress,
    onDownload,
    onLikePress,
    style,
    weatherBadge,
    rating,
}) => {
    const { 
        name, 
        location, 
        displayLength, 
        displayElev, 
        displayRoute, 
        score,
        heroImage,
        isMapFallback
    } = getMountainData(item, rating);

    return (
        <TouchableOpacity
            style={[styles.cardContainer, style]}
            activeOpacity={0.9}
            onPress={onPress}
        >
            <View style={styles.imageContainer}>
                <Image source={heroImage} style={styles.cardImage} resizeMode="cover" />
                
                {/* Automatically darkens map images so the white text stays readable */}
                {isMapFallback && <View style={styles.mapDarkenOverlay} />}

                <View style={[styles.glassPill, styles.topLeftPosition]}>
                    <View style={styles.badgeSection}>
                        <CustomIcon library="Ionicons" name="star" size={14} color={Colors.YELLOW} />
                        <CustomText variant="caption" style={styles.badgeText}>
                            {score}
                        </CustomText>
                    </View>
                </View>

                <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.95)"]}
                    style={styles.gradientOverlay}
                >
                    <View style={styles.headerContent}>
                        <View style={styles.textContainer}>
                            <CustomText variant="body" style={styles.title} numberOfLines={1}>
                                {name}
                            </CustomText>

                            <View style={styles.locationRow}>
                                <CustomIcon library="FontAwesome6" name="location-dot" size={10} color={Colors.TEXT_INVERSE} />
                                <CustomText variant="caption" style={styles.location} numberOfLines={1}>
                                    {location}
                                </CustomText>
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            <View style={styles.statsContainer}>
                <StatItem label="Distance" value={displayLength} icon="map-outline" lib="Ionicons" />
                <View style={styles.verticalDivider} />
                <StatItem label="Elevation" value={displayElev} icon="trending-up" lib="Feather" />
                <View style={styles.verticalDivider} />
                <StatItem label="Route" value={displayRoute} icon="repeat" lib="Feather" />
            </View>
        </TouchableOpacity>
    );
};

const getMountainData = (item, rating) => {
    const name = item?.general?.name || "Unnamed Mountain";

    let location = "Unknown Location";
    if (item?.general?.province && item.general.province.length > 0) {
        location = item.general.province[0];
    } else if (item?.general?.address) {
        location = item.general.address;
    }

    const displayLength = item?.difficulty?.length ? `${item.difficulty.length} km` : "--";
    const displayElev = item?.difficulty?.elevation ? `${item.difficulty.elevation} masl` : "--";
    const displayRoute = formatRouteType(item?.difficulty?.circularity);
    const score = rating ? Number(rating).toFixed(1) : (item?.general?.rating ? Number(item.general.rating).toFixed(1) : "N/A");
    const heroImage = getHeroImageSource(item);
    const isMapFallback = isUsingMapFallback(item);

    return {
        name, location, displayLength, displayElev, displayRoute, score, heroImage, isMapFallback
    };
};

const StatItem = ({ label, value, icon, lib, iconColor = Colors.PRIMARY }) => (
    <View style={styles.statBox}>
        <View style={styles.statTopRow}>
            <CustomIcon library={lib} name={icon} size={14} color={iconColor} />
            <CustomText variant="caption" style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.75}>
                {value}
            </CustomText>
        </View>
        <CustomText variant="caption" style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.75}>
            {label}
        </CustomText>
    </View>
);

const styles = StyleSheet.create({
    cardContainer: { width: 280, backgroundColor: Colors.WHITE, borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: Colors.GRAY_LIGHT, ...Platform.select({ ios: { shadowColor: Colors.SHADOW, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 }, android: { elevation: 4 }, web: { boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)" } }) },
    imageContainer: { height: 180, width: "100%", position: "relative", backgroundColor: Colors.GRAY_LIGHT },
    cardImage: { width: "100%", height: "100%", backgroundColor: Colors.GRAY_LIGHT },
    mapDarkenOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
    glassPill: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
    badgeSection: { flexDirection: "row", alignItems: "center", gap: 4 },
    badgeText: { color: Colors.WHITE, fontWeight: "bold" },
    topLeftPosition: { position: "absolute", top: 12, left: 12, zIndex: 2 },
    gradientOverlay: { position: "absolute", left: 0, right: 0, bottom: 0, height: "65%", justifyContent: "flex-end", padding: 16 },
    headerContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
    textContainer: { flex: 1 },
    title: { fontWeight: "bold", color: Colors.TEXT_INVERSE, marginBottom: -4, ...Platform.select({ ios: { textShadowColor: Colors.SHADOW, textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }, android: { textShadowColor: Colors.SHADOW, textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }, web: { textShadow: "0px 1px 4px rgba(0,0,0,0.5)" } }) },
    locationRow: { flexDirection: "row", alignItems: "center", paddingVertical: 2, gap: 8 },
    location: { color: Colors.TEXT_INVERSE, fontWeight: "500" },
    statsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 16, backgroundColor: Colors.WHITE },
    statBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    statTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
    statValue: { fontWeight: "900", color: Colors.TEXT_PRIMARY, marginBottom: 0, textAlign: 'center' },
    statLabel: { fontSize: 10, color: Colors.TEXT_SECONDARY, textTransform: "uppercase", fontWeight: "700", marginTop: 2, textAlign: 'center' },
    verticalDivider: { width: 1, height: 24, backgroundColor: Colors.GRAY_LIGHT },
});

export default MountainCard;