import { auth } from '@/src/core/config/Firebase';
import { useSuperAdmin } from '@/src/core/context/SuperAdminProvider';
import { signOut } from "firebase/auth";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useEffect } from 'react';
import { Pressable, Text, View } from "react-native";

export default function home(){
    const { users, fetchUsers, loaded } = useSuperAdmin();

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
            throw new Error('Failed to create new business admin');
        }
    }

    return(
        <View>
            <Text>Super admin screen</Text>
            <Pressable onPress={onSignOut}>
                <Text>Sign out</Text>
            </Pressable>
            {
                loaded ? 
                    users.map((u) => {
                        return(
                            <View key={u.id}>
                                <Text>User: {u.email}</Text>
                                <Text>Role: {u.role}</Text>
                                <Pressable onPress={() => createBusinessAdmin(u.id)}>
                                    <Text>Make Admin</Text>
                                </Pressable>
                            </View>
                            
                        )
                    })
                    :
                    <Text>Loading users</Text> 
            }
        </View>
    )
}

const addNewAdmin = ({accounts}) => {
    return(
        <View>
            
        </View>
    )
}