import LandingScreen from "@/src/features/Auth/screens/LandingScreen";
import { Redirect, useRouter } from "expo-router";
import { useAuthStore } from "../core/stores/authStore";
import LoadingScreen from "./loading";

export default function index() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const role = useAuthStore((s) => s.role);
  const isLoading = useAuthStore((s) => s.isLoading);

  const onLogIn = () => {
    router.push("/(auth)/login");
  };

  const onSignUp = () => {
    router.push("/(auth)/signup");
  };

  const onPrivacy = () => {
    router.push("/(auth)/privacy");
  };

  const onTerms = () => {
    router.push("/(auth)/terms");
  };

  if (isLoading) return <LoadingScreen />;

  if (user) {
    if (!profile) return <LoadingScreen />;

    if (profile && profile.onBoardingComplete)
      return <Redirect href={"/(tabs)"} />;
    else return <Redirect href={"/(auth)/preference"} />;
  }

  return (
    <LandingScreen
      onLogInPress={onLogIn}
      onSignUpPress={onSignUp}
      onPrivacyPress={onPrivacy}
      onTermsPress={onTerms}
    />
  );
}
