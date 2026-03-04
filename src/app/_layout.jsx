import {
  AntDesign,
  Feather,
  FontAwesome5,
  FontAwesome6,
  Ionicons,
  MaterialCommunityIcons
} from '@expo/vector-icons';

import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../core/stores/authStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const initialize = useAuthStore((state) => state.initialize);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user); 

      const [fontsLoaded, fontError] = useFonts({
        ...AntDesign.font,
        ...Feather.font,
        ...FontAwesome5.font,
        ...FontAwesome6.font,
        ...Ionicons.font,
        ...MaterialCommunityIcons.font,
    });

    useEffect(() => {
        if (fontsLoaded) {
            console.log("Icons are loaded");
        }
    }, [fontsLoaded]);

    useEffect(() => {
        const unsub = initialize();
        return () => {
            if(unsub) unsub();
        }
    }, [user?.uid]);

    useEffect(() => {
        if (fontsLoaded || fontError) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    if (!fontsLoaded || isLoading) {
        return null;
    }

    return <Stack screenOptions = {{headerShown: false}}/>
}