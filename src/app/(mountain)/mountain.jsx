import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function mountain(){
    const router = useRouter();

    const onBook = () => {
        router.push('/(offer)/book')
    }

    return(
        <View>
            <Text>Mountain</Text>
            <Pressable onPress={onBook}>
                <Text>Book Mountain</Text>
            </Pressable>
        </View>
    )
}