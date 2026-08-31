
import CustomHeader from "@/src/components/CustomHeader";
import ScreenWrapper from "@/src/components/ScreenWrapper";
import { Colors } from "@/src/constants/colors";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";

export default function ApproveBusiness() {
    // const {
    //     application,
    //     isLoading,
    //     onApproveApplication,
    //     onRejectApplication
    // } = useApplication();

    const { onBackPress } = useAppNavigation();

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader
                title="Applications"
                centerTitle={true}
                onBackPress={onBackPress}
            />

            {/* <TESTAPPLICATIONAPPROVE
                application={application}
                applicationsIsLoading={applicationLoading}
                onApproveApplicationPress={onApproveApplicationPress}
                onRejectApplicationPress={onRejectApplicationPress}
            /> */}
        </ScreenWrapper>
    )
}

// const TESTAPPLICATIONAPPROVE = ({
//     application,
//     onApproveApplicationPress,
//     applicationsIsLoading,
//     onRejectApplicationPress
// }: {
//     application: Record<string, string>;
//     onApproveApplicationPress: (data: Record<string, string>) => void;
//     applicationsIsLoading: boolean;
//     onRejectApplicationPress: () => void;
// }) => {
//     return (
//         <ScrollView>
//             <View style={styles.area}>

//                 {applicationsIsLoading && <Text>APPLICATION IS LOADING</Text>}

//                 <View style={styles.application} key={application.id}>
//                     <Text>Business Name: {application.businessName}</Text>
//                     <Text>Applicant&apos;s Email: {application.email}</Text>
//                     <Pressable onPress={() => onApproveApplicationPress({
//                         userId: application.userId,
//                         appId: application.id,
//                         email: application.email,
//                         businessName: application.businessName,
//                         address: application.businessAddress,
//                         province: application.province
//                     })}>
//                         <Text>Approve Request</Text>
//                     </Pressable>
//                     <Pressable onPress={() => onRejectApplicationPress()}>
//                         <Text>Reject Request</Text>
//                     </Pressable>

//                     <CustomTextInput
//                         label={'Why is the application rejected?'}
//                         placeholder={'Missing documents, incomplete information, etc.'}
//                         value={application.message || ''}
//                         onChangeText={(text) => console.log(text)}
//                     />
//                 </View>
//             </View>

//             <View style={{ margin: 100 }} />
//         </ScrollView>
//     )
// }

// const styles = StyleSheet.create({
//     application: {
//         marginVertical: 5
//     },
//     business: {
//         marginVertical: 5,
//         padding: 10,
//         borderWidth: 0.5,
//     },
//     area: {
//         borderWidth: 1,
//         margin: 10,
//         padding: 10
//     },
// })