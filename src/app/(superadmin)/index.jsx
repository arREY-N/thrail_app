import { auth } from '@/src/core/config/Firebase';
import { useRouter } from 'expo-router';
import { signOut } from "firebase/auth";
import { Pressable, ScrollView, Text } from "react-native";

export default function home(){
    const router = useRouter();

    const onSignOutPress = async () => {
        try{
            await signOut(auth);
        } catch (err) {
            console.error('Error:', err);
        }
    }

    const onManageBusinessPress = () => {
        console.log('Manage Business');
        router.push('/business/list');
    }

    const onManageTrailsPress = () => {
        console.log('Manage trails');
        router.push('/trail/list');
    }
    
    const onManageMountainPress = () => {
        console.log('Manage mountains');
        router.push('/mountain/list');
    }
    
    const onManageUsersPress = () => {
        console.log('Manage users');
        router.push('/(superadmin)/user');
    }


    return(
        <TESTHOME 
            onSignOutPress={onSignOutPress}
            onManageBusinessPress={onManageBusinessPress}
            onManageTrailsPress={onManageTrailsPress}
            onManageUsersPress={onManageUsersPress}
            onManageMountainPress={onManageMountainPress}
        />
    )
}

const TESTHOME = ({
    onSignOutPress,
    onManageBusinessPress,
    onManageTrailsPress,
    onManageUsersPress,
    onManageMountainPress,
}) => {
    return(
        <ScrollView>
            <Text>Super admin screen</Text>
            <Text>SKIP</Text>
            <Pressable onPress={onSignOutPress}>
                <Text>Sign out</Text>
            </Pressable>

            <Pressable onPress={onManageBusinessPress}>
                <Text>Manage Businesses</Text>
            </Pressable>

            <Pressable onPress={onManageTrailsPress}>
                <Text>Manage Trails</Text>
            </Pressable>

            <Pressable onPress={onManageUsersPress}>
                <Text>Manage Users</Text>
            </Pressable>

            <Pressable onPress={onManageMountainPress}>
                <Text>Manage Mountains</Text>
            </Pressable>

        </ScrollView>
    )
}