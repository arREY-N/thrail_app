import { useAuthStore } from '@/src/core/stores/authStore';
import { useRouter } from 'expo-router';
import React from 'react';

import ProfileScreen from '../../features/Profile/screens/ProfileScreen';

export default function profile(){
    const router = useRouter();

    const signOut = useAuthStore(s => s.signOut);
    const profile = useAuthStore(s => s.profile);

    const onSignOutPress = async () => {
        await signOut();
        // resetData();
    }

    const onApplyPress = () => {
        console.log('Apply');
        router.push('/(business)/apply');
    }

    return (
        <ProfileScreen
            onSignOutPress={onSignOutPress}
            onApplyPress={onApplyPress}
            profile={profile}
        />
    )
}