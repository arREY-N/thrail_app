import { useApplicationsStore } from '@/src/core/stores/applicationsStore';
import { useBusinessesStore } from '@/src/core/stores/businessesStore';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function business(){
    const applicationsIsLoading = useApplicationsStore(s => s.isLoading);
    const applications = useApplicationsStore(s => s.applications);
    const approveApplication = useApplicationsStore(s => s.approveApplication);
    const loadApplications = useApplicationsStore(s => s.loadApplications);
    const reloadApplications = useApplicationsStore(s => s.reloadApplications);
    
    const businessesIsLoading = useBusinessesStore(s => s.isLoading);
    const businesses = useBusinessesStore(s => s.businesses);
    const addBusiness = useBusinessesStore(s => s.addBusiness);
    const deleteBusiness = useBusinessesStore(s => s.deleteBusiness);
    const loadBusinesses = useBusinessesStore(s => s.loadBusinesses);

    useEffect(() => {
        loadBusinesses();
        loadApplications();
    }, []);

    const approveApplicationPress = async (applicationData) => {
        await approveApplication(applicationData.userId);            
        await addBusiness(applicationData);
    }
    
    const onDeletePress = async (id) => {
        await deleteBusiness(id);
    }

    return(
        <TESTBUSINESS
            reloadApplications={reloadApplications}
            applications={applications}
            approveApplicationPress={approveApplicationPress}
            businesses={businesses}
            onDeletePress={onDeletePress}
            applicationsIsLoading={applicationsIsLoading}
            businessIsLoading={businessesIsLoading}
        />
    )
}

const TESTBUSINESS = ({
    reloadApplications,
    applications,
    approveApplicationPress,
    businesses,
    onDeletePress,
    applicationsIsLoading,
    businessIsLoading
}) => {
    return (
        <ScrollView>
            <Text>Superadmin Business Screen</Text>
            <Text>--BUSINESS APPLICATIONS--</Text>
            
            { applicationsIsLoading  && <Text>LOADING APPLICATIONS</Text>}
            <Pressable onPress={reloadApplications}>
                <Text>=============RELOAD=============</Text>
            </Pressable>
            {
                applications 
                    ? applications.filter(a => a.approved === false).map(a => {                
                        return(
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
                        )    
                    }) 
                    : <Text>Applications loading</Text>

            }

            <View style={styles.users}>
                <Text>-----ACTIVE BUSINESSES-----</Text>
                {
                    (!businessIsLoading && businesses) ? 
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