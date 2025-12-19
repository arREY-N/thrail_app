import { useAccount } from '@/src/core/context/AccountProvider';
import { saveSignUp } from '@/src/core/domain/authDomain';
import SignUpScreen from '@/src/features/Auth/screens/SignUpScreen';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
 
export default function signup(){
    const router = useRouter();
    const [error, setError] = useState(null);
    const { setAccount } = useAccount();
    
    const onSignUpPress = async (email, password, username, confirmPassword) => {
        setError(null);
        try{
            saveSignUp(
                email, 
                password, 
                username, 
                confirmPassword,
                setAccount,
            );
            router.push('/(auth)/information');
        } catch (err) {
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
            onSignUpPress={onSignUpPress} 
            onLogInPress={onLogIn} 
            onBackPress={onBackPress}
            onGmailSignUp={onGmailSignUp}
            error={error}/>
    )
}