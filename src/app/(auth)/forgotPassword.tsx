import { Redirect } from 'expo-router';
import { View } from 'react-native';

import CustomLoading from "@/src/components/CustomLoading";
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useForgotPassword } from "@/src/core/hook/user/useForgotPassword";
import ForgotPasswordScreen from "@/src/features/Auth/screens/ForgotPasswordScreen";
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

export default function ForgotPassword() {
    const { isLargeScreen } = useBreakpoints();
    const { onBackPress } = useAppNavigation();

    const controller = useForgotPassword();

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
                onBackPress={onBackPress}
            />

            <CustomLoading
                message="Sending reset email..."
                visible={controller.loading}
            />
        </View>
    );
}