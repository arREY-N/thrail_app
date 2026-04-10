import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

import { useGroup } from "@/src/core/hook/group/useGroup";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import getSearchParam from "@/src/core/utility/getSearchParam";
import GroupRoomScreen from "@/src/features/Community/screens/GroupRoomScreen";

export default function groupRoom() {
    const { roomId: rawId } = useLocalSearchParams();
    const roomId = getSearchParam(rawId);

    const { profile } = useAuthHook();
    const { onBackPress } = useAppNavigation();

    const { 
        messages, 
        currentGroup,
        sendMessage,
        onViewableItemsChanged
    } = useGroup(roomId);

    if(!currentGroup) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>No group found</Text>
            </View>
        )
    };

    const headerTitle = currentGroup.trail?.name || currentGroup.GroupName;

    return(
        <>
            <Stack.Screen options={{  headerShown: false }} />

            <GroupRoomScreen
                roomId={roomId}
                messages={messages}
                currentGroup={currentGroup}
                sendMessage={sendMessage}
                currentUser={profile}
                onViewableItemsChanged={onViewableItemsChanged}
                headerTitle={headerTitle}   
                onBackPress={onBackPress}         
            />
        </>

        // <>
        //     <Stack.Screen options={{ title: currentGroup.GroupName, headerShown: true }}/>
        //     <TestGroupRoom
        //         roomId={roomId}
        //         messages={messages}
        //         currentGroup={currentGroup}
        //         sendMessage={sendMessage}
        //         onViewableItemsChanged={onViewableItemsChanged}
        //     />
        // </>
    )
}

// export type GroupRoomParams = {
//     roomId: string;
//     messages: Message[];
//     currentGroup: Group;
//     sendMessage: (content: string) => void;
//     onViewableItemsChanged?: (info: { 
//         viewableItems: ViewToken[]; 
//         changed: ViewToken[]; 
//     }) => void;
// }

// export const TestGroupRoom = (params: GroupRoomParams) => {
//     const [content, setContent] = useState('');

//     const viewabilityConfig = useRef({
//         itemVisiblePercentThreshold: 50,
//         minimumViewTime: 300
//     }).current

//     const renderMessage = (item: Message) => {
//         return(
//             <View style={{ padding: 10 }}>
//                 <Text style={{ fontSize: 16 }}>{item.content}</Text>
//                 <Text style={{ fontSize: 14, color: '#666' }}>{item.senderName}</Text>
//                 <Text style={{ fontSize: 12, color: '#999' }}>{formatDate(item.timesent)}</Text>
//                 {item.readBy.length > 0 && (
//                     <Text style={{ fontSize: 12, color: '#999' }}>{(item.readBy || ['']).map(u => u.username).join(', ')}</Text>
//                 )}
//             </View>
//         )
//     }
//     return (
//         <View style={{ flex: 1, padding: 20 }}>
//             <Text>Group Name: {params.currentGroup?.GroupName}</Text>

//             <CustomTextInput 
//                 label={'message'} 
//                 placeholder={'Enter message'} 
//                 value={content} 
//                 onChangeText={setContent} 
//                 secureTextEntry={undefined} 
//                 keyboardType={undefined} 
//                 isPasswordVisible={undefined} 
//                 onTogglePassword={undefined} 
//                 style={undefined} 
//                 inputStyle={undefined} 
//                 icon={undefined} 
//                 prefix={undefined} 
//                 children={undefined} 
//                 showTodayButton={undefined} 
//                 allowFutureDates={undefined} 
//                 multiline={undefined}            
//             />

//             <Pressable onPress={() => params.sendMessage(content)}>
//                 <Text>Send Message</Text>
//             </Pressable>

//             <FlatList
//                 data={params.messages}
//                 renderItem={({ item }) => renderMessage(item)}
//                 keyExtractor={(item) => item.id}
//                 onViewableItemsChanged={params.onViewableItemsChanged}
//                 viewabilityConfig={viewabilityConfig}
//             />
//         </View>
//     )
// }