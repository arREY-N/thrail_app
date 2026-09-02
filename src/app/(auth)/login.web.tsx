import LoadingScreen from "@/src/app/loading";
import useLandingNavigation from "@/src/core/hook/navigation/useLandingNavigation";
import { useNotifyPermission } from "@/src/core/hook/useNotifyPermission";
import { useAuthHook } from "@/src/core/models/User/User";
import LogInScreen from "@/src/features/Auth/screens/LogInScreen";
import { useBreakpoints } from "@/src/hooks/useBreakpoints";
import { Redirect, useLocalSearchParams } from "expo-router";

export default function LogIn() {
	useNotifyPermission();

	const { isLargeScreen } = useBreakpoints();
	const { mode } = useLocalSearchParams<{
		mode?: "login" | "signup" | "forgot";
	}>();
	const { user, profile, isLoading } = useAuthHook();

	const { onLogIn, onPrivacy, onTerms } = useLandingNavigation();

	if (user) {
		if (!profile) return <LoadingScreen />;

		if (profile && profile.onBoardingComplete)
			return <Redirect href={"/(tabs)" as any} />;
		else return <Redirect href={"/(auth)/preference" as any} />;
	}

	if (isLoading) return <LoadingScreen />;

	if (!isLargeScreen && mode) {
		if (mode === "login") return <Redirect href="/(auth)/login" />;
		if (mode === "signup") return <Redirect href="/(auth)/signup" />;
		if (mode === "forgot") return <Redirect href="/(auth)/forgotPassword" />;
	}

	return (
		<LogInScreen
			onLogInPress={onLogIn as any}
			onSignUpPress={() => { }}
			error={""}
			onForgotPasswordPress={() => { }}
			onBackPress={() => { }}
			onRememberMePress={() => { }}
			remember={true}
			onGmailLogIn={() => { }}
			onTermsPress={onTerms}
			onPrivacyPress={onPrivacy}
		/>
	);
}
