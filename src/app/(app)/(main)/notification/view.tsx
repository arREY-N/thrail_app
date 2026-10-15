/**
 * @file view.tsx
 * @description Controller route for viewing notification details.
 * Binds useViewNotification hook directly to NotificationDetailScreen with real Firestore data.
 */

import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useViewNotification } from '@/src/core/models/Notification/Notification';
import getSearchParam from '@/src/core/utility/getSearchParam';
import { NotificationDetailScreen } from '@/src/features/Notification/screens/NotificationDetailScreen';

export default function ViewNotification(): React.JSX.Element {
    const { onBackPress } = useAppNavigation();
    const { notificationId: rawId } = useLocalSearchParams();
    const notificationId = getSearchParam(rawId);

    const { notification } = useViewNotification(notificationId);

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <NotificationDetailScreen
                notification={notification}
                onBackPress={onBackPress}
            />
        </>
    );
}