import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Group } from "@/src/core/models/Group/Group";
import { Message } from "@/src/core/models/Message/Message";
import { UserLogic } from "@/src/core/models/User/logic/User.logic";
import { MessageRepository } from "@/src/core/repositories/messageRepository";
import { useGroupStore } from "@/src/core/stores/groupStores/groupStoreCreator";
import { useCallback, useEffect, useRef, useState } from "react";
import { ViewToken } from "react-native";

export const useGroup = (groupId: string) => {
    const { profile } = useAuthHook();

    const subscribe = useGroupStore(s => s.subscribeToGroup);
    const unsubscribe = useGroupStore(s => s.unsubscribeFromGroup);

    const setMessages = useGroupStore(s => s.setMessagesByGroup);

    const rawMessages = useGroupStore(
        (s) => s.messagesByGroup[groupId]
    );

    const markAsRead = useGroupStore(s => s.markAsRead);
    const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
    const groups = useGroupStore(s => s.groups);

    const messages = rawMessages ?? [];

    useEffect(() => {
        if (!groupId) return;

        subscribe(groupId);
        setCurrentGroup(groups.find(g => g.id === groupId) ?? null);    
        return () => unsubscribe(groupId);

    }, [groupId, subscribe, unsubscribe,]);

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
        currentGroup,
        sendMessage,
        onViewableItemsChanged 
    };
};