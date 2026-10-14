import LoadingScreen from "@/src/app/loading";
import { MaintenanceScreen } from "@/src/app/maintenance";
import GlobalErrorFallback from "@/src/components/GlobalErrorFallback";
import useMaintenance from "@/src/core/hook/useMaintenance";
import { useAuthHook } from "@/src/core/models/User/User";
import {
	initErrorMonitoring,
	Sentry,
	setUserTracking,
} from "@/src/core/utility/errorMonitoring";
import "@/src/core/utility/locationTask";
import {
	AntDesign,
	Feather,
	FontAwesome5,
	FontAwesome6,
	Ionicons,
	MaterialCommunityIcons,
	MaterialIcons,
} from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

// Initialize global Sentry monitoring before component mounting
initErrorMonitoring();

// Complete authentication session in web browser
WebBrowser.maybeCompleteAuthSession();

// Prevent splash screen auto-hide at module load time
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
	initialRouteName: 'index',
};

function RootLayout() {
	const { checked, isMaintenance } = useMaintenance();

	const {
		initialize,
		isLoading,
		user,
	} = useAuthHook();

	const [hasInitialAuthResolved, setHasInitialAuthResolved] = useState(false);

	if (!isLoading && !hasInitialAuthResolved) {
		setHasInitialAuthResolved(true);
	}

	// Synchronize anonymous user ID with Sentry without leaking PII
	useEffect(() => {
		setUserTracking(user?.uid ?? null);
	}, [user?.uid]);

	const [fontsLoaded, fontError] = useFonts({
		...AntDesign.font,
		...Feather.font,
		...FontAwesome5.font,
		...FontAwesome6.font,
		...Ionicons.font,
		...MaterialCommunityIcons.font,
		...MaterialIcons.font,
	});

	useEffect(() => {
		const unsub = initialize();

		return () => {
			if (unsub) unsub();
		};
	}, [initialize]);

	useEffect(() => {
		if (fontsLoaded || fontError) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded, fontError]);

	if (!fontsLoaded && !fontError) {
		return null;
	}

	if (!checked || !hasInitialAuthResolved) {
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
			<Sentry.ErrorBoundary fallback={GlobalErrorFallback}>
				<KeyboardProvider statusBarTranslucent>
					<Stack screenOptions={{ headerShown: false }} />
				</KeyboardProvider>
			</Sentry.ErrorBoundary>
		</GestureHandlerRootView>
	);
}

export default Sentry.wrap(RootLayout);

