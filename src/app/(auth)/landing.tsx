import React from 'react';
import { useLocalSearchParams, Redirect, router } from 'expo-router';
import useLandingNavigation from '@/src/core/hook/navigation/useLandingNavigation';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import LandingScreen from '@/src/features/Auth/screens/LandingScreen';

export default function Landing() {
    const { isLargeScreen } = useBreakpoints();
    const { mode } = useLocalSearchParams<{ mode?: 'login' | 'signup' | 'forgot' }>();
    const { 
        onLogIn, 
        onSignUp,
        onPrivacy,
        onTerms
    } = useLandingNavigation();

    if (!isLargeScreen && mode) {
        if (mode === 'login') {
            return <Redirect href="/(auth)/login" />;
        }
        if (mode === 'signup') {
            return <Redirect href="/(auth)/signup" />;
        }
        if (mode === 'forgot') {
            return <Redirect href="/(auth)/forgotPassword" />;
        }
    }

    return (
        <LandingScreen 
            onLogInPress={onLogIn} 
            onSignUpPress={onSignUp}
            onPrivacyPress={onPrivacy}
            onTermsPress={onTerms}
            initialMode={mode}
            onModeChange={(newMode) => {
                router.setParams({ mode: newMode });
            }}
        />
    );
}
