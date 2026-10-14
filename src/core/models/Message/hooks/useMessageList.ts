import { Message } from "@/src/core/models/Message/interfaces/Message.types";
import { useMessageStore } from "@/src/core/models/Message/stores/messageStore";
import { useEffect } from "react";

export function useMessageList(groupId?: string) {
    const messagesByGroup = useMessageStore((s) => s.messagesByGroup);
    const hasReachedEndByGroup = useMessageStore((s) => s.hasReachedEndByGroup);
    const isLoading = useMessageStore((s) => s.isLoading);
    const error = useMessageStore((s) => s.error);
    const subscribeToGroupMessages = useMessageStore((s) => s.subscribeToGroupMessages);
    const unsubscribeFromGroupMessages = useMessageStore((s) => s.unsubscribeFromGroupMessages);
    const loadMoreGroupMessages = useMessageStore((s) => s.loadMoreGroupMessages);

    const messages: Message[] = groupId ? messagesByGroup[groupId] ?? [] : [];
    const hasReachedEnd: boolean = groupId ? hasReachedEndByGroup[groupId] ?? false : false;

    useEffect(() => {
        if (!groupId) return;

        const unsubscribe = subscribeToGroupMessages(groupId);

        return () => {
            if (unsubscribe) {
                unsubscribe();
            } else {
                unsubscribeFromGroupMessages(groupId);
            }
        };
    }, [groupId, subscribeToGroupMessages, unsubscribeFromGroupMessages]);

    const loadMoreMessages = () => {
        if (groupId) {
            loadMoreGroupMessages(groupId);
        }
    };

    return {
        messages,
        hasReachedEnd,
        isLoading,
        error,
        loadMoreMessages,
    };
}
