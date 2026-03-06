import { useAuthStore } from '@/src/core/stores/authStore';
import { useRouter } from 'expo-router';
import React from 'react';

import ProfileScreen from '@/src/features/Profile/screens/ProfileScreen';


export default function profile(){
    const router = useRouter();
    const role = useAuthStore(s => s.role);

    const signOut = useAuthStore(s => s.signOut);
    const profile = useAuthStore(s => s.profile);

    async function onSignOutPress(){
        await signOut();
    }

    function onApplyPress(){
        router.push('/(main)/business/apply');
    }

    function onAdminPress(){
        router.push('/(main)/admin')
    }
    
    function onSuperadminPress() {
        router.push('/(main)/superadmin');
    }

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