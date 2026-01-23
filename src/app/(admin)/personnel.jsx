import CustomTextInput from "@/src/components/CustomTextInput";
import { useAuthStore } from "@/src/core/stores/authStore";
import { useBusinessesStore } from "@/src/core/stores/businessesStore";
import { useUsersStore } from "@/src/core/stores/usersStore";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function personnel(){
    const loadUserByEmail = useUsersStore(s => s.loadUserByEmail);
    const profile = useAuthStore(s => s.profile);

    const businessAdmins = useBusinessesStore(s => s.businessAdmins);
    const businessAccount = useBusinessesStore(s => s.businessAccount);
    const createBusinessAdmin = useBusinessesStore(s => s.createBusinessAdmin);
    const reloadBusinessAdmins = useBusinessesStore(s => s.reloadBusinessAdmins);
    const isLoading = useBusinessesStore(s => s.isLoading);

    const [searchedUsers, setSearchedUsers] = useState([]);

    const [owner, setOwner] = useState(false);

    useEffect(() => {
        console.log(`${profile.id} === ${businessAccount.id}`);
        if(profile.id === businessAccount.id){
            setOwner(true);
        } else {
            setOwner(false);
        }
    }, [profile, businessAccount])
    
    const onFindUserPress = async (email) => {
        const user = await loadUserByEmail(email);
        if(user){
            setSearchedUsers([user]);
        } 
    }

    const onMakeAdminPress = async (user) => {
        await createBusinessAdmin({user, businessId: businessAccount.id})
        setSearchedUsers([]);
    }

    const onReloadPress = async () => {
        console.log('Reload');
        await reloadBusinessAdmins(businessAccount.id);
    }

    return(
        <TESTPERSONNEL
            businessAdmins={businessAdmins}
            onFindUserPress={onFindUserPress}
            searchedUsers={searchedUsers}
            onMakeAdminPress={onMakeAdminPress}
            onReloadPress={onReloadPress}
            owner={owner}
            isLoading={isLoading}/>
    );
}

const TESTPERSONNEL = ({
    businessAdmins,
    onFindUserPress,
    searchedUsers,
    onMakeAdminPress,
    onReloadPress,
    owner,
    isLoading
}) => {
    const [email, setEmail] = useState('');
    
    return(
        <View>
            <Text>Personnel Page</Text>
            { owner ?   
                <View>
                    { isLoading && <Text> LOADING </Text>} 
                    <CustomTextInput
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                    />

                    <Pressable onPress={() => onFindUserPress(email)}>
                        <Text>---Find user---</Text>
                    </Pressable>

                    {
                        searchedUsers.length > 0
                        ? searchedUsers.map((s) => {
                            return(
                                <View>
                                    <Text>ID: {s.id}</Text>
                                    <Text>Username: {s.username}</Text>
                                    <Text>Email: {s.email}</Text>
                                        { s.role === 'admin'
                                            ? <Text>ALREADY AN ADMIN</Text>
                                            : <Pressable onPress={() => {
                                                onMakeAdminPress(s)
                                                setEmail('');
                                            }}>
                                                <Text>-----MAKE ADMIN</Text>
                                            </Pressable>
                                        }
                                </View> 
                            )
                        }) : <Text>NO USER FOUND</Text>
                    }
                </View> : <></>
           }

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