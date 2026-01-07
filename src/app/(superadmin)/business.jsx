import { useApplicationsStore } from '@/src/core/stores/applicationsStore';
import { useBusinessesStore } from '@/src/core/stores/businessesStore';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function business(){
    const applications = useApplicationsStore((state) => state.applications);
    const approveApplication = useApplicationsStore((state) => state.approveApplication);
    const loadApplications = useApplicationsStore((state) => state.loadApplications);
    const reloadApplications = useApplicationsStore((state) => state.reloadApplications);

    const businesses = useBusinessesStore((state) => state.businesses);
    const addBusiness = useBusinessesStore((state) => state.addBusiness);
    const deleteBusiness = useBusinessesStore((state) => state.deleteBusiness);
    const loadBusinesses = useBusinessesStore((state) => state.loadBusinesses);

    useEffect(() => {
        loadBusinesses();
        loadApplications();
    }, []);

    const approveApplicationPress = async (applicationData) => {
        setError(null);
        try{
            await approveApplication(applicationData.userId);            
            await addBusiness(applicationData);
        } catch (err) {
            setError(err);
        }
    }
    
    const onDeletePress = async (id) => {
        setError(null);
        try{
            await deleteBusiness(id);
        } catch (err) {
            setError(err);
        }
    }

    return(
        <TESTBUSINESS
            reloadApplication={reloadApplications}
            applications={applications}
            approveApplicationPress={approveApplicationPress}
            businesses={businesses}
            onDeletePress={onDeletePress}
        />
    )
}

const TESTBUSINESS = ({
    reloadApplications,
    applications,
    approveApplicationPress,
    businesses,
    onDeletePress,
}) => {
    return (
        <ScrollView>
            <Text>Superadmin Business Screen</Text>
            <Text>--BUSINESS APPLICATIONS--</Text>
            <Pressable onPress={() => reloadApplications}>
                <Text>=============RELOAD=============</Text>
            </Pressable>
            {
                applications ? 
                    applications.map(a => {                
                        return !a.approved ? (
                            <View style={styles.application} key={a.id}>
                                <Text>{a.businessName}</Text>
                                <Text>{a.email}</Text>
                                <Pressable onPress={() => approveApplicationPress({
                                    userId: a.userId,
                                    appId: a.id,
                                    email: a.email, 
                                    businessName: a.businessName,
                                    address: a.businessAddress,
                                    province: a.province})}>
                                    <Text>Approve Request</Text>
                                </Pressable>
                            </View>   
                        ) : <></>
                    }) :
                    <Text>Applications loading</Text>

            }

            <View style={styles.users}>
                <Text>-----ACTIVE BUSINESSES-----</Text>
                {
                    businesses ? 
                        businesses.filter(b => b.active === true).map((b) => {
                            return(
                                <View key={b.id} style={styles.business}>
                                    <Text>ID: {b.id}</Text>
                                    <Text>Name: {b.businessName}</Text>
                                    <Text>Address: {b.address}</Text>
                                    <Text>Created: {b.createdAt?.toDate().toLocaleDateString('en-us', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}</Text>
                                    {
                                        true && 
                                        
                                        <Pressable onPress={() => onDeletePress(b.id)}>
                                            <Text>--DELETE</Text>
                                        </Pressable>
                                    }
                                </View>
                            )
                        })
                        :
                        <Text>--Loading businesses</Text> 
                }
                <Text>-----ARCHIVED BUSINESSES-----</Text>
                {
                    businesses ? 
                        businesses.filter(b => b.active === false).map((b) => {
                            return(
                                <View key={b.id} style={styles.business}>
                                    <Text>ID: {b.id}</Text>
                                    <Text>Name: {b.businessName}</Text>
                                    <Text>Address: {b.address}</Text>
                                    <Text>Created: {b.createdAt?.toDate().toLocaleDateString('en-us', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}</Text>
                                </View>
                            )
                        })
                        :
                        <Text>--Loading businesses</Text> 
                }
            </View>    
            <View style={{margin: 100}}/>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    application: {
        marginVertical: 5
    },
    business: {
        margin: 5
    }
})