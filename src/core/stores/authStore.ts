import { auth, db } from '@/src/core/config/Firebase';
import { AuthRepository } from '@/src/core/repositories/authRepository';
import { Property } from '@/src/types/Property';
import { User as FirebaseUser, onIdTokenChanged, signOut, Unsubscribe } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { create } from "zustand";
import { SignUp } from '../models/User/SignUp';
import { User, userConverter } from '../models/User/User';
import { editProperty } from '../utility/editProperty';
import { validateInfo, validateSignUp } from '../utility/validate';

type CustomClaims = {
    role: string;
    businessId?: string;
    owner?: string;
}

export interface AuthState{
    user: FirebaseUser | null;
    profile: User | null;
    isLoading: boolean;
    role: string | null;
    error: string | null;
    _unsubscribe: Unsubscribe | null;
    businessId: string | null;
    account: SignUp;
    remember: boolean;
    isChecking: boolean;

    signOut: () => Promise<void>;
}

const accountTemplate = {
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    firstname: '',
    lastname: '',
    birthday: new Date,
    address: '',
}

const init = {
    user: null,
    profile: null,
    isLoading: true,
    role: null,
    error: null,
    _unsubscribe: null,
    businessId: null,
    account: accountTemplate,
    remember: true,
    isChecking: false,
}

export const useAuthStore = create<AuthState>((set, get) => ({
    ...init,
    
    resetSignUp: () => set({ account: new SignUp() }),

    reset: () => set({
        ...init,
        isLoading: false
    }),

    initialize: () => {
        const unsubscribeAuth = onIdTokenChanged(auth, async (firebaseUser) => {
            set({ isLoading: true, error: null })
            console.log('init')
            const currentUnsub = get()._unsubscribe;

            if(currentUnsub) {
                currentUnsub();
                set({ _unsubscribe: null });
            }

            if(firebaseUser) {
                console.log('with user');
                const idTokenResult = await firebaseUser.getIdTokenResult(true);
                const userRole = (idTokenResult.claims as CustomClaims)?.role || null;
                
                if(!userRole){
                    set({
                        user: firebaseUser,
                    });
                    setTimeout(() => firebaseUser.getIdToken(true), 2000);
                    return;
                }
                
                const businessId = (idTokenResult.claims as CustomClaims).businessId || (idTokenResult.claims as CustomClaims).owner || null;

                set({ 
                    user: firebaseUser, 
                    role: userRole, 
                    businessId
                });
                
                const ref = doc(db, 'users', firebaseUser.uid).withConverter(userConverter);
                const unsubProfile = onSnapshot(ref, 
                    (snap) => {
                        if(snap.exists()){
                            set({
                                profile: snap.data(),
                                isLoading: false
                            });
                        }
                    },
                    (error) => {
                        if(!get().user) return;
                        console.log('Firestore listener error: ', error);
                    }
                )

                set({_unsubscribe: unsubProfile});
            } else {
                console.log('no user')
                const currentUnsub = get()._unsubscribe;

                if(currentUnsub){
                    currentUnsub();
                    set({_unsubscribe: null})
                }
                
                set({
                    ...init,
                    isLoading: false
                });
            }
        });

        return unsubscribeAuth;
    },

    logIn: async (
        email: string, 
        password: string,
    ) => {
        set({ isChecking: true, error: null });
        try{
            await AuthRepository.logIn({email, password});
            set({ isChecking: false, error: null })
        } catch (err) {
            console.log(err);
            set({
                error: (err as Error).message ?? 'Error logging in',
                isLoading: false,
            })
        }
    },

    signOut: async () => {
        set({isLoading: true, error: null});

        try{
            const currentUnsub = get()._unsubscribe;
            
            if(currentUnsub){
                currentUnsub();
                set({_unsubscribe: null})
            }

            await signOut(auth);

            set({
                isLoading: false,
            })
        } catch (err) {
            set({
                error: (err as Error).message ?? 'Failed signing out',
                isLoading: false
            })
        }
    },

    signUp: async () => {
        set({ isLoading: true, error: null });
        try {
            const user = await AuthRepository.signUp(get().account);
            
            set({ isLoading: false })
        } catch (err) {
            set({
                error: (err as Error).message || 'Failed signing up',
                isLoading: false,
            })
        }
    },

    validateSignUp: async () => {
        set({ isChecking: true, error: null });  
        try {
            validateSignUp(get().account);

            console.log(get().account);
            await AuthRepository.checkUserCredentials(get().account)

            set({ isChecking: false, error: null });

            return true;
        } catch (err) {
            set({
                error: (err as Error).message || 'Failed checking user credentials',
                isChecking: false
            })
            return false
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
                error: (err as Error).message || 'Failed checking user information',
                isLoading: false
            })
        }
    },

    edit: (
        property: Property
    ) => {
        set((state) => {
            if(!state.profile) {         
                return state
            };

            return {
                profile: editProperty(state.profile, property)
            }
        })
    },

    editAccount: (data: SignUp) => {
        set({
            account: new SignUp({...get().account, ...data})
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