import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Message } from "@/src/core/models/Message/Message";
import { UserLogic } from "@/src/core/models/User/logic/User.logic";
import { MessageRepository } from "@/src/core/repositories/messageRepository";
import { useGroupStore } from "@/src/core/stores/groupStores/groupStoreCreator";
import { useCallback } from "react";

export default function useGroupRoom(groupId: string) {
    const { profile } = useAuthHook();
    
    const markAsReadAction = useGroupStore(s => s.markAsRead);
    const loadMoreMessages = useGroupStore(s => s.loadMoreMessages);

    const rawMessages = useGroupStore((s) => s.messagesByGroup[groupId]);
    const messages = rawMessages ?? [];

    const sendMessage = async (content: string) => {
        if(!profile || !groupId) throw new Error("Missing profile or groupId");

        const newMessage = new Message({
            content,
            senderId: profile.id,
            senderName: profile.username,
            timesent: new Date(), 
        });

        await MessageRepository.sendMessage(groupId, newMessage);
    }
    
    const markAsRead = useCallback((message: Message) => {
        if (!profile || !groupId) return;
        
        const alreadyRead = message.readBy.some(user => user.id === profile.id);
        if (!alreadyRead) {
            markAsReadAction(groupId, message, UserLogic.toSummary(profile));
        }
    }, [groupId, profile, markAsReadAction]);

    return {
        messages,
        sendMessage,
        markAsRead,
        loadMoreMessages
    }
}