import { db } from '@/src/core/config/Firebase';
import type { IMedicalProfile, IPreference } from '@/src/core/models/User/User';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

export const finishOnboarding = async (
    uid: string,
    data: { preferences: IPreference; medicalProfile: IMedicalProfile }
) => {
    if (!uid || !data) throw new Error('Missing UID or data object');

    const ref = doc(db, 'users', uid);

    await setDoc(
        ref,
        {
            onBoardingComplete: true,
            preferences: data.preferences,
            medicalProfile: data.medicalProfile,
            updatedAt: serverTimestamp(),
        },
        { merge: true },
    );
}