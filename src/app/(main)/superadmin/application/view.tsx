import LoadingScreen from "@/src/app/loading";
import CustomButton from "@/src/components/CustomButton";
import CustomTextInput from "@/src/components/CustomTextInput";
import useManageApplication from "@/src/core/hook/superadmin/useManageApplication";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Application } from "@/src/core/models/Application/Application";
import { formatDate } from "@/src/core/utility/date";
import getSearchParam from "@/src/core/utility/getSearchParam";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function viewApplication(){
    const { applicationId } = useLocalSearchParams();
    const appId = getSearchParam(applicationId);
    
    const { role } = useAuthHook();

    const controller = useManageApplication({ applicationId: appId, role });

    if(controller.isLoading) return <LoadingScreen/>

    return(
        <TESTAPPLICATION {...controller}/>
    )
}

type ApplicationScreenParams = {
    application: Application,
    onApproveApplication: (id: string) => void,
    onRejectApplication: (id: string) => void,
    setRejectionLetter: (text: string) => void,
    error: string | null,
}

const TESTAPPLICATION = (params: ApplicationScreenParams) => {
    const { 
        application,
        onApproveApplication,
        onRejectApplication,
        setRejectionLetter,
        error,
    } = params;

    return(
        <View>
            { error && <Text>{ error }</Text>}
            <View style={styles.group}>
                <Text>Application</Text>
                <Text>Applied on: {formatDate(application.createdAt)}</Text>
                <Text>Status: {application.status}</Text>
            </View>
            
            <View style={styles.group}>
                <Text>Applicant</Text>
                <Text>Name: {application.owner.name}</Text>
                <Text>ID: {application.owner.id}</Text>
                <Text>Email: {application.owner.email}</Text>
            </View>
            
            <View style={styles.group}>
                <Text>Business</Text>
                <Text>Name: {application.name}</Text>
                <Text>Address: {application.address}</Text>
                <Text>Established on: {formatDate(application.establishedOn)}</Text>
                <Text>Locations: {application.servicedLocation.join(', ')}</Text>
            </View>

            <View style={styles.group}>
                <Text>Permits</Text>
                <Text>DENR: {application.permits.denr}</Text>
                <Text>DTI: {application.permits.dti}</Text>
                <Text>BIR: {application.permits.bir}</Text>
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
                        value={application.message}
                        onChangeText={(text: string) => setRejectionLetter(text)}
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