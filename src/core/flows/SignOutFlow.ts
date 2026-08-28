import { TrackHikerGPSFlow } from "@/src/core/flows/TrackHikerGPSFlow";
import { useTrailsStore } from "@/src/core/models/Trail/Trail";
import { useAuthHook } from "@/src/core/models/User/User";
import { catchError } from "@/src/core/utility/errorFormatter";
import { router } from "expo-router";
import { useState } from "react";

export function SignOutFlow() {
    const { onSignOutPress } = useAuthHook();
    const { stopBackgroundTracking } = TrackHikerGPSFlow();
    const [flowError, setFlowError] = useState<string | null>(null);

    const signOut = async () => {
        try {
            setFlowError(null);
            await stopBackgroundTracking();
            await onSignOutPress()
            useTrailsStore.getState().reset();
            router.replace('/(auth)/landing');
        } catch (error) {
            setFlowError((error as Error).message);
            catchError((error as Error), 'error', 'SignOutFlow()')
        }
    }

    return {
        signOut,
        flowError,
    }
}