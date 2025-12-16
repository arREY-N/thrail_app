import { auth } from '@/src/core/config/Firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext({
    user: null,
    isLoading: true
});

export function useAuth(){
    return useContext(AuthContext);
}

export function AuthProvider({children}){
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setIsLoading(false); 
        });

        return unsubscribe;
    }, []);

    const value = {
        user,
        isLoading
    }

    return <AuthContext.Provider value={value}>{ children }</AuthContext.Provider>
}