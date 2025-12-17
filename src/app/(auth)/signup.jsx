import { signUp } from '@/src/core/FirebaseAuthUtil';
import SignUpScreen from '@/src/features/Auth/screens/SignUpScreen';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';

export default function signup(){
    const router = useRouter();
    const [error, setError] = useState(null);

    const onSignUp = async (email, password) => {
        setError(null);
        try{
            await signUp(email, password);
            router.replace('(auth)/preference');
        } catch (err) {
            console.error('Sign up error:', err.message)
            setError(err.message);
        }
    }

    return <SignUpScreen onSignUp={onSignUp}/>
}