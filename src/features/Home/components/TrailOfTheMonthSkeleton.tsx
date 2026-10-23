/**
 * @file TrailOfTheMonthSkeleton.tsx
 * @description Sleek shimmer skeleton placeholder for the Trail of the Month spotlight card.
 */

import { Colors, Palette } from "@/src/constants/colors";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

export default function TrailOfTheMonthSkeleton() {
    const shimmerAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 0.8,
                    duration: 900,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0.3,
                    duration: 900,
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [shimmerAnim]);

    return (
        <View style={styles.container}>
            {/* Header placeholder */}
            <View style={styles.headerRow}>
                <Animated.View style={[styles.badgeSkeleton, { opacity: shimmerAnim }]} />
                <Animated.View style={[styles.scoreSkeleton, { opacity: shimmerAnim }]} />
            </View>

            {/* Image placeholder */}
            <Animated.View style={[styles.imageSkeleton, { opacity: shimmerAnim }]} />

            {/* Content lines */}
            <View style={styles.body}>
                <View style={styles.specsRow}>
                    <Animated.View style={[styles.pillSkeleton, { opacity: shimmerAnim }]} />
                    <Animated.View style={[styles.pillSkeleton, { opacity: shimmerAnim }]} />
                    <Animated.View style={[styles.pillSkeleton, { opacity: shimmerAnim }]} />
                </View>

                <Animated.View style={[styles.hookSkeleton, { opacity: shimmerAnim }]} />
                <Animated.View style={[styles.buttonSkeleton, { opacity: shimmerAnim }]} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginBottom: 20,
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Palette.Slate50,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate100,
    },
    badgeSkeleton: {
        width: 140,
        height: 22,
        borderRadius: 11,
        backgroundColor: Palette.Slate200,
    },
    scoreSkeleton: {
        width: 90,
        height: 22,
        borderRadius: 11,
        backgroundColor: Palette.Slate200,
    },
    imageSkeleton: {
        width: "100%",
        height: 180,
        backgroundColor: Palette.Slate300,
    },
    body: {
        padding: 16,
        gap: 12,
    },
    specsRow: {
        flexDirection: "row",
        gap: 8,
    },
    pillSkeleton: {
        flex: 1,
        height: 28,
        borderRadius: 6,
        backgroundColor: Palette.Slate100,
    },
    hookSkeleton: {
        width: "85%",
        height: 18,
        borderRadius: 4,
        backgroundColor: Palette.Slate100,
    },
    buttonSkeleton: {
        width: "100%",
        height: 44,
        borderRadius: 10,
        backgroundColor: Palette.Slate200,
        marginTop: 4,
    },
});
