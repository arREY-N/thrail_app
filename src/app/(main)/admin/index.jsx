import { useAdmin } from '@/src/core/hook/useAdmin';
import { useAuthHook } from '@/src/core/hook/useAuthHook';
import { Pressable, StyleSheet, Text, View } from "react-native";

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
     

    return (
        <TESTHOME 
            businessAccount={businessAccount}
            onManageAdminsPress={onManageAdminsPress}
            onManageOffersPress={onManageOffersPress}
            adminProfile={profile}
            error={error}/>
    );
}

const TESTHOME =({
    businessAccount,
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
                            <Text>  Business Name: {businessAccount?.name}</Text>
                            <Text>  Address: {businessAccount?.address}</Text>
                            <Text>  Province: {businessAccount?.province}</Text>
                            <Text>  Approved: {businessAccount?.createdAt}</Text>
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