import { Stack, useLocalSearchParams } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";

import CustomButton from "@/src/components/CustomButton";
import CustomHeader from "@/src/components/CustomHeader";
import CustomIcon from "@/src/components/CustomIcon";
import CustomLoading from "@/src/components/CustomLoading";
import CustomText from "@/src/components/CustomText";
import ScreenWrapper from "@/src/components/ScreenWrapper";
import { Colors } from "@/src/constants/colors";

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { Group, useGroupItem, useGroupList, useGroupLocation, useGroupStore } from "@/src/core/models/Group/Group";
import getSearchParam from "@/src/core/utility/getSearchParam";


import Unauthorized from "@/src/app/unauthorized";
import { CreateHikeFlow } from "@/src/core/flows/CreateHikeFlow";
import { useBookingsStore } from "@/src/core/models/Booking/Booking";
import { useHikeStore } from "@/src/core/models/Hike/Hike";
import { useAuthHook } from "@/src/core/models/User/User";
import HikeLiveMonitorScreen from "@/src/features/Navigation/screens/HikeLiveMonitorScreen";
import HikeRecordingScreen from "@/src/features/Navigation/screens/HikeRecordingScreen";
import HikeRecordingScreenWeb from "@/src/features/Navigation/screens/HikeRecordingScreen.web";
import { useEffect, useState } from "react";

const SCREEN_OPTIONS = { headerShown: false };

function HikeLiveMonitorView({
    groupId,
    paramLon,
    paramLat,
}: {
    groupId: string;
    paramLon?: string | string[];
    paramLat?: string | string[];
}) {
    const { onBackPress } = useAppNavigation();
    const { profile, isLoading: authLoading } = useAuthHook();

    const { group: fetchedGroup, isLoading: isGroupLoading, error: groupError } = useGroupItem(groupId);
    const [cachedGroup, setCachedGroup] = useState<Group | null>(null);

    if (fetchedGroup && fetchedGroup !== cachedGroup) {
        setCachedGroup(fetchedGroup);
    }

    useEffect(() => {
        if (groupId && !fetchedGroup && cachedGroup) {
            useGroupStore.getState().fetchGroupById(groupId);
        }
    }, [groupId, fetchedGroup, cachedGroup]);

    const currentGroup = fetchedGroup || cachedGroup;
    const { location: groupLocations, error: locationError } = useGroupLocation(groupId);

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

    if (!profile) return <Unauthorized />;

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

    if (groupError && !currentGroup) {
        return (
            <ScreenWrapper style={undefined}>
                <CustomHeader title="Live Monitor" onBackPress={onBackPress} rightActions={undefined} style={undefined} />
                <View style={styles.mismatchContainer}>
                    <View style={styles.mismatchIconBox}>
                        <CustomIcon library="Feather" name="shield-off" size={48} color={Colors.ERROR} />
                    </View>
                    <CustomText variant="h2" style={styles.mismatchTitle}>Access Denied or Not Found</CustomText>
                    <CustomText style={styles.mismatchDesc}>
                        {groupError || "You do not have permission to spectate this group, or this session does not exist."}
                    </CustomText>
                    <CustomButton title="Return to Chat" onPress={onBackPress} style={{ marginTop: 32 }} textStyle={undefined} disabled={undefined} />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <>
            <Stack.Screen options={SCREEN_OPTIONS} />
            {Platform.OS === "web" ? (
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
            ) : (
                <HikeLiveMonitorScreen
                    groupId={groupId}
                    currentGroup={currentGroup}
                    hikerLocations={groupLocations || []}
                    error={locationError}
                    onBackPress={onBackPress}
                    lon={paramLon}
                    lat={paramLat}
                    profile={profile}
                />
            )}
        </>
    );
}

export default function HikeView() {
    const { hikeId: rawId, trailId: rawTrail, groupId: rawGroup, bookingId: rawBooking, mode: rawMode, lon: paramLon, lat: paramLat } = useLocalSearchParams();

    const hikeId = getSearchParam(rawId);
    const trailId = getSearchParam(rawTrail);
    const groupId = getSearchParam(rawGroup);
    const bookingId = getSearchParam(rawBooking);
    const mode = getSearchParam(rawMode);

    const isMonitorMode = mode === 'monitor' || Boolean(groupId && !hikeId && !trailId && !bookingId);

    if (isMonitorMode && groupId) {
        return <HikeLiveMonitorView groupId={groupId} paramLon={paramLon} paramLat={paramLat} />;
    }

    return (
        <HikeRecorderView
            hikeId={hikeId}
            trailId={trailId}
            groupId={groupId}
            bookingId={bookingId}
            paramLon={paramLon}
            paramLat={paramLat}
        />
    );
}

function HikeRecorderView({
    hikeId,
    trailId,
    groupId,
    bookingId,
    paramLon,
    paramLat,
}: {
    hikeId?: string;
    trailId?: string;
    groupId?: string;
    bookingId?: string;
    paramLon?: string | string[];
    paramLat?: string | string[];
}) {

    const { onBackPress } = useAppNavigation();
    const { profile } = useAuthHook();
    const { groups } = useGroupList(profile?.id || "");

    const storedHike = useHikeStore((s) => s.currentHike);
    const resolvedBookingId = bookingId || (storedHike?.mode === 'booked' ? storedHike.bookingId : undefined);
    const userBookings = useBookingsStore((s) => s.userBookings);
    const activeBooking = resolvedBookingId ? userBookings.find(b => b.id === resolvedBookingId) : null;

    // DIY emergency chat fallback: automatically resolve for non-booked hikes without an explicit group
    const isDiySession = !groupId && !resolvedBookingId && !bookingId;
    const diyEmergencyChatId = isDiySession ? (profile?.emergencyContact?.chatId || undefined) : undefined;

    const resolvedGroupId =
        groupId ||
        (resolvedBookingId && groups?.find(g =>
            g.members?.some((m: { id?: string; bookingId?: string }) => m.id === profile?.id && m.bookingId === resolvedBookingId)
        )?.id) ||
        activeBooking?.offer?.id ||
        diyEmergencyChatId ||
        undefined;

    const {
        currentHike,
        booking,
        fullOffer,
        error: hikeError,
        elapsedTime,
        timerStartTime,
        totalDistance,
        totalElevationGain,
        totalElevationLoss,
        isLoading,
        shareLocationEnabled,
        setShareLocationEnabled,

        onStartHike,
        onAddReview,
        onPauseHike,
        onCompleteHike,
        onResumeHike,
        onResetHike,
    } = CreateHikeFlow({
        hikeId,
        trailId,
        bookingId: resolvedBookingId || bookingId,
        groupId: resolvedGroupId || groupId
    });

    const { group: fetchedGroup } = useGroupItem(resolvedGroupId || '');
    const [cachedGroup, setCachedGroup] = useState<Group | null>(null);

    if (fetchedGroup && fetchedGroup !== cachedGroup) {
        setCachedGroup(fetchedGroup);
    }

    // Resilient re-fetch if store drops group on room unmount
    useEffect(() => {
        if (resolvedGroupId && !fetchedGroup && cachedGroup) {
            useGroupStore.getState().fetchGroupById(resolvedGroupId);
        }
    }, [resolvedGroupId, fetchedGroup, cachedGroup]);

    const currentGroup = fetchedGroup || cachedGroup;
    const {
        location: groupLocations,
        onEmergencyPress,
        onSendPicture,
        onSendSMS,
        error: groupError,
    } = useGroupLocation(resolvedGroupId || '');

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

    if (!profile) return <Unauthorized />

    return (
        <>
            <Stack.Screen options={SCREEN_OPTIONS} />

            <HikeRecordingScreen
                fullOffer={fullOffer}
                hike={currentHike}
                booking={booking || null}
                currentGroup={currentGroup || null}
                hikerLocations={groupLocations || []}
                error={hikeError || groupError}

                baseElapsedTime={elapsedTime}
                timerStartTime={timerStartTime}
                totalDistance={totalDistance}
                totalElevationGain={totalElevationGain}
                totalElevationLoss={totalElevationLoss}

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
                onTriggerEmergencySOS={onEmergencyPress}
                onSendSMS={onSendSMS}
                onOpenSOSCamera={onSendPicture}
                emergencyContactNumber={profile.emergencyContact?.contactNumber || ""}
                profile={profile}
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