import CustomTextInput from "@/src/components/CustomTextInput";
import { useAuthStore } from "@/src/core/stores/authStore";
import { useBusinessesStore } from "@/src/core/stores/businessesStore";
import { useUsersStore } from "@/src/core/stores/usersStore";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function personnel(){
    const loadUserByEmail = useUsersStore((state) => state.loadUserByEmail);
    const profile = useAuthStore((state) => state.profile);

    const businessAdmins = useBusinessesStore((state) => state.businessAdmins);
    const businessAccount = useBusinessesStore((state) => state.businessAccount);
    const createBusinessAdmin = useBusinessesStore((state) => state.createBusinessAdmin);
    const reloadBusinessAdmins = useBusinessesStore((state) => state.reloadBusinessAdmins);
    
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
            setSearchedUsers((prev) => {
                return prev.some(u => u.id == user?.id) 
                    ? prev 
                    : [...prev, user]
            });
        } 
    }

    const onMakeAdminPress = async (userId) => {
        await createBusinessAdmin({userId, businessId: businessAccount.id})
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
            owner={owner}/>
    );
}

const TESTPERSONNEL = ({
    businessAdmins,
    onFindUserPress,
    searchedUsers,
    onMakeAdminPress,
    onReloadPress,
    owner
}) => {
    const [email, setEmail] = useState('');
    
    return(
        <View>
            <Text>Personnel Page</Text>
            { owner ?   
                <View> 
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
                                <Pressable onPress={() => {
                                    onMakeAdminPress(s.id)
                                    setEmail('');
                                }}>
                                    <Text>ID: {s.id}</Text>
                                    <Text>Username: {s.username}</Text>
                                    <Text>Email: {s.email}</Text>
                                    <Text>-----MAKE ADMIN</Text>
                                </Pressable>
                            )
                        })
                        : <Text>NO USER FOUND</Text>
                    }
                </View> : <></>
           }

            <Text>ADMINS</Text>
            { businessAdmins.map((a) => {
                    return(
                        <Text>{a.id}</Text>
                    )
                })
            }
            <Pressable onPress={onReloadPress}>
                <Text>===RELOAD ADMINS===</Text>
            </Pressable>
        </View>
    )
}