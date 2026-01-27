import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { useAuthStore } from '@/src/core/stores/authStore';

import CustomLoading from '@/src/components/CustomLoading';
import SignUpScreen from '@/src/features/Auth/screens/SignUpScreen';
 
export default function signup(){
    const router = useRouter();
    const error = useAuthStore(s => s.error)
    const validateSignUp = useAuthStore(s => s.validateSignUp);
    const editAccount = useAuthStore(s => s.editAccount);
    const isLoading = useAuthStore(s => s.isLoading);

    const onSignUpPress = async (email, password, username, confirmPassword) => {
        editAccount({
            email, 
            password, 
            username, 
            confirmPassword
        })    
        
        const validated = await validateSignUp();
        if(validated) router.push('/(auth)/information');
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
        <View style={{ flex: 1 }}>
            <CustomLoading visible={isLoading} message="Validating..." />

            <SignUpScreen
                onSignUpPress={onSignUpPress} 
                onLogInPress={onLogIn} 
                onBackPress={onBackPress}
                onGmailSignUp={onGmailSignUp}
                error={error}
            />
        </View>
    )
}