import useSuperadminDomain from '@/src/core/hook/useSuperadminDomain';
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function superadminDashboard(){
    const {
        businesses,
        trails,
        superadmin,
        admin,
        users,
        mountains,
        applications,
        onManageBusinessPress,
        onManageTrailsPress,
        onManageUsersPress,
        onManageMountainPress,
        onManageApplicationPress,
    } = useSuperadminDomain();

    return(
        <TESTSUPERADMIN
            businessCount={businesses.length}
            trailCount={trails.length}
            userCount={users.length}
            adminCount={admin.length}
            superadminCount={superadmin.length}
            mountainCount={mountains.length}
            applicationCount={applications.length}
            onManageBusinessPress={onManageBusinessPress}
            onManageTrailsPress={onManageTrailsPress}
            onManageUsersPress={onManageUsersPress}
            onManageMountainPress={onManageMountainPress}
            onManageApplicationPress={onManageApplicationPress}
        />
    )
}

const TESTSUPERADMIN = ({
    businessCount,
    trailCount,
    userCount,
    adminCount,
    superadminCount,
    mountainCount,
    applicationCount,
    onManageBusinessPress,
    onManageTrailsPress,
    onManageUsersPress,
    onManageMountainPress,
    onManageApplicationPress,
}) => {
    return(
        <View>
            <Text>Superadmin Dashboard</Text>

            <Pressable style={styles.entityCard} onPress={onManageBusinessPress}>
                <Text>Businesses</Text>
                <Text>Count: {businessCount}</Text>
            </Pressable>

            <Pressable style={styles.entityCard} onPress={onManageApplicationPress}>
                <Text>Applications</Text>
                <Text>Count: {applicationCount}</Text>
            </Pressable>

            <Pressable style={styles.entityCard} onPress={onManageTrailsPress}>
                <Text>Trails</Text>
                <Text>Count: {trailCount}</Text>
            </Pressable>

            <Pressable style={styles.entityCard} onPress={onManageUsersPress}>
                <Text>Accounts</Text>
                <Text>Superadmin: {superadminCount}</Text>
                <Text>Admins: {adminCount}</Text>
                <Text>Users: {userCount}</Text>
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