import { router } from "expo-router";
import React, { useState } from "react";

import { finishOnboarding } from "@/src/core/FirebaseAuthUtil";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import usePreference from "@/src/core/hook/user/usePreference";
import PreferenceScreen from "@/src/features/Auth/screens/PreferenceScreen";

export default function Preference() {
    const { user } = useAuthHook();
    const [error, setError] = useState<string | undefined>();

    const { 
        questions, 
        setAnswer, 
        setMedicalDetails, 
        setMedicalClearance, 
        savePreference 
    } = usePreference();
    
    const onFinishedPreference = async () => {
        try {
            const finalData = savePreference(); 
            console.log('Trying to save preference and medical profile');
            await finishOnboarding(user?.uid as string, finalData as unknown as Parameters<typeof finishOnboarding>[1]);
            router.replace('/(tabs)' as any);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        }
    };

    return (
        <PreferenceScreen
            questions={questions}
            setAnswer={setAnswer as any}
            setMedicalDetails={setMedicalDetails}
            setMedicalClearance={setMedicalClearance}
            onFinish={onFinishedPreference}
            error={error}
        />
    );
}
