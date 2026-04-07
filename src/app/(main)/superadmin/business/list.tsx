
import useSuperadmin from '@/src/core/hook/superadmin/useSuperadmin';
import { Application } from '@/src/core/models/Application/Application';
import { Business } from '@/src/core/models/Business/Business';
import { formatDate } from '@/src/core/utility/date';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import CustomHeader from "@/src/components/CustomHeader";
import ScreenWrapper from "@/src/components/ScreenWrapper";
import { Colors } from "@/src/constants/colors";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";

export default function listBusiness(){
    const {
        applications,
        businesses,
        applicationLoading,
        businessLoading,
        reloadApplications,
        reloadBusinesses,
        onApproveApplicationPress,
        onDeleteBusinessPress,
    } = useSuperadmin(null);

    const { onBackPress } = useAppNavigation();

    console.log('Applications: ', applications);
    return(
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                title="Business" 
                centerTitle={true} 
                onBackPress={onBackPress}
            />

            <TESTBUSINESS
                applications={applications}
                businesses={businesses}
                applicationsIsLoading={applicationLoading}
                businessIsLoading={businessLoading}
                reloadBusinesses={reloadBusinesses}
                reloadApplications={reloadApplications}
                approveApplicationPress={onApproveApplicationPress}
                onDeletePress={onDeleteBusinessPress}
            />
        </ScreenWrapper>
    )
}

type ScreenParams = {
    reloadApplications: () => void,
    applications: Application[],
    approveApplicationPress: (id: string) => void,
    businesses: Business[],
    onDeletePress: (id: string) => void,
    applicationsIsLoading: boolean,
    businessIsLoading: boolean,
    reloadBusinesses: () => void;
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
}: ScreenParams) => {
    console.log(businesses);
    return (
        <ScrollView>
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
                                    <Text>Name: {b.name}</Text>
                                    <Text>Address: {b.address}</Text>
                                    <Text>Created: {formatDate(b.createdAt)}</Text>
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
                                    <Text>Name: {b.name}</Text>
                                    <Text>Address: {b.address}</Text>
                                    <Text>Created: {formatDate(b.createdAt)}</Text>
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