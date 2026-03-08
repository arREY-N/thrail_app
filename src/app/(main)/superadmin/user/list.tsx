import LoadingScreen from "@/src/app/loading";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import useUser, { IUserDomain } from "@/src/core/hook/user/useUser";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function listUsers(){
    const { role } = useAuthHook();

    const controller = useUser({ role });

    if(controller.isLoading) return <LoadingScreen/>
    
    return <TESTUSER { ...controller }/>;
}

const TESTUSER = (params: IUserDomain) => {
    const { error, isLoading, users } = params;
    return(
        <ScrollView>
            <Text>Users</Text>
            { error && <Text>{error}</Text> }
            { isLoading && <Text> Loading </Text>}
            { users && users.map((u) => {
                return(
                    <View key={u.id} style={styles.userCard}>
                        <Text>ID: {u.id}</Text>
                        <Text>Name: {u.firstname} {u.lastname}</Text>
                        <Text>Email: {u.email}</Text>
                        <Text>Role: {u.role}</Text>
                                                
                    </View>
                )}) 
            }
            <View style={{margin: 50}}/>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    userCard: {
        borderWidth: 1,
        margin: 10,
        padding: 10,
    }
})