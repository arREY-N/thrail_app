/**
 * @file room.tsx
 * @description Main entry point for a group chat room screen, setting up router params, subscription, and event handlers.
 */

import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Keyboard, Text, View } from "react-native";

import { useGroup } from "@/src/core/hook/group/useGroup";
import useGroupRoom from "@/src/core/hook/group/useGroupRoom";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import useDevicePermissions from "@/src/core/hook/user/useDevicePermissions";
import { useGroupStore } from "@/src/core/models/Group/Group";
import { useFilesStore } from "@/src/core/stores/fileStore";
import getSearchParam from "@/src/core/utility/getSearchParam";
import { formatGroupName } from "@/src/features/Community/screens/Group/ListScreen";
import RoomScreen from "@/src/features/Community/screens/Group/RoomScreen";

/**
 * GroupRoom screen component container.
 * Subscribes to room message snapshots and initializes attachment actions.
 */
export default function groupRoom() {
    const { roomId: rawId } = useLocalSearchParams();
    const roomId = getSearchParam(rawId);

    const { profile } = useAuthHook();
    const { onBackPress } = useAppNavigation();
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const { statuses: permissionStatuses, requestPermission: onRequestPermission } = useDevicePermissions();

    const {  
        currentGroup,
    } = useGroup(roomId);
 
    const {
        messages,
        sendMessage,
        markAsRead,
        markRoomAsVisited,
        loadMoreMessages,
        hasReachedEnd,
    } = useGroupRoom(roomId);

    const capturePhoto = useFilesStore(s => s.capturePhoto);
    const selectPhoto = useFilesStore(s => s.selectPhoto);
    const subscribeToGroup = useGroupStore(s => s.subscribeToGroup);

    useEffect(() => {
        if (roomId) {
            subscribeToGroup(roomId);
            markRoomAsVisited();
        }
    }, [roomId, subscribeToGroup, markRoomAsVisited]);

    /**
     * Handlers for attaching a photo from image gallery.
     */
    const handleAttachPhotoPress = async () => {
        try {
            Keyboard.dismiss();
            await new Promise(resolve => setTimeout(resolve, 300));
            setIsUploading(true);
            const url = await selectPhoto();
            if (url) {
                await sendMessage(`[Attachment]: ${url}`);
            }
        } catch (error) {
            console.log("Photo selection failed or canceled:", error);
        } finally {
            setIsUploading(false);
        }
    };

    /**
     * Handlers for capturing a photo with device camera.
     */
    const handleCapturePhotoPress = async () => {
        try {
            Keyboard.dismiss();
            await new Promise(resolve => setTimeout(resolve, 300));
            setIsUploading(true);
            const url = await capturePhoto();
            if (url) {
                await sendMessage(`[Attachment]: ${url}`);
            }
        } catch (error) {
            console.log("Photo capture failed or canceled:", error);
        } finally {
            setIsUploading(false);
        }
    };

    /**
     * Prepend the latest message from the group preview if it hasn't been fetched yet.
     * Prevents empty screen while waiting for the full chat history snapshot.
     */
    const displayMessages = React.useMemo(() => {
        if (!currentGroup?.lastMessage || !currentGroup.lastMessage.id) return messages;
        
        const hasLatest = messages.some(m => m.id === currentGroup.lastMessage!.id);
        if (!hasLatest) {
            return [currentGroup.lastMessage as any, ...messages];
        }
        return messages;
    }, [messages, currentGroup?.lastMessage]);

    if(!currentGroup) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>No group found</Text>
            </View>
        )
    }

    const headerTitle = formatGroupName(currentGroup, profile);

    return(
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <RoomScreen
                messages={displayMessages}
                currentGroup={currentGroup}
                sendMessage={sendMessage}
                currentUser={profile}
                markAsRead={markAsRead}
                headerTitle={headerTitle}   
                onBackPress={onBackPress}         
                onAttachPhotoPress={handleAttachPhotoPress}
                onCapturePhotoPress={handleCapturePhotoPress}
                loadMoreMessages={() => loadMoreMessages(roomId)}
                hasReachedEnd={hasReachedEnd}
                isUploading={isUploading}
            />
        </>
    );
}