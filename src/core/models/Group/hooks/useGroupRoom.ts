import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { GroupRepo } from "@/src/core/init/repositories";
import { useGroupStore } from "@/src/core/models/Group/stores/groupStore";
import { Message } from "@/src/core/models/Message/Message";
import { IMessage } from "@/src/core/models/Message/Message.types";
import { UserLogic } from "@/src/core/models/User/User";
import { useCallback } from "react";

export function useGroupRoom(groupId: string) {
    const { profile } = useAuthHook();

    const markAsReadAction = useGroupStore(s => s.markAsRead);
    const loadMoreMessages = useGroupStore(s => s.loadMoreMessages);
    const markGroupAsVisitedAction = useGroupStore(s => s.markGroupAsVisited);

    const rawMessages = useGroupStore((s) => s.messagesByGroup[groupId]);
    const messages = rawMessages ?? [];

    const hasReachedEnd = useGroupStore((s) => s.hasReachedEndByGroup[groupId] ?? false);

    const sendMessage = async (content: string) => {
        if (!profile || !groupId) throw new Error("Missing profile or groupId");

        const newMessage = new Message({
            content,
            senderId: profile.id,
            senderName: profile.username,
            timesent: new Date(),
        });

        await GroupRepo.sendMessage(groupId, newMessage);
    };

    const markAsRead = useCallback((rawMsg: IMessage) => {
        if (!profile || !groupId) return;

        const message = new Message(rawMsg);
        const alreadyRead = message.readBy.some(user => user.id === profile.id);
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
