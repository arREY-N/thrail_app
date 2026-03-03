import { db } from '@/src/core/config/Firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Preference } from './models/User/Preference';

export const finishOnboarding = async (
    uid: string, 
    preferences: Preference
) => {
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