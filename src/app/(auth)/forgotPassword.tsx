import React from 'react';
import { View } from 'react-native';

import CustomLoading from "@/src/components/CustomLoading";
import { useForgotPassword } from "@/src/core/hook/user/useForgotPassword";
import ForgotPasswordScreen from "@/src/features/Auth/screens/ForgotPasswordScreen";

export default function forgotPassword(){
    const controller = useForgotPassword();

    return (
        <View style={{ flex: 1 }}>
            <ForgotPasswordScreen
                onSendResetEmail={controller.onSendResetEmail}
                error={controller.error}
                success={controller.success}
                onLogIn={controller.onLogIn}
                onBackPress={controller.onBackPress}
            />

            <CustomLoading 
                message="Sending reset email..."
                visible={controller.loading}            
            />
        </View>
    );
}