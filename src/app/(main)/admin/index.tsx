import { useAdmin } from '@/src/core/hook/useAdmin';
import { useAuthHook } from '@/src/core/hook/useAuthHook';
import { formatDate } from '@/src/core/utility/date';
import { Business } from '@/src/types/entities/Business';
import { UserUI } from '@/src/types/entities/User';
import { Pressable, StyleSheet, Text, View } from "react-native";
import LoadingScreen from '../../loading';

export default function adminHome(){
    const {
        businessId,
        profile,
        error,
    } = useAuthHook();

    const {
        businessAccount,
        onManageAdminsPress,
        onManageOffersPress,
    } = useAdmin({ businessId })
     

    if(!businessAccount || !profile) return <LoadingScreen/>

    return (
        <TESTHOME 
            businessAccount={businessAccount}
            onManageAdminsPress={onManageAdminsPress}
            onManageOffersPress={onManageOffersPress}
            adminProfile={profile}
            error={error}/>
    );
}

type screenParams = {
    businessAccount: Business
    onManageAdminsPress: () => void,
    onManageOffersPress: () => void,
    adminProfile: UserUI,
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
                    <Text>  Business Name: {businessAccount.businessName}</Text>
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
            
            <Pressable onPress={onManageAdminsPress}>
                <Text>Manage Admins</Text>
            </Pressable>
            
            <Pressable onPress={onManageOffersPress}>
                <Text>Manage Offers</Text>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    adminInfo: {
        margin: 10,
    }
})