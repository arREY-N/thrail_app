import Unauthorized from "@/src/app/unauthorized";
import CustomButton from "@/src/components/CustomButton";
import CustomHeader from "@/src/components/CustomHeader";
import CustomIcon from "@/src/components/CustomIcon";
import CustomLoading from "@/src/components/CustomLoading";
import CustomText from "@/src/components/CustomText";
import ScreenWrapper from "@/src/components/ScreenWrapper";
import { Colors, Palette } from "@/src/constants/colors";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useGroupItem, useGroupLocation } from "@/src/core/models/Group/Group";
import { useAuthHook } from "@/src/core/models/User/User";
import getSearchParam from "@/src/core/utility/getSearchParam";
import HikeRecordingScreenWeb from "@/src/features/Navigation/screens/HikeRecordingScreen.web";
import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

const SCREEN_OPTIONS = { headerShown: false };

export default function HikeViewWeb() {
    const { groupId: rawGroup, lon: paramLon, lat: paramLat } = useLocalSearchParams();
    const groupId = getSearchParam(rawGroup);

    const { onBackPress } = useAppNavigation();
    const { profile, isLoading: authLoading } = useAuthHook();

    const { group: currentGroup, isLoading: isGroupLoading, error: groupError } = useGroupItem(groupId || '');
    const { location: groupLocations, error: locationError } = useGroupLocation(groupId || '');

    if (authLoading) {
        return (
            <ScreenWrapper style={undefined}>
                <CustomHeader title="Live Monitor" onBackPress={onBackPress} rightActions={undefined} style={undefined} />
                <View style={styles.centerContainer}>
                    <CustomLoading visible={true} message="Authenticating spectator access..." />
                </View>
            </ScreenWrapper>
        );
    }

    if (!profile) {
        return <Unauthorized />;
    }

    // Missing Group ID State
    if (!groupId) {
        return (
            <ScreenWrapper style={undefined}>
                <CustomHeader title="Live Monitor" onBackPress={onBackPress} rightActions={undefined} style={undefined} />
                <View style={styles.centerContainer}>
                    <View style={styles.errorCard}>
                        <View style={styles.errorIconBox}>
                            <CustomIcon library="Feather" name="alert-triangle" size={40} color={Colors.WARNING} />
                        </View>
                        <CustomText variant="h2" style={styles.errorTitle}>Session Not Specified</CustomText>
                        <CustomText style={styles.errorDescription}>
                            To monitor active hikers on desktop, a valid session groupId must be provided in the URL (e.g. /hike/view?groupId=...).
                        </CustomText>
                        <CustomButton
                            title="Return to Dashboard"
                            onPress={onBackPress}
                            style={{ marginTop: 24, width: 220 }}
                            textStyle={undefined}
                            disabled={undefined}
                        />
                    </View>
                </View>
            </ScreenWrapper>
        );
    }

    // Loading Group Telemetry State
    if (isGroupLoading && !currentGroup) {
        return (
            <ScreenWrapper style={undefined}>
                <CustomHeader title="Live Monitor" onBackPress={onBackPress} rightActions={undefined} style={undefined} />
                <View style={styles.centerContainer}>
                    <CustomLoading visible={true} message="Connecting to live trail telemetry..." />
                </View>
            </ScreenWrapper>
        );
    }

    // Group Not Found or Access Denied
    if (groupError) {
        return (
            <ScreenWrapper style={undefined}>
                <CustomHeader title="Live Monitor" onBackPress={onBackPress} rightActions={undefined} style={undefined} />
                <View style={styles.centerContainer}>
                    <View style={styles.errorCard}>
                        <View style={[styles.errorIconBox, { backgroundColor: Palette.Red50 }]}>
                            <CustomIcon library="Feather" name="shield-off" size={40} color={Colors.ERROR} />
                        </View>
                        <CustomText variant="h2" style={styles.errorTitle}>Access Denied or Not Found</CustomText>
                        <CustomText style={styles.errorDescription}>
                            {groupError || "You do not have permission to spectate this group, or this session does not exist."}
                        </CustomText>
                        <CustomButton
                            title="Return to Dashboard"
                            onPress={onBackPress}
                            style={{ marginTop: 24, width: 220 }}
                            textStyle={undefined}
                            disabled={undefined}
                        />
                    </View>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <>
            <Stack.Screen options={SCREEN_OPTIONS} />
            <HikeRecordingScreenWeb
                groupId={groupId}
                currentGroup={currentGroup}
                hikerLocations={groupLocations || []}
                error={locationError}
                onBackPress={onBackPress}
                lon={paramLon}
                lat={paramLat}
                profile={profile}
            />
        </>
    );
}

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    errorCard: {
        maxWidth: 440,
        width: "100%",
        padding: 32,
        borderRadius: 20,
        backgroundColor: Colors.WHITE,
        alignItems: "center",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    errorIconBox: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Palette.Amber50,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    errorTitle: {
        color: Colors.TEXT_PRIMARY,
        marginBottom: 10,
        textAlign: "center",
    },
    errorDescription: {
        color: Colors.TEXT_SECONDARY,
        textAlign: "center",
        lineHeight: 22,
        fontSize: 14,
    },
});

