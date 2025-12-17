import { auth } from '@/src/core/config/Firebase';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';

export const signUp = async (email, password) => {
    try{
        const userCredential = await createUserWithEmailAndPassword(
            auth, 
            email, 
            password
        );

        return userCredential.user;
    } catch (error){
        console.error('Firebase sign up error:', error);
    }
}

export const logIn = async (email, password) => {
    try{
        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        return userCredential.user;
    } catch (error) {
        console.error('Firebase log in error: ', error);
    }
}

export const forgotPassword = async (email) => {
    if(!email){
        throw new Error('Email is required');
    }

    await sendPasswordResetEmail(auth, email)
}