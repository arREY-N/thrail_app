import { useAdmin } from "@/src/core/hook/useAdmin";
import { useAuthStore } from "@/src/core/stores/authStore";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function personnelList(){
    const {
        businessId
    } = useAuthStore();

    const {
        businessAdmins,
        onReloadPress
    } = useAdmin({ businessId });

    return(
        <TESTPERSONNEL
            businessAdmins={businessAdmins}
            onReloadPress={onReloadPress}
        />
    )
}

const TESTPERSONNEL = ({
    businessAdmins,
    onReloadPress,
}) => {
    return(
        <View>
            <Text>Personnel Page</Text>
            <Text>ADMINS</Text>
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
            <Pressable onPress={onReloadPress}>
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