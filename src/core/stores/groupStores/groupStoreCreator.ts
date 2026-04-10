import { Group } from "@/src/core/models/Group/Group";
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
    subscribeToGroup: (groupId: string) => void;
    unsubscribeFromGroup: (groupId: string) => void;

    setGroups: (groups: Group[]) => void;
    setMessagesByGroup: (groupId: string, messages: Message[]) => void;

    sendMessage: (groupId: string, message: Message) => void;
    markAsRead: (groupId: string, message: Message, userSummary: IUserSummary) => void;
    createGroup: (group: Group) => void;
    joinGroup: (group: Group, userSummary: IUserSummary) => Promise<void>;
    checkGroupExists: (groupId: string) => Promise<Group | null>;
}

export const useGroupStore = create<GroupState>((set, get) => ({
    groups: [],
    isLoading: false,
    error: null,
    messagesByGroup: {},
    activeListeners: {},

    subscribeToGroup: (groupId) => {
        if(get().activeListeners[groupId]) return;

        const unsubscribe = MessageRepository.listenToMessages(
            groupId,
            (messages) => set((state) => ({
                messagesByGroup: {...state.messagesByGroup, [groupId]: messages}
            })
        ));
        
        set((state) => ({
            activeListeners: { 
                ...state.activeListeners,
                [groupId]: unsubscribe
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

    joinGroup: async (group: Group, userSummary: IUserSummary): Promise<void> => {
        try {
            const newGroup = new Group({
                ...group,
                members: [...(group.members || []), userSummary],
                participantsIds: [...(group.participantsIds || []), userSummary.id],
            })

            await MessageRepository.writeGroup(newGroup);

        } catch (error) {
            console.error("Failed to join group:", error);
            throw error;
        }
    },
}));