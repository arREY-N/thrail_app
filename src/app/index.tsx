import useLandingNavigation from "@/src/core/hook/navigation/useLandingNavigation";
import { useAuthHook } from "@/src/core/models/User/User";

import LandingScreen from "@/src/features/Auth/screens/LandingScreen";
import { useBreakpoints } from "@/src/hooks/useBreakpoints";
import { Href, Redirect, router, useLocalSearchParams } from "expo-router";
import React from "react";
import SplashScreenView from "@/src/components/SplashScreenView";

export default function Index() {
	const { isLargeScreen } = useBreakpoints();
	const { mode } = useLocalSearchParams<{ mode?: 'login' | 'signup' | 'forgot' }>();
	const { user, profile } = useAuthHook();

	const {
		onOpenLogIn,
		onOpenSignUp,
		onPrivacy,
		onTerms
	} = useLandingNavigation();

	if (user) {
		if (!profile) return <SplashScreenView />;

		if (profile && profile.onBoardingComplete)
			return <Redirect href="/(app)/(tabs)" />;
		else
			return <Redirect href="/(auth)/preference" />;
	}

	if (!isLargeScreen && mode) {
		if (mode === 'login') return <Redirect href="/(auth)/login" />;
		if (mode === 'signup') return <Redirect href="/(auth)/signup" />;
		if (mode === 'forgot') return <Redirect href="/(auth)/forgotPassword" />;
	}

	return (
		<LandingScreen
			onLogInPress={onOpenLogIn}
			onSignUpPress={onOpenSignUp}
			onPrivacyPress={onPrivacy}
			onTermsPress={onTerms}
			initialMode={mode}
			onModeChange={(newMode) => {
				router.setParams({ mode: newMode });
			}}
			onBrandingLabPress={() => {
				router.push('/branding-preview' as Href);
			}}
		/>
	);
}
