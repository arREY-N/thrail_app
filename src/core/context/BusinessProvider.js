import { useAuthStore } from '@/src/core/stores/authStore';
import { useBusinessesStore } from '@/src/core/stores/businessesStore';
import { createContext, useContext, useEffect } from 'react';

const BusinessContext = createContext(null);

export function useBusiness(){
    const context = useContext(BusinessContext);

    if(!context) throw new Error('useBusiness must be within a BusinessProvider');

    return context;
}

export function BusinessProvider({children}){
    const role = useAuthStore(s => s.role);
    const businessId = useAuthStore(s => s.businessId);
    const loadBusinessAccount = useBusinessesStore(s => s.loadBusinessAccount);
    const loadBusinessAdmins = useBusinessesStore(s => s.loadBusinessAdmins);
    const businessAccount = useBusinessesStore(s => s.businessAccount);

    useEffect(()=>{
        if(role === 'admin'  && !businessAccount) {
            loadBusinessAccount(businessId);
        }
    }, [businessId, businessAccount, role])
    
    useEffect(()=>{        
        if(businessAccount){
            loadBusinessAdmins();
        }
    }, [businessAccount])
    
    const value = {
        role,
        businessId   
    }

    return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>
}