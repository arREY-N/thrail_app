import { useRouter } from 'expo-router';
import { useState } from 'react';

import ApplyScreen from '@/src/features/Profile/screens/ApplyScreen';

import { useApplicationsStore } from '@/src/core/stores/applicationsStore';
import { useAuthStore } from '@/src/core/stores/authStore';

export default function applyBusiness(){
    const router = useRouter();

    const [system, setSystem] = useState(null);
    const profile = useAuthStore(s => s.profile);

    const provinces = ['Cavite', 'Laguna', 'Batangas', 'Rizal', 'Quezon'];
    const createApplication = useApplicationsStore(s => s.createApplication);
    const error = useApplicationsStore(s => s.error);

    const onApplyPress = async (businessData) => {
        try{           
            const appId = await createApplication({
                ...businessData,
                userId: profile.id, 
            });
            router.replace('/(tabs)');             
        } catch (err) {
            setSystem(error ? error.message : err.message );
        }
    }

    const onBackPress = () => {
        router.back();
    }

    return (
        <ApplyScreen
            system={system}
            provinces={provinces}
            onApplyPress={onApplyPress}
            onBackPress={onBackPress}
        />
    )
}