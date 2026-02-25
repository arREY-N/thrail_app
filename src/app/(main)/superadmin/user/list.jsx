import LoadingScreen from "@/src/app/loading";
import useUserDomain from "@/src/core/hook/useUserDomain";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function listUsers(){
    const {
        users,
        error,
        isLoading,
    } = useUserDomain();

    if(isLoading) return <LoadingScreen/>
    
    return (
        <TESTUSER
            isLoading={isLoading}
            system={error}
            users={users}
        />
    );
}

const TESTUSER = ({
    isLoading,
    system,
    users,
}) => {
    return(
        <ScrollView>
            <Text>Users</Text>
            { system && <Text>{system}</Text> }
            { isLoading && <Text> Loading </Text>}
            { users && users.map((u) => {
                return(
                    <View style={styles.userCard}>
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