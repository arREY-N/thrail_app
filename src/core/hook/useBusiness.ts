import { useBusinessesStore } from '@/src/core/stores/businessesStore';
import { useEffect } from 'react';

export default function useBusiness(
    role: string,
    businessId: string,
){
    const business = useBusinessesStore(s => s.current);
    const loadBusiness = useBusinessesStore(s => s.load);
    const deleteBusiness = useBusinessesStore(s => s.delete);

    useEffect(() => {
        if(role === 'user') return;        
        if(businessId) loadBusiness(businessId);
    }, []);


    async function onDeleteBusinessPress(
        id: string
    ){
        await deleteBusiness(id);
    }

    return {
        business,
        onDeleteBusinessPress,
    }

}