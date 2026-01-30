import { useUsersStore } from "@/src/core/stores/usersStore";
import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function user(){
    const system = useUsersStore(s => s.error);
    const isLoading = useUsersStore(s => s.isLoading);
    const loadUsers = useUsersStore(s => s.loadUsers);
    const users = useUsersStore(s => s.users);
    const onDeleteAccountPress = useUsersStore(s => s.deleteAccount);

    useEffect(() => {
        loadUsers();
    }, []);

    return (
        <TESTUSER
            isLoading={isLoading}
            system={system}
            users={users}
            onDeleteAccountPress={onDeleteAccountPress}
        />
    );
}

const TESTUSER = ({
    isLoading,
    system,
    users,
    onDeleteAccountPress
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
                        <Pressable onPress={() => onDeleteAccountPress(u.id)}>
                            <Text>Delete Account</Text>
                        </Pressable>
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