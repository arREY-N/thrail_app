import React from 'react';
import { View } from 'react-native';


import CustomLoading from "@/src/components/CustomLoading";
import useSignUp from "@/src/core/hook/auth/useSignUp";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import TermsScreen from "@/src/features/Auth/screens/TermsScreen";

export default function tac(){
    const { onBackPress } = useAppNavigation();
    
    const { 
        onAcceptPress,
        onDeclinePress,
        error,
        isLoading,
    } = useSignUp();

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
