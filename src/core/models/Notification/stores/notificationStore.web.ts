import { NotificationState, notificationStoreCreator } from "@/src/core/models/Notification/stores/notificationStoreCreator";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const useNotificationStore = create<NotificationState>()(
    immer(notificationStoreCreator)
);

export const useNotificationsStore = useNotificationStore;
