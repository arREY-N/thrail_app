import { auth, db } from '@/src/core/config/Firebase';
import { getAuthErrorMessage } from '@/src/core/error/autherror';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

// export const signUp = async (
//     email, 
//     password, 
//     username,
//     phoneNumber,
//     lastname,
//     firstname,
//     birthday,
//     address
// ) => {
//     try{
//         const userCredential = await createUserWithEmailAndPassword(
//             auth, 
//             email, 
//             password
//         );

//         const user = userCredential.user;

//         console.log('user: ', user);
        
//         await setDoc(doc(db, 'users', user.uid), {
//             uid: user.uid,
//             email: user.email,
//             username: username,
//             firstname: firstname,
//             lastname: lastname,
//             phoneNumber: phoneNumber,
//             birthday: birthday,
//             address: address,
//             onBoardingComplete: false,
//             createdAt: serverTimestamp(),
//             updatedAt: serverTimestamp(),
//         },
//         {merge: true});

//         console.log('New user: ', user);
        

//         return user;
//     } catch (error){
//         throw new Error(getAuthErrorMessage(error));
//     }
// }

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