import { auth, db, functions, provider } from '@/src/core/config/Firebase';
import { getAuthErrorMessage } from '@/src/core/error/autherror';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword, signInWithPopup, } from 'firebase/auth';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { httpsCallable } from "firebase/functions";
import { SignUp } from '../models/User/SignUp';
import { CredentialResponse, UserCredential } from '../models/User/SignUp.types';
import { User, userConverter } from '../models/User/User';
import { LogIn } from '../models/User/User.types';

GoogleSignin.configure({
  webClientId: '672035725620-l5sdrcnscegfqmh43o6sj7rpcsggj7vi.apps.googleusercontent.com', 
  offlineAccess: true,
});


const userCollection = collection(db, 'users').withConverter(userConverter);

class AuthRepositoryImpl {
    async checkUserCredentials(userCredentials: UserCredential): Promise<void> {
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
        
            return user;
        } catch (err){
            console.error(err);
            throw new Error(getAuthErrorMessage(err as FirebaseError));
        }
    }
    
    async signUpWithGoogle(): Promise<void>{
        try {
            await GoogleSignin.hasPlayServices();

            const response = await GoogleSignin.signIn();

            console.log('Google Sign-In response:', response);
            if(response.type === 'cancelled') 
                throw new Error('Google sign-in was cancelled by the user');

            const { idToken } = response.data;

            const googleCredential = GoogleAuthProvider.credential(idToken);

            const { user } = await signInWithCredential(getAuth(), googleCredential);    

            const userDoc = doc(userCollection, user.uid);
            const snap = await getDoc(userDoc);

            if(snap.exists()) {
                console.log('User already exists in Firestore');
                return;
            }

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

            const userDoc = doc(userCollection, user.uid);
            const snap = await getDoc(userDoc);

            if(snap.exists()) {
                console.log('User already exists in Firestore');
                return;
            }

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
        
        } catch (err) {
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
