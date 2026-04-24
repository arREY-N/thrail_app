import { Group } from "@/src/core/models/Group/Group";
import { IGroupMember } from "@/src/core/models/Group/Group.types";
import { Message } from "@/src/core/models/Message/Message";
import { IUserSummary } from "@/src/core/models/User/User.types";
import { MessageRepository } from "@/src/core/repositories/messageRepository";
import { Unsubscribe } from "firebase/auth";
import { create } from "zustand";

export interface GroupState {
    groups: Group[];
    isLoading: boolean;
    error: string | null;

    messagesByGroup: Record<string, Message[]>;
    activeListeners: Record<string, Unsubscribe>;
    messageLimits: Record<string, number>; // Tracks pagination limit per group

    subscribeToGroup: (groupId: string) => void;
    unsubscribeFromGroup: (groupId: string) => void;
    loadMoreMessages: (groupId: string) => void; // Triggers pagination

    setGroups: (groups: Group[]) => void;
    setMessagesByGroup: (groupId: string, messages: Message[]) => void;

    sendMessage: (groupId: string, message: Message) => void;
    markAsRead: (groupId: string, message: Message, userSummary: IUserSummary) => void;
    createGroup: (group: Group) => void;
    joinGroup: (group: Group, member: IGroupMember) => Promise<void>;
    checkGroupExists: (groupId: string) => Promise<Group | null>;
}

export const useGroupStore = create<GroupState>((set, get) => ({
    groups: [],
    isLoading: false,
    error: null,
    messagesByGroup: {},
    activeListeners: {},
    messageLimits: {},

    subscribeToGroup: (groupId) => {
        // If already listening, do not duplicate
        if(get().activeListeners[groupId]) return;

        // Default to loading the 30 most recent messages
        const limitCount = get().messageLimits[groupId] || 30;

        const unsubscribe = MessageRepository.listenToMessages(
            groupId,
            limitCount, // Pass the limit to Firebase
            (messages) => set((state) => ({
                messagesByGroup: {...state.messagesByGroup, [groupId]: messages}
            })
        ));
        
        set((state) => ({
            activeListeners: { 
                ...state.activeListeners,
                [groupId]: unsubscribe
            },
            messageLimits: {
                ...state.messageLimits,
                [groupId]: limitCount
            }
        }));
    },

    // Function to paginate older messages
    loadMoreMessages: (groupId) => {
        const currentLimit = get().messageLimits[groupId] || 30;
        const newLimit = currentLimit + 30; // Increase by 30

        // 1. Kill the old listener
        const oldUnsubscribe = get().activeListeners[groupId];
        if (oldUnsubscribe) {
            oldUnsubscribe();
        }

        // 2. Start a new listener with the expanded limit
        const newUnsubscribe = MessageRepository.listenToMessages(
            groupId,
            newLimit,
            (messages) => set((state) => ({
                messagesByGroup: {...state.messagesByGroup, [groupId]: messages}
            })
        ));

        // 3. Update Zustand state
        set((state) => ({
            messageLimits: {
                ...state.messageLimits,
                [groupId]: newLimit
            },
            activeListeners: {
                ...state.activeListeners,
                [groupId]: newUnsubscribe
            }
        }));
    },

    unsubscribeFromGroup: (groupId) => {
        const unsubscribe = get().activeListeners[groupId];

        if(unsubscribe){
            unsubscribe();
            set((state) => {
                const newListeners = { ...state.activeListeners };
                delete newListeners[groupId];
                return {
                    ...state,
                    activeListeners: newListeners
                }
            })
        }
    },

    setGroups: (groups) => set({ groups }),
    setMessagesByGroup: (groupId, messages) => set((state) => {
        const current = state.messagesByGroup[groupId];
        if(current === messages) {
            return state;
        }

        return {
            messagesByGroup: {
                ...state.messagesByGroup,
                [groupId]: messages
            }
        }
    }),

    sendMessage: async (groupId, message) => {
        await MessageRepository.sendMessage(groupId, message);
    },

    markAsRead: async (groupId: string, message: Message, userSummary: IUserSummary) => {
        await MessageRepository.markMessageAsRead(groupId, message.id, userSummary);
    },

    createGroup: async (group: Group) => {
        try {
            await MessageRepository.writeGroup(group);
        } catch (error) {
            console.error("Failed to create group:", error);
            throw error;
        }
    },

    checkGroupExists: async (groupId: string): Promise<Group | null> => {
        try {
            const group = await MessageRepository.fetchGroup(groupId);  
            return group;
        } catch (error) {
            console.error("Failed to check group existence:", error);
            throw error;
        }
    },

    joinGroup: async (group: Group, member: IGroupMember): Promise<void> => {
        try {
            const newGroup = new Group({
                ...group,
                members: [...(group.members || []), member],
                participantsIds: [...(group.participantsIds || []), member.id],
            })

            await MessageRepository.writeGroup(newGroup);

        } catch (error) {
            console.error("Failed to join group:", error);
            throw error;
        }
    },
}));