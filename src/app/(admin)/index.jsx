import { useAuthStore } from '@/src/core/stores/authStore';
import { useBusinessesStore } from '@/src/core/stores/businessesStore';
import { resetData } from '@/src/core/stores/dataStore';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function home(){
    const router = useRouter();

    const businessAccount = useBusinessesStore(s => s.businessAccount);
    const signOut = useAuthStore(s => s.signOut);
    const profile = useAuthStore(s => s.profile);
    const error = useAuthStore(s => s.error); 
    const user = useAuthStore(s => s.user);
    
    const onSignOutPress = async () => {
        await signOut();
        resetData();
    }

    const onManageAdminsPress = () => {
        console.log('Manage admins');
        router.push('/(admin)/personnel');    
    }

    const onManageOffersPress = () => {
        console.log('Manage offers');
        router.push({
            pathname: '/offer/view',
            params: { businessId: businessAccount.id }
        });
    }

    return (
        <TESTHOME 
            businessAccount={businessAccount}
            onSignOutPress={onSignOutPress}
            onManageAdminsPress={onManageAdminsPress}
            onManageOffersPress={onManageOffersPress}
            adminProfile={profile}
            error={error}/>
    );
}

const TESTHOME =({
    businessAccount,
    onSignOutPress,
    onManageAdminsPress,
    onManageOffersPress,
    adminProfile,
    error,
}) => {
    return (
        <View>
            <Text>Admin screen</Text>
            { error && <Text>{error}</Text>}
            <View style={styles.adminInfo}>
                <Text>BUSINESS INFORMATION</Text>
                {
                    businessAccount
                        ? <View>
                            <Text>  Business Name: {businessAccount?.businessName}</Text>
                            <Text>  Address: {businessAccount?.address}</Text>
                            <Text>  Province: {businessAccount?.province}</Text>
                            <Text>  Approved: {businessAccount?.createdAt?.toDate().toLocaleDateString()}</Text>
                            <Text>  Status: {businessAccount?.active ? 'Active' : 'Archived'}</Text>
                        </View>
                        : <Text> Loading </Text>
                }
            </View>

            <View style={styles.adminInfo}>
                <Text>ADMIN INFORMATION</Text>
                <Text>  Admin Name: {adminProfile?.firstname} {adminProfile?.lastname} </Text>
                <Text>  Username: {adminProfile?.username}</Text>
                <Text>  Address: {adminProfile?.address}</Text>
                <Text>  Province: {adminProfile?.email}</Text>
            </View>

            <Pressable onPress={onSignOutPress}>
                <Text>Sign out</Text>
            </Pressable>
            
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