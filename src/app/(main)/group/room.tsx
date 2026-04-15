import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { useGroup } from "@/src/core/hook/group/useGroup";
import useGroupRoom from "@/src/core/hook/group/useGroupRoom";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useFilesStore } from "@/src/core/stores/fileStore";
import getSearchParam from "@/src/core/utility/getSearchParam";
import GroupRoomScreen from "@/src/features/Community/screens/GroupRoomScreen";

export default function groupRoom() {
    const { roomId: rawId } = useLocalSearchParams();
    const roomId = getSearchParam(rawId);

    const { profile } = useAuthHook();
    const { onBackPress } = useAppNavigation();
    
    const {  
        currentGroup,
        onViewGroupLocation,
    } = useGroup(roomId);
 
    const {
        messages,
        sendMessage,
        onViewableItemsChanged,
    } = useGroupRoom(roomId);

    const uploadDocument = useFilesStore(s => s.uploadDocument);

    const handleAttachPress = async () => {
        try {
            const url = await uploadDocument();
            if (url) {
                sendMessage(`[Attachment]: ${url}`);
            }
        } catch (error) {
            console.log("Upload failed or canceled:", error);
        }
    };

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
            <Pressable onPress={() => onViewGroupLocation(currentGroup.id)}>
                <Text>View Location for group: {headerTitle} </Text>
            </Pressable>
            <GroupRoomScreen
                roomId={roomId}
                messages={messages}
                currentGroup={currentGroup}
                sendMessage={sendMessage}
                currentUser={profile}
                onViewableItemsChanged={onViewableItemsChanged}
                headerTitle={headerTitle}   
                onBackPress={onBackPress}         
                onAttachPress={handleAttachPress}
            />
        </>
    )
}