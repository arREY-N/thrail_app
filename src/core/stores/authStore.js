import { auth, db } from '@/src/core/config/Firebase';
import { onIdTokenChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { create } from "zustand";

const init = {
    user: null,
    profile: null,
    isLoading: true,
    role: null,
    error: null,
    _unsubscribe: null,
    businessId: null,
}

export const useAuthStore = create((set, get) => ({
    ...init,

    reset: () => set(init),

    initialize: () => {
        set({isLoading: true, error: null});
        
        const unsubscribeAuth = onIdTokenChanged(auth, async (firebaseUser) => {
            const currentUnsub = get()._unsubscribe;
            if(currentUnsub) {
                currentUnsub();
                set({_unsubscribe: null});
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

                set({ user: firebaseUser, role: userRole});
                
                const ref = doc(db, 'users', firebaseUser.uid);
                const unsubProfile = onSnapshot(ref, (snap) =>{
                    if(snap.exists()){
                        set({
                            profile: { id: firebaseUser.uid, ...snap.data() },
                            isLoading: false
                        });
                    }
                })

                set({_unsubscribe: unsubProfile});
            } else {
                set({
                    user: null,
                    profile: null,
                    role: null,
                    isLoading: false,
                    businessId: null,
                    _unsubscribe: null
                });
            }
        });

        return unsubscribeAuth;
    },

    logIn: async (email, password) => {
        set({isLoading: true, error: null});
        try{
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            const token = await userCredential.user.getIdTokenResult(true);
            const role = token.claims.role || 'user';
    
            const businessId = token.claims.businessId || token.claims.owner || null;
                
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
            console.log('Signing out');
            
            const unsubProfile = get()._unsubscribe;
            if(unsubProfile) await unsubProfile();

            set({
                user: null,
                profile: null,
                role: null,
                isLoading: false,
                businessId: null,
                _unsubscribe: null
            })
            
            await signOut(auth);
            console.log('Sign out');
        } catch (err) {
            set({
                error: err.message ?? 'Failed signing out',
                isLoading: false
            })
        }
    }
}))