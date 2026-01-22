import { auth, db } from '@/src/core/config/Firebase';
import { checkUserCredentials, logIn, signUp } from '@/src/core/repositories/authRepository';
import { onIdTokenChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { create } from "zustand";
import { validateInfo, validateSignUp } from '../domain/authDomain';

const accountTemplate = {
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    firstname: '',
    lastname: '',
    birthday: '',
    address: '',
}

const init = {
    user: null,
    profile: null,
    isLoading: false,
    role: null,
    error: null,
    _unsubscribe: null,
    businessId: null,
    account: accountTemplate,
    remember: true,
}

export const useAuthStore = create((set, get) => ({
    ...init,
    
    resetSignUp: () => set({account: accountTemplate}),

    reset: () => set(init),

    initialize: () => {
        set({isLoading: true, error: null});
        
        const unsubscribeAuth = onIdTokenChanged(auth, async (firebaseUser) => {
            console.log('change token')
            const currentUnsub = get()._unsubscribe;

            if(currentUnsub) {
                console.log('currentUnsub');
                currentUnsub();
                set({ _unsubscribe: null });
            }

            if(firebaseUser) {
                const idTokenResult = await firebaseUser.getIdTokenResult(true);
                const userRole = idTokenResult.claims?.role || null;
                
                if(!userRole){
                    set({
                        user: firebaseUser,
                        isLoading: true,
                    });
                    setTimeout(() => firebaseUser.getIdToken(true), 2000);
                    return;
                }
                
                const businessId = idTokenResult.claims.businessId || idTokenResult.claims.owner || null;

                set({ user: firebaseUser, role: userRole, businessId});
                
                const ref = doc(db, 'users', firebaseUser.uid);
                const unsubProfile = onSnapshot(ref, 
                    (snap) => {
                        if(snap.exists()){
                            set({
                                profile: { id: firebaseUser.uid, ...snap.data() },
                                isLoading: false
                            });
                        }
                    },
                    (error) => {
                        console.log('Firestore listener error: ', error);
                    }
                )

                set({_unsubscribe: unsubProfile});
            } else {
                console.log('no user');
                set({
                    user: null,
                    profile: null,
                    role: null,
                    isLoading: false,
                    businessId: null,
                });
            }
        });

        return unsubscribeAuth;
    },

    logIn: async (email, password) => {
        set({isLoading: true, error: null});
        try{
            const userCredential = await logIn({email, password});

            const token = await userCredential.user.getIdTokenResult(true);
            const role = token.claims.role || 'user';
    
            const businessId = token.claims.businessId || token.claims.owner || null;
            console.log('Store: ', businessId);

            set({
                user: userCredential.user,
                role: role,
                isLoading: false,
                businessId
            });
            return {user: userCredential.user, role}
        } catch (err) {
            set({
                error: err.message ?? 'Error logging in',
                isLoading: false,
            })
        }
    },

    signOut: async () => {
        set({isLoading: true, error: null});

        try{
            set({
                user: null,
                profile: null,
                role: null,
                isLoading: false,
                businessId: null
            })
            await signOut(auth);
        } catch (err) {
            set({
                error: err.message ?? 'Failed signing out',
                isLoading: false
            })
        }
    },

    signUp: async () => {
        set({ isLoading: true, error: null });
        try {
            const user = await signUp(get().account);
            console.log('User: ', user);
            set({ isLoading: false })
        } catch (err) {
            set({
                error: err.message || 'Failed signing up',
                isLoading: false,
            })
        }
    },

    validateSignUp: async () => {
        set({ isLoading: true, error: null });  
        try {
            validateSignUp(get().account);

            await checkUserCredentials(get().account)

            set({ isLoading: false });

            return true;
        } catch (err) {
            set({
                error: err.message || 'Failed checking user credentials',
                isLoading: false
            })
        }
    },

    validateInfo: () => {
        set({ isLoading: true, error: null });
        try {
            validateInfo(get().account);
            set({ isLoading: false });
            return true;
        } catch (err) {
            set({
                error: err.message || 'Failed checking user information',
                isLoading: false
            })
        }
    },

    editAccount: (userData) => {
        set((state) => {
            return {
                account: {...state.account, ...userData}
            }
        })
    },

    rememberMe: () => {
        set((state) => {
            return {
                error: 'Function to be added soon',
                remember: !state.remember
            }
        })

        return get().remember;
    },

    gmailSignUp: () => {
        set({
            error: 'Function to be added soon',
        })
    },
    
    gmailLogIn: () => {
        set({
            error: 'Function to be added soon',
        })
    },
    
    forgotPassword: () => {
        set({
            error: 'Function to be added soon',
        })
    }
}))