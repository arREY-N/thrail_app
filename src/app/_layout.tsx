import {
	AntDesign,
	Feather,
	FontAwesome5,
	FontAwesome6,
	Ionicons,
	MaterialCommunityIcons,
} from "@expo/vector-icons";
import { Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

import LoadingScreen from "@/src/app/loading";
import { MaintenanceScreen } from "@/src/app/maintenance";
import useMaintenance from "@/src/core/hook/useMaintenance";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useFonts } from "expo-font";
import { SplashScreen } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

// Prevent splash screen auto-hide at module load time
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const { checked, isMaintenance } = useMaintenance();

	const {
		initialize,
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
			if(unsub) unsub()
		};
	}, []);

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

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<KeyboardProvider statusBarTranslucent>
				<Stack screenOptions={{ headerShown: false }} />
			</KeyboardProvider>
		</GestureHandlerRootView>
	);
}
