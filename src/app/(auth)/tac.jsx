import { useAuthStore } from "@/src/core/stores/authStore";
import { useRouter } from "expo-router";

import TermsScreen from "../../../src/features/Auth/screens/TermsScreen";

export default function tac(){
    const router = useRouter();
    const error = useAuthStore(s => s.error);
    const isLoading = useAuthStore(s => s.isLoading);
    const signUp = useAuthStore(s => s.signUp);

    const onAcceptPress = async () => {
        await signUp();
    }

    const onDeclinePress = async () => {
        console.log('Alert user that this will cancel the whole process');
        router.replace('/(auth)/landing');
    }

    const onBackPress = () => {
        router.back();
    }

    return(
        <TermsScreen 
            isLoading={isLoading}
            onAcceptPress={onAcceptPress}
            onDeclinePress={onDeclinePress}
            onBackPress={onBackPress}
            error={error}
        />
    )
}
