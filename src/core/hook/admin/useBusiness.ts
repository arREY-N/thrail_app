import { useBusinessesStore } from '@/src/core/stores/businessesStore';
import { router } from 'expo-router';
import { useEffect } from 'react';

export type BusinessParams = {
    role: string,
    businessId: string,
}

export default function useBusiness(params: BusinessParams | null){
    const business = useBusinessesStore(s => s.current);
    const loadBusiness = useBusinessesStore(s => s.load);
    const deleteBusiness = useBusinessesStore(s => s.delete);

    useEffect(() => {
        if(params?.role === 'user') return;        
        if(params?.businessId) loadBusiness(params?.businessId);
    }, [params?.role, params?.businessId]);


    async function onDeleteBusinessPress(
        id: string
    ){
        await deleteBusiness(id);
    }

    const onApplyPress = () => {
        console.log('Apply business');
        router.push({
            pathname: '/(main)/business/apply'
        })
    }

    return {
        business,
        onDeleteBusinessPress,
        onApplyPress,
    }
}