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
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useFonts } from "expo-font";
import { SplashScreen } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {

	const {
		initialize,
		isLoading
	} = useAuthHook();

	SplashScreen.preventAutoHideAsync();

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

	if(isLoading) return <LoadingScreen/>

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<Stack screenOptions={{ headerShown: false }} />
		</GestureHandlerRootView>
	);
}
