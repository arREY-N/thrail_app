import { useAppNavigation } from '@/src/core/hook/useAppNavigation';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
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
    const reset = useAuthStore(s => s.reset);

    const onGmailSignUp = useAuthStore(s => s.gmailSignUp);
    const { onBackPress, onLogIn } = useAppNavigation();

    useEffect(() => {
        console.log("Loading State Changed:", isLoading);
    }, [isLoading]);

    useEffect(() => {
        reset();
    },[]);

    const onSignUpPress = async (email, password, username, confirmPassword) => {
        editAccount({
            email, 
            password, 
            username, 
            confirmPassword
        });   
        
        const validated = await validateSignUp();

        if(validated) {
            router.push('/(auth)/information');
        }
    }

    return (  
        <View style={{ flex: 1 }}>
            <SignUpScreen
                onSignUpPress={onSignUpPress} 
                onLogInPress={onLogIn} 
                onBackPress={onBackPress}
                onGmailSignUp={onGmailSignUp}
                error={error}
            />

            <CustomLoading 
                visible={isLoading} 
                message="Validating..." 
            />
        </View>
    )
}