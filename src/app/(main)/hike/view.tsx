import useWriteHike from "@/src/core/hook/hike/useHikeWrite";
import { Booking } from "@/src/core/models/Booking/Booking";
import { Hike } from "@/src/core/models/Hike/Hike";
import { formatDate } from "@/src/core/utility/date";
import getSearchParam from "@/src/core/utility/getSearchParam";
import NavigationScreen from "@/src/features/Navigation/screens/NavigationScreen";
import { Stack, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function hikeView(){
    const { hikeId: rawId , trailId: rawTrail} = useLocalSearchParams();
    
    const hikeId = getSearchParam(rawId);
    const trailId = getSearchParam(rawTrail);

    const {
        hike,
        booking,
        error,
        elapsedTime,
        
        onStartHike,
        onAddReview,
        onPauseHike,
        onCompleteHike,
        onResumeHike,
        onResetHike
    } = useWriteHike({hikeId, trailId});

    const formatTime = (ms: number) => {
        const s = Math.floor(ms / 1000) % 60;
        const m = Math.floor(ms / 60000) % 60;
        const h = Math.floor(ms / 3600000);
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };


    return(
        <>
            <Stack.Screen options={{headerShown: true}}/>
            <TestView 
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
            />        
        </>
    )
}

export type HikeViewParams = {
    hike: Hike | null;
    booking?: Booking | null;
    error?: string | null;
    elapsedTime: string;
    hikeId?: string;
    trailId?: string;

    onStartHike: ({hikeId, trailId}: { hikeId?: string; trailId?: string }) => void;
    onPauseHike: () => void;
    onCompleteHike: () => void;
    onResumeHike: () => void;
    onResetHike: () => void;
    onAddReview: (trailId: string) => void;
}

export const TestView = (params: HikeViewParams) => {
    const { 
        hike, 
        booking, 
        error,
        elapsedTime,
        hikeId,
        trailId,
        onStartHike,
        onPauseHike,
        onCompleteHike,
        onResumeHike,
        onResetHike,
        onAddReview,
    } = params;


    if(!hike) {
        return <Text>Loading hike...</Text>;
    }

    console.log(hike);

    return(
        <ScrollView>
            { error && <Text style={{color: 'red'}}>Error: {error}</Text>}
            <Text>Elapsed Time: {elapsedTime} ms</Text>
            <Text>Hike View</Text>
            <Text>Trail: { hike.trail.name || 'Trail not found' }</Text>
            <Text>Hike Review: {hike.review || 'No review available'} </Text>
            <Text>Predicted difficulty: { hike.predictedDifficulty }</Text>
            <Text>Hike status: { hike.status }</Text>
            {booking && (
                <View>
                    <Text>Booking ID: {booking.id}</Text>
                    <Text>Organizer: {booking.business.name}</Text>
                    <Text>Booking Status: {booking.status}</Text>
                    <Text>Date: {formatDate(booking.offer.date)}</Text>
                </View>
            )}

            <View style={{borderWidth: 1, padding: 10, margin: 10}}>
                { (hike.status !== 'unhiked' && hike.startTime) && <Text>{String(hike.startTime)}</Text>}
                { (hike.status === 'unhiked') && 
                    <Pressable onPress={() => onStartHike({hikeId, trailId})}>
                        <Text>START HIKE</Text>
                    </Pressable>
                }

                { (hike.status === 'paused') &&
                    <View>
                        <Pressable onPress={() => onResumeHike()}>
                            <Text>RESUME HIKE</Text>
                        </Pressable>
                        <Pressable onPress={() => onResetHike()}>
                            <Text>RESET HIKE</Text>
                        </Pressable>
                        <Pressable onPress={() => onCompleteHike()}>
                            <Text>COMPLETE HIKE</Text>
                        </Pressable>
                    </View>
                }

                { hike.status === 'started' &&
                    <View>
                        <Pressable onPress={() => onPauseHike()}>
                            <Text>PAUSE HIKE</Text>
                        </Pressable>
                        <Pressable onPress={() => onCompleteHike()}>
                            <Text>COMPLETE HIKE</Text>
                        </Pressable>
                    </View>

                }

                { hike.status === 'completed' && (trailId || hike.trail.id) &&
                    <Pressable onPress={() => onAddReview(trailId || hike.trail.id)}>
                        <Text>ADD REVIEW</Text>
                    </Pressable>
                }
            </View>
            <NavigationScreen/>
        </ScrollView>
    )
}