import { useAccount } from "@/src/core/context/AccountProvider";
import { onSignUp } from "@/src/core/domain/authDomain";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function tac(){
    const router = useRouter();
    const [error, setError] = useState();
    const { account } = useAccount(); 
    
    const onAcceptPress = async () => {
        try {
            await onSignUp(account);
        } catch (err) {
            setError(err)
        }
    }

    const onDeclinePress = async () => {
        console.log('Alert user that this will cancel the whole process');
        router.replace('/(auth)/landing');
    }

    const onBackPress = () => {
        router.back();
    }

    return(
        <View>
            { error && <Text>{error.message}</Text>}
            <Text>TAC</Text>

            <Pressable onPress={onAcceptPress}>
                <Text>Accept</Text>
            </Pressable>

            <Pressable onPress={onDeclinePress}>
                <Text>Decline</Text>
            </Pressable>

            <Pressable onPress={onBackPress}>
                <Text>Back</Text>
            </Pressable>
        </View>
    )
}
