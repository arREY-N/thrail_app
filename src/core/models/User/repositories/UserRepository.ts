import { auth, db, functions, provider } from '@/src/core/config/Firebase';
import { getAuthErrorMessage } from '@/src/core/error/autherror';
import { CredentialResponse, SignUp, UserCredential } from '@/src/core/models/User/interfaces/SignUp.types';
import { LogIn, User } from '@/src/core/models/User/interfaces/User.types';
import { newUser, userConverter } from '@/src/core/models/User/utils/UserFactory';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword, signInWithPopup, } from 'firebase/auth';
import { collection, deleteDoc, doc, Firestore, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { httpsCallable } from "firebase/functions";

GoogleSignin.configure({
    webClientId: '672035725620-l5sdrcnscegfqmh43o6sj7rpcsggj7vi.apps.googleusercontent.com',
    offlineAccess: true,
});

const createUsersCollection = (db: Firestore) => {
    return collection(db, 'users').withConverter(userConverter);
};

export const UserRepository = (db: Firestore) => ({
    /**
     * Fetches all users.
     */
    async fetchAll(): Promise<User[]> {
        try {
            const col = createUsersCollection(db);
            const snapshot = await getDocs(col);
            if (snapshot.empty) return [];
            return snapshot.docs.map(docsnap => docsnap.data());
        } catch (err: unknown) {
            if (err instanceof Error) throw err;
            throw new Error('An error occurred while fetching all users.');
        }
    },

    /**
     * Fetches a user by ID.
     */
    async fetchById(id: string): Promise<User | null> {
        try {
            if (!id) return null;
            const col = createUsersCollection(db);
            const snap = await getDoc(doc(col, id));
            if (!snap.exists()) return null;
            return snap.data();
        } catch (err: unknown) {
            if (err instanceof Error) throw err;
            throw new Error('An error occurred while fetching user.');
        }
    },

    /**
     * Writes or updates a user document.
     */
    async write(data: User): Promise<User> {
        try {
            const col = createUsersCollection(db);
            const docRef = data.id ? doc(col, data.id) : doc(col);
            const updated: User = {
                ...data,
                id: data.id || docRef.id,
            };
            await setDoc(docRef, updated, { merge: true });
            return updated;
        } catch (err: unknown) {
            if (err instanceof Error) throw err;
            throw new Error('An error occurred while writing user');
        }
    },

    /**
     * Deletes a user by ID.
     */
    async delete(id: string): Promise<void> {
        try {
            if (!id) throw new Error('Invalid user ID');
            const col = createUsersCollection(db);
            const docRef = doc(col, id);
            await deleteDoc(docRef);
        } catch (err: unknown) {
            if (err instanceof Error) throw err;
            throw new Error('Failed deleting user');
        }
    },

    /**
     * Fetches users matching a given email.
     */
    async fetchByEmail(email: string): Promise<User[]> {
        try {
            const col = createUsersCollection(db);
            const q = query(col, where('email', '==', email));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) return [];
            return querySnapshot.docs.map(docsnap => docsnap.data());
        } catch (err: unknown) {
            if (err instanceof Error) throw err;
            throw new Error(`An error occurred while fetching user with email ${email}`);
        }
    },

    async checkUserCredentials(userCredentials: UserCredential): Promise<void> {
        const checkCredentials = httpsCallable(functions, 'checkEmail');
        try {
            const response = await checkCredentials(userCredentials);

            let unavailable = []

            if (!(response as CredentialResponse).data.emailAvailable) unavailable.push('Email');
            if (!(response as CredentialResponse).data.usernameAvailable) unavailable.push('Username');

            if (unavailable.length > 0)
                throw new Error(`${unavailable.join(', ')} already in use`);
        } catch (err) {
            console.log(err);
            throw new Error(getAuthErrorMessage(err as FirebaseError));
        }
    },

    async checkEmail(email: string): Promise<boolean> {
        const checkCredentials = httpsCallable(functions, 'checkEmail');
        try {
            const response = await checkCredentials({ email, username: 'checkExistingEmailOnly' });

            if ((response as CredentialResponse).data.emailAvailable) return false;

            return true;
        } catch (err) {
            console.log(err);
            throw new Error(getAuthErrorMessage(err as FirebaseError));
        }
    },

    async signUp(accountData: SignUp): Promise<User> {
        const { email, password } = accountData;

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password,
            );

            const user = newUser(accountData);
            user.id = userCredential.user.uid;

            await setDoc(
                doc(createUsersCollection(db), userCredential.user.uid),
                user,
                { merge: true }
            );

            return user;
        } catch (err) {
            console.log(err);
            throw new Error(getAuthErrorMessage(err as FirebaseError));
        }
    },

    async signUpWithGoogle(): Promise<void> {
        try {
            await GoogleSignin.hasPlayServices();

            const response = await GoogleSignin.signIn();

            console.log('Google Sign-In response:', response);
            if (response.type === 'cancelled')
                throw new Error('Google sign-in was cancelled by the user');

            const { idToken } = response.data;

            const googleCredential = GoogleAuthProvider.credential(idToken);

            const { user } = await signInWithCredential(getAuth(), googleCredential);

            const userDoc = doc(createUsersCollection(db), user.uid);
            const snap = await getDoc(userDoc);

            if (snap.exists()) {
                console.log('User already exists in Firestore');
                return;
            }

            const created = newUser({
                id: user.uid,
                email: user.email ?? '',
                firstname: user.displayName?.split(' ')[0] ?? '',
                lastname: user.displayName?.split(' ')[1] ?? '',
                phoneNumber: user.phoneNumber ?? '',
                username: `${user.displayName?.split(' ')[0] ?? ''}_${user.uid.slice(0, 4)}`
            });

            await setDoc(
                doc(createUsersCollection(db), created.id),
                created,
                { merge: true }
            );
        } catch (err) {
            console.log(err);
            throw new Error(getAuthErrorMessage(err as FirebaseError));
        }
    },

    async webSignUpWithGoogle(): Promise<void> {
        try {
            const result = await signInWithPopup(auth, provider);

            const credential = GoogleAuthProvider.credentialFromResult(result);

            const token = credential?.accessToken;

            if (!token)
                throw new Error('Failed to retrieve access token from Google');

            const user = result.user;

            const userDoc = doc(createUsersCollection(db), user.uid);
            const snap = await getDoc(userDoc);

            if (snap.exists()) {
                console.log('User already exists in Firestore');
                return;
            }

            const created = newUser({
                id: user.uid,
                email: user.email ?? '',
                firstname: user.displayName?.split(' ')[0] ?? '',
                lastname: user.displayName?.split(' ')[1] ?? '',
                phoneNumber: user.phoneNumber ?? '',
                username: `${user.displayName?.split(' ')[0] ?? ''}_${user.uid.slice(0, 4)}`
            });

            await setDoc(
                doc(createUsersCollection(db), created.id),
                created,
                { merge: true }
            );

        } catch (err) {
            console.log(err);
            throw new Error(getAuthErrorMessage(err as FirebaseError));
        }
    },

    async logIn(data: LogIn): Promise<void> {
        try {
            await signInWithEmailAndPassword(
                auth,
                data.email,
                data.password
            );
        } catch (err) {
            console.log(err);
            throw new Error(getAuthErrorMessage(err as FirebaseError));
        }
    }
});

export const UserRepo = UserRepository(db);
