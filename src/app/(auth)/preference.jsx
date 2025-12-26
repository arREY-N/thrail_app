import { useAccount } from "@/src/core/context/AccountProvider";
import { useAuth } from "@/src/core/context/AuthProvider";
import { finishOnboarding } from "@/src/core/FirebaseAuthUtil";
import PreferenceScreen from "@/src/features/Auth/screens/PrefenceScreen";
import { useRouter } from "expo-router";
import { useState } from "react";

export default function preference(){
    const router = useRouter();
    const { user } = useAuth();
    const [error, setError] = useState();
    const { questions, setAnswer, savePreference, resetPreferences } = useAccount(); 

    const onFinishedPreference = async () => {
        try {
            const finalPreferences = savePreference();
            await finishOnboarding(user.uid, finalPreferences);
            resetPreferences();
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
            // <Pressable onPress={onFinishedPreference}>
            //     <Text>Finish Onboarding</Text>
            // </Pressable>

            // <Pressable onPress={() => router.replace('/(tabs)/home')}>
            //     <Text>Skip for now</Text>
            // </Pressable>
    ) 
}