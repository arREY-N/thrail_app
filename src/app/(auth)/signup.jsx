import { useAccount } from '@/src/core/context/AccountProvider';
import { validateSignUp } from '@/src/core/domain/authDomain';
import SignUpScreen from '@/src/features/Auth/screens/SignUpScreen';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
 
export default function signup(){
    const router = useRouter();
    const [error, setError] = useState(null);
    const { account, updateAccount } = useAccount();
    
    const onSignUpPress = (email, password, username, confirmPassword) => {
        setError(null);
        try{ 
            validateSignUp(email, password, username, confirmPassword);

            updateAccount({
                email, 
                password, 
                username, 
                confirmPassword,
            });

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
        // account={account} add account props to handle auto fill  
        <SignUpScreen
            onSignUpPress={onSignUpPress} 
            onLogInPress={onLogIn} 
            onBackPress={onBackPress}
            onGmailSignUp={onGmailSignUp}
            error={error}/>
    )
}