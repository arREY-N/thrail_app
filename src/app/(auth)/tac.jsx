import React from 'react';
import { View } from 'react-native';


import CustomLoading from "@/src/components/CustomLoading";
import useSignUp from "@/src/core/hook/auth/useSignUp";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import TACScreen from "@/src/features/Auth/screens/TACScreen";

export default function tac(){
    const { onBackPress } = useAppNavigation();
    
    const { 
        onAcceptPress,
        onDeclinePress,
        error,
        isLoading,
    } = useSignUp();

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
