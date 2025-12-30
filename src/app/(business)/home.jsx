import { auth } from '@/src/core/config/Firebase';
import { signOut } from "firebase/auth";
import { Pressable, Text, View } from "react-native";

export default function home(){

    const onSignOut = async () => {
        try{
            await signOut(auth);
        } catch (err) {
            console.error('Error:', err);
        }
    }


    return(
        <View>
            <Text>Admin screen</Text>
            <Pressable onPress={onSignOut}>
                <Text>Sign out</Text>
            </Pressable>
        </View>
    )
}