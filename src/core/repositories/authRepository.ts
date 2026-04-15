import { auth, db, functions, provider } from '@/src/core/config/Firebase';
import { getAuthErrorMessage } from '@/src/core/error/autherror';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword, signInWithPopup, } from 'firebase/auth';
import { collection, doc, setDoc } from 'firebase/firestore';
import { httpsCallable } from "firebase/functions";
import { SignUp } from '../models/User/SignUp';
import { CredentialResponse, UserCredential } from '../models/User/SignUp.types';
import { User, userConverter } from '../models/User/User';
import { LogIn } from '../models/User/User.types';

GoogleSignin.configure({
  webClientId: '1:672035725620:web:ffa5e8f734a2b492e78561', 
});


const userCollection = collection(db, 'users').withConverter(userConverter);

class AuthRepositoryImpl {
    async checkUserCredentials(userCredentials: UserCredential): Promise<void> {
        const checkCredentials = httpsCallable(functions, 'checkEmail');
        
        console.log("functions instance: ", functions);
        console.log('callable: ', checkCredentials);

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
    
    async signUpWithGoogle(): Promise<void>{
        try {
            console.log('Starting Google sign-up process');
            await GoogleSignin.hasPlayServices();

            const response = await GoogleSignin.signIn();

            if(response.type === 'success') {
                const { idToken } = response.data;

                const googleCredential = GoogleAuthProvider.credential(idToken);

                const { user } = await signInWithCredential(getAuth(), googleCredential);
                console.log('User created: ', user);    

                const newUser = new User({
                    id: user.uid,
                    email: user.email ?? '',
                    firstname: user.displayName?.split(' ')[0] ?? '',
                    lastname: user.displayName?.split(' ')[1] ?? '',
                    phoneNumber: user.phoneNumber ?? '',
                    username: `${user.displayName?.split(' ')[0] ?? ''}_${user.uid.slice(0, 4)}`
                });

                await setDoc(
                    doc(userCollection, newUser.id), 
                    newUser,
                    {merge: true}
                );
            } else {
                console.log('Sign in ')
            }
        } catch (err) {
            console.error(err);
            throw new Error(getAuthErrorMessage(err as FirebaseError));
        }
    }

    async webSignUpWithGoogle() : Promise<void> {
        try {
            const result = await signInWithPopup(auth, provider);

            const credential = GoogleAuthProvider.credentialFromResult(result);

            const token = credential?.accessToken;

            if(!token)
                throw new Error('Failed to retrieve access token from Google');

            const user = result.user;

            const newUser = new User({
                id: user.uid,
                email: user.email ?? '',
                firstname: user.displayName?.split(' ')[0] ?? '',
                lastname: user.displayName?.split(' ')[1] ?? '',
                phoneNumber: user.phoneNumber ?? '',
                username: `${user.displayName?.split(' ')[0] ?? ''}_${user.uid.slice(0, 4)}`
            });

            await setDoc(
                doc(userCollection, newUser.id), 
                newUser,
                {merge: true}
            );
        
        } catch (error) {
            console.error("Google sign-in error:", error);
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
