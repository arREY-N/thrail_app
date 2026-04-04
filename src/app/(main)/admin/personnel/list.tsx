import LoadingScreen from "@/src/app/loading";
import UnauthorizedScreen from "@/src/app/unauthorized";
import CustomButton from "@/src/components/CustomButton";
import { useAdmin } from "@/src/core/hook/admin/useAdmin";
import useAdminNavigation from "@/src/core/hook/navigation/useAdminNavigation";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Admin } from "@/src/core/models/Admin/Admin";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function personnelList(){
    const { profile, businessId, role, isLoading } = useAuthHook(); 

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
        <TESTPERSONNEL
            businessId={businessId}
            businessAdmins={businessAdmins}
            onReloadPress={onReloadPress}
            onAddAdminPress={onAddAdminPress}
        />
    )
}

export type TestPersonnelParams = {
    businessId: string;
    businessAdmins: Admin[],
    onReloadPress: (businessId: string) => Promise<void>,
    onAddAdminPress: () => void,
}

const TESTPERSONNEL = ({
    businessId,
    businessAdmins,
    onReloadPress,
    onAddAdminPress,
}: TestPersonnelParams) => {
    return(
        <View>
            <CustomButton 
                title={'Add Admins'}
                onPress={onAddAdminPress}
                style={undefined}
                textStyle={undefined} children={undefined}            />

            { businessAdmins.map((a) => {
                    return(
                        <View style={styles.admin}>
                            <Text>ID: {a.id}</Text>
                            <Text>NAME: {a.firstname} {a.lastname}</Text>
                            <Text>USERNAME: {a.username}</Text>
                            <Text>EMAIL: {a.email}</Text>
                        </View>
                    )
                })
            }
            <Pressable onPress={() => onReloadPress(businessId)}>
                <Text>===RELOAD ADMINS===</Text>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    admin: {
        borderWidth: 1,
        margin: 5,
        padding: 5
    }
})