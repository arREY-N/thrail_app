import { useAuthStore } from '@/src/core/stores/authStore';
import { useBusinessesStore } from '@/src/core/stores/businessesStore';
import { resetData } from '@/src/core/stores/dataStore';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from "react-native";
import LoadingScreen from '../loading';

export default function home(){
    const [system, setSystem] = useState(null);
    const router = useRouter();

    const businessAccount = useBusinessesStore((state) => state.businessAccount);
    const signOut = useAuthStore((state) => state.signOut);
    const profile = useAuthStore((state) => state.profile);
    
    const onSignOutPress = async () => {
        try{
            resetData();
            await signOut();
        } catch (err) {
            console.error('Error:', err);
        }
    }

    const onManageAdminsPress = () => {
        console.log('Manage admins');
        router.push('/(admin)/personnel');    
    }

    const onManageOffersPress = () => {
        console.log('Manage offers');
        router.push('/(admin)/offer');
    }

    if(!businessAccount) return <LoadingScreen/>;

    return (
        <TESTHOME 
            businessAccount={businessAccount}
            onSignOutPress={onSignOutPress}
            onManageAdminsPress={onManageAdminsPress}
            onManageOffersPress={onManageOffersPress}
            adminProfile={profile}/>
    );
}

const TESTHOME =({
    businessAccount,
    onSignOutPress,
    onManageAdminsPress,
    onManageOffersPress,
    adminProfile,
}) => {
    return (
        <View>
            <Text>Admin screen</Text>
            <View style={styles.adminInfo}>
                <Text>BUSINESS INFORMATION</Text>
                <Text>  Business Name: {businessAccount?.businessName}</Text>
                <Text>  Address: {businessAccount?.address}</Text>
                <Text>  Province: {businessAccount?.province}</Text>
                <Text>  Approved: {businessAccount?.createdAt?.toDate().toLocaleDateString()}</Text>
                <Text>  Status: {businessAccount?.active ? 'Active' : 'Archived'}</Text>
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