import { fetchAllUsers } from '@/src/core/repositories/userRepository';
import { createContext, useContext, useState } from "react";

const SuperAdminContext = createContext(null);

export function useSuperAdmin(){
    const context = useContext(SuperAdminContext);

    if(!context){
        throw new Error('useSuperAdmin must be within a SuperAdminProvider');
    }

    return context;
}

export function SuperAdminProvider({children}){
    const [users, setUsers] = useState([]);
    const [loaded, setLoaded] = useState(false);

    const fetchUsers = async () => {
        setLoaded(false);
        try{
            const users = await fetchAllUsers();

            if(!users){
                setUsers([]);
                return;
            }
            setUsers(users);
        } catch (err) {
            throw new Error('Failed fetching all users');
        } finally {
            setLoaded(true);
        }
    }

    const value = {
        users, 
        loaded,
        fetchUsers
    }

    return <SuperAdminContext.Provider value={value}>{children}</SuperAdminContext.Provider>
}

