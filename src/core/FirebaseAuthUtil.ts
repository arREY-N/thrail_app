import { db } from '@/src/core/config/Firebase';
import { Preference } from '@/src/types/Preference';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

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