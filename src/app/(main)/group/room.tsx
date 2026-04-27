import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import { Text, View } from "react-native";

import { useGroup } from "@/src/core/hook/group/useGroup";
import useGroupRoom from "@/src/core/hook/group/useGroupRoom";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useFilesStore } from "@/src/core/stores/fileStore";
import { useGroupStore } from "@/src/core/stores/groupStores/groupStoreCreator";
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
        markAsRead,
        loadMoreMessages
    } = useGroupRoom(roomId);

    const uploadDocument = useFilesStore(s => s.uploadDocument);
    const subscribeToGroup = useGroupStore(s => s.subscribeToGroup);

    useFocusEffect(
        useCallback(() => {
            if (roomId) subscribeToGroup(roomId);
        }, [roomId, subscribeToGroup])
    );

    const handleAttachPress = async () => {
        try {
            setIsUploading(true);
            const url = await uploadDocument();
            if (url) {
                await sendMessage(`[Attachment]: ${url}`);
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
                messages={messages}
                currentGroup={currentGroup}
                sendMessage={sendMessage}
                currentUser={profile}
                markAsRead={markAsRead}
                headerTitle={headerTitle}   
                onBackPress={onBackPress}         
                onAttachPress={handleAttachPress}
                onLocationPress={() => onViewGroupLocation(currentGroup.id)}
                loadMoreMessages={() => loadMoreMessages(roomId)}
                isUploading={isUploading} 
            />
        </>
    )
}