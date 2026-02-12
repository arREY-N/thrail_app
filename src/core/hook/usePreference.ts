import { SignUpUI } from "@/src/types/entities/User";
import { useState } from "react";

const preferenceTemplate = {
    q1: {
        question: 'Have you hiked before?',
        type: 'binary', 
        options: ['Yes', 'No'], 
        answer: null,
        // follow: 'q2'
    },
    q2: {
        question: 'Which mountain(s) have you hiked?',
        type: 'multi-select', 
        options: [
            'Mt. Pulag', 
            'Mt. Ulap', 
            'Mt. Daraitan', 
            'Mt. Batulao', 
            'Mt. Maculot'
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
    const account = new SignUpUI();
    const [questions, setQuestions] = useState(preferenceTemplate);

    const setAnswer = (
        question: keyof typeof preferenceTemplate, 
        newAnswer: string,
    ) => {
        setQuestions(prev => {
            // const currentQuestion = prev[question];
            let saveAnswer: string | string[] | null = newAnswer;

            if(prev[question].type === 'multi-select'){
                
                const answers: string | string[] | null = prev[question].answer                

                saveAnswer = answers?.includes(newAnswer) 
                    ? answers.filter(a => a !== newAnswer)
                    : [...answers ?? [], newAnswer] 
            }

            return(
                {
                    ...prev,
                    [question]: {
                        ...prev[question],
                        answer: saveAnswer 
                    }
                }
            )
        });
    }

    const savePreference = () => ({
        hiked: questions['q1'].answer,
        location: questions['q2']?.answer,
        experience: questions['q3'].answer,
        hike_length: questions['q4'].answer,
        province: questions['q5'].answer,
    });

    const resetPreferences = () => setQuestions(preferenceTemplate)

    return { questions, setAnswer, savePreference, resetPreferences }
}