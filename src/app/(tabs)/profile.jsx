import React from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '@/src/core/config/Firebase';
import ProfileScreen from '@/src/features/Profile/screens/ProfileScreen';

export default function profile(){
    const onSignOut = () => {
        signOut(auth);
    }

    return <ProfileScreen onSignOut={onSignOut}/>
}