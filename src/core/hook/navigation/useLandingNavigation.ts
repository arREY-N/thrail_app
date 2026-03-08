import { router } from "expo-router";

export default function useLandingNavigation(){
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

    return {
        onLogIn,
        onSignUp,
        onPrivacy,
        onTerms,
    }
}