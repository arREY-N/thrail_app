import { auth, db } from '@/src/core/config/Firebase';
import { getAuthErrorMessage } from '@/src/core/error/autherror';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

export const signUp = async (email, password, username) => {
    try{
        const userCredential = await createUserWithEmailAndPassword(
            auth, 
            email, 
            password
        );

        const user = userCredential.user;

        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            username: username,
            firstname: '',
            lastname: '',
            number: null,
            birthday: '',
            address: '',
            basicInformation: false,
            onBoardingComplete: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        },
        {merge: true});

        return user;
    } catch (error){
        throw new Error(getAuthErrorMessage(error));
    }
}

export const finishOnboarding = async (uid) =>{
    const ref = doc(db, 'users', uid);

    await setDoc(
        ref, 
        {
            onBoardingComplete: true,
            updatedAt: serverTimestamp(),
        },
        {merge: true},
    );
}

export const updateUserProfile = async (uid, data) => {
    const ref = doc(db, 'users', uid);

    await setDoc(
        ref,
        {
            ...data,
            basicInformation: true,
            updatedAt: serverTimestamp(),
        },
        {merge: true}
    );
}

export const logIn = async (email, password) => {
    try{
        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        return userCredential.user;
    } catch (err) {
        console.error('Error logging in: ', err.message);
        throw new Error(getAuthErrorMessage(err))
    }
}

export const forgotPassword = async (email) => {
    if(!email){
        throw new Error('Email is required');
    }

    try {
        await sendPasswordResetEmail(auth, email)
    } catch (err) {
        console.error('Error sending password reset email: ', err.message);
        throw new Error(getAuthErrorMessage(err));
    }
}