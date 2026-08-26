import { Message } from "@/src/core/models/Message/interfaces/Message.types";
import { useMessageStore } from "@/src/core/models/Message/stores/messageStore";
import { IUserSummary } from "@/src/core/models/User/User";

export function useMessage() {
    const isLoading = useMessageStore((s) => s.isLoading);
    const error = useMessageStore((s) => s.error);
    const sendMessageAction = useMessageStore((s) => s.sendMessage);
    const markMessageAsReadAction = useMessageStore((s) => s.markMessageAsRead);
    const clearMessagesAction = useMessageStore((s) => s.clearMessages);

    const sendMessage = async (groupId: string, message: Message): Promise<Message> => {
        return await sendMessageAction(groupId, message);
    };

    const markAsRead = async (groupId: string, messageId: string, userSummary: IUserSummary): Promise<void> => {
        await markMessageAsReadAction(groupId, messageId, userSummary);
    };

    const clearMessages = (groupId?: string) => {
        clearMessagesAction(groupId);
    };

    return {
        isLoading,
        error,
        sendMessage,
        markAsRead,
        clearMessages,
    };
}
