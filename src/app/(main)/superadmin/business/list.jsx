import useSuperadmin from '@/src/core/hook/useSuperadmin';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function listBusiness(){
    const {
        applications,
        businesses,
        applicationLoading,
        businessesLoading,
        reloadApplications,
        reloadBusinesses,
        onApproveApplicationPress,
        onDeleteBusinessPress,
    } = useSuperadmin();

    return(
        <TESTBUSINESS
            applications={applications}
            businesses={businesses}
            applicationsIsLoading={applicationLoading}
            businessIsLoading={businessesLoading}
            reloadBusinesses={reloadBusinesses}
            reloadApplications={reloadApplications}
            approveApplicationPress={onApproveApplicationPress}
            onDeletePress={onDeleteBusinessPress}
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
    businessIsLoading,
    reloadBusinesses,
}) => {
    return (
        <ScrollView>
            <View style={styles.area}>
                <Text>--BUSINESS APPLICATIONS--</Text>
                
                { applicationsIsLoading && <Text>APPLICATION IS LOADING</Text>}
                { businessIsLoading && <Text>BUSINESS IS LOADING</Text>}

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
            </View>

            <View style={styles.area}>
                <Text>-----ACTIVE BUSINESSES-----</Text>
                <Pressable onPress={reloadBusinesses}>
                    <Text>=============RELOAD=============</Text>
                </Pressable>
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
        marginVertical: 5,
        padding: 10,
        borderWidth: 0.5,
    },
    area : {
        borderWidth: 1,
        margin: 10,
        padding: 10
    },
})