import useApply from "@/src/core/hook/apply/useApply";
import useSuperadminDomain from "@/src/core/hook/superadmin/useSuperadminDomain";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { formatDate } from "@/src/core/utility/date";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function listApplications(){
    const { role } = useAuthHook();
    const { onViewApplicationPress } = useSuperadminDomain();

    const { applications } = useApply({ role });

    return(
        <TESTAPPLICATIONLIST
            applications={applications}
            onViewApplicationPress={onViewApplicationPress}
        />
    )
}

const TESTAPPLICATIONLIST = ({
    applications,
    onViewApplicationPress,  
}) => {
    const pendingApplication = applications.filter(a => a.status === 'pending');
    const approvedApplication = applications.filter(a => a.status === 'approved');
    const rejectedApplication = applications.filter(a => a.status === 'rejected');

    return(
        <ScrollView>
            <Text>APPLICATIONS</Text>

            <Text>PENDING APPLICATIONS</Text>
            { pendingApplication.length > 0 
                ? pendingApplication.map(a => {
                    console.log(a);
                    console.log(formatDate(a.createdAt));
                    return(
                        <View style={styles.group}>
                            <Pressable onPress={() => onViewApplicationPress(a.id)}>
                                <Text>Application ID: {a.id}</Text>
                                <Text>Applicant: {a.name}</Text>
                                <Text>Created At: {formatDate(a.createdAt)}</Text>
                                <Text>View application</Text>
                            </Pressable>
                        </View>
                    )
                })
                : <Text>No pending applications</Text>
            }

            <Text>APPROVED APPLICATIONS</Text>
            { approvedApplication.length > 0 
                ? approvedApplication.map(a => {
                    console.log(a);
                    console.log(formatDate(a.createdAt));
                    return(
                        <View style={styles.group}>
                            <Pressable onPress={() => onViewApplicationPress(a.id)}>
                                <Text>Application ID: {a.id}</Text>
                                <Text>Applicant: {a.name}</Text>
                                <Text>Created At: {formatDate(a.createdAt)}</Text>
                                <Text>View application</Text>
                            </Pressable>
                        </View>
                    )
                })
                : <Text>No pending applications</Text>
            }

            <Text>REJECTED APPLICATIONS</Text>
            { rejectedApplication.length > 0 
                ? rejectedApplication.map(a => {
                    console.log(a);
                    console.log(formatDate(a.createdAt));
                    return(
                        <View style={styles.group}>
                            <Pressable onPress={() => onViewApplicationPress(a.id)}>
                                <Text>Application ID: {a.id}</Text>
                                <Text>Applicant: {a.name}</Text>
                                <Text>Created At: {formatDate(a.createdAt)}</Text>
                                <Text>View application</Text>
                            </Pressable>
                        </View>
                    )
                })
                : <Text>No pending applications</Text>
            }
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    group: {
        padding: 10,
        margin: 10,
        borderWidth: 1,
    }
})