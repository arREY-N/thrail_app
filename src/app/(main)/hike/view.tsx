import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";

import CustomButton from "@/src/components/CustomButton";
import CustomHeader from "@/src/components/CustomHeader";
import CustomIcon from "@/src/components/CustomIcon";
import CustomLoading from "@/src/components/CustomLoading";
import CustomText from "@/src/components/CustomText";
import ScreenWrapper from "@/src/components/ScreenWrapper";
import { Colors } from "@/src/constants/colors";

import getSearchParam from "@/src/core/utility/getSearchParam";


import { CreateHikeFlow } from "@/src/core/flows/CreateHikeFlow";
import HikeRecordingScreen from "@/src/features/Navigation/screens/HikeRecordingScreen";

const SCREEN_OPTIONS = { headerShown: false };

export default function HikeView() {
    const { hikeId: rawId, trailId: rawTrail, groupId: rawGroup, bookingId: rawBooking, lon: paramLon, lat: paramLat } = useLocalSearchParams();

    const hikeId = getSearchParam(rawId);
    const trailId = getSearchParam(rawTrail);
    const groupId = getSearchParam(rawGroup);
    const bookingId = getSearchParam(rawBooking);

    const {
        currentHike,
        booking,
        fullOffer,
        error: hikeError,
        elapsedTime,
        timerStartTime,
        totalDistance,
        totalElevationGain,
        isLoading,
        shareLocationEnabled,
        currentGroup,
        setShareLocationEnabled,

        onBackPress,
        onStartHike,
        onAddReview,
        onPauseHike,
        onCompleteHike,
        onResumeHike,
        onResetHike,
        groupLocations,
        onEmergencyPress,
        onSendPicture,
        error: groupError,
    } = CreateHikeFlow({ hikeId, trailId, bookingId, groupId });

    if (isLoading && !currentHike) {
        return (
            <ScreenWrapper style={undefined}>
                <CustomHeader title="Hike Tracker" onBackPress={onBackPress} rightActions={undefined} style={undefined} />
                <View style={styles.centerContainer}>
                    <CustomLoading visible={true} message="Preparing your trail data..." />
                </View>
            </ScreenWrapper>
        );
    }

    if (currentHike && currentHike.status !== 'unhiked' && currentHike.trail.id !== 'diy' && ((hikeId && currentHike.id !== hikeId) || (trailId !== undefined && currentHike.trail.id !== trailId))) {
        return (
            <ScreenWrapper style={undefined}>
                <CustomHeader title="Active Session Found" onBackPress={onBackPress} rightActions={undefined} style={undefined} />
                <View style={styles.mismatchContainer}>
                    <View style={styles.mismatchIconBox}>
                        <CustomIcon library="Feather" name="alert-circle" size={48} color={Colors.WARNING} />
                    </View>
                    <CustomText variant="h2" style={styles.mismatchTitle}>Hike in Progress</CustomText>
                    <CustomText style={styles.mismatchDesc}>
                        You are currently tracking an active session at <CustomText style={{ fontWeight: 'bold' }}>{currentHike.trail?.name}</CustomText>.
                        Please complete or reset your current hike before starting a new one.
                    </CustomText>
                    <CustomButton title="Return to Dashboard" onPress={onBackPress} style={{ marginTop: 32 }} textStyle={undefined} disabled={undefined} />
                </View>
            </ScreenWrapper>
        );
    }

    if (!currentHike) return null;

    return (
        <>
            <Stack.Screen options={SCREEN_OPTIONS} />

            <HikeRecordingScreen
                fullOffer={fullOffer}
                hike={currentHike}
                booking={booking || null}
                currentGroup={currentGroup || null}
                hikerLocations={(groupLocations as any) || []}
                error={hikeError || groupError}

                baseElapsedTime={elapsedTime}
                timerStartTime={timerStartTime}
                totalDistance={totalDistance}
                totalElevationGain={totalElevationGain}

                isLoading={isLoading}
                lon={paramLon}
                lat={paramLat}

                shareLocationEnabled={shareLocationEnabled}
                setShareLocationEnabled={setShareLocationEnabled}

                onStartHike={onStartHike}
                onPauseHike={onPauseHike}
                onResumeHike={onResumeHike}
                onCompleteHike={onCompleteHike}
                onResetHike={onResetHike}
                onAddReview={() => currentHike && onAddReview(trailId || currentHike.trail.id)}
                onBackPress={onBackPress}

                onTriggerBackendSOS={onEmergencyPress}
                onOpenSOSCamera={onSendPicture}
                emergencyContactNumber={booking?.emergencyContact?.contactNumber || ""}
            />
        </>
    )
}

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mismatchContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        marginTop: -60,
    },
    mismatchIconBox: {
        backgroundColor: Colors.STATUS_WARNING_BG,
        padding: 24,
        borderRadius: 48,
        marginBottom: 24,
    },
    mismatchTitle: {
        color: Colors.TEXT_PRIMARY,
        marginBottom: 12,
    },
    mismatchDesc: {
        textAlign: 'center',
        color: Colors.TEXT_SECONDARY,
        lineHeight: 24,
    }
});