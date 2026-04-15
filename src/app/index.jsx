import useLandingNavigation from "@/src/core/hook/navigation/useLandingNavigation";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useNotifyPermission } from "@/src/core/hook/user/useNotifyPermission";
import computeTotalLength from "@/src/core/models/Trail/logic/TrailComputation";
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
		else 
			return <Redirect href={"/(auth)/preference"} />;
	}

	const result = computeTotalLength(sampleTrail);

	console.log(result);

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


const sampleTrail = [
  { latitude: 14.6701792, longitude: 121.3207761, altitude: 443.0 },
  { latitude: 14.6700174, longitude: 121.3210576, altitude: 438.0 },
  { latitude: 14.6699949, longitude: 121.3210968, altitude: 453.0 },
  { latitude: 14.669881, longitude: 121.321278, altitude: 453.0 },
  { latitude: 14.6698832, longitude: 121.3213595, altitude: 453.0 },
  { latitude: 14.669962, longitude: 121.3213799, altitude: 453.0 },
  { latitude: 14.6701965, longitude: 121.3213867, altitude: 438.0 },
  { latitude: 14.6703257, longitude: 121.3214931, altitude: 438.0 },
  { latitude: 14.670449, longitude: 121.3215322, altitude: 438.0 },
  { latitude: 14.6705974, longitude: 121.3215792, altitude: 438.0 },
  { latitude: 14.6705711, longitude: 121.3216811, altitude: 442.0 },
  { latitude: 14.6706938, longitude: 121.3217898, altitude: 442.0 },
  { latitude: 14.6708494, longitude: 121.3218306, altitude: 444.0 },
  { latitude: 14.6712022, longitude: 121.3217808, altitude: 444.0 },
  { latitude: 14.6713402, longitude: 121.3218034, altitude: 444.0 },
  { latitude: 14.671544, longitude: 121.321817, altitude: 444.0 },
  { latitude: 14.671625, longitude: 121.3219121, altitude: 444.0 },
  { latitude: 14.6715527, longitude: 121.3220503, altitude: 444.0 },
  { latitude: 14.6714848, longitude: 121.3220707, altitude: 444.0 },
  { latitude: 14.6710247, longitude: 121.3224195, altitude: 444.0 },
  { latitude: 14.6709458, longitude: 121.3226935, altitude: 448.0 },
  { latitude: 14.6709129, longitude: 121.3229721, altitude: 448.0 },
  { latitude: 14.6708516, longitude: 121.3233458, altitude: 458.0 },
  { latitude: 14.6707968, longitude: 121.3235021, altitude: 478.0 },
  { latitude: 14.6706654, longitude: 121.3236334, altitude: 478.0 },
  { latitude: 14.6705668, longitude: 121.3239981, altitude: 478.0 },
  { latitude: 14.6706259, longitude: 121.324066, altitude: 478.0 },
  { latitude: 14.6707771, longitude: 121.3242699, altitude: 487.0 },
  { latitude: 14.6707223, longitude: 121.3244284, altitude: 487.0 },
  { latitude: 14.670742, longitude: 121.3245031, altitude: 487.0 },
  { latitude: 14.6708428, longitude: 121.3245575, altitude: 470.0 },
  { latitude: 14.6709677, longitude: 121.3245734, altitude: 470.0 },
  { latitude: 14.6712504, longitude: 121.3245983, altitude: 470.0 },
  { latitude: 14.6713774, longitude: 121.3246979, altitude: 470.0 },
  { latitude: 14.671593, longitude: 121.3248392, altitude: 470.0 },
  { latitude: 14.6717368, longitude: 121.3249335, altitude: 485.0 },
  { latitude: 14.6719559, longitude: 121.3249924, altitude: 485.0 },
  { latitude: 14.6719915, longitude: 121.3250311, altitude: 506.0 }
];