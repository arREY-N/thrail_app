import { Stack, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Text, View } from "react-native";

import { useGroup } from "@/src/core/hook/group/useGroup";
import useGroupRoom from "@/src/core/hook/group/useGroupRoom";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useFilesStore } from "@/src/core/stores/fileStore";
import getSearchParam from "@/src/core/utility/getSearchParam";
import RoomScreen from "@/src/features/Community/screens/Group/RoomScreen";

export default function groupRoom() {
    const { roomId: rawId } = useLocalSearchParams();
    const roomId = getSearchParam(rawId);

    const { profile } = useAuthHook();
    const { onBackPress } = useAppNavigation();
    const [isUploading, setIsUploading] = useState(false);

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
            setIsUploading(true);
            const url = await uploadDocument();
            if (url) {
                sendMessage(`[Attachment]: ${url}`);
            }
        } catch (error) {
            console.log("Upload failed or canceled:", error);
        } finally {
            setIsUploading(false);
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
            <RoomScreen
                roomId={roomId}
                messages={messages}
                currentGroup={currentGroup}
                sendMessage={sendMessage}
                currentUser={profile}
                onViewableItemsChanged={onViewableItemsChanged}
                headerTitle={headerTitle}   
                onBackPress={onBackPress}         
                onAttachPress={handleAttachPress}
                onLocationPress={() => onViewGroupLocation(currentGroup.id)}
                isUploading={isUploading} 
            />
        </>
    )
}