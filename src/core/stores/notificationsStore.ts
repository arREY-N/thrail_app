import { Notification } from "@/src/core/models/Notification/Notification";
import { NotificationRepository } from "@/src/core/repositories/notificationRepository";
import { useAuthStore } from "@/src/core/stores/authStores/authStore";
import { Unsubscribe } from "firebase/firestore";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface NotificationState {
    notifications: Notification[];
    isLoading: boolean;

    subscribeToNotifications: () => Unsubscribe | null;
    unsubscribeFromNotifications: () => void;
    readNotification: (notificationId: string) => Promise<void>;
}

let activeNotificationsUnsubscribe: Unsubscribe | null = null;

export const useNotificationsStore = create<NotificationState>()(
    immer((set, get) => ({
        notifications: [],
        isLoading: false,

        subscribeToNotifications: () => {
            if (activeNotificationsUnsubscribe) {
                activeNotificationsUnsubscribe();
                activeNotificationsUnsubscribe = null;
            }

            try {
                const { profile } = useAuthStore.getState();

                if (!profile) {
                    throw new Error('User not found');
                }

                const unsub = NotificationRepository.listenToNotifications(
                    profile.id,
                    (notifications) => set({
                        notifications
                    })
                );

                activeNotificationsUnsubscribe = unsub;
                return () => {
                    if (activeNotificationsUnsubscribe === unsub) {
                        activeNotificationsUnsubscribe();
                        activeNotificationsUnsubscribe = null;
                    } else {
                        unsub();
                    }
                };
            } catch (error) {
                console.error("Failed to subscribe to notifications:", error);
                return null;
            }
        },

        unsubscribeFromNotifications: () => {
            if (activeNotificationsUnsubscribe) {
                activeNotificationsUnsubscribe();
                activeNotificationsUnsubscribe = null;
            }
        },

        readNotification: async (notificationId: string) => {
            const targetNotification = get().notifications.find(n => n.id === notificationId);

            if (!targetNotification || targetNotification.read) {
                return;
            }

            // Optimistic update
            set((state) => {
                const notif = state.notifications.find(n => n.id === notificationId);
                if (notif) {
                    notif.read = true;
                }
                state.isLoading = true;
            });

            try {
                const { profile } = useAuthStore.getState();

                if (!profile) {
                    throw new Error('User not found');
                }

                await NotificationRepository.readNotification(profile.id, notificationId);
            } catch (error) {
                console.error("Failed to read notification:", error);
                // Rollback optimistic update on error
                set((state) => {
                    const notif = state.notifications.find(n => n.id === notificationId);
                    if (notif) {
                        notif.read = false;
                    }
                });
                throw error;
            } finally {
                set({ isLoading: false });
            }
        },
    }))
)