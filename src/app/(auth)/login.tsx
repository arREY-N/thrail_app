import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import CustomLoading from '@/src/components/CustomLoading';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import useLandingNavigation from '@/src/core/hook/navigation/useLandingNavigation';
import { useAuthHook } from '@/src/core/models/User/User';
import LogInScreen from '@/src/features/Auth/screens/LogInScreen';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

export default function Login() {
    console.log('inside login.tsx');
    const { isLargeScreen } = useBreakpoints();

    const {
        onLanding,
        onSignUpPress
    } = useAppNavigation();

    const {
        onLogIn,
        onPrivacy,
        onTerms
    } = useLandingNavigation();

    const {
        error,
        remember,
        reset,
        onRememberMePress,
        onForgotPassword,
        onGmailLogIn,
        isLoading,
    } = useAuthHook();

    useEffect(() => {
        reset();
    }, [reset]);

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            onLanding();
        }
    };

    console.log('in here')

    return (
        <View style={{ flex: 1 }}>
            <LogInScreen
                onLogInPress={onLogIn}
                onSignUpPress={onSignUpPress}
                error={error}
                onForgotPasswordPress={onForgotPassword}
                onBackPress={handleBack}
                onRememberMePress={onRememberMePress}
                remember={remember}
                onGmailLogIn={onGmailLogIn}
                onTermsPress={onTerms}
                onPrivacyPress={onPrivacy}
            />

            <CustomLoading
                visible={isLoading}
                message="Signing in..."
            />
        </View>
    );
}
