import React from 'react';

import ProfileScreen from '@/src/features/Profile/screens/ProfileScreen';

import { useProfileNavigation } from '@/src/core/hook/navigation/useProfileNavigation';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';

export default function profile(){
    const {
        profile,
        role,
        onSignOutPress,
    } = useAuthHook();

    const {
        onAdminPress,
        onSuperadminPress,
        onViewAccountPress,
        onApplyPress,
    } = useProfileNavigation();

    return (
        <ProfileScreen
            onSignOutPress={onSignOutPress}
            onApplyPress={onApplyPress}
            onAdminPress={onAdminPress}
            onSuperadminPress={onSuperadminPress}
            profile={profile}
            role={role}
        />
    );
}