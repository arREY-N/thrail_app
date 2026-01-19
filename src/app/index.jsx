import { useRootNavigationState, useRouter } from "expo-router";
import { useEffect } from "react";
import { useAuthStore } from "../core/stores/authStore";
import LoadingScreen from "./loading";
import LandingScreen from '@/src/features/Auth/screens/LandingScreen';

export default function index() {
    const router = useRouter();

    const onLogIn = () => {
        router.push('/(auth)/login');
    }

    const onSignUp = () => {
        router.push('/(auth)/signup');
    }
    
    const onPrivacy = () => {
        router.push('/(auth)/privacy');
    }

    const onTerms = () => {
        router.push('/(auth)/terms')
    }

    return (
        <LandingScreen 
            onLogInPress={onLogIn} 
            onSignUpPress={onSignUp}
            onPrivacyPress={onPrivacy}
            onTermsPress={onTerms}/>
    )
}
