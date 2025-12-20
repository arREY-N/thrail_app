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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if(!firebaseUser){
                setUser(null);
                setIsLoading(false); 
                setProfile(null);
                return;
            }

            const ref = doc(db, 'users', firebaseUser.uid);
            
            const unsubscribeProfile = onSnapshot(ref, (snap) => {                
                if(snap.exists()){
                    setProfile(snap.data())
                }
                setUser(firebaseUser);
                setIsLoading(false);
            })
            return unsubscribeProfile;
        });
        return unsubscribe;
    }, []);

    const value = {
        user,
        isLoading,
        profile
    }

    return <AuthContext.Provider value={value}>{ children }</AuthContext.Provider>
}