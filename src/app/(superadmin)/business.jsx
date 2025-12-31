import { useSuperAdmin } from '@/src/core/context/SuperAdminProvider';
import { createBusiness } from '@/src/core/domain/superAdminDomain';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

/**
 * Display business accounts
 * Display business admins
 * Approve business account creation request
 * Monitor business status 
 */
export default function business(){
    const [email, setEmail] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [error, setError] = useState(null);
    const { applications, fetchApplications } = useSuperAdmin();

    useEffect(() => {
        fetchApplications();
    }, [])
    const approveApplicationPress = async ({email, businessName}) => {
        setError(null);
        try{
            createBusiness({email, businessName});            
        } catch (err) {
            setError(err);
        } finally {
            setBusinessName('')
            setEmail('');
        }
    }

    return(
        <ScrollView>
            <Text>Superadmin Business Screen</Text>

            {
                applications.map(a => {
                    return (
                        <View style={styles.application}>
                            <Text>{a.businessName}</Text>
                            <Text>{a.email}</Text>
                        </View>   
                    )
                })
            }
            <Pressable onPress={() => approveApplicationPress({email, businessName})}>
                <Text>Create New Business</Text>
            </Pressable>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    application: {
        marginVertical: 5
    }
})