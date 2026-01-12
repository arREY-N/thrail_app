import { auth, db } from '@/src/core/config/Firebase';
import { getAuthErrorMessage } from '@/src/core/error/autherror';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from "firebase/functions";

export async function checkUserCredentials(userCredentials){
    const functions = getFunctions();
    
    const checkCredentials = httpsCallable(functions, 'checkEmail');

    try {
        const {email, username} = userCredentials;

        const response = await checkCredentials({email, username});
        
        console.log(response.data);
        let unavailable = []
        if(!response.data.emailAvailable) unavailable.push('Email');
        if(!response.data.usernameAvailable) unavailable.push('Username');

        if(unavailable.length > 0) 
            throw new Error(`${unavailable.join(', ')} already in use`);

        return true
    } catch (err) {
        const errorMessage = err.message || 'Failed checking credentials'; 
        console.log(errorMessage);
        throw new Error(errorMessage);
    }
}

export const signUp = async (accountData) => {
    const { 
        email, 
        password, 
        username,
        phoneNumber,
        lastname,
        firstname,
        birthday,
        address 
    } = accountData;

    try{
        const userCredential = await createUserWithEmailAndPassword(
            auth, 
            email, 
            password
        );

        const user = userCredential.user;

        console.log('user: ', user);
        
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email,
            username,
            firstname,
            lastname,
            phoneNumber,
            birthday,
            address,
            onBoardingComplete: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        },
        {merge: true});

        console.log('New user: ', user);       

        return user;
    } catch (error){
        throw new Error(getAuthErrorMessage(error));
    }
}