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
    const { 
        applications, 
        fetchApplications,
        loaded, 
        businesses, 
        fetchBusinesses 
    } = useSuperAdmin();
    
    useEffect(() => {   
        fetchApplications();
        fetchBusinesses();
    }, []);

    const approveApplicationPress = async (applicationData) => {
        setError(null);
        try{
            createBusiness(applicationData);            
            console.log(`Business created: \n${email}\n${businessName}`);
            
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
                        <View style={styles.application} key={a.id}>
                            <Text>{a.businessName}</Text>
                            <Text>{a.email}</Text>
            
                            <Pressable onPress={() => approveApplicationPress({
                                appId: a.id,
                                email: a.email, 
                                businessName: a.businessName})}>
                                <Text>Approve Request</Text>
                            </Pressable>
                        </View>   
                    )
                })
            }

            <View style={styles.users}>
                <Text>--BUSINESSES--</Text>
                {
                    loaded ? 
                        businesses.map((b) => {
                            return(
                                <View key={b.id} style={styles.user}>
                                    <Text>Owner: {b.ownerEmail}</Text>
                                    <Text>Email: {b.email}</Text>
                                    <Text>Created: {new Date(b.createdAt).toDateString()}</Text>
                                </View>
                            )
                        })
                        :
                        <Text>Loading users</Text> 
                }
            </View>    
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    application: {
        marginVertical: 5
    },
    users: {
        
    }
})