import useLandingNavigation from "@/src/core/hook/navigation/useLandingNavigation";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useNotifyPermission } from "@/src/core/hook/user/useNotifyPermission";
import LandingScreen from "@/src/features/Auth/screens/LandingScreen";
import { Redirect } from "expo-router";
import LoadingScreen from "./loading";

export default function index() {
  console.log("index");
  
  useNotifyPermission();

  const { user, profile, isLoading } = useAuthHook();

  const { onLogIn, onSignUp, onPrivacy, onTerms } = useLandingNavigation();

  if (user) {
    if (!profile) return <LoadingScreen />;

    if (profile && profile.onBoardingComplete)
      return <Redirect href={"/(tabs)"} />;
    else return <Redirect href={"/(auth)/preference"} />;
  }

  // if(isLoading) return <LoadingScreen/>

  return (
    <LandingScreen
      onLogInPress={onLogIn}
      onSignUpPress={onSignUp}
      onPrivacyPress={onPrivacy}
      onTermsPress={onTerms}
    />
  );
}
