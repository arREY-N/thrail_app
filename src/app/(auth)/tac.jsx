import { useRouter } from "expo-router";
import React from 'react';
import { View } from 'react-native';

import { useAuthStore } from "@/src/core/stores/authStore";

import CustomLoading from "@/src/components/CustomLoading";
import TermsScreen from "@/src/features/Auth/screens/TermsScreen";

export default function tac(){
    const router = useRouter();
    const error = useAuthStore(s => s.error);
    const isLoading = useAuthStore(s => s.isLoading);
    const signUp = useAuthStore(s => s.signUp);

    const onAcceptPress = async () => {
        await signUp();
        // console.log('GO TO PREFERENCE!');
        // return <Redirect href={'/(auth)/preference'}/>
    }

    const onDeclinePress = async () => {
        console.log('Alert user that this will cancel the whole process');
        router.replace('/(auth)/landing');
    }

    const onBackPress = () => {
        router.back();
    }

    return(
        <View style={{ flex: 1 }}>
            <CustomLoading visible={isLoading} message="Creating account..." />

            <TermsScreen 
                onAcceptPress={onAcceptPress}
                onDeclinePress={onDeclinePress}
                onBackPress={onBackPress}
                error={error}
            />
        </View>
    )
}
