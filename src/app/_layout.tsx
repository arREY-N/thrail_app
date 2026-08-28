
import LoadingScreen from "@/src/app/loading";
import { useAuthHook } from "@/src/core/models/User/User";
import {
	AntDesign,
	Feather,
	FontAwesome5,
	FontAwesome6,
	Ionicons,
	MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { MaintenanceScreen } from "@/src/app/maintenance";
import useMaintenance from "@/src/core/hook/useMaintenance";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

// Prevent splash screen auto-hide at module load time
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
	initialRouteName: 'index',
};

export default function RootLayout() {
	const { checked, isMaintenance } = useMaintenance();

	const {
		initialize,
		isLoading
	} = useAuthHook();

	const [fontsLoaded, fontError] = useFonts({
		...AntDesign.font,
		...Feather.font,
		...FontAwesome5.font,
		...FontAwesome6.font,
		...Ionicons.font,
		...MaterialCommunityIcons.font,
	});

	useEffect(() => {
		const unsub = initialize();

		return () => {
			if (unsub) unsub()
		};
	}, [initialize]);

	useEffect(() => {
		if (fontsLoaded || fontError) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded, fontError]);

	if (!checked) {
		return (
			<GestureHandlerRootView style={{ flex: 1 }}>
				<LoadingScreen />
			</GestureHandlerRootView>
		);
	}

	if (checked && isMaintenance) {
		return (
			<GestureHandlerRootView style={{ flex: 1 }}>
				<MaintenanceScreen />
			</GestureHandlerRootView>
		);
	}

	if (isLoading) return <LoadingScreen />

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<KeyboardProvider statusBarTranslucent>
				<Stack screenOptions={{ headerShown: false }} />
			</KeyboardProvider>
		</GestureHandlerRootView>
	);
}
