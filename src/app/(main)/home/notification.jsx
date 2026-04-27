import React from "react";

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useNotifications } from "@/src/core/hook/notification/useNotification";
import NotificationScreen from '@/src/features/Home/screens/NotificationScreen';

export default function notification() {
    const { onBackPress } = useAppNavigation();
    
    const {
        notifications,
        onViewNotification,
    } = useNotifications();
    
    return (
        <NotificationScreen 
            notifications={notifications}
            onBackPress={onBackPress}
            onPressItem={onViewNotification}
        />
    );
}