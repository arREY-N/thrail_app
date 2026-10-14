import { router } from "expo-router";

export default function useLandingNavigation() {
    // onOpen: Navigates to the specified screen without replacing the current screen.
    const onOpenLogIn = () => {
        router.push('/(auth)/login');
    };

    const onOpenSignUp = () => {
        router.push('/(auth)/signup');
    };

    // onSwitch: Navigates to the specified screen replacing the current screen.
    const onSwitchToSignUp = () => {
        router.replace('/(auth)/signup');
    };

    const onSwitchToLogIn = () => {
        router.replace('/(auth)/login');
    };

    // onBack: Navigates back to the landing page, replacing the current screen.
    const onBackToLanding = () => {
        router.replace('/(auth)/landing');
    };

    const onForgotPassword = () => {
        router.push('/(auth)/forgotPassword');
    };

    const onPrivacy = () => {
        router.push('/(auth)/privacy');
    };

    const onTerms = () => {
        router.push('/(auth)/terms');
    };

    return {
        onOpenLogIn,
        onOpenSignUp,
        onSwitchToSignUp,
        onSwitchToLogIn,
        onBackToLanding,
        onForgotPassword,
        onPrivacy,
        onTerms,
    };
}
