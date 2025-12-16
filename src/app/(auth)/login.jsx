import React from 'react'
import { logIn } from '@/src/core/FirebaseAuthUtil'
import LogInScreen from '@/src/features/Auth/screens/LogInScreen';

export default function login(){
    const onLogIn = (email, password) => {
        logIn(email, password)
    }

    return (
        <LogInScreen onLogIn={onLogIn}/>
    )
}