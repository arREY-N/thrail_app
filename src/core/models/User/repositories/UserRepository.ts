import { auth, db, functions, provider } from '@/src/core/config/Firebase';
import { getAuthErrorMessage } from '@/src/core/error/autherror';
import { CredentialResponse, SignUp, UserCredential } from '@/src/core/models/User/interfaces/SignUp.types';
import { LogIn, User } from '@/src/core/models/User/interfaces/User.types';
import { newUser, userConverter } from '@/src/core/models/User/utils/UserFactory';
import NetInfo from "@react-native-community/netinfo";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, GoogleAuthProvider, signInWithCredential, signInWithCustomToken, signInWithPopup, } from 'firebase/auth';
import { collection, deleteDoc, doc, Firestore, getDoc, getDocs, query, setDoc, Timestamp, updateDoc, where } from 'firebase/firestore';
import { httpsCallable } from "firebase/functions";

const isOffline = async (): Promise<boolean> => {
    try {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            return true;
        }
        const state = await NetInfo.fetch();
        return state.isConnected === false || state.isInternetReachable === false;
    } catch {
        return false;
    }
};

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
        try {
            const checkCredentials = httpsCallable(functions, 'checkEmail');
            const response = await checkCredentials(userCredentials);

            let unavailable = []

            if (!(response as CredentialResponse).data.emailAvailable) unavailable.push('Email');
            if (!(response as CredentialResponse).data.usernameAvailable) unavailable.push('Username');

            if (unavailable.length > 0)
                throw new Error(`${unavailable.join(', ')} already in use`);
        } catch (err) {
            throw new Error(`Failed checking user credentials: ${(err as Error).message}`);
        }
    },

    async checkEmail(email: string): Promise<boolean> {
        const checkCredentials = httpsCallable(functions, 'checkEmail');
        try {
            const response = await checkCredentials({ email, username: 'checkExistingEmailOnly' });

            if ((response as CredentialResponse).data.emailAvailable) return false;

            return true;
        } catch (err) {
            if (await isOffline()) {
                throw new Error(getAuthErrorMessage('auth/network-request-failed'));
            }
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
            throw new Error(getAuthErrorMessage(err as FirebaseError));
        }
    },

    async signUpWithGoogle(): Promise<void> {
        try {
            await GoogleSignin.hasPlayServices();

            const response = await GoogleSignin.signIn();

            if (response.type === 'cancelled')
                throw new Error('Google sign-in was cancelled by the user');

            const { idToken } = response.data;

            const googleCredential = GoogleAuthProvider.credential(idToken);

            const { user } = await signInWithCredential(getAuth(), googleCredential);

            const userDoc = doc(createUsersCollection(db), user.uid);
            const snap = await getDoc(userDoc);

            if (snap.exists()) {
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
            throw new Error(getAuthErrorMessage(err as FirebaseError));
        }
    },

    /**
     * Logs in through the `secureLogin` Cloud Function, which enforces the
     * server-side attempt limiter and returns a custom token on success.
     */
    async logIn(data: LogIn): Promise<void> {
        try {
            const secureLogin = httpsCallable<LogIn, { token: string }>(functions, 'secureLogin');
            const response = await secureLogin({ email: data.email, password: data.password });

            await signInWithCustomToken(auth, response.data.token);
        } catch (err) {
            console.log(err);
            if (await isOffline()) {
                throw new Error(getAuthErrorMessage('auth/network-request-failed'));
            }
            throw new Error(getAuthErrorMessage(err as FirebaseError));
        }
    },

    /**
     * Updates phone verification timestamp for personal phone or emergency contact.
     *
     * @param userId - ID of the user document to update.
     * @param contactType - Whether to update the personal phone or emergency contact.
     * @param verifiedAt - New verification date or null to reset.
     */
    async updateVerification(
        userId: string,
        contactType: 'personal' | 'emergency',
        verifiedAt: Date | null
    ): Promise<void> {
        try {
            if (!userId) throw new Error('User ID is required');
            const userRef = doc(db, 'users', userId);
            const tsValue = verifiedAt instanceof Date && !isNaN(verifiedAt.getTime())
                ? Timestamp.fromDate(verifiedAt)
                : null;

            if (contactType === 'personal') {
                await updateDoc(userRef, {
                    phoneVerifiedAt: tsValue,
                });
            } else {
                await updateDoc(userRef, {
                    'emergencyContact.phoneVerifiedAt': tsValue,
                });
            }
        } catch (err: unknown) {
            if (err instanceof Error) throw err;
            throw new Error('Failed to update user verification');
        }
    }
});

export const UserRepo = UserRepository(db);
