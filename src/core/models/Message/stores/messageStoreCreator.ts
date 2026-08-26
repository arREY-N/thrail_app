import { Message } from "@/src/core/models/Message/interfaces/Message.types";
import { MessageRepo } from "@/src/core/models/Message/repositories/MessageRepository";
import { IUserSummary } from "@/src/core/models/User/User";
import { Unsubscribe } from "firebase/firestore";
import { StateCreator } from "zustand";

export interface MessageState {
    messagesByGroup: Record<string, Message[]>;
    activeListeners: Record<string, Unsubscribe>;
    messageLimits: Record<string, number>;
    messagePrevCounts: Record<string, number>;
    hasReachedEndByGroup: Record<string, boolean>;
    isLoading: boolean;
    error: string | null;

    subscribeToGroupMessages: (groupId: string) => Unsubscribe | null;
    unsubscribeFromGroupMessages: (groupId: string) => void;
    loadMoreGroupMessages: (groupId: string) => void;
    sendMessage: (groupId: string, message: Message) => Promise<Message>;
    markMessageAsRead: (groupId: string, messageId: string, userSummary: IUserSummary) => Promise<void>;
    setMessagesByGroup: (groupId: string, messages: Message[]) => void;
    clearMessages: (groupId?: string) => void;
}

const init = {
    messagesByGroup: {},
    activeListeners: {},
    messageLimits: {},
    messagePrevCounts: {},
    hasReachedEndByGroup: {},
    isLoading: false,
    error: null,
};

export const messageStoreCreator: StateCreator<
    MessageState,
    [["zustand/immer", never]]
> = (set, get) => ({
    ...init,

    subscribeToGroupMessages: (groupId: string) => {
        if (get().activeListeners[groupId]) {
            return get().activeListeners[groupId];
        }

        const limitCount = get().messageLimits[groupId] || 30;

        const unsubscribe = MessageRepo.listenToGroupMessages(
            groupId,
            limitCount,
            (messages, fromCache) => {
                set((state) => {
                    state.messagesByGroup[groupId] = messages;
                    state.messagePrevCounts[groupId] = messages.length;
                    state.hasReachedEndByGroup[groupId] = fromCache
                        ? (state.hasReachedEndByGroup[groupId] ?? false)
                        : messages.length < limitCount;
                });
            }
        );

        set((state) => {
            state.activeListeners[groupId] = unsubscribe;
            state.messageLimits[groupId] = limitCount;
        });

        return unsubscribe;
    },

    unsubscribeFromGroupMessages: (groupId: string) => {
        const unsubscribe = get().activeListeners[groupId];
        if (unsubscribe) {
            unsubscribe();
            set((state) => {
                delete state.activeListeners[groupId];
            });
        }
    },

    loadMoreGroupMessages: (groupId: string) => {
        const currentLimit = get().messageLimits[groupId] || 30;

        if (get().hasReachedEndByGroup[groupId]) return;

        const newLimit = currentLimit + 30;

        const oldUnsubscribe = get().activeListeners[groupId];
        if (oldUnsubscribe) {
            oldUnsubscribe();
        }

        const newUnsubscribe = MessageRepo.listenToGroupMessages(
            groupId,
            newLimit,
            (messages, fromCache) => {
                const reachedEnd = fromCache
                    ? (get().hasReachedEndByGroup[groupId] ?? false)
                    : messages.length < newLimit;

                set((state) => {
                    state.messagesByGroup[groupId] = messages;
                    state.messagePrevCounts[groupId] = messages.length;
                    state.hasReachedEndByGroup[groupId] = reachedEnd;
                });
            }
        );

        set((state) => {
            state.messageLimits[groupId] = newLimit;
            state.activeListeners[groupId] = newUnsubscribe;
        });
    },

    sendMessage: async (groupId: string, message: Message) => {
        try {
            set({ error: null });
            const saved = await MessageRepo.sendMessage(groupId, message);
            return saved;
        } catch (error) {
            console.error("Failed to send message:", error);
            set({
                error: error instanceof Error ? error.message : "Failed to send message",
            });
            throw error;
        }
    },

    markMessageAsRead: async (groupId: string, messageId: string, userSummary: IUserSummary) => {
        try {
            await MessageRepo.markMessageAsRead(groupId, messageId, userSummary);
        } catch (error) {
            console.error("Failed to mark message as read:", error);
        }
    },

    setMessagesByGroup: (groupId: string, messages: Message[]) => {
        set((state) => {
            state.messagesByGroup[groupId] = messages;
        });
    },

    clearMessages: (groupId?: string) => {
        set((state) => {
            if (groupId) {
                delete state.messagesByGroup[groupId];
                delete state.messageLimits[groupId];
                delete state.messagePrevCounts[groupId];
                delete state.hasReachedEndByGroup[groupId];
            } else {
                state.messagesByGroup = {};
                state.messageLimits = {};
                state.messagePrevCounts = {};
                state.hasReachedEndByGroup = {};
            }
        });
    },
});
