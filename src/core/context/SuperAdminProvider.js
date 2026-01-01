import { fetchAllApplications } from '@/src/core/repositories/applictionRepository';
import { fetchAllBusinesses } from '@/src/core/repositories/businessRepository';
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
    const [applications, setApplications] = useState([]);
    const [businesses, setBusinesses] = useState([]);
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

    const fetchApplications = async () => {
        setLoaded(false);
        try {
            const applications = await fetchAllApplications();

            if(!applications){
                setApplications([]);
                return;
            }
            setApplications(applications);
        } catch(err) {
            throw new Error('Failed fetching all applications')
        } finally {
            setLoaded(true);
        }
    }

    const fetchBusinesses = async () => {
        setLoaded(false);
        try {
            const businesses = await fetchAllBusinesses();

            if(!businesses){
                setBusinesses([]);
                return;
            }
            setBusinesses(businesses);
        } catch (err) {
            throw new Error('Failed fetching all businesses', err)
        } finally {
            setLoaded(true);
        }
    }

    const value = {
        users, 
        loaded,
        fetchUsers,
        applications,
        fetchApplications,
        businesses,
        fetchBusinesses
    }

    return <SuperAdminContext.Provider value={value}>{children}</SuperAdminContext.Provider>
}

