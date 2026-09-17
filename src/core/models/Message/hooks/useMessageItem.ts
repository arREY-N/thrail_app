import { Message } from "@/src/core/models/Message/interfaces/Message.types";
import { useMessageStore } from "@/src/core/models/Message/stores/messageStore";

export function useMessageItem(groupId?: string, messageId?: string) {
    const messagesByGroup = useMessageStore((s) => s.messagesByGroup);
    const isLoading = useMessageStore((s) => s.isLoading);
    const error = useMessageStore((s) => s.error);

    let message: Message | null = null;

    if (groupId && messageId) {
        const groupMessages = messagesByGroup[groupId] ?? [];
        message = groupMessages.find((m) => m.id === messageId) ?? null;
    }

    return {
        message,
        isLoading,
        error,
    };
}
