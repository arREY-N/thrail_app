import { SignUp } from "@/src/core/models/User/SignUp";
import { useState } from "react";

const preferenceTemplate = {
    medical: {
        question: 'Do you have any pre-existing medical conditions that guides should be aware of?',
        type: 'medical', 
        options: ['Yes', 'No'], 
        answer: null as boolean | null,
        details: '',
        clearanceUri: '',
    },
    q1: {
        question: 'Have you hiked before?',
        type: 'binary', 
        options: ['Yes', 'No'], 
        answer: null as boolean | null,
    },
    q2: {
        question: 'Which mountain(s) have you hiked?',
        type: 'multi-select', 
        options: [
            'Mt. Ayaas (Rizal)',
            'Mt. Banahaw (Quezon)',
            'Mt. Batulao (Batangas)',
            'Mt. Binacayan (Rizal)',
            'Mt. Bira-Bira (Rizal)',
            'Mt. Cristobal (Laguna/Quezon)',
            'Mt. Daguldol (Batangas)',
            'Mt. Daraitan (Rizal)',
            'Mt. Hapunang Banoi (Rizal)',
            'Mt. Irid (Rizal)',
            'Mt. Kalisungan (Laguna)',
            'Mt. Mabilog (Laguna)',
            'Mt. Maculot (Batangas)',
            'Mt. Makiling (Laguna)',
            'Mt. Marami (Cavite)',
            'Mt. Pamitinan (Rizal)',
            'Mt. Parawagan (Rizal)',
            'Mt. Pico de Loro (Cavite)',
            'Mt. Romelo (Laguna)',
            'Mt. Sembrano (Rizal)',
            'Mt. Sipit Ulang (Rizal)',
            'Mt. Talamitam (Batangas)'
        ],
        answer: [] as string[],
    },
    q3: {
        question: 'What is your hiking experience level?',
        type: 'select', 
        options: ['Beginner', 'Regular', 'Experienced'], 
        answer: null,
    },
    q4: {
        question: 'How long do you prefer your hikes to be?',
        type: 'multi-select', 
        options: ['1-3 Hour(s)', 'Half-Day', 'Full-Day', 'Overnight', 'Multi-Day'], 
        answer: [] as string[],
    },
    q5: {
        question: 'Which provinces in Region IV-A (CALABARZON) would you like to explore?',
        type: 'multi-select', 
        options: ['Cavite', 'Laguna', 'Batangas', 'Rizal', 'Quezon'], 
        answer: [] as string[],
    },
}

export default function usePreference(){
    const account = new SignUp();
    const [questions, setQuestions] = useState(preferenceTemplate);

    const setAnswer = (
        question: keyof typeof preferenceTemplate, 
        newAnswer: string,
    ) => {
        setQuestions(prev => {
            let saveAnswer: string | string[] | boolean | null = newAnswer;
            let additionalUpdates = {};

            if(prev[question].type === 'multi-select'){
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

            return(
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

    const savePreference = () => ({
        preferences: {
            hiked: questions['q1'].answer,
            location: questions['q2']?.answer,
            experience: questions['q3'].answer,
            hike_length: questions['q4'].answer,
            province: questions['q5'].answer,
        },
        medicalProfile: {
            hasCondition: questions['medical'].answer,
            details: questions['medical'].details,
            clearanceUri: questions['medical'].clearanceUri,
        }
    });

    const resetPreferences = () => setQuestions(preferenceTemplate)

    return { questions, setAnswer, setMedicalDetails, setMedicalClearance, savePreference, resetPreferences }
}