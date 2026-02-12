import { useAuthStore } from "@/src/core/stores/authStore";

export function useAuthHook(){
    const role = useAuthStore(s => s.role);
    const profile = useAuthStore(s => s.profile);
    const user = useAuthStore(s => s.user);
    const isLoading = useAuthStore(s => s.isLoading);
    const error = useAuthStore(s => s.error);
    const businessId = useAuthStore(s => s.businessId);
    
    const isSuperadmin = role === 'superadmin'
    const isAdmin = role === 'admin'

    return {
        role,
        isSuperadmin,
        isAdmin,
        profile,
        user,
        isLoading,
        error,
        businessId,
    }
}