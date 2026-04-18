import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { ITrailStats } from "@/src/core/models/Trail/Trail.types";

interface HikeBriefingProps {
    trailName: string;
    stats: ITrailStats | null;
    isLoading: boolean;
}

/**
 * HikeBriefing — A premium stat card shown before the user starts their hike.
 *
 * Displays Distance, Elevation Gain, Elevation Loss, and Estimated Duration
 * in a clean, glassy card layout with iconography.
 */
export default function HikeBriefing({ trailName, stats, isLoading }: HikeBriefingProps) {

    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <MaterialIcons name="terrain" size={20} color="#4A6B2A" />
                    <Text style={styles.title}>Trail Stats</Text>
                </View>
                <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#4A6B2A" />
                    <Text style={styles.loadingText}>Computing trail stats…</Text>
                </View>
            </View>
        );
    }

    if (!stats) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <MaterialIcons name="terrain" size={20} color="#4A6B2A" />
                    <Text style={styles.title}>Trail Stats</Text>
                </View>
                <Text style={styles.noDataText}>No trail data available for this mountain.</Text>
            </View>
        );
    }

    const distanceKm = (stats.distance / 1000).toFixed(1);
    // GeoJSON trails are directional — the larger of gain/loss represents
    // the actual climbing effort regardless of which direction was recorded
    const climbingEffort = Math.round(Math.max(stats.elevationGain, stats.elevationLoss));
    const descentEffort = Math.round(Math.min(stats.elevationGain, stats.elevationLoss));

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <MaterialIcons name="terrain" size={20} color="#4A6B2A" />
                <Text style={styles.title}>Trail Stats</Text>
            </View>

            <Text style={styles.trailName}>{trailName}</Text>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <StatItem
                    icon="straighten"
                    label="Distance"
                    value={`${distanceKm} km`}
                    color="#2196F3"
                />
                <StatItem
                    icon="trending-up"
                    label="Elevation Gain"
                    value={`+${climbingEffort} m`}
                    color="#4CAF50"
                />
                <StatItem
                    icon="trending-down"
                    label="Descent"
                    value={`-${descentEffort} m`}
                    color="#FF7043"
                />
            </View>
        </View>
    );
}

function StatItem({ icon, label, value, color }: {
    icon: keyof typeof MaterialIcons.glyphMap;
    label: string;
    value: string;
    color: string;
}) {
    return (
        <View style={styles.statItem}>
            <View style={[styles.iconCircle, { backgroundColor: color + "18" }]}>
                <MaterialIcons name={icon} size={20} color={color} />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "rgba(255, 255, 255, 0.92)",
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 12,
        marginBottom: 12,
        // Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 6,
        // Subtle border
        borderWidth: 1,
        borderColor: "rgba(74, 107, 42, 0.12)",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 4,
    },
    title: {
        fontSize: 13,
        fontWeight: "700",
        color: "#4A6B2A",
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    trailName: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1a1a1a",
        marginBottom: 14,
    },
    statsGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    statItem: {
        alignItems: "center",
        flex: 1,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 6,
    },
    statValue: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1a1a1a",
    },
    statLabel: {
        fontSize: 10,
        color: "#888",
        marginTop: 2,
        textAlign: "center",
    },
    loadingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 12,
    },
    loadingText: {
        fontSize: 13,
        color: "#666",
    },
    noDataText: {
        fontSize: 13,
        color: "#999",
        paddingVertical: 8,
    },
});
