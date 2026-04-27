import { useAuthStore } from "@/src/core/stores/authStore";
import { router } from "expo-router";

export function useAuthHook(){
    const role = useAuthStore(s => s.role);
    const profile = useAuthStore(s => s.profile);
    const user = useAuthStore(s => s.user);
    const isLoading = useAuthStore(s => s.isLoading);
    const error = useAuthStore(s => s.error);
    const businessId = useAuthStore(s => s.businessId);
    const remember = useAuthStore(s => s.remember);
    const initialize = useAuthStore(s => s.initialize);
    const reset = useAuthStore(s => s.reset);
    const onLogIn = useAuthStore(s => s.logIn);
    const onRememberMePress = useAuthStore(s => s.rememberMe)
    const password = useAuthStore(s => s.forgotPassword);
    const signOut = useAuthStore(s => s.signOut);
    const gmailSignUp = useAuthStore(s => s.gmailSignUp);

    const isSuperadmin = role === 'superadmin'
    const isAdmin = role === 'admin'

    const onSignOutPress = () => {
        signOut(); 
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
            console.error("Forgot password error:", error);
        }
    }
   
    return {
        role,
        isSuperadmin,
        isAdmin,
        profile,
        user,
        isLoading,
        error,
        businessId,
        remember,
        initialize,
        reset,
        onLogIn,
        onRememberMePress,
        onForgotPassword,
        forgotPassword,
        onSignOutPress,
        onGmailLogIn: gmailSignUp,
    }
}