import { useAuthStore } from "@/src/core/stores/authStore";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function tac(){
    const router = useRouter();
    const error = useAuthStore(s => s.error);
    const isLoading = useAuthStore(s => s.isLoading);
    const signUp = useAuthStore(s => s.signUp);
    const profile = useAuthStore(s => s.profile);
    const user = useAuthStore(s => s.user);

    const onAcceptPress = async () => {
        await signUp();
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
            { (isLoading || (user && !profile)) && <Text>Loading</Text>}
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
