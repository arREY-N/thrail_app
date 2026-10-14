import { NotificationState, notificationStoreCreator } from "@/src/core/models/Notification/stores/notificationStoreCreator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useNotificationStore = create<NotificationState>()(
    persist(
        immer(notificationStoreCreator),
        {
            name: "notification-storage",
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

export const useNotificationsStore = useNotificationStore;
