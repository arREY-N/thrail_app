import useSuperadminDomain from "@/src/core/hook/useSuperadminDomain";
import { formatDate } from "@/src/core/utility/date";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function listApplications(){
    const {
        pendingApplication,
        approvedApplication,
        rejectedApplication,
        onViewApplicationPress,
    } = useSuperadminDomain();

    return(
        <TESTAPPLICATIONLIST
            pendingApplication={pendingApplication}
            approvedApplication={approvedApplication}
            rejectedApplication={rejectedApplication}
            onViewApplicationPress={onViewApplicationPress}
        />
    )
}

const TESTAPPLICATIONLIST = ({
    pendingApplication,
    approvedApplication,
    rejectedApplication,
    onViewApplicationPress,  
}) => {
    return(
        <View>
            <Text>APPLICATIONS</Text>

            <View style={styles.group}>
                <Text>PENDING APPLICATIONS</Text>
                { pendingApplication.length > 0 
                    ? pendingApplication.map(a => {
                        console.log(a);
                        console.log(formatDate(a.createdAt));
                        return(
                            <Pressable onPress={() => onViewApplicationPress(a.id)}>
                                <Text>Application ID: {a.id}</Text>
                                <Text>Applicant: {a.name}</Text>
                                <Text>Created At: {formatDate(a.createdAt)}</Text>
                                <Text>View application</Text>
                            </Pressable>
                        )
                    })
                    : <Text>No pending applications</Text>
                }
            </View>
            <View style={styles.group}>
                <Text>APPROVED APPLICATIONS</Text>
                { approvedApplication.length > 0 
                    ? approvedApplication.map(a => {
                        console.log(a);
                        console.log(formatDate(a.createdAt));
                        return(
                            <Pressable onPress={() => onViewApplicationPress(a.id)}>
                                <Text>Application ID: {a.id}</Text>
                                <Text>Applicant: {a.name}</Text>
                                <Text>Created At: {formatDate(a.createdAt)}</Text>
                                <Text>View application</Text>
                            </Pressable>
                        )
                    })
                    : <Text>No approved applications</Text>
                }
            </View>
            <View style={styles.group}>
                <Text>REJECTED APPLICATIONS</Text>
                { rejectedApplication.length > 0 
                    ? rejectedApplication.map(a => {
                        console.log(a);
                        console.log(formatDate(a.createdAt));
                        return(
                            <Pressable onPress={() => onViewApplicationPress(a.id)}>
                                <Text>Application ID: {a.id}</Text>
                                <Text>Applicant: {a.name}</Text>
                                <Text>Created At: {formatDate(a.createdAt)}</Text>
                                <Text>View application</Text>
                            </Pressable>
                        )
                    })
                    : <Text>No rejected applications</Text>
                }
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    group: {
        padding: 10,
        margin: 10,
        borderWidth: 1,
    }
})