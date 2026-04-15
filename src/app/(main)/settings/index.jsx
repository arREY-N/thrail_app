import { router } from 'expo-router';
import React from 'react';

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useProfileNavigation } from '@/src/core/hook/navigation/useProfileNavigation';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import SettingsScreen from '@/src/features/Profile/screens/SettingsScreen';

export default function settings() {
    const { profile } = useAuthHook();

    const { onBackPress } = useAppNavigation();

    const { 
        role, 
        onSignOutPress 
    } = useAuthHook();

    const {
        onAdminPress,
        onSuperadminPress,
        onApplyPress,
    } = useProfileNavigation();

    const onProfileInfoPress = () => {
        router.push(`/(main)/user/view?userId=${profile?.id}`);
    };

    return (
        <SettingsScreen
            role={role}
            onBackPress={onBackPress}
            onProfileInfoPress={onProfileInfoPress}
            onSignOutPress={onSignOutPress}
            onAdminPress={onAdminPress}
            onSuperadminPress={onSuperadminPress}
            onApplyPress={onApplyPress}
        />
    );
}