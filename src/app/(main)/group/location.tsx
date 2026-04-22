import { useGroup } from "@/src/core/hook/group/useGroup";
import useGroupLocation from "@/src/core/hook/group/useGroupLocation";
import getSearchParam from "@/src/core/utility/getSearchParam";
import { Stack, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import LocationScreen from "@/src/features/Community/screens/Group/LocationScreen";

export default function groupLocation() {
    const { groupId: rawId } = useLocalSearchParams();
    
    const groupId = getSearchParam(rawId);
    const { onBackPress } = useAppNavigation();
    
    const {
        currentGroup,
        booking,
    } = useGroup(groupId);

    const {
        onStartSharingLocation,
        onStopSharingLocation,
        onStartHike,
        onPauseHike,
        onResumeHike,
        onCompleteHike,
        onEmergencyPress,
        onSendPicture,
        error,
        isLive,
        currentHike,
        location,
    } = useGroupLocation(groupId);

    if (!currentGroup || !booking) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>  
                <Text>Loading group data...</Text>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{headerShown: false}}/>

            <LocationScreen
                group={currentGroup}
                booking={booking}
                onStartSharingLocation={onStartSharingLocation}
                onStopSharingLocation={onStopSharingLocation}
                onStartHike={onStartHike}
                onPauseHike={onPauseHike}
                onResumeHike={onResumeHike}
                onCompleteHike={onCompleteHike}
                onEmergencyPress={onEmergencyPress}
                onSendPicture={onSendPicture}
                error={error}
                isLive={isLive}
                currentHike={currentHike}
                location={location}
                onBackPress={onBackPress}
            />

            {/* <TESTSCREEN
                group={currentGroup}
                booking={booking}
                onStartSharingLocation={onStartSharingLocation}
                onStopSharingLocation={onStopSharingLocation}
                onStartHike={onStartHike}
                onPauseHike={onPauseHike}
                onResumeHike={onResumeHike}
                onCompleteHike={onCompleteHike}
                onEmergencyPress={onEmergencyPress}
                onSendPicture={onSendPicture}
                error={error}
                isLive={isLive}
                currentHike={currentHike}
                location={location} */}
        </>
    )
}

// export type TestScreenParams = {
//     onStartSharingLocation: () => void;
//     onStopSharingLocation: () => void;
//     onStartHike: (group: Group, booking: Booking) => void;
//     onPauseHike: () => void;
//     onResumeHike: () => void;
//     onCompleteHike: () => void;
//     onEmergencyPress: () => void;
//     onSendPicture: () => void;

//     group: Group | null;
//     booking: Booking | null;
//     error: string | null;
//     isLive: boolean;
//     currentHike: Hike | null;
//     location: Location[];
// }

// const TESTSCREEN = (params: TestScreenParams) => {
//     const { group, booking, location, currentHike } = params;

//     if(!group || !booking) {
//         return (
//             <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>  
//                 <Text>Loading group data...</Text>
//             </View>
//         )
//     }
    
//     return(
//         <ScrollView>
//             <Text>{group.GroupName}</Text>
//             { 
//                 ([...group.members, ...group.admins]).map((m, index) => {
//                     const bookingId = group.members.find(member => member.id === m.id)?.bookingId;
//                     return (
//                         <Text key={`${m.id}_${index}`}>{index + 1}: {m.username} - {bookingId}</Text>
//                     )
//                 }
//             )
//             }

//             { currentHike?.status !== 'started' && (
//                 <Pressable onPress={() => params.onStartHike(group, booking)} style={{ marginTop: 20, padding: 10, backgroundColor: 'green' }}>    
//                     <Text style={{ color: 'white' }}>START HIKE</Text>
//                 </Pressable>
//             )}

//             { currentHike?.status === 'started' && (
//                 <>
//                     <Pressable onPress={() => params.onPauseHike()} style={{ marginTop: 20, padding: 10, backgroundColor: 'green' }}>    
//                         <Text style={{ color: 'white' }}>Pause Hike</Text>
//                     </Pressable>
//                     <Pressable onPress={() => params.onCompleteHike()} style={{ marginTop: 20, padding: 10, backgroundColor: 'green' }}>    
//                         <Text style={{ color: 'white' }}>Complete Hike</Text>
//                     </Pressable>
//                 </>
//             )}

//             { currentHike?.status === 'paused' && (
//                 <>
//                     <Pressable onPress={() => params.onResumeHike()} style={{ marginTop: 20, padding: 10, backgroundColor: 'green' }}>    
//                         <Text style={{ color: 'white' }}>Resume Hike</Text>
//                     </Pressable>
//                     <Pressable onPress={() => params.onCompleteHike()} style={{ marginTop: 20, padding: 10, backgroundColor: 'green' }}>    
//                         <Text style={{ color: 'white' }}>Complete Hike</Text>
//                     </Pressable>
//                 </>
//             )}

//             { !params.isLive && (
//                 <Pressable onPress={() => params.onStartSharingLocation()} style={{ marginTop: 20, padding: 10, backgroundColor: 'green' }}>    
//                     <Text style={{ color: 'white' }}>Start Sharing Location</Text>
//                 </Pressable>
//             )}

//             { params.isLive && (
//                 <Pressable onPress={params.onStopSharingLocation} style={{ marginTop: 20, padding: 10, backgroundColor: 'red' }}>
//                     <Text style={{ color: 'white' }}>Stop Sharing Location</Text>
//                 </Pressable>
//             )}

//             <Text>Booking information </Text>
//             <Text>ID: {booking.id}</Text>
//             <Text>Created: {formatDate(booking.createdAt)}</Text>
//             <Text>Status: {booking.status}</Text>
//             {params.error && <Text style={{ color: 'red', marginTop: 20 }}>{params.error}</Text>}
//             {params.isLive && <Text style={{ color: 'green', marginTop: 20 }}>Location is live!</Text>}
            
//             <Pressable onPress={params.onEmergencyPress} style={{ marginTop: 20, padding: 10, backgroundColor: 'red' }}>
//                 <Text style={{ color: 'white' }}>Send Emergency Alert</Text>
//             </Pressable>
            
//             <Pressable onPress={params.onSendPicture} style={{ marginTop: 20, padding: 10, backgroundColor: 'red' }}>
//                 <Text style={{ color: 'white' }}>Send Picture</Text>
//             </Pressable>
            
//             {
//                 params.isLive && (location ?? []).map(loc => {
//                     const user = [ ...group.members, ...group.admins ].find(member => member.id === loc.id);
//                     const userStatus = Date.now() - new Date(loc.timestamp).getTime() > (5 * 1000) ? 'inactive' : 'active' 
//                     return (
//                         <View style={{ marginTop: 20, padding: 10, borderWidth: 1, borderColor: 'gray' }} key={loc.id}>
//                             <Text>User: {user?.firstname} </Text>
//                             <Text>Status: {userStatus} </Text>
//                             <Text>Lat: {loc.latitude}</Text>
//                             <Text>Long: {loc.longitude}</Text>
//                             <Text>Alt: {loc.altitude}</Text>
//                             <Text>Time: {formatDate(loc.timestamp)}</Text>
//                         </View>

//                     )
//                 })
//             }
//         </ScrollView>
//     )
// }