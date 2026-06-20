import { router } from "expo-router";
import React, { useState } from "react";

import { auth } from "@/src/core/config/Firebase";
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
            const uid = user?.uid || auth.currentUser?.uid;
            
            if (!uid) throw new Error("Missing UID. User might not be fully logged in yet.");
            
            console.log('Trying to save preference and medical profile');
            await finishOnboarding(uid, finalData as unknown as Parameters<typeof finishOnboarding>[1]);
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
