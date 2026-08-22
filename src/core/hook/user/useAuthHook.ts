import { useHikerGPS } from "@/src/core/hook/trail/useHikerGPS";
import { useTrailsStore } from "@/src/core/models/Trail/stores/trailsStore";
import { useAuthStore } from "@/src/core/stores/authStores/authStore";
import { catchError } from "@/src/core/utility/errorFormatter";
import { router } from "expo-router";
import { useMemo, useState } from "react";

export function useAuthHook() {
    const [localError, setLocalError] = useState('');
    const role = useAuthStore(s => s.role);
    const profile = useAuthStore(s => s.profile);
    const user = useAuthStore(s => s.user);
    const isLoading = useAuthStore(s => s.isLoading);
    const error = useAuthStore(s => s.error);
    const businessId = useAuthStore(s => s.businessId);
    const remember = useAuthStore(s => s.remember);
    const initialize = useAuthStore(s => s.initialize);
    const reset = useAuthStore(s => s.reset);
    const logIn = useAuthStore(s => s.logIn);
    const onRememberMePress = useAuthStore(s => s.rememberMe)
    const password = useAuthStore(s => s.forgotPassword);
    const signOut = useAuthStore(s => s.signOut);
    const gmailSignUp = useAuthStore(s => s.gmailSignUp);

    const isSuperadmin = role === 'superadmin'
    const isAdmin = role === 'admin'
    const isNotUser = role && role !== 'user';

    const { stopBackgroundTracking } = useHikerGPS();

    const onSignOutPress = async () => {
        try {
            await signOut();
            stopBackgroundTracking();
            useTrailsStore.getState().reset();
            router.replace('/(auth)/landing');
        } catch (error) {
            setLocalError((error as Error).message);
            catchError((error as Error), 'error', 'useAuthHook()')
        }
    }

    const onForgotPassword = () => {
        router.push({
            pathname: "/(auth)/forgotPassword"
        })
    }

    const forgotPassword = async (email: string) => {
        try {
            await password(email);
        } catch (error) {
            setLocalError((error as Error).message);
            catchError((error as Error), 'error', 'useAuthHook()')
        }
    }

    const onGmailLogIn = async () => {
        try {
            await gmailSignUp();
            router.push("/(tabs)");
        } catch (error) {
            setLocalError((error as Error).message);
            catchError((error as Error), 'error', 'useAuthHook()')
        }
    }

    const onLogIn = async (email: string, password: string) => {
        try {
            await logIn(email, password);
            router.push("/(tabs)");
        } catch (error) {
            setLocalError((error as Error).message);
            catchError((error as Error), 'error', 'useAuthHook()')
        }
    }

    const isNewAccount = useMemo(() => {
        if (!profile) return false;
        if (!profile.preferences) return true;
        return profile.preferences.hiked === false;
    }, [profile]);

    return {
        role,
        isSuperadmin,
        isAdmin,
        profile,
        user,
        isLoading,
        error: localError || error,
        businessId,
        remember,
        initialize,
        reset,
        onLogIn,
        onRememberMePress,
        onForgotPassword,
        forgotPassword,
        onSignOutPress,
        onGmailLogIn,
        isNotUser,
        isNewAccount,
    }
}
