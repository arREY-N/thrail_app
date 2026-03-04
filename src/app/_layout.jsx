import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { useAuthStore } from "../core/stores/authStore";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const initialize = useAuthStore((state) => state.initialize);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user); 

  useEffect(() => {
    const unsub = initialize();
    return () => {
      if (unsub) unsub();
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}