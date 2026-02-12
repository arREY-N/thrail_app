import { finishOnboarding } from "@/src/core/FirebaseAuthUtil";
import { useAuthStore } from "@/src/core/stores/authStore";
import { useRouter } from "expo-router";
import { useState } from "react";

import usePreference from "@/src/core/hook/usePreference";
import PreferenceScreen from "@/src/features/Auth/screens/PreferenceScreen";

export default function preference(){
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const [error, setError] = useState();

    const { questions, setAnswer, savePreference } = usePreference();
    
    const onFinishedPreference = async () => {
        try {
            const finalPreferences = savePreference();
            console.log('Trying to save preference');
            await finishOnboarding(user.uid, finalPreferences);
            router.replace('/(tabs)')
        } catch (err) {
            setError(err.message);
        }
    }

    return(
        <PreferenceScreen
            questions={questions}
            setAnswer={setAnswer}
            onFinish={onFinishedPreference}
            error={error}
        />
    ) 
}