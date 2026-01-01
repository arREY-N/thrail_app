import { auth } from '@/src/core/config/Firebase';
import { useRouter } from 'expo-router';
import { signOut } from "firebase/auth";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Pressable, ScrollView, Text } from "react-native";

export default function home(){
    const router = useRouter();

    const onSignOut = async () => {
        try{
            await signOut(auth);
        } catch (err) {
            console.error('Error:', err);
        }
    }

    const createBusinessAdmin = async (businessId) => {
        const functions = getFunctions();
        
        const createAdmin = httpsCallable(functions, 'createAdmin');
        try{
            const result = await createAdmin({
                businessId
            });

            console.log(`Admin created ${result.businessId}`);
        } catch (err) {
            console.error('Failed to create new business admin', err);
        }
    }

    const onManageBusinessPress = () => {
        console.log('Manage Business');
        router.push('/(superadmin)/business');
    }

    const onManageTrailsPress = () => {
        console.log('Manage trails');
        router.push('/(superadmin)/trail');
    }

    return(
        <ScrollView>
            <Text>Super admin screen</Text>
            <Pressable onPress={onSignOut}>
                <Text>Sign out</Text>
            </Pressable>

            <Pressable onPress={onManageBusinessPress}>
                <Text>Manage Businesses</Text>
            </Pressable>

            <Pressable onPress={onManageTrailsPress}>
                <Text>Manage Trails</Text>
            </Pressable>
        </ScrollView>
    )
}