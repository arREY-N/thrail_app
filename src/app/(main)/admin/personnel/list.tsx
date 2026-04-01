// TODO: remove the unused import once front end implemented
import LoadingScreen from "@/src/app/loading";
import UnauthorizedScreen from "@/src/app/unauthorized";
import { useAdmin } from "@/src/core/hook/admin/useAdmin";
import useAdminNavigation from "@/src/core/hook/navigation/useAdminNavigation";

import { useAuthHook } from "@/src/core/hook/user/useAuthHook";

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import PersonnelListScreen from "@/src/features/Admin/screens/Personnel/PersonnelListScreen";
import { Stack } from 'expo-router';

export default function personnelList(){
    const { profile, businessId, role, isLoading } = useAuthHook(); 
    
    const {onBackPress} = useAppNavigation();

    if(isLoading) return <LoadingScreen/>

    if(!profile || !businessId || !role) return <UnauthorizedScreen/>

    const {
        businessAdmins,
        onReloadPress
    } = useAdmin({ businessId });

    const { onAddAdminPress } = useAdminNavigation({
        userId: profile.id,
        businessId,
        role,
    });


    return(
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <PersonnelListScreen
                businessId={businessId}
                businessAdmins={businessAdmins}
                onReloadPress={onReloadPress}
                onAddAdminPress={onAddAdminPress}
                onBackPress={onBackPress} 
            />
        </>
        
        // <TESTPERSONNEL
        //     businessId={businessId}
        //     businessAdmins={businessAdmins}
        //     onReloadPress={onReloadPress}
        //     onAddAdminPress={onAddAdminPress}
        // />
    )
}

// export type TestPersonnelParams = {
//     businessId: string;
//     businessAdmins: Admin[],
//     onReloadPress: (businessId: string) => Promise<void>,
//     onAddAdminPress: () => void,
// }

// const TESTPERSONNEL = ({
//     businessId,
//     businessAdmins,
//     onReloadPress,
//     onAddAdminPress,
// }: TestPersonnelParams) => {
//     return(
//         <View>
//             <CustomButton 
//                 title={'Add Admins'}
//                 onPress={onAddAdminPress}
//                 style={undefined}
//                 textStyle={undefined} children={undefined}            />

//             { businessAdmins.map((a) => {
//                     return(
//                         <View style={styles.admin}>
//                             <Text>ID: {a.id}</Text>
//                             <Text>NAME: {a.firstname} {a.lastname}</Text>
//                             <Text>USERNAME: {a.username}</Text>
//                             <Text>EMAIL: {a.email}</Text>
//                         </View>
//                     )
//                 })
//             }
//             <Pressable onPress={() => onReloadPress(businessId)}>
//                 <Text>===RELOAD ADMINS===</Text>
//             </Pressable>
//         </View>
//     )
// }

// const styles = StyleSheet.create({
//     admin: {
//         borderWidth: 1,
//         margin: 5,
//         padding: 5
//     }
// })