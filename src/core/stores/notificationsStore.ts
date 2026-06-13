import { Notification } from "@/src/core/models/Notification/Notification";
import { NotificationRepository } from "@/src/core/repositories/notificationRepository";
import { useAuthStore } from "@/src/core/stores/authStores/authStore";
import { Unsubscribe } from "firebase/auth";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface NotificationState {
    notifications: Notification[];
    isLoading: boolean;

    subscribeToNotifications: () => Unsubscribe | null;
    readNotification: (notificationId: string) => Promise<void>;
    unsubscribe: Unsubscribe | null;
}

export const useNotificationsStore = create<NotificationState>()(
    immer((set, get) => ({
        notifications: [],
        isLoading: false,
        unsubscribe: null,

        subscribeToNotifications: () => {
            try {
                const { profile } = useAuthStore.getState();
    
                if(!profile)
                    throw new Error('User not found');
    
                const unsub = NotificationRepository.listenToNotifications(
                    profile.id,
                    (notifications) => set({
                        notifications
                    })
                )

                set({ unsubscribe: unsub });
                return unsub;
            } catch (error) {
                console.error("Failed to subscribe to notifications:", error);
                return null;
            }
        },

        readNotification: async (notificationId: string) =>  {
            try {
                set({ isLoading: true });

                const { profile } = useAuthStore.getState();

                const notification = get().notifications.find(n => n.id === notificationId);    

                if(notification && !notification.read){ 
                    notification.read = true;
                }
            
                if(!profile)
                    throw new Error('User not found');

                await NotificationRepository.readNotification(profile.id, notificationId);
            } catch (error) {
                console.error("Failed to read notification:", error);
                throw error;
            } finally {
                set({ isLoading: false });
            }
        },
    }))
)