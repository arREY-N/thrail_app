import { auth } from '@/src/core/config/Firebase';
import { useSuperAdmin } from '@/src/core/context/SuperAdminProvider';
import { useRouter } from 'expo-router';
import { signOut } from "firebase/auth";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function home(){
    const { users, fetchUsers, loaded } = useSuperAdmin();
    const router = useRouter();

    useEffect(() => {
        fetchUsers();        
    },[])

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

    // const createBusinessPress = async ({email, businessName}) => {
    //     try{
    //         createBusiness()            
    //     } catch (err) {
    //         setError(err);
    //     } finally {
    //         setBusinessName('')
    //         setEmail('');
    //     }
    // }

    const onManageBusinessPress = () => {
        console.log('Manage Business');
        router.push('/(superadmin)/business');
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
            {
                loaded ? 
                    users.map((u) => {
                        return(
                            <View key={u.id} style={styles.user}>
                                <Text>User: {u.email}</Text>
                                <Text>Role: {u.role}</Text>
                            </View>
                        )
                    })
                    :
                    <Text>Loading users</Text> 
            }
        </ScrollView>
    )
}

const styles =  StyleSheet.create({
    user: {
        marginVertical: 10
    }
})