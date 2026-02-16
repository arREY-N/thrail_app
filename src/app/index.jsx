import { useRootNavigationState, useRouter } from "expo-router";
import { useEffect } from "react";
import { useAuthStore } from "../core/stores/authStore";
import LoadingScreen from "./loading";

export default function index() {
    const router = useRouter();

    const isLoading = useAuthStore((state) => state.isLoading);
    const user = useAuthStore((state) => state.user);
    const profile = useAuthStore((state) => state.profile);
    const role = useAuthStore((state) => state.role);
    const rootNavigationState = useRootNavigationState();

    useEffect(() => {
        if(!rootNavigationState?.key) return;

        if(isLoading) return;
        
        if(!user) {
            router.replace('/(auth)/landing');
        } else if(role === 'superadmin') {
            router.replace('/(superadmin)/home');
        } else if(role === 'admin') {
            router.replace('/(admin)/home');
        } else if(role === 'user'){
            if(profile) {
                if(!profile.onBoardingComplete){
                    router.replace('/(auth)/preference');
                } else {
                    router.replace('/(tabs)/home');
                }
            }
        }
    }, [user, role, isLoading, profile, rootNavigationState?.key])

    return <LoadingScreen/>;
}
