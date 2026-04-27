import { Notification } from "@/src/core/models/Notification/Notification";
import { NotificationRepository } from "@/src/core/repositories/notificationRepository";
import { useAuthStore } from "@/src/core/stores/authStore";
import { Unsubscribe } from "firebase/auth";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface NotificationState {
    notifications: Notification[];
    isLoading: boolean;

    subscribeToNotifications: () => Unsubscribe;
    readNotification: (notificationId: string) => Promise<void>;

}

export const useNotificationsStore = create<NotificationState>()(
    immer((set, get) => ({
        notifications: [],
        isLoading: false,
        
        subscribeToNotifications: () => {
            const { profile } = useAuthStore.getState();

            if(!profile)
                throw new Error('User not found');

            return NotificationRepository.listenToNotifications(
                profile.id,
                (notifications) => set({
                    notifications
                })
            )
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