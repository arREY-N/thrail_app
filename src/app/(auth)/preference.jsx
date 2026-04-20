import { finishOnboarding } from "@/src/core/FirebaseAuthUtil";
import { useAuthStore } from "@/src/core/stores/authStore";
import { useRouter } from "expo-router";
import { useState } from "react";

import usePreference from "@/src/core/hook/user/usePreference";
import PreferenceScreen from "@/src/features/Auth/screens/PreferenceScreen";

export default function preference(){
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const [error, setError] = useState();

    const { questions, setAnswer, setMedicalDetails, setMedicalClearance, savePreference } = usePreference();
    
    const onFinishedPreference = async () => {
        try {
            const finalData = savePreference(); 
            console.log('Trying to save preference and medical profile');
            await finishOnboarding(user.uid, finalData);
            router.replace('/(tabs)')
        } catch (err) {
            setError(err.message);
        }
    }

    return(
        <PreferenceScreen
            questions={questions}
            setAnswer={setAnswer}
            setMedicalDetails={setMedicalDetails}
            setMedicalClearance={setMedicalClearance}
            onFinish={onFinishedPreference}
            error={error}
        />
    ) 
}