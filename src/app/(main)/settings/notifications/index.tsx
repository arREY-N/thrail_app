/**
 * @file index.tsx
 * @description Controller for the notifications settings page.
 */
import React from 'react';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import NotificationSettingsScreen from '@/src/features/Settings/screens/NotificationSettingsScreen';

/**
 * NotificationsPage coordinates notification preference toggles.
 */
export default function notifications() {
    const { onBackPress } = useAppNavigation();
    
    // TODO: [Backend] Retrieve initial notification preferences from user profile
    const masterPush = true;
    const weatherCyclone = true;
    const trailHazards = true;
    const bookingStatus = true;
    const rescheduleCancel = true;
    const payments = true;
    const groupChats = true;
    const mountainPackages = true;

    const handleToggleMasterPush = (value: boolean) => {
        // TODO: [Backend] Handle updating master push notifications toggle state in Firestore
        console.log('Master push setting changed:', value);
    };

    const handleToggleWeatherCyclone = (value: boolean) => {
        // TODO: [Backend] Handle updating weather & cyclone alerts toggle state in Firestore
        console.log('Weather cyclone setting changed:', value);
    };

    const handleToggleTrailHazards = (value: boolean) => {
        // TODO: [Backend] Handle updating trail hazards toggle state in Firestore
        console.log('Trail hazards setting changed:', value);
    };

    const handleToggleBookingStatus = (value: boolean) => {
        // TODO: [Backend] Handle updating booking status toggle state in Firestore
        console.log('Booking status setting changed:', value);
    };

    const handleToggleRescheduleCancel = (value: boolean) => {
        // TODO: [Backend] Handle updating reschedule & cancellation alert toggle state in Firestore
        console.log('Reschedule cancel setting changed:', value);
    };

    const handleTogglePayments = (value: boolean) => {
        // TODO: [Backend] Handle updating payment notifications toggle state in Firestore
        console.log('Payments setting changed:', value);
    };

    const handleToggleGroupChats = (value: boolean) => {
        // TODO: [Backend] Handle updating coordination chats toggle state in Firestore
        console.log('Group chats setting changed:', value);
    };

    const handleToggleMountainPackages = (value: boolean) => {
        // TODO: [Backend] Handle updating mountain packages toggle state in Firestore
        console.log('Mountain packages setting changed:', value);
    };
    
    return (
        <NotificationSettingsScreen 
            onBackPress={onBackPress}
            masterPush={masterPush}
            weatherCyclone={weatherCyclone}
            trailHazards={trailHazards}
            bookingStatus={bookingStatus}
            rescheduleCancel={rescheduleCancel}
            payments={payments}
            groupChats={groupChats}
            mountainPackages={mountainPackages}
            onToggleMasterPush={handleToggleMasterPush}
            onToggleWeatherCyclone={handleToggleWeatherCyclone}
            onToggleTrailHazards={handleToggleTrailHazards}
            onToggleBookingStatus={handleToggleBookingStatus}
            onToggleRescheduleCancel={handleToggleRescheduleCancel}
            onTogglePayments={handleTogglePayments}
            onToggleGroupChats={handleToggleGroupChats}
            onToggleMountainPackages={handleToggleMountainPackages}
        />
    );
}
