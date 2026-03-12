import { auth, db } from '@/src/core/config/Firebase';
import { getAuthErrorMessage } from '@/src/core/error/autherror';
import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, } from 'firebase/auth';
import { collection, doc, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from "firebase/functions";
import { SignUp } from '../models/User/SignUp';
import { CredentialResponse, UserCredential } from '../models/User/SignUp.types';
import { User, userConverter } from '../models/User/User';
import { LogIn } from '../models/User/User.types';

const userCollection = collection(db, 'users').withConverter(userConverter);

class AuthRepositoryImpl {
    async checkUserCredentials(userCredentials: UserCredential): Promise<void> {
        const functions = getFunctions();
        const checkCredentials = httpsCallable(functions, 'checkEmail');
        
        try {
            const response = await checkCredentials(userCredentials);
            
            let unavailable = []
        
            if(!(response as CredentialResponse).data.emailAvailable) unavailable.push('Email');
            if(!(response as CredentialResponse).data.usernameAvailable) unavailable.push('Username');
        
            if(unavailable.length > 0) 
                throw new Error(`${unavailable.join(', ')} already in use`);
        } catch (err) { 
            console.error(err);
            throw new Error(getAuthErrorMessage(err as FirebaseError));
        }
    }
    
    async signUp(accountData: SignUp): Promise<User> {
        const { email, password } = accountData;
        
        try{
            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                email, 
                password,
            );
            
            const user = new User(accountData);
            user.id = userCredential.user.uid;
            
            await setDoc(
                doc(userCollection, userCredential.user.uid), 
                user,
                {merge: true}
            );
        
            console.log('New user: ', user);       
        
            return user;
        } catch (err){
            console.error(err);
            throw new Error(getAuthErrorMessage(err as FirebaseError));
        }

    }
    
    async logIn(data: LogIn): Promise<void> {
        try {
            await signInWithEmailAndPassword(
                auth,
                data.email,
                data.password
            );
        } catch (err) {
            console.error(err);
            throw new Error(getAuthErrorMessage(err as FirebaseError));
        }
    }
}

export const AuthRepository = new AuthRepositoryImpl();
