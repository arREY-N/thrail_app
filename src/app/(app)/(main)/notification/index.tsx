/**
 * @file index.tsx
 * @description Route controller for the user notifications list. Binds useNotifications hook
 * and useAppNavigation directly to NotificationScreen with real Firestore data.
 */

import React from 'react';

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useNotifications } from '@/src/core/models/Notification/Notification';
import { NotificationScreen } from '@/src/features/Notification/screens/NotificationScreen';

/**
 * Notification list route controller.
 */
export default function NotificationIndex(): React.JSX.Element {
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

