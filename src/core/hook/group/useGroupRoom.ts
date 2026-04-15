import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Message } from "@/src/core/models/Message/Message";
import { UserLogic } from "@/src/core/models/User/logic/User.logic";
import { MessageRepository } from "@/src/core/repositories/messageRepository";
import { useGroupStore } from "@/src/core/stores/groupStores/groupStoreCreator";
import { useCallback, useRef } from "react";
import { ViewToken } from "react-native";


export default function useGroupRoom(groupId: string) {
    const { profile } = useAuthHook();
    
    const markAsRead = useGroupStore(s => s.markAsRead);

    const rawMessages = useGroupStore(
        (s) => s.messagesByGroup[groupId]
    );
    const messages = rawMessages ?? [];

    const sendMessage = (content: string) => {
        if(!profile || !groupId) return;

        const newMessage = new Message({
            content,
            senderId: profile.id,
            senderName: profile.username,
            timesent: new Date(), 
        })

        MessageRepository.sendMessage(groupId, newMessage);
    }
    
    const processedMessages = useRef(new Set<string>());

    const onViewableItemsChanged = useCallback(({ changed }: { 
        viewableItems: ViewToken<Message>[]; 
        changed: ViewToken<Message>[] 
    }) => {
        changed.forEach((token) => {
            const message = token.item;
            if (!token.isViewable || !message || !profile) return;

            if (processedMessages.current.has(message.id)) {
                console.log('Already processed this session:', message.id);
                return;
            }

            const alreadyRead = message.readBy.some(user => user.id === profile.id);
            
            if (!alreadyRead) {
                processedMessages.current.add(message.id);
                
                markAsRead(groupId, message, UserLogic.toSummary(profile));
                console.log(`Marking message ${message.id} as read.`);
            }
        });
    }, [groupId, profile]);

    return {
        messages,
        sendMessage,
        onViewableItemsChanged
    }
}