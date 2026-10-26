import { GroupRepo } from "@/src/core/models/Group/repositories/GroupRepository";
import { useGroupStore } from "@/src/core/models/Group/stores/groupStore";
import { Message, newMessage } from "@/src/core/models/Message/Message";
import { useAuthHook, UserLogic } from "@/src/core/models/User/User";
import { useCallback, useMemo } from "react";

export function useGroupRoom(groupId: string) {
    const { profile } = useAuthHook();

    const markAsReadAction = useGroupStore(s => s.markAsRead);
    const loadMoreMessages = useGroupStore(s => s.loadMoreMessages);
    const markGroupAsVisitedAction = useGroupStore(s => s.markGroupAsVisited);

    const rawMessages = useGroupStore((s) => s.messagesByGroup[groupId]);
    const currentGroup = useGroupStore((s) => s.groups.find(g => g.id === groupId));

    const messages = useMemo(() => {
        if (rawMessages && rawMessages.length > 0) {
            return rawMessages;
        }
        if (currentGroup?.lastMessage && currentGroup.lastMessage.content) {
            return [{
                id: currentGroup.lastMessage.id || 'last-msg',
                content: currentGroup.lastMessage.content,
                senderId: currentGroup.lastMessage.senderId,
                senderName: currentGroup.lastMessage.senderName,
                timesent: currentGroup.lastMessage.timesent,
                status: currentGroup.lastMessage.status || 'sent',
                readBy: currentGroup.lastMessage.readBy || [],
            } as Message];
        }
        return [];
    }, [rawMessages, currentGroup?.lastMessage]);

    const hasReachedEnd = useGroupStore((s) => s.hasReachedEndByGroup[groupId] ?? false);

    const sendMessage = async (content: string) => {
        if (!profile || !groupId) throw new Error("Missing profile or groupId");

        const msg = newMessage({
            content,
            senderId: profile.id,
            senderName: profile.username,
            timesent: new Date(),
        });

        await GroupRepo.sendMessage(groupId, msg);
    };

    const markAsRead = useCallback((rawMsg: Message) => {
        if (!profile || !groupId) return;

        const message = newMessage(rawMsg);
        const alreadyRead = message.readBy?.some(user => user.id === profile.id);
        if (!alreadyRead) {
            markAsReadAction(groupId, message, UserLogic.toSummary(profile));
        }
    }, [groupId, profile, markAsReadAction]);

    const markRoomAsVisited = useCallback(() => {
        if (!profile || !groupId) return;

        markGroupAsVisitedAction(groupId, UserLogic.toSummary(profile));
    }, [groupId, profile, markGroupAsVisitedAction]);

    return {
        messages,
        sendMessage,
        markAsRead,
        markRoomAsVisited,
        loadMoreMessages,
        hasReachedEnd,
    };
}
export default useGroupRoom;
