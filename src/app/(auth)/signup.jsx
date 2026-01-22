import { useAppNavigation } from '@/src/core/hook/useAppNavigation';
import { useAuthStore } from '@/src/core/stores/authStore';
import SignUpScreen from '@/src/features/Auth/screens/SignUpScreen';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
 
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
        reset();
    },[]);

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

    return (  
        <View>
            { isLoading && <Text>Loading</Text> }

            <SignUpScreen
                onSignUpPress={onSignUpPress} 
                onLogInPress={onLogIn} 
                onBackPress={onBackPress}
                onGmailSignUp={onGmailSignUp}
                error={error}
                isLoading={isLoading}/>
        </View>
    )
}