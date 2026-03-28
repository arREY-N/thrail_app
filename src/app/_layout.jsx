import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useAuthStore } from "@/src/core/stores/authStore";
import {
  AntDesign,
  Feather,
  FontAwesome5,
  FontAwesome6,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { Stack } from "expo-router";

import { useFonts } from "expo-font";
import { SplashScreen } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  const { isLoading } = useAuthHook();

  const initialize = useAuthStore.getState().initialize;

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
    return () => unsub?.();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  console.log("root", isLoading);

  if(isLoading) return <LoadingScreen/>

  return <Stack screenOptions={{ headerShown: false }} />;
}
