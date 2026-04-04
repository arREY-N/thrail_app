// TODO: remove the unused import once front end implemented
import LoadingScreen from '@/src/app/loading';
import UnauthorizedScreen from '@/src/app/unauthorized';
import CustomButton from '@/src/components/CustomButton';
import { useAdmin } from '@/src/core/hook/admin/useAdmin';
import useAdminNavigation from '@/src/core/hook/navigation/useAdminNavigation';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import { Business } from '@/src/core/models/Business/Business';
import { User } from '@/src/core/models/User/User';
import { formatDate } from '@/src/core/utility/date';
import { StyleSheet, Text, View } from "react-native";

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import AdminHomeScreen from '@/src/features/Admin/screens/AdminHomeScreen';
import { Stack } from 'expo-router';


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
    } = useAdminNavigation({ 
        userId: profile?.id,
        businessId,
        role,
    });

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <AdminHomeScreen 
                businessAccount={businessAccount}
                onManageAdminsPress={onManageAdminsPress}
                onManageOffersPress={onManageOffersPress}
                adminProfile={profile}
                error={error}
                onBackPress={onBackPress}
            />
        </>

        // <TESTHOME 
        //     businessAccount={businessAccount}
        //     onManageAdminsPress={onManageAdminsPress}
        //     onManageOffersPress={onManageOffersPress}
        //     adminProfile={profile}
        //     error={error}/>
    );
}

type screenParams = {
    businessAccount: Business
    onManageAdminsPress: () => void,
    onManageOffersPress: () => void,
    adminProfile: User,
    error: string | null,
}

const TESTHOME =(params: screenParams) => {
    const { 
        businessAccount, 
        onManageAdminsPress, 
        onManageOffersPress,
        adminProfile, 
        error 
    } = params;
    
    return (
        <View>
            <Text>Admin screen</Text>
            { error && <Text>{error}</Text>}
            <View style={styles.adminInfo}>
                <Text>BUSINESS INFORMATION</Text>
                
                <View>
                    <Text>  Business Name: {businessAccount.name}</Text>
                    <Text>  Address: {businessAccount.address}</Text>
                    <Text>  Serviced Location: {businessAccount.servicedLocation}</Text>
                    <Text>  Established on: {formatDate(businessAccount.establishedOn)}</Text>
                    <Text>  Approved: {formatDate(businessAccount.createdAt)}</Text>
                    <Text>  Status: {businessAccount.active ? 'Active' : 'Archived'}</Text>
                </View>
            </View>

            <View style={styles.adminInfo}>
                <Text>ADMIN INFORMATION</Text>
                <Text>  Admin Name: {adminProfile.firstname} {adminProfile?.lastname} </Text>
                <Text>  Username: {adminProfile.username}</Text>
                <Text>  Address: {adminProfile.address}</Text>
                <Text>  Province: {adminProfile.email}</Text>
            </View>
            
            <CustomButton 
                title={'Manage Admins'}
                onPress={onManageAdminsPress}
                style={undefined}
                textStyle={undefined} children={undefined}            />
            
            <CustomButton 
                title={'Manage Offers'}
                onPress={onManageOffersPress}
                style={undefined}
                textStyle={undefined} children={undefined}            />
            
        </View>
    )
}

const styles = StyleSheet.create({
    adminInfo: {
        margin: 10,
    }
})