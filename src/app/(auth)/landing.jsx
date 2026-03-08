import useLandingNavigation from '@/src/core/hook/navigation/useLandingNavigation';
import LandingScreen from '@/src/features/Auth/screens/LandingScreen';
import React from 'react';

export default function landing(){
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
            onTermsPress={onTerms}/>
    )
}