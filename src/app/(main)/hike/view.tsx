import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

import CustomButton from "@/src/components/CustomButton";
import CustomHeader from "@/src/components/CustomHeader";
import CustomIcon from "@/src/components/CustomIcon";
import CustomLoading from "@/src/components/CustomLoading";
import CustomText from "@/src/components/CustomText";
import ScreenWrapper from "@/src/components/ScreenWrapper";
import { Colors } from "@/src/constants/colors";

import { useGroup } from "@/src/core/hook/group/useGroup";
import useGroupLocation from "@/src/core/hook/group/useGroupLocation";
import useWriteHike from "@/src/core/hook/hike/useHikeWrite";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import getSearchParam from "@/src/core/utility/getSearchParam";

import { useGroupList } from "@/src/core/hook/group/useGroupList";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import HikeRecordingScreen from "@/src/features/Navigation/screens/HikeRecordingScreen";

export default function hikeView() {
    const { hikeId: rawId, trailId: rawTrail, groupId: rawGroup, bookingId: rawBooking, lon: paramLon, lat: paramLat } = useLocalSearchParams();
    
    const hikeId = getSearchParam(rawId);
    const trailId = getSearchParam(rawTrail);
    const groupId = getSearchParam(rawGroup);
    const bookingId = getSearchParam(rawBooking); 

    const { onBackPress } = useAppNavigation();
    const { profile } = useAuthHook();
    const { groups } = useGroupList(profile?.id || "");

    const {
        hike,
        booking,
        fullOffer,
        error: hikeError,
        elapsedTime,
        timerStartTime,
        totalDistance,
        totalElevationGain,
        isLoading,
        shareLocationEnabled,
        setShareLocationEnabled,

        onStartHike,
        onAddReview,
        onPauseHike,
        onCompleteHike,
        onResumeHike,
        onResetHike,
    } = useWriteHike({ hikeId, trailId, bookingId, groupId }); 

    const resolvedBookingId = bookingId || (hike?.mode === 'booked' ? hike.bookingId : undefined);
    
    const resolvedGroupId = groupId || (resolvedBookingId && groups?.find(g => 
        g.members?.some((m: any) => m.id === profile?.id && m.bookingId === resolvedBookingId)
    )?.id) || undefined;

    const { currentGroup } = useGroup(resolvedGroupId || '');
    const {
        location: groupLocations,
        onEmergencyPress,
        onSendPicture,
        error: groupError,
    } = useGroupLocation(resolvedGroupId || '');

    if (isLoading && !hike) {
        return (
            <ScreenWrapper style={undefined}>
                <CustomHeader title="Hike Tracker" onBackPress={onBackPress} rightActions={undefined} style={undefined} children={undefined} />
                <View style={styles.centerContainer}>
                    <CustomLoading visible={true} message="Preparing your trail data..." children={undefined} />
                </View>
            </ScreenWrapper>
        );
    }

    if (hike && hike.status !== 'unhiked' && hike.trail.id !== 'diy' && ((hikeId && hike.id !== hikeId) || (trailId !== undefined && hike.trail.id !== trailId))) {
        return (
            <ScreenWrapper style={undefined}>
                <CustomHeader title="Active Session Found" onBackPress={onBackPress} rightActions={undefined} style={undefined} children={undefined} />
                <View style={styles.mismatchContainer}>
                    <View style={styles.mismatchIconBox}>
                        <CustomIcon library="Feather" name="alert-circle" size={48} color={Colors.WARNING} />
                    </View>
                    <CustomText variant="h2" style={styles.mismatchTitle}>Hike in Progress</CustomText>
                    <CustomText style={styles.mismatchDesc}>
                        You are currently tracking an active session at <CustomText style={{ fontWeight: 'bold' }}>{hike.trail?.name}</CustomText>. 
                        Please complete or reset your current hike before starting a new one.
                    </CustomText>
                    <CustomButton title="Return to Dashboard" onPress={onBackPress} style={{ marginTop: 32 }} textStyle={undefined} disabled={undefined} children={undefined} />
                </View>
            </ScreenWrapper>
        );
    }

    if (!hike) return null;

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <HikeRecordingScreen
                fullOffer={fullOffer}
                hike={hike} 
                booking={booking || null}  
                currentGroup={currentGroup || null}
                hikerLocations={groupLocations || []}
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
                onAddReview={() => hike && onAddReview(trailId || hike.trail.id)}
                onBackPress={onBackPress}
                
                onTriggerBackendSOS={onEmergencyPress}
                onOpenSOSCamera={onSendPicture}
                emergencyContactNumber={booking?.emergencyContact?.contactNumber || ""}
            />
            
            {/* <TestView 
                hike={hike} 
                booking={booking}
                error={error}
                onStartHike={onStartHike}
                onPauseHike={onPauseHike}
                onCompleteHike={onCompleteHike}
                onResumeHike={onResumeHike}
                onResetHike={onResetHike}
                onAddReview={onAddReview}
                elapsedTime={formatTime(elapsedTime)}
                hikeId={hikeId}
                trailId={trailId}
                lon={paramLon}
                lat={paramLat}
                onEmergencyPress={onEmergencyPress}
                isLoading={isLoading}
            />         */}
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

// export type HikeViewParams = {
//     hike: Hike | null;
//     booking?: Booking | null;
//     error?: string | null;
//     elapsedTime: string;
//     hikeId?: string;
//     trailId?: string;
//     lon?: string | string[];
//     lat?: string | string[];
//     isLoading: boolean;

//     onStartHike: ({hikeId, trailId}: { hikeId?: string; trailId?: string }) => void;
//     onPauseHike: () => void;
//     onCompleteHike: () => void;
//     onResumeHike: () => void;
//     onResetHike: () => void;
//     onAddReview: (trailId: string) => void;
//     onEmergencyPress: () => void;
// }

// export const TestView = (params: HikeViewParams) => {
//     const { 
//         hike, 
//         booking, 
//         error,
//         elapsedTime,
//         hikeId,
//         trailId,
//         isLoading,
//         onStartHike,
//         onPauseHike,
//         onCompleteHike,
//         onResumeHike,
//         onResetHike,
//         onEmergencyPress,
//         onAddReview,
//     } = params;

//     if(!hike) {
//         return <Text>Loading hike...</Text>;
//     }

//     console.log(hike);

//     return(
//         <ScrollView>
//             { isLoading && <Text>Loading...</Text>}
//             { error && <Text style={{color: 'red'}}>Error: {error}</Text>}
//             <Text>Elapsed Time: {elapsedTime} ms</Text>
//             <Text>Hike View</Text>
//             <Text>Trail: { hike.trail.name || 'Trail not found' }</Text>
//             <Text>Hike Review: {hike.review || 'No review available'} </Text>
//             <Text>Predicted difficulty: { hike.predictedDifficulty }</Text>
//             <Text>Hike status: { hike.status }</Text>
//             <Pressable onPress={() => onEmergencyPress()}>
//                 <Text>EMERGENCY BUTTON</Text>
//             </Pressable>
//             {booking && (
//                 <View>
//                     <Text>Booking ID: {booking.id}</Text>
//                     <Text>Organizer: {booking.business.name}</Text>
//                     <Text>Booking Status: {booking.status}</Text>
//                     <Text>Date: {formatDate(booking.offer.date)}</Text>
//                 </View>
//             )}

//             <View style={{borderWidth: 1, padding: 10, margin: 10}}>
//                 { (hike.status !== 'unhiked' && hike.startTime) && <Text>{String(hike.startTime)}</Text>}
//                 { (hike.status === 'unhiked') && 
//                     <Pressable onPress={() => onStartHike({hikeId, trailId})}>
//                         <Text>START HIKE</Text>
//                     </Pressable>
//                 }

//                 { (hike.status === 'paused') &&
//                     <View>
//                         <Pressable onPress={() => onResumeHike()}>
//                             <Text>RESUME HIKE</Text>
//                         </Pressable>
//                         <Pressable onPress={() => onResetHike()}>
//                             <Text>RESET HIKE</Text>
//                         </Pressable>
//                         <Pressable onPress={() => onCompleteHike()}>
//                             <Text>COMPLETE HIKE</Text>
//                         </Pressable>
//                     </View>
//                 }

//                 { hike.status === 'started' &&
//                     <View>
//                         <Pressable onPress={() => onPauseHike()}>
//                             <Text>PAUSE HIKE</Text>
//                         </Pressable>
//                         <Pressable onPress={() => onCompleteHike()}>
//                             <Text>COMPLETE HIKE</Text>
//                         </Pressable>
//                     </View>

//                 }

//                 { hike.status === 'completed' && (trailId || hike.trail.id) &&
//                     <Pressable onPress={() => onAddReview(trailId || hike.trail.id)}>
//                         <Text>ADD REVIEW</Text>
//                     </Pressable>
//                 }
//             </View>
//             <NavigationScreen lon={params.lon} lat={params.lat}/>
//         </ScrollView>
//     )
// }