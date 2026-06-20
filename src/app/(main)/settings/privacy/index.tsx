/**
 * @file index.tsx
 * @description Controller for the privacy & permissions settings page.
 */
import React from 'react';

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import PrivacyPermissionsScreen from '@/src/features/Settings/screens/PrivacyPermissionsScreen';

/**
 * PrivacyPage coordinates user profile privacy and hardware permissions settings.
 */
export default function privacy() {
    const { onBackPress } = useAppNavigation();
    
    // TODO: [Backend] Retrieve initial privacy preferences from user profile
    const publicProfile = true;
    const shareStats = true;
    const activityStatus = true;

    const handleTogglePublicProfile = (value: boolean) => {
        // TODO: [Backend] Handle updating public profile privacy setting in Firestore
        console.log('Toggle public profile:', value);
    };

    const handleToggleShareStats = (value: boolean) => {
        // TODO: [Backend] Handle updating share hiking stats privacy setting in Firestore
        console.log('Toggle share stats:', value);
    };

    const handleToggleActivityStatus = (value: boolean) => {
        // TODO: [Backend] Handle updating activity status privacy setting in Firestore
        console.log('Toggle activity status:', value);
    };
    
    return (
        <PrivacyPermissionsScreen 
            onBackPress={onBackPress}
            publicProfile={publicProfile}
            shareStats={shareStats}
            activityStatus={activityStatus}
            onTogglePublicProfile={handleTogglePublicProfile}
            onToggleShareStats={handleToggleShareStats}
            onToggleActivityStatus={handleToggleActivityStatus}
        />
    );
}
