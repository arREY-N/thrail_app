import useSuperadmin from '@/src/core/hook/useSuperadmin';
import { Pressable, Text, View, StyleSheet } from "react-native";
import LoadingScreen from '../../loading';

export default function superadminDashboard(){
    const {
        businessCount,
        trailCount,
        userCount,
        adminCount,
        mountainCount,
        loaded,
        onManageBusinessPress,
        onManageTrailsPress,
        onManageUsersPress,
        onManageMountainPress
    } = useSuperadmin();

    if(!loaded) return <LoadingScreen/>

    return(
        <TESTSUPERADMIN
            businessCount={businessCount}
            trailCount={trailCount}
            userCount={userCount}
            adminCount={adminCount}
            mountainCount={mountainCount}
            onManageBusinessPress={onManageBusinessPress}
            onManageTrailsPress={onManageTrailsPress}
            onManageUsersPress={onManageUsersPress}
            onManageMountainPress={onManageMountainPress}
        />
    )
}

const TESTSUPERADMIN = ({
    businessCount,
    trailCount,
    userCount,
    adminCount,
    mountainCount,
    onManageBusinessPress,
    onManageTrailsPress,
    onManageUsersPress,
    onManageMountainPress,
}) => {
    return(
        <View>
            <Text>Superadmin Dashboard</Text>

            <Pressable style={styles.entityCard} onPress={onManageBusinessPress}>
                <Text>Businesses</Text>
                <Text>Count: {businessCount}</Text>
            </Pressable>

            <Pressable style={styles.entityCard} onPress={onManageTrailsPress}>
                <Text>Trails</Text>
                <Text>Count: {trailCount}</Text>
            </Pressable>

            <Pressable style={styles.entityCard} onPress={onManageUsersPress}>
                <Text>Accounts</Text>
                <Text>Users: {userCount}</Text>
                <Text>Admins: {adminCount}</Text>
            </Pressable>

            <Pressable style={styles.entityCard} onPress={onManageMountainPress}>
                <Text>Mountains</Text>
                <Text>Count: {mountainCount}</Text>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    entityCard: {
        borderWidth: 1,
        padding: 10,
        margin: 10,
    }
})