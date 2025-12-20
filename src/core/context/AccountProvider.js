import { createContext, useContext, useState } from "react";

const preferenceTemplate = {
    q1: {
        question: 'Have you hiked before',
        type: 'binary', 
        options: ['Yes', 'No'], 
        answer: null,
        follow: 'q2'
    },
    q2: {
        question: 'Select location',
        type: 'multi-select', 
        options: ['Mt. A', 'Mt. B', 'Mt. C', 'Mt. D', 'Mt. E'], 
        answer: [],
    },
    q3: {
        question: 'What is your hiking experience level',
        type: 'select', 
        options: ['Beginner', 'Regular', 'Experienced'], 
        answer: null,
    },
    q4: {
        question: 'How long do you prefer your hikes to be?',
        type: 'multi-select', 
        options: ['1-3 hours', 'half-day', 'full-day', 'overnight', 'multi-day'], 
        answer: [],
    },
    q5: {
        question: 'Which provinces in Region IV-A (CALABARZON) would you like to explore?',
        type: 'multi-select', 
        options: ['Cavite', 'Laguna', 'Batangas', 'Rizal', 'Quezon'], 
        answer: [],
    },
}

const userPreferences = {
    'hiked': null,
    'location': null,
    'experience': null,
    'hike_length': null,
    'province': null,
}

const AccountContext = createContext(null);

export function useAccount(){
    const context = useContext(AccountContext);
    
    if(!context){
        throw new Error('useAccount must be used inside an AccountProvider')
    }

    return context;
}

export function AccountProvider({children}){
    const [questions, setQuestions] = useState(preferenceTemplate);
    const [preferences, setPreferences] = useState(userPreferences);
    const [account, setAccount] = useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        firstname: '',
        lastname: '',
        birthday: '',
        address: '', 
    });

    const updateAccount = (info) => {
        setAccount(a => ({
            ...a,
            ...info
        }))
    }

    const setAnswer = (question, newAnswer) => {
        setQuestions(prev => {
            let saveAnswer = newAnswer;

            if(questions[question].type === 'multi-select'){
                
                const answers = prev[question].answer                

                saveAnswer = answers.includes(newAnswer) 
                                ? answers.filter(a => a !== newAnswer)
                                : [...answers, newAnswer] 
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

    const savePreference = () => {
        const finalPreferences = {
            hiked: questions['q1'].answer,
            location: questions['q2']?.answer,
            experience: questions['q3'].answer,
            hike_length: questions['q4'].answer,
            province: questions['q5'].answer,
        }
        setPreferences(prev => ({...prev, ...finalPreferences}));
        return finalPreferences;
    }

    const resetAccount = () => {
        setAccount({
            email: '',
            username: '',
            password: '',
            confirmPassword: '',
            phoneNumber: '',
            firstname: '',
            lastname: '',
            birthday: '',
            address: '', 
        })
    }

    const resetPreferences = () => {
        setPreferences(userPreferences);
    }

    const value = {
        account, updateAccount, resetAccount,
        questions, setAnswer,
        preferences, savePreference, resetPreferences
    }

    return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}