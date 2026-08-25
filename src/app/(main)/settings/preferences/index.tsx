/**
 * @file index.tsx
 * @description Controller for the Hiking Preferences settings page.
 */
import LoadingScreen from '@/src/app/loading';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import useUser from '@/src/core/hook/user/useUser';
import HikingPreferencesScreen from '@/src/features/Settings/screens/HikingPreferencesScreen';
import React from 'react';

/**
 * PreferencesPage coordinates fetching and displaying user hiking preferences.
 */
export default function preferences() {
    const { onBackPress } = useAppNavigation();
    const { role, profile } = useAuthHook();
    
    const { user, isLoading } = useUser({ role, id: profile?.id });

    if (isLoading || !user) {
        return <LoadingScreen />;
    }

    const onEditPress = () => {
        // TODO: [Backend] Implement navigation or logic for editing preferences
    };

    return (
        <HikingPreferencesScreen 
            onBackPress={onBackPress}
            onEditPress={onEditPress}
            preferences={user.preferences}
        />
    );
}
