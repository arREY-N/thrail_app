import { auth, db } from '@/src/core/config/Firebase';
import { getAuthErrorMessage } from '@/src/core/error/autherror';
import { SignUpUI, UserUI } from '@/src/types/entities/User';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from "firebase/functions";
import { UserMapper } from '../mapper/userMapper';

type UserCredential = {
    email: string,
    username: string,
}

type CredentialResponse = {
    data: {
        emailAvailable: boolean,
        usernameAvailable: boolean,
    }
}

type LogIn = {
    email: string,
    password: string,
}

class AuthRepositoryImpl {
    async checkUserCredentials(
        userCredentials: UserCredential
    ){
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
            throw new Error(getAuthErrorMessage(err));
        }
    }

    async signUp(
        accountData: SignUpUI
    ): Promise<UserUI> {
        const { 
            email, 
            password, 
        } = accountData;
    
        try{
            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                email, 
                password,
            );
            
            const user = UserMapper.toDB(new UserUI(accountData));
            user.id = userCredential.user.uid;
            
            console.log('user: ', user);
            
            await setDoc(
                doc(db, 'users', userCredential.user.uid), 
                user,
                {merge: true}
            );
    
            console.log('New user: ', user);       
    
            return UserMapper.toUI(user);
        } catch (err){
            console.error(err);
            throw new Error(getAuthErrorMessage(err));
        }
    }
    
    async logIn(
        data: LogIn
    ): Promise<void> {
        try {
            await signInWithEmailAndPassword(
                auth,
                data.email,
                data.password
            );
    
        } catch (err) {
            console.error(err);
            throw new Error(getAuthErrorMessage(err));
        }
    }
}

export const AuthRepository = new AuthRepositoryImpl();
