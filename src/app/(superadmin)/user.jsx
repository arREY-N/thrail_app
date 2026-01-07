import { useUsersStore } from "@/src/core/stores/usersStore";
import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function user(){
    const loadUsers = useUsersStore((state) => state.loadUsers);
    const users = useUsersStore((state) => state.users);
    const deleteAccount = useUsersStore((state) => state.deleteAccount);

    useEffect(() => {
        loadUsers();
    }, []);

    const onDeleteAccountPress = async (id) => {
        if(!id) {
            console.log('INVALID ID');
            return;
        }
        console.log('Deleting: ', id)
        await deleteAccount(id);
    }

    return (
        <TESTUSER
            users={users}
            onDeleteAccountPress={onDeleteAccountPress}
        />
    );
}

const TESTUSER = ({
    users,
    onDeleteAccountPress
}) => {
    return(
        <ScrollView>
            <Text>Users</Text>
            {
                users ? users.map((u) => {
                    return(
                        <Pressable onPress={() => onDeleteAccountPress(u.id)} style={styles.userCard}>
                            <Text>ID: {u.id}</Text>
                            <Text>Name: {u.firstname} {u.lastname}</Text>
                            <Text>Email: {u.email}</Text>
                            <Text>Role: {u.role}</Text>
                        </Pressable>
                    )
                }) : <></>
            }
            <View style={{margin: 50}}/>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    userCard: {
        borderWidth: 1,
        margin: 10,
    }
})