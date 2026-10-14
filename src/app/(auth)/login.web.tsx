/**
 * @file login.web.tsx
 * @description Route controller for the web browser authentication login flow.
 */

import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import LoadingScreen from '@/src/app/loading';
import CustomLoading from '@/src/components/CustomLoading';
import useLandingNavigation from '@/src/core/hook/navigation/useLandingNavigation';
import { useNotifyPermission } from '@/src/core/hook/useNotifyPermission';
import { useAuthHook } from '@/src/core/models/User/User';
import LogInScreen from '@/src/features/Auth/screens/LogInScreen';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

/**
 * Controller managing the web browser log-in screen state, responsive redirects, and authentication actions.
 *
 * @returns {React.JSX.Element} The rendered web login controller view.
 */
export default function Login() {
    useNotifyPermission();

    const { isLargeScreen } = useBreakpoints();
    const { mode } = useLocalSearchParams<{
        mode?: 'login' | 'signup' | 'forgot';
    }>();
    const {
        onBackToLanding,
        onSwitchToSignUp,
        onForgotPassword,
        onPrivacy,
        onTerms,
    } = useLandingNavigation();

    const {
        user,
        profile,
        reset,
        onLogIn,
        onGmailLogIn,
        error,
        isLoading,
    } = useAuthHook();

    useEffect(() => {
        reset();
    }, [reset]);

    if (user) {
        if (!profile) return <LoadingScreen />;

        if (profile.onBoardingComplete) {
            return <Redirect href="/(app)/(tabs)" />;
        }
        return <Redirect href="/(auth)/preference" />;
    }

    if (!isLargeScreen && mode) {
        if (mode === 'login') return <Redirect href="/(auth)/login" />;
        if (mode === 'signup') return <Redirect href="/(auth)/signup" />;
        if (mode === 'forgot') return <Redirect href="/(auth)/forgotPassword" />;
    }

    return (
        <View style={styles.container}>
            <LogInScreen
                onLogInPress={onLogIn}
                onSignUpPress={onSwitchToSignUp}
                error={error}
                onForgotPasswordPress={onForgotPassword}
                onBackPress={onBackToLanding}
                onGmailLogIn={onGmailLogIn}
                onTermsPress={onTerms}
                onPrivacyPress={onPrivacy}
                isLoading={isLoading}
            />

            <CustomLoading
                visible={isLoading}
                message="Signing in..."
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
