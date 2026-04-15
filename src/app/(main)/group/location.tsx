import useBookOffer from "@/src/core/hook/book/useBookOffer";
import { useGroup } from "@/src/core/hook/group/useGroup";
import useGroupLocation from "@/src/core/hook/group/useGroupLocation";
import { Booking } from "@/src/core/models/Booking/Booking";
import { Group } from "@/src/core/models/Group/Group";
import { Hike } from "@/src/core/models/Hike/Hike";
import { Location } from "@/src/core/models/Location/Location";
import { formatDate } from "@/src/core/utility/date";
import getSearchParam from "@/src/core/utility/getSearchParam";
import { Stack, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function GroupLocationScreen() {
    const { groupId: rawId, bookingId: rawBookingId } = useLocalSearchParams();
    
    const groupId = getSearchParam(rawId);
    const bookingId = getSearchParam(rawBookingId);
    
    const {
        currentGroup,
    } = useGroup(groupId);

    const {
        booking,
    } = useBookOffer({ bookingId: bookingId });

    const {
        onStartSharingLocation,
        onStopSharingLocation,
        error,
        isLive,
        currentHike,
        location,
    } = useGroupLocation(groupId);

    return (
        <>
            <Stack.Screen options={{headerShown: true}}/>
            <TESTSCREEN
                group={currentGroup}
                booking={booking}
                onStartSharingLocation={onStartSharingLocation}
                onStopSharingLocation={onStopSharingLocation}
                error={error}
                isLive={isLive}
                currentHike={currentHike}
                location={location}
            />
        </>
    )
}

export type TestScreenParams = {
    group: Group | null;
    booking: Booking | null;
    onStartSharingLocation: (group: Group, booking: Booking) => void;
    onStopSharingLocation: () => void;
    error: string | null;
    isLive: boolean;
    currentHike: Hike | null;
    location: Location[];
}

const TESTSCREEN = (params: TestScreenParams) => {
    const { group, booking, location } = params;

    if(!group || !booking) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>  
                <Text>Loading group data...</Text>
            </View>
        )
    }
    
    return(
        <ScrollView>
            <Text>{group.GroupName}</Text>
            { 
                ([...group.members, ...group.admins]).map((m, index) => (
                    <Text key={`${m.id}_${index}`}>{m.username}</Text>
                ))
            }

            <Pressable onPress={() => params.onStartSharingLocation(group, booking)} style={{ marginTop: 20, padding: 10, backgroundColor: 'green' }}>    
                <Text style={{ color: 'white' }}>Start Sharing Location</Text>
            </Pressable>
            <Pressable onPress={params.onStopSharingLocation} style={{ marginTop: 20, padding: 10, backgroundColor: 'red' }}>
                <Text style={{ color: 'white' }}>Stop Sharing Location</Text>
            </Pressable>
            <Text>Booking information </Text>
            <Text>ID: {booking.id}</Text>
            <Text>Created: {formatDate(booking.createdAt)}</Text>
            <Text>Status: {booking.status}</Text>
            {params.error && <Text style={{ color: 'red', marginTop: 20 }}>{params.error}</Text>}
            {params.isLive && <Text style={{ color: 'green', marginTop: 20 }}>Location is live!</Text>}
            
            
            {
                params.isLive && (location ?? []).map(loc => {
                    const user = group.members.find(member => member.id === loc.id);
                    const userStatus = Date.now() - new Date(loc.timestamp).getTime() > (5 * 1000) ? 'inactive' : 'active' 
                    return (
                        <View style={{ marginTop: 20, padding: 10, borderWidth: 1, borderColor: 'gray' }} key={loc.id}>
                            <Text>User: {user?.firstname} </Text>
                            <Text>Status: {userStatus} </Text>
                            <Text>Long: {loc.longitude}, Lat: {loc.latitude}, Time: {formatDate(loc.timestamp)}</Text>
                        </View>

                    )
                })
            }
        </ScrollView>
    )
}