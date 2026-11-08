/**
 * @file map.tsx
 * @description Pure map view screen displaying a sent location pin from the group room.
 */

import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { Keyboard, StatusBar, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CustomText from "@/src/components/CustomText";
import { Colors } from "@/src/constants/colors";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import getSearchParam from "@/src/core/utility/getSearchParam";
import { RoomHeader } from "@/src/features/Community/screens/Group/components/RoomHeader";
import { LocationPinMap } from "@/src/features/Map/components/LocationPinMap";

export default function GroupLocationMapScreen() {
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ lat?: string; long?: string; title?: string }>();
    const { onBackPress } = useAppNavigation();

    useEffect(() => {
        // Ensure keyboard from the originating chat room is dismissed
        Keyboard.dismiss();
    }, []);

    const rawLat = getSearchParam(params.lat);
    const rawLong = getSearchParam(params.long);
    const title = getSearchParam(params.title) || "Shared Location";

    const latitude = Number(rawLat);
    const longitude = Number(rawLong);
    const hasValidCoordinates = !isNaN(latitude) && !isNaN(longitude) && rawLat !== "" && rawLong !== "";

    return (
        <View style={[styles.screen, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <Stack.Screen options={{ headerShown: false }} />
            <RoomHeader
                title={title}
                subtitle={hasValidCoordinates ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : undefined}
                onBackPress={onBackPress}
            />
            <View style={styles.container}>
                {hasValidCoordinates ? (
                    <LocationPinMap
                        latitude={latitude}
                        longitude={longitude}
                        title={title}
                    />
                ) : (
                    <View style={styles.errorContainer}>
                        <CustomText variant="body" style={styles.errorText}>
                            No valid coordinates provided.
                        </CustomText>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
    },
    container: {
        flex: 1,
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    errorText: {
        color: Colors.TEXT_SECONDARY,
        textAlign: "center",
    },
});
