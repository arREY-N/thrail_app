import { useAuthStore } from "@/src/core/stores/authStore";

export function useAuthHook(){
    const role = useAuthStore(s => s.role);
    const profile = useAuthStore(s => s.profile);
    const user = useAuthStore(s => s.user);
    const isLoading = useAuthStore(s => s.isLoading);
    const error = useAuthStore(s => s.error);
    const businessId = useAuthStore(s => s.businessId);
    const signOut = useAuthStore(s => s.signOut);

    const isSuperadmin = role === 'superadmin'
    const isAdmin = role === 'admin'

    const onSignOutPress = () => {
        signOut(); 
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
        onSignOutPress,
    }
}