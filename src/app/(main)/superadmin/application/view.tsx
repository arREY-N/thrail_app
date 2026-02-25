import LoadingScreen from "@/src/app/loading";
import CustomButton from "@/src/components/CustomButton";
import CustomTextInput from "@/src/components/CustomTextInput";
import useApplicationDomain from "@/src/core/hook/useApplicationDomain";
import { formatDate } from "@/src/core/utility/date";
import { Application } from "@/src/types/entities/Application";
import { useLocalSearchParams } from "expo-router";
import { Dispatch, SetStateAction } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function viewApplication(){
    const { applicationId } = useLocalSearchParams();

    const appId = Array.isArray(applicationId) ? applicationId[0] : ( applicationId ?? null);

    const { 
        application,
        rejectionLetter,
        isLoading,
        onApproveApplication,
        onRejectApplication,
        setRejectionLetter,
    } = useApplicationDomain({ applicationId: appId });

    console.log('View application: ', application);

    if(!application || isLoading) return <LoadingScreen/>

    return(
        <TESTAPPLICATION
            application={application}
            rejectionLetter={rejectionLetter}
            onApproveApplication={onApproveApplication}
            onRejectApplication={onRejectApplication}
            setRejectionLetter={setRejectionLetter}
        />
    )
}

type ApplicationScreenParams = {
    application: Application,
    onApproveApplication: (id: string) => void,
    onRejectApplication: (id: string) => void,
    setRejectionLetter: Dispatch<SetStateAction<string | null>>,
    rejectionLetter: string | null,
}

const TESTAPPLICATION = (params: ApplicationScreenParams) => {
    const { 
        application,
        onApproveApplication,
        onRejectApplication,
        setRejectionLetter,
        rejectionLetter,
    } = params;

    return(
        <View>
            <View style={styles.group}>
                <Text>Application</Text>
                <Text>Applied on: {formatDate(application.createdAt)}</Text>
                <Text>Status: {application.status}</Text>
            </View>
            
            <View style={styles.group}>
                <Text>Applicant</Text>
                <Text>Name: {application.name}</Text>
                <Text>ID: {application.validId}</Text>
                <Text>Email: {application.email}</Text>
            </View>
            
            <View style={styles.group}>
                <Text>Business</Text>
                <Text>Name: {application.businessName}</Text>
                <Text>Address: {application.businessAddress}</Text>
                <Text>Established on: {formatDate(application.establishedOn)}</Text>
                <Text>Locations: {application.servicedLocation.join(', ')}</Text>
            </View>

            <View style={styles.group}>
                <Text>Permits</Text>
                <Text>DENR: {application.denr}</Text>
                <Text>DTI: {application.dti}</Text>
                <Text>BIR: {application.bir}</Text>
            </View>

            { application.status !== 'approved' &&
                <View>
                    <CustomButton
                        title={'Approve'}
                        onPress={() => onApproveApplication(application.id)}
                        style={null}
                        textStyle={null}
                    />
        
                    <CustomButton
                        title={'Reject'}
                        onPress={() => onRejectApplication(application.id)}
                        style={null}
                        textStyle={null}
                    />
                    
                    <CustomTextInput
                        label={'Reason for rejection'}
                        placeholder={'Missing/invalid requirements, incomplete information, etc.'}
                        value={rejectionLetter}
                        onChangeText={setRejectionLetter}
                        secureTextEntry={false}
                        keyboardType={null}
                        isPasswordVisible={true}
                        onTogglePassword={null}
                        style={null}
                        icon={null}
                    />
                </View>
            }
        </View>
    )
}

const styles = StyleSheet.create({
    group: {
        borderWidth: 1,
        margin: 10,
        padding: 10,
    }
})