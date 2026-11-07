/**
 * @file map.tsx
 * @description Pure map view screen displaying a sent location pin from the group room.
 */

import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";

import CustomText from "@/src/components/CustomText";
import ScreenWrapper from "@/src/components/ScreenWrapper";
import { Colors } from "@/src/constants/colors";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import getSearchParam from "@/src/core/utility/getSearchParam";
import { RoomHeader } from "@/src/features/Community/screens/Group/components/RoomHeader";
import { LocationPinMap } from "@/src/features/Map/components/LocationPinMap";

export default function GroupLocationMapScreen() {
    const params = useLocalSearchParams<{ lat?: string; long?: string; title?: string }>();
    const { onBackPress } = useAppNavigation();

    const rawLat = getSearchParam(params.lat);
    const rawLong = getSearchParam(params.long);
    const title = getSearchParam(params.title) || "Shared Location";

    const latitude = Number(rawLat);
    const longitude = Number(rawLong);
    const hasValidCoordinates = !isNaN(latitude) && !isNaN(longitude) && rawLat !== "" && rawLong !== "";

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
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
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
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

