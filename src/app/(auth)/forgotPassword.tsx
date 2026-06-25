import React from 'react';
import { View } from 'react-native';
import { Redirect, router } from 'expo-router';

import CustomLoading from "@/src/components/CustomLoading";
import { useForgotPassword } from "@/src/core/hook/user/useForgotPassword";
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import ForgotPasswordScreen from "@/src/features/Auth/screens/ForgotPasswordScreen";

export default function forgotPassword(){
    const { isLargeScreen } = useBreakpoints();
    const controller = useForgotPassword();

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            controller.onLanding();
        }
    };

    if (isLargeScreen) {
        return <Redirect href="/(auth)/landing?mode=forgot" />;
    }

    return (
        <View style={{ flex: 1 }}>
            <ForgotPasswordScreen
                onSendResetEmail={controller.onSendResetEmail}
                error={controller.error}
                success={controller.success}
                onLogIn={controller.onLogIn}
                onBackPress={handleBack}
            />

            <CustomLoading 
                message="Sending reset email..."
                visible={controller.loading}            
            />
        </View>
    );
}