import { db } from "@/src/core/config/Firebase";
import { finishOnboarding } from "@/src/core/FirebaseAuthUtil";
import { useAuthHook } from "@/src/core/models/User/hooks/useAuthHook";
import { catchError } from "@/src/core/utility/errorFormatter";
import { generateInitialUserRecommendations } from "@/src/features/SuperAdmin/services/tarsApiService";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

/**
 * Safely extracts an array of trail names from the misc/public document.
 */
function extractTrailNames(data: any): string[] {
    if (!data) return [];

    const candidates = [
        data.trailNames,
        data.trails,
        data.trail_names,
        data.trailsList,
        data.mountains,
        data.mountainNames,
        data.names,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate) && candidate.length > 0) {
            return candidate
                .map((item: any) => (typeof item === 'string' ? item.trim() : (item?.name || item?.trailName || '')))
                .filter(Boolean)
                .sort((a: string, b: string) => a.localeCompare(b));
        }
    }

    for (const key of Object.keys(data)) {
        const val = data[key];
        if (Array.isArray(val) && val.length > 0) {
            return val
                .map((item: any) => (typeof item === 'string' ? item.trim() : (item?.name || item?.trailName || '')))
                .filter(Boolean)
                .sort((a: string, b: string) => a.localeCompare(b));
        }
    }

    return [];
}

const preferenceTemplate = {
    medical: {
        question: 'Do you have any pre-existing medical conditions that guides should be aware of?',
        type: 'medical',
        options: ['Yes', 'No'],
        answer: null as boolean | null,
        details: '',
        clearanceUri: '',
    },
    trails: {
        question: 'Which mountain(s) have you hiked?',
        type: 'multi-select',
        options: [] as string[],
        answer: [] as string[],
    },
    province: {
        question: 'Which provinces in Region IV-A (CALABARZON) would you like to explore?',
        type: 'multi-select',
        options: ['Cavite', 'Laguna', 'Batangas', 'Rizal', 'Quezon'],
        answer: [] as string[],
    },
}

export function usePreference() {
    const [questions, setQuestions] = useState(preferenceTemplate);
    const [error, setError] = useState<string | null>();
    const { user } = useAuthHook();

    useEffect(() => {
        let isMounted = true;

        const fetchAvailableTrails = async () => {
            try {
                const docRef = doc(db, 'misc', 'public');
                const docSnap = await getDoc(docRef);

                if (isMounted && docSnap.exists()) {
                    const data = docSnap.data();
                    const availableTrails = extractTrailNames(data);

                    if (availableTrails.length > 0) {
                        setQuestions(prev => ({
                            ...prev,
                            trails: {
                                ...prev.trails,
                                options: availableTrails,
                            }
                        }));
                    }
                }
            } catch (err) {
                console.warn('[usePreference] Could not load available trails from misc/public:', err);
            }
        };

        fetchAvailableTrails();

        return () => {
            isMounted = false;
        };
    }, []);

    const setAnswer = (
        question: keyof typeof preferenceTemplate,
        newAnswer: string,
    ) => {
        setQuestions(prev => {
            let saveAnswer: string | string[] | boolean | null = newAnswer;
            let additionalUpdates = {};

            if (prev[question].type === 'multi-select') {
                const answers: string | string[] | boolean | null = prev[question].answer;
                const answerArray = Array.isArray(answers) ? answers : [];

                saveAnswer = answerArray.includes(newAnswer)
                    ? answerArray.filter(a => a !== newAnswer)
                    : [...answerArray, newAnswer]
            }
            else if (prev[question].type === 'binary' || prev[question].type === 'medical') {
                saveAnswer = newAnswer === 'Yes' ? true : false;

                if (question === 'medical' && saveAnswer === false) {
                    additionalUpdates = { details: '', clearanceUri: '' };
                }
            }

            return (
                {
                    ...prev,
                    [question]: {
                        ...prev[question],
                        answer: saveAnswer,
                        ...additionalUpdates
                    }
                }
            )
        });
    }

    const setMedicalDetails = (text: string) => {
        setQuestions(prev => ({
            ...prev,
            medical: {
                ...prev.medical,
                details: text
            }
        }));
    };

    const setMedicalClearance = (uri: string) => {
        setQuestions(prev => ({
            ...prev,
            medical: {
                ...prev.medical,
                clearanceUri: uri
            }
        }));
    };

    const savePreference = () => {
        const selectedTrails = (questions['trails']?.answer as string[]) || [];
        const hasHiked = selectedTrails.length > 0;

        return {
            preferences: {
                hiked: hasHiked,
                location: selectedTrails,
                experience: 'Beginner', // Baseline level; engine determines profile capability from selected hiked trails
                hike_length: [] as string[],
                province: (questions['province']?.answer as string[]) || [],
            },
            medicalProfile: {
                hasCondition: questions['medical'].answer,
                // Convert onboarding medical conditions string input into a string[] array
                details: questions['medical'].details
                    ? (questions['medical'].details as string).split(/[,\n]+/).map(s => s.trim()).filter(Boolean)
                    : [],
                clearanceUri: questions['medical'].clearanceUri,
            }
        };
    };

    const onFinishedPreference = async () => {
        try {
            const finalData = savePreference();
            const uid = user?.uid;

            if (!uid) throw new Error("Missing UID. User might not be fully logged in yet.");

            console.log('Trying to save preference, medical profile, and initial profile');
            await finishOnboarding(uid, finalData as unknown as Parameters<typeof finishOnboarding>[1]);

            // Trigger THARESYS initial recommendation generation in background for this new user
            generateInitialUserRecommendations(uid).catch((err) => {
                console.warn('[usePreference] Initial recommendation generation background note:', err?.message || err);
            });

            router.replace('/(app)/(tabs)');
        } catch (err) {
            catchError((err as Error), 'error', 'usePreference');
            setError((err as Error).message)
        }
    };

    const resetPreferences = () => {
        setQuestions(prev => ({
            ...preferenceTemplate,
            trails: {
                ...preferenceTemplate.trails,
                options: prev.trails.options,
            }
        }));
    };

    return {
        error,
        questions,
        setAnswer,
        setMedicalDetails,
        setMedicalClearance,
        savePreference,
        resetPreferences,
        onFinishedPreference
    }
}