import { auth, db } from '@/src/core/config/Firebase';
import { getAuthErrorMessage } from '@/src/core/error/autherror';
import { sendPasswordResetEmail } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

export const finishOnboarding = async (uid, preferences) =>{
    const ref = doc(db, 'users', uid);

    if(!uid || !preferences) throw new Error('Missing UID or preference object');
    
    await setDoc(
        ref, 
        {
            onBoardingComplete: true,
            preferences,
            updatedAt: serverTimestamp(),
        },
        {merge: true},
    );
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