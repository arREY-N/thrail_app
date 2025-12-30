import { auth, db } from '@/src/core/config/Firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext({
    user: null,
    isLoading: true,
    profile: null
});

export function useAuth(){
    const context = useContext(AuthContext);
    
    if(!context){
        throw new Error('useAuth must be used within an AuthProvider')
    }
    
    return context;
}

export function AuthProvider({children}){
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [role, setRole] = useState(null);

    useEffect(() => {
        let unsubscribeProfile = null;

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if(firebaseUser) {
                setUser(firebaseUser);
                const idTokenResult = await firebaseUser.getIdTokenResult(true);
                const userRole = idTokenResult.claims?.role || null;
                setRole(userRole);
                
                const ref = doc(db, 'users', firebaseUser.uid);
                unsubscribeProfile = onSnapshot(ref, (snap) => {                
                    if(snap.exists()){
                        setProfile({
                            uid: snap.id,
                            ...snap.data()
                        });
                        setIsLoading(false);
                    }
                });
            }
            
            if(!firebaseUser){
                if(unsubscribeProfile){
                    unsubscribeProfile();
                }
                setUser(null);
                setIsLoading(false); 
                setProfile(null);
                setRole(null);
            }
            
            return () => {
                unsubscribe();
                if(unsubscribeProfile){
                    unsubscribeProfile();
                }
            };
        });
        return unsubscribe;
    }, []);

    const value = {
        user,
        isLoading,
        profile,
        role
    }

    return <AuthContext.Provider value={value}>{ children }</AuthContext.Provider>
}