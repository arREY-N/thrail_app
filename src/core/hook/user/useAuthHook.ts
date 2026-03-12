import { NO_AUTH } from "@/src/core/config/Firebase";
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
    const reset = useAuthStore(s => s.reset);
    const onLogInPress = useAuthStore(s => s.logIn);
    const onRememberMePress = useAuthStore(s => s.rememberMe)
    const onForgotPassword = useAuthStore(s => s.forgotPassword);
    const onGmailLogIn = useAuthStore(s => s.gmailLogIn)
    const signOut = useAuthStore(s => s.signOut);

    const isSuperadmin = role === 'superadmin'
    const isAdmin = role === 'admin'

    const onSignOutPress = () => {
        signOut(); 
    }

    const onLogIn = (email: string, password: string) => {
        onLogInPress(email, password);
        if(NO_AUTH){
            router.replace('/(tabs)')

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
        reset,
        onLogIn,
        onRememberMePress,
        onForgotPassword,
        onSignOutPress,
        onGmailLogIn,
    }
}