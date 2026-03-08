import LoadingScreen from "@/src/app/loading";
import UnauthorizedScreen from "@/src/app/unauthorized";
import CustomTextInput from "@/src/components/CustomTextInput";
import useAdminWrite, { IUseAdminWrite } from "@/src/core/hook/admin/useAdminWrite";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function personnel(){
    const { profile, isLoading } = useAuthHook();

    if(isLoading) return <LoadingScreen/>

    if(!profile) return <UnauthorizedScreen/> 
    
    const controller = useAdminWrite({ userId: profile.id })

    return(
        <TESTPERSONNEL { ...controller }/>
    );
}

const TESTPERSONNEL = ({
    businessAdmins,
    onFindUserPress,
    searched,
    onMakeAdminPress,
    onReloadPress,
    isOwner,
    isLoading
}: IUseAdminWrite) => {
    const [email, setEmail] = useState('');
    
    return(
        <View>
            <Text>Personnel Page</Text>
            { isOwner ?   
                <View>
                    { isLoading && <Text> LOADING </Text>} 
                    <CustomTextInput
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail} label={undefined} secureTextEntry={undefined} keyboardType={undefined} isPasswordVisible={undefined} onTogglePassword={undefined} style={undefined} icon={undefined}                    />

                    <Pressable onPress={() => onFindUserPress(email)}>
                        <Text>---Find user---</Text>
                    </Pressable>

                    {
                        searched.length > 0
                        ? searched.map((s) => {
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