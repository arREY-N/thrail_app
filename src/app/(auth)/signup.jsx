import React from 'react'
import { signUp } from '@/src/core/FirebaseAuthUtil';
import SignUpScreen from '@/src/features/Auth/screens/SignUpScreen';

export default function signup(){ 
    const onSignUp = (email, password) => {
        signUp(email, password);
    }

    return <SignUpScreen onSignUp={onSignUp}/>
}