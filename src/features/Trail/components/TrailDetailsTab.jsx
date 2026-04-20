import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { MaterialIcons } from "@expo/vector-icons";

import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

const isFeatureEnabled = (nestedValue, flatValue) => {
    if (nestedValue === true || String(nestedValue).toLowerCase() === 'true') return true;
    if (flatValue === true || String(flatValue).toLowerCase() === 'true') return true;
    return false;
};

const getArray = (nestedValue, flatValue) => {
    if (Array.isArray(nestedValue) && nestedValue.length > 0) return nestedValue;
    if (Array.isArray(flatValue) && flatValue.length > 0) return flatValue;
    return [];
};

const formatList = (list) => {
    if (!list) return '';
    return Array.isArray(list) ? list.join(', ') : list;
};

const Tag = ({ label }) => (
    <View style={styles.tag}>
        <CustomText variant="caption" style={styles.tagText}>
            {label}
        </CustomText>
    </View>
);

const StatItem = ({ icon, label, value, color, size = "large" }) => (
    <View style={[styles.statItem, size === "small" && styles.statItemSmall]}>
        <View style={[
            styles.iconCircle, 
            { backgroundColor: color + "18" },
            size === "small" && styles.iconCircleSmall
        ]}>
            <MaterialIcons name={icon} size={size === "small" ? 16 : 20} color={color} />
        </View>
        <CustomText variant="body" style={[styles.statValue, size === "small" && styles.statValueSmall]}>
            {value}
        </CustomText>
        <CustomText variant="caption" style={styles.statLabel}>{label}</CustomText>
    </View>
);

const TrailDetailsTab = ({ stats, trailStats, statsLoading, trail, location }) => {
    const qualityList = getArray(trail?.difficulty?.quality, trail?.quality);
    const diffPoints = getArray(trail?.difficulty?.difficulty_points, trail?.difficulty_points);
    const viewpoints = getArray(trail?.tourism?.viewpoint, trail?.viewpoint);
    const circularity = trail?.difficulty?.circularity || trail?.circularity || '';

    // 1. HARD STATS (Computed from GeoJSON)
    const computedDistance = trailStats 
        ? `${(trailStats.distance / 1000).toFixed(1)} km` 
        : stats.distance;
    
    const computedGain = trailStats 
        ? `+${Math.round(Math.max(trailStats.elevationGain, trailStats.elevationLoss))} m` 
        : stats.elevation;

    const computedDescent = trailStats 
        ? `-${Math.round(Math.min(trailStats.elevationGain, trailStats.elevationLoss))} m` 
        : "--";

    // 2. CURATED STATS (From Developer/Database)
    // We use the Developer's estimated time because human knowledge accounts for trail conditions
    const curatedTime = stats.time || "--";
    const curatedMASL = trail?.geography?.masl ? `${trail.geography.masl} MASL` : "--";
    const curatedDiff = trail?.difficulty?.level || "--";

    return (
        <View style={styles.tabContent}>
            {statsLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={Colors.PRIMARY} />
                    <CustomText variant="caption" style={styles.loadingText}>Synchronizing trail data...</CustomText>
                </View>
            ) : (
                <View style={styles.hybridStatsContainer}>
                    {/* Primary Row: The "Big Three" */}
                    <View style={styles.statsRow}>
                        <StatItem
                            icon="straighten"
                            label="Distance"
                            value={computedDistance}
                            color="#2196F3"
                        />
                        <StatItem
                            icon="schedule"
                            label="Est. Time"
                            value={curatedTime}
                            color="#9C27B0"
                        />
                        <StatItem
                            icon="trending-up"
                            label="Elev. Gain"
                            value={computedGain}
                            color="#4CAF50"
                        />
                    </View>

                    <View style={styles.divider} />

                    {/* Secondary Row: The Contextual Details */}
                    <View style={styles.statsRow}>
                        <StatItem
                            icon="terrain"
                            label="Peak"
                            value={curatedMASL}
                            color="#795548"
                            size="small"
                        />
                        <StatItem
                            icon="trending-down"
                            label="Descent"
                            value={computedDescent}
                            color="#FF7043"
                            size="small"
                        />
                        <StatItem
                            icon="speed"
                            label="Difficulty"
                            value={curatedDiff}
                            color="#607D8B"
                            size="small"
                        />
                    </View>
                </View>
            )}

            <View style={styles.section}>
                <CustomText variant="h3" style={styles.sectionTitle}>
                    About
                </CustomText>

                <CustomText style={styles.descriptionText}>
                    This is a {formatList(qualityList) || 'scenic'} {circularity} trail located in {location}.
                    {"\n\n"}
                    {diffPoints.length > 0 
                        ? `Expect features such as ${formatList(diffPoints)}.` 
                        : 'A great trail for outdoor enthusiasts.'}
                </CustomText>
            </View>

            <View style={styles.section}>
                <CustomText variant="h3" style={styles.sectionTitle}>
                    Features & Facilities
                </CustomText>

                <View style={styles.tagContainer}>
                    {isFeatureEnabled(trail?.tourism?.shelter, trail?.shelter) && <Tag label="Shelter" />}
                    {isFeatureEnabled(trail?.tourism?.clean_water, trail?.clean_water) && <Tag label="Drinking Water" />}
                    {isFeatureEnabled(trail?.tourism?.resting, trail?.resting) && <Tag label="Resting Area" />}
                    {isFeatureEnabled(trail?.tourism?.information_board, trail?.information_board) && <Tag label="Info Board" />}
                    {isFeatureEnabled(trail?.tourism?.community, trail?.community) && <Tag label="Community" />}
                    
                    {isFeatureEnabled(trail?.tourism?.river, trail?.river) && <Tag label="River" />}
                    {isFeatureEnabled(trail?.tourism?.lake, trail?.lake) && <Tag label="Lake" />}
                    {isFeatureEnabled(trail?.tourism?.waterfall, trail?.waterfall) && <Tag label="Waterfall" />}
                    {isFeatureEnabled(trail?.tourism?.monument, trail?.monument) && <Tag label="Monument" />}
                    
                    {viewpoints?.map((vp, index) => (
                        <Tag key={`vp-${index}`} label={vp} />
                    ))}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    tabContent: {
        gap: 20,
        paddingBottom: 20,
    },
    hybridStatsContainer: {
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(0, 0, 0, 0.05)",
        gap: 12,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statItemSmall: {
        // Optional specific styles for small item container
    },
    statValue: {
        fontWeight: 'bold',
        marginBottom: 2,
        fontSize: 15,
    },
    statValueSmall: {
        fontSize: 13,
    },
    statLabel: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 10,
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    iconCircleSmall: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginBottom: 6,
    },
    divider: {
        height: 1,
        backgroundColor: "rgba(0, 0, 0, 0.05)",
        marginHorizontal: 10,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 20,
    },
    loadingText: {
        color: Colors.TEXT_SECONDARY,
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    descriptionText: {
        color: Colors.TEXT_SECONDARY,
        lineHeight: 22,
        marginBottom: -16,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    tagText: {
        color: Colors.TEXT_INVERSE,
        fontSize: 12,
    },
});

export default TrailDetailsTab;