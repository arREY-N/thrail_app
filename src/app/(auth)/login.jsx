import { forgotPassword, logIn } from '@/src/core/FirebaseAuthUtil';
import LogInScreen from '@/src/features/Auth/screens/LogInScreen';
import React, { useState } from 'react';

export default function login(){
    const [error, setError] = useState(null);

    const onLogIn = async (email, password) => {
        setError(null);
        try{
            await logIn(email, password)
        } catch (err) {
            setError(err.message);
        }
    }

    const onForgotPassword = async (email) => {
        setError(null);
        try{
            await forgotPassword(email)
        }catch(error){
            setError(error.message)
        }
    }

    return (
        <LogInScreen onLogIn={onLogIn} error={error}/>
    )
}