import {
    Roboto_400Regular,
    Roboto_700Bold,
} from "@expo-google-fonts/roboto";
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
import { useAuthStore } from "../core/stores/authStore";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const initialize = useAuthStore((state) => state.initialize);
  const isLoading = useAuthStore((state) => state.isLoading);
  // Emman's branch included user, leaving it here in case you need it for layout logic later
  const user = useAuthStore((state) => state.user); 

  // Combine both Roboto AND the Vector Icons into one hook
  const [fontsLoaded, fontError] = useFonts({
    Roboto_400Regular,
    Roboto_700Bold,
    ...AntDesign.font,
    ...Feather.font,
    ...FontAwesome5.font,
    ...FontAwesome6.font,
    ...Ionicons.font,
    ...MaterialCommunityIcons.font,
  });

  // Handle initialization
  useEffect(() => {
    const unsub = initialize();
    return () => {
      if (unsub) unsub();
    };
    // Used the empty array [] from HEAD. Emman's branch had [user?.uid], 
    // but auth listeners should usually only be initialized once on mount.
  }, []);

  // Throw font errors so Expo Router's Error Boundary can catch them
  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  // Hide the splash screen only when fonts are loaded AND auth is done loading
  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading]);

  // Prevent rendering until everything is ready
  if (!fontsLoaded || isLoading) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}