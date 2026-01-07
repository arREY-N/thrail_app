import { useAuthStore } from '@/src/core/stores/authStore';
import { useBusinessesStore } from '@/src/core/stores/businessesStore';
import { createContext, useContext, useEffect, useMemo } from 'react';

const BusinessContext = createContext(null);

export function useBusiness(){
    const context = useContext(BusinessContext);

    if(!context) throw new Error('useBusiness must be within a BusinessProvider');

    return context;
}

export function BusinessProvider({children}){
    const role = useAuthStore((state) => state.role);
    const businessId = useAuthStore((state) => state.businessId);
    const loadBusinessAccount = useBusinessesStore((state) => state.loadBusinessAccount);
    const loadBusinessAdmins = useBusinessesStore((state) => state.loadBusinessAdmins);
    const businessAccount = useBusinessesStore((state) => state.businessAccount);

    useEffect(()=>{
        if(role === 'admin'  && !businessAccount) {
            loadBusinessAccount(businessId);
        }
        console.log('ACCNT: ', businessAccount)
    }, [businessId, businessAccount, role])
    
    useEffect(()=>{        
        if(businessAccount){
            loadBusinessAdmins();
        }
    }, [businessAccount])
    
    const value = useMemo(() => {
        return {

        }
    }, [])

    return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>
}