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
    messageLimits: Record<string, number>;       // Tracks pagination limit per group
    messagePrevCounts: Record<string, number>;   // Tracks previous snapshot count to detect true end
    hasReachedEndByGroup: Record<string, boolean>; // True when fetched count < limit (all loaded)

    subscribeToGroup: (groupId: string) => void;
    unsubscribeFromGroup: (groupId: string) => void;
    loadMoreMessages: (groupId: string) => void;  // Triggers pagination
    markGroupAsVisited: (groupId: string, userSummary: IUserSummary) => Promise<void>; // Marks the group as visited for the user

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
    messagePrevCounts: {},
    hasReachedEndByGroup: {},

    subscribeToGroup: (groupId) => {
        // If already listening, do not duplicate
        if(get().activeListeners[groupId]) return;

        // Default to loading the 30 most recent messages
        const limitCount = get().messageLimits[groupId] || 30;

        const unsubscribe = MessageRepository.listenToMessages(
            groupId,
            limitCount,
            (messages, fromCache) => set((state) => ({
                messagesByGroup: { ...state.messagesByGroup, [groupId]: messages },
                messagePrevCounts: { ...state.messagePrevCounts, [groupId]: messages.length },
                // Reached end if snapshot returned fewer than what we asked for.
                // Ignore cache snapshots to prevent premature true detection.
                hasReachedEndByGroup: {
                    ...state.hasReachedEndByGroup,
                    [groupId]: fromCache 
                        ? (state.hasReachedEndByGroup[groupId] ?? false)
                        : messages.length < limitCount,
                },
            }))
        );
        
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

    // Function to paginate older messages — safe: kills old listener before creating new one
    loadMoreMessages: (groupId) => {
        const currentLimit = get().messageLimits[groupId] || 30;

        // Do not fetch more if we already know we have everything
        if (get().hasReachedEndByGroup[groupId]) return;

        const newLimit = currentLimit + 30;

        // 1. Kill the old listener
        const oldUnsubscribe = get().activeListeners[groupId];
        if (oldUnsubscribe) {
            oldUnsubscribe();
        }

        // 2. Start a new listener with the expanded limit
        const newUnsubscribe = MessageRepository.listenToMessages(
            groupId,
            newLimit,
            (messages, fromCache) => {
                // True end: Firestore returned fewer messages than we requested.
                // Ignore cache snapshots to prevent premature true detection before server updates arrive.
                const reachedEnd = fromCache
                    ? (get().hasReachedEndByGroup[groupId] ?? false)
                    : (messages.length < newLimit);

                set((state) => ({
                    messagesByGroup: { ...state.messagesByGroup, [groupId]: messages },
                    messagePrevCounts: { ...state.messagePrevCounts, [groupId]: messages.length },
                    hasReachedEndByGroup: {
                        ...state.hasReachedEndByGroup,
                        [groupId]: reachedEnd,
                    },
                }));
            }
        );

        // 3. Update Zustand state with new listener and limit
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

    // Marks the group as visited for the user
    markGroupAsVisited: async (groupId, userSummary) => {
        await MessageRepository.markGroupAsVisited(groupId, userSummary);
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
            console.log("Failed to create group:", error);
            throw error;
        }
    },

    checkGroupExists: async (groupId: string): Promise<Group | null> => {
        try {
            const group = await MessageRepository.fetchGroup(groupId);  
            return group;
        } catch (error) {
            console.log("Failed to check group existence:", error);
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
            console.log("Failed to join group:", error);
            throw error;
        }
    },
}));