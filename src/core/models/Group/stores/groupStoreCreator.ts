import { Group, IGroupMember } from "@/src/core/models/Group/interfaces/Group.types";
import { GroupRepo } from "@/src/core/models/Group/repositories/GroupRepository";
import { newGroup } from "@/src/core/models/Group/utils/GroupFactory";
import { Message } from "@/src/core/models/Message/Message";
import { IUserSummary } from "@/src/core/models/User/User";
import { upsertItem } from "@/src/core/models/utils/upsert";
import { logger } from "@/src/core/utility/errorFormatter";
import NetInfo from "@react-native-community/netinfo";
import { Unsubscribe } from "firebase/auth";
import { Platform } from "react-native";
import { StateCreator } from "zustand";

export interface GroupState {
    groups: Group[];
    isLoading: boolean;
    isWriting: boolean;
    error: string | null;
    isFetching: boolean;

    messagesByGroup: Record<string, Message[]>;
    activeListeners: Record<string, Unsubscribe>;
    messageLimits: Record<string, number>;       // Tracks pagination limit per group
    messagePrevCounts: Record<string, number>;   // Tracks previous snapshot count to detect true end
    hasReachedEndByGroup: Record<string, boolean>; // True when fetched count < limit (all loaded)

    subscribeToGroup: (groupId: string) => void;
    unsubscribeFromGroup: (groupId: string) => void;
    loadMoreMessages: (groupId: string) => void;  // Triggers pagination
    prefetchRecentMessagesForGroups: (groupIds: string[], limitCount?: number) => Promise<void>;
    markGroupAsVisited: (groupId: string, userSummary: IUserSummary) => Promise<void>; // Marks the group as visited for the user

    fetchGroupById: (groupId: string) => Promise<Group | void>;

    setGroups: (groups: Group[], fromCache?: boolean) => void;
    setMessagesByGroup: (groupId: string, messages: Message[]) => void;

    sendMessage: (groupId: string, message: Message) => void;
    markAsRead: (groupId: string, message: Message, userSummary: IUserSummary) => void;
    createGroup: (group: Group) => Promise<void>;
    joinGroup: (group: Group, member: IGroupMember) => Promise<void>;
    checkGroupExists: (groupId: string) => Promise<Group | null>;
    reset: () => void;
}

const init = {
    groups: [],
    isLoading: false,
    isFetching: false,
    isWriting: false,
    error: null,
    messagesByGroup: {},
    activeListeners: {},
    messageLimits: {},
    messagePrevCounts: {},
    hasReachedEndByGroup: {},
}

export const groupStoreCreator: StateCreator<GroupState, [["zustand/immer", never]]> = ((set, get) => ({
    ...init,

    reset: () => {
        const listeners = get().activeListeners || {};
        Object.values(listeners).forEach((unsub) => {
            if (typeof unsub === "function") unsub();
        });
        set(init);
    },

    fetchGroupById: async (groupId: string): Promise<Group | void> => {
        const existing = get().groups.find(g => g.id === groupId);
        if (existing) {
            return existing;
        }

        try {
            set({ isFetching: true, error: null });

            const group = await GroupRepo.fetchGroup(groupId);

            logger('GroupStoreCreator', 'Found group: ', group);
            set({
                isFetching: false,
                groups: upsertItem(get().groups, group),
            });

            return group;
        } catch (error) {
            set({ isFetching: false, error: error instanceof Error ? error.message : "Failed to fetch group" });
        }
    },

    subscribeToGroup: (groupId) => {
        // If already listening, do not duplicate
        if (get().activeListeners[groupId]) return;

        if (Platform.OS !== 'web') {
            NetInfo.fetch().then((network) => {
                const isOnline = Boolean(network.isConnected && network.isInternetReachable);
                if (!isOnline) {
                    set((state) => ({
                        hasReachedEndByGroup: {
                            ...state.hasReachedEndByGroup,
                            [groupId]: true,
                        },
                    }));
                }
            });
        }

        // Default to loading the 15 most recent messages
        const limitCount = get().messageLimits[groupId] || 15;

        const unsubscribe = GroupRepo.listenToMessages(
            groupId,
            limitCount,
            (messages, fromCache) => set((state) => {
                const currentGroupMsgs = state.messagesByGroup[groupId] || [];
                const resolvedMsgs = (messages && messages.length > 0)
                    ? messages
                    : (fromCache && currentGroupMsgs.length > 0 ? currentGroupMsgs : messages);

                return {
                    messagesByGroup: { ...state.messagesByGroup, [groupId]: resolvedMsgs },
                    messagePrevCounts: { ...state.messagePrevCounts, [groupId]: resolvedMsgs.length },
                    hasReachedEndByGroup: {
                        ...state.hasReachedEndByGroup,
                        [groupId]: fromCache
                            ? (state.hasReachedEndByGroup[groupId] ?? false)
                            : messages.length < limitCount,
                    },
                };
            })
        );

        set((state) => ({
            activeListeners: {
                ...state.activeListeners,
                [groupId]: unsubscribe,
            },
            messageLimits: {
                ...state.messageLimits,
                [groupId]: limitCount,
            },
        }));
    },

    // Function to paginate older messages — safe: kills old listener before creating new one
    loadMoreMessages: async (groupId) => {
        const currentLimit = get().messageLimits[groupId] || 15;

        // Do not fetch more if we already know we have everything
        if (get().hasReachedEndByGroup[groupId]) return;

        if (Platform.OS !== 'web') {
            const network = await NetInfo.fetch();
            const isOnline = Boolean(network.isConnected && network.isInternetReachable);
            if (!isOnline) {
                // When offline, we cannot paginate older messages from the server
                set((state) => ({
                    hasReachedEndByGroup: {
                        ...state.hasReachedEndByGroup,
                        [groupId]: true,
                    },
                }));
                return;
            }
        }

        const newLimit = currentLimit + 15;

        // 1. Kill the old listener
        const oldUnsubscribe = get().activeListeners[groupId];
        if (oldUnsubscribe) {
            oldUnsubscribe();
        }

        // 2. Start a new listener with the expanded limit
        const newUnsubscribe = GroupRepo.listenToMessages(
            groupId,
            newLimit,
            (messages, fromCache) => {
                const currentGroupMsgs = get().messagesByGroup[groupId] || [];
                const resolvedMsgs = (messages && messages.length > 0)
                    ? messages
                    : (fromCache && currentGroupMsgs.length > 0 ? currentGroupMsgs : messages);

                const reachedEnd = fromCache
                    ? (get().hasReachedEndByGroup[groupId] ?? false)
                    : (messages.length < newLimit);

                set((state) => ({
                    messagesByGroup: { ...state.messagesByGroup, [groupId]: resolvedMsgs },
                    messagePrevCounts: { ...state.messagePrevCounts, [groupId]: resolvedMsgs.length },
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
                [groupId]: newLimit,
            },
            activeListeners: {
                ...state.activeListeners,
                [groupId]: newUnsubscribe,
            },
        }));
    },

    // Marks the group as visited for the user
    markGroupAsVisited: async (groupId, userSummary) => {
        await GroupRepo.markGroupAsVisited(groupId, userSummary);
    },

    unsubscribeFromGroup: (groupId) => {
        const unsubscribe = get().activeListeners[groupId];

        if (unsubscribe) {
            unsubscribe();
            set((state) => {
                const newListeners = { ...state.activeListeners };
                delete newListeners[groupId];
                return {
                    ...state,
                    activeListeners: newListeners,
                };
            });
        }
    },

    setGroups: (groups, fromCache = false) => {
        if ((!groups || groups.length === 0) && get().groups.length > 0 && fromCache) {
            // Do not wipe cached groups if an offline/local cache snapshot is empty
            return;
        }
        if (groups && groups.length > 0) {
            set({ groups });
            // When online, retrieve the last 15 messages for each group so offline mode is fully populated
            if (!fromCache) {
                const groupIds = groups.map(g => g.id).filter(Boolean);
                get().prefetchRecentMessagesForGroups(groupIds, 15);
            }
        } else if (!fromCache) {
            set({ groups: [] });
        }
    },

    prefetchRecentMessagesForGroups: async (groupIds: string[], limitCount = 15) => {
        if (!groupIds || groupIds.length === 0) return;

        if (Platform.OS !== 'web') {
            const network = await NetInfo.fetch();
            const isOnline = Boolean(network.isConnected && network.isInternetReachable);
            if (!isOnline) return;
        }

        try {
            const results = await Promise.all(
                groupIds.map(async (id) => {
                    const msgs = await GroupRepo.fetchRecentMessages(id, limitCount);
                    return { id, msgs };
                })
            );

            set((state) => {
                const nextMessagesByGroup = { ...state.messagesByGroup };
                results.forEach(({ id, msgs }) => {
                    if (msgs && msgs.length > 0) {
                        nextMessagesByGroup[id] = msgs;
                    }
                });
                return { messagesByGroup: nextMessagesByGroup };
            });
        } catch (err) {
            console.warn('[groupStoreCreator] prefetchRecentMessages error:', err);
        }
    },

    setMessagesByGroup: (groupId, messages) => set((state) => {
        const current = state.messagesByGroup[groupId];
        if (current === messages) {
            return state;
        }

        return {
            messagesByGroup: {
                ...state.messagesByGroup,
                [groupId]: messages,
            },
        };
    }),

    sendMessage: async (groupId, message) => {
        await GroupRepo.sendMessage(groupId, message);
    },

    markAsRead: async (groupId: string, message: Message, userSummary: IUserSummary) => {
        await GroupRepo.markMessageAsRead(groupId, message.id, userSummary);
    },

    createGroup: async (group: Group) => {
        try {
            set({ isLoading: true, error: null });
            await GroupRepo.writeGroup(group);
            set({
                isLoading: false,
                groups: upsertItem(get().groups, group),
            });
        } catch (error) {
            set({ isLoading: false, error: error instanceof Error ? error.message : "Failed to create group" });
            throw error;
        }
    },

    checkGroupExists: async (groupId: string): Promise<Group | null> => {
        try {
            const group = await GroupRepo.fetchGroup(groupId);
            return group;
        } catch (error) {
            console.log("Failed to check group existence:", error);
            throw error;
        }
    },

    joinGroup: async (group: Group, member: IGroupMember): Promise<void> => {
        try {
            set({ isLoading: true, error: null });
            const created = newGroup({
                ...group,
                members: [...(group.members || []), member],
                participantsIds: [...(group.participantsIds || []), member.id],
            });

            await GroupRepo.writeGroup(created);
            set({ isLoading: false });
        } catch (error) {
            set({ isLoading: false, error: error instanceof Error ? error.message : "Failed to join group" });
            console.log("Failed to join group:", error);
            throw error;
        }
    },
}));