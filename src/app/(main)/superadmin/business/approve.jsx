import CustomTextInput from '@/src/components/CustomTextInput';
import useSuperadmin from '@/src/core/hook/useSuperadmin';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function approveBusiness(){
    const {
        application,
        applicationLoading,
        onApproveApplicationPress,
        onRejectApplicationPress
    } = useSuperadmin();

    return(
        <TESTAPPLICATIONAPPROVE
            application={application}
            applicationsIsLoading={applicationLoading}
            onApproveApplicationPress={onApproveApplicationPress}
            onRejectApplicationPress={onRejectApplicationPress}
        />
    )
}

const TESTAPPLICATIONAPPROVE = ({
    application,
    onApproveApplicationPress,
    applicationsIsLoading,
    onRejectApplicationPress
}) => {
    return (
        <ScrollView>
            <View style={styles.area}>
                
                { applicationsIsLoading && <Text>APPLICATION IS LOADING</Text>}

                <View style={styles.application} key={application.id}>
                    <Text>Business Name: {application.businessName}</Text>
                    <Text>Applicant's Email: {application.email}</Text>
                    <Pressable onPress={() => onApproveApplicationPress({
                        userId: application.userId,
                        appId: application.id,
                        email: application.email, 
                        businessName: application.businessName,
                        address: application.businessAddress,
                        province: application.province})}>
                        <Text>Approve Request</Text>
                    </Pressable>
                    <Pressable onPress={() => onRejectApplicationPress()}>
                        <Text>Reject Request</Text>
                    </Pressable>

                    <CustomTextInput
                        label={'Why is the application rejected?'}
                        placeholder={'Missing documents, incomplete information, etc.'}
                        value={application.message || ''}
                        onChangeText={(text) => console.log(text)}
                    />
                </View>
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