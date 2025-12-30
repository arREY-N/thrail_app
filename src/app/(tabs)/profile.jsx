import { auth } from '@/src/core/config/Firebase';
import { useRecommendation } from '@/src/core/context/RecommendationProvider';
import ProfileScreen from '@/src/features/Profile/screens/ProfileScreen';
import { signOut } from 'firebase/auth';
import React from 'react';

export default function profile(){
    const { resetRecommendations } = useRecommendation();

    const onSignOut = async () => {
        try{
            await signOut(auth);
            resetRecommendations();
        } catch (err) {
            console.error('Error:', err);
        }
    }

    return <ProfileScreen onSignOut={onSignOut}/>
}