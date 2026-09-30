/**
 * @file login.tsx
 * @description Route controller for the native mobile authentication login flow.
 */

import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import CustomLoading from '@/src/components/CustomLoading';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import useLandingNavigation from '@/src/core/hook/navigation/useLandingNavigation';
import { useAuthHook } from '@/src/core/models/User/User';
import LogInScreen from '@/src/features/Auth/screens/LogInScreen';

/**
 * Controller managing the native mobile log-in screen state and authentication actions.
 *
 * @returns {React.JSX.Element} The rendered login controller view.
 */
export default function Login() {
    const {
        onLanding,
        onSignUpPress,
    } = useAppNavigation();

    const {
        onPrivacy,
        onTerms,
    } = useLandingNavigation();

    // TODO(backend): Deprecate and remove "remember" and "onRememberMePress" from useAuthHook & authStore.
    // The frontend no longer renders or uses "Remember Me" functionality.
    const {
        error,
        reset,
        onLogIn,
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

    return (
        <View style={styles.container}>
            <LogInScreen
                onLogInPress={onLogIn}
                onSignUpPress={onSignUpPress}
                error={error}
                onForgotPasswordPress={onForgotPassword}
                onBackPress={handleBack}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
