import { useRouter } from "expo-router";
import React from 'react';
import { View } from 'react-native';

import { useAuthStore } from "@/src/core/stores/authStore";

import CustomLoading from "@/src/components/CustomLoading";
import TACScreen from "@/src/features/Auth/screens/TACScreen";

export default function tac(){
    const router = useRouter();
    const error = useAuthStore(s => s.error);
    const isLoading = useAuthStore(s => s.isLoading);
    const signUp = useAuthStore(s => s.signUp);

    const onAcceptPress = async () => {
        await signUp();
    }

    const onDeclinePress = async () => {
        console.log('Alert user that this will cancel the whole process');
        router.replace('/(auth)/landing');
    }

    const onBackPress = () => {
        router.back();
    }

    return(
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <CustomLoading 
                visible={isLoading} 
                message="Creating account..." 
            />

            <TACScreen 
                onAcceptPress={onAcceptPress}
                onDeclinePress={onDeclinePress}
                error={error}
            />
        </View>
    )
}
