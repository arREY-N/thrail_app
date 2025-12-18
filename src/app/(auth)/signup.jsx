import { signUp } from '@/src/core/FirebaseAuthUtil';
import SignUpScreen from '@/src/features/Auth/screens/SignUpScreen';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';

export default function signup(){
    const router = useRouter();
    const [error, setError] = useState(null);

    const onSignUp = async (email, username, password, confirmPassword) => {
        setError(null);
        try{
            if(!email || !username || !password || !confirmPassword){
                throw new Error('Please fill up all the necessary information.')
            }

            if(password !== confirmPassword){
                throw new Error('Password does not match')
            }

            const user = await signUp(email, password, username);
            
            if(!user) {
                throw new Error('Sign up failed.');
            }

            router.replace('/(auth)/information');
        } catch (err) {
            console.error('Sign up error:', err.message)
            setError(err.message);
        }
    }

    const onLogIn = () => {
        router.replace('/(auth)/login');
    }

    const onBackPress = () => {
        router.back();
    }

    const onGmailSignUp = async () => {
        setError('Function to be added soon.');
    }
    
    return (
        <SignUpScreen 
            onSignUp={onSignUp} 
            onLogin={onLogIn} 
            onBackPress={onBackPress}
            onGmailSignUp={onGmailSignUp}
            error={error}/>
    )
}