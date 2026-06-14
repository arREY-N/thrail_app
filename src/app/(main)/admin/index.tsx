import LoadingScreen from '@/src/app/loading';
import UnauthorizedScreen from '@/src/app/unauthorized';
import { useAdmin } from '@/src/core/hook/admin/useAdmin';
import useAdminNavigation from '@/src/core/hook/navigation/useAdminNavigation';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import { Stack } from 'expo-router';

import DashboardScreen from '@/src/features/Admin/screens/DashboardScreen';


export default function adminHome(){
    const {
        businessId,
        profile,
        error,
        role,
        isLoading,
    } = useAuthHook();

    const {
        businessAccount,
    } = useAdmin({ businessId })

    const { onBackPress } = useAppNavigation();
    
    if(isLoading || !businessAccount || !businessId || !profile || !role) 
        return <LoadingScreen/> 

    if(!isLoading && (!businessId || !profile || !role)) 
        return <UnauthorizedScreen/>

    const {
        onManageAdminsPress,
        onManageOffersPress,    
        onManageTrailsPress,
    } = useAdminNavigation({ 
        userId: profile?.id,
        businessId,
        role,
    });

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <DashboardScreen 
                businessAccount={businessAccount}
                onManageAdminsPress={onManageAdminsPress}
                onManageOffersPress={onManageOffersPress}
                onManageTrailsPress={onManageTrailsPress}
                adminProfile={profile}
                error={error as string | null}
                onBackPress={onBackPress}
            />
        </>
    );
}
