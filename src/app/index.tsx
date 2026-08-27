import useLandingNavigation from "@/src/core/hook/navigation/useLandingNavigation";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useNotifyPermission } from "@/src/core/hook/user/useNotifyPermission";
import LandingScreen from "@/src/features/Auth/screens/LandingScreen";
import { useBreakpoints } from "@/src/hooks/useBreakpoints";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import LoadingScreen from "./loading";

export default function Index() {
	useNotifyPermission();

	const { isLargeScreen } = useBreakpoints();
	const { mode } = useLocalSearchParams<{ mode?: 'login' | 'signup' | 'forgot' }>();
	const { user, profile, isLoading } = useAuthHook();

	const { onLogIn, onSignUp, onPrivacy, onTerms } = useLandingNavigation();

	if (user) {
		if (!profile) return <LoadingScreen />;

		if (profile && profile.onBoardingComplete)
			return <Redirect href={"/(tabs)" as any} />;
		else
			return <Redirect href={"/(auth)/preference" as any} />;
	}

	if (isLoading) return <LoadingScreen />

	if (!isLargeScreen && mode) {
		if (mode === 'login') return <Redirect href="/(auth)/login" />;
		if (mode === 'signup') return <Redirect href="/(auth)/signup" />;
		if (mode === 'forgot') return <Redirect href="/(auth)/forgotPassword" />;
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