import { db } from '@/src/core/config/Firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { IMedicalProfile, IPreference } from './models/User/User.types';

export const finishOnboarding = async (
    uid: string, 
    data: { preferences: IPreference; medicalProfile: IMedicalProfile }
) => {
    const ref = doc(db, 'users', uid);

    if(!uid || !data) throw new Error('Missing UID or data object');
    
    await setDoc(
        ref, 
        {
            onBoardingComplete: true,
            preferences: data.preferences,
            medicalProfile: data.medicalProfile,
            updatedAt: serverTimestamp(),
        },
        {merge: true},
    );
}