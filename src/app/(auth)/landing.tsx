import React from 'react';
import useLandingNavigation from '@/src/core/hook/navigation/useLandingNavigation';
import LandingScreen from '@/src/features/Auth/screens/LandingScreen';

export default function Landing() {
    const { 
        onLogIn, 
        onSignUp,
        onPrivacy,
        onTerms
    } = useLandingNavigation();

    return (
        <LandingScreen 
            onLogInPress={onLogIn} 
            onSignUpPress={onSignUp}
            onPrivacyPress={onPrivacy}
            onTermsPress={onTerms}
        />
    );
}
