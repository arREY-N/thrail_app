import { Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

const UnauthorizedScreen = () => {
    const router = useRouter();
    return (
        <View>
            <Text>You do not have the proper authorization to access this page</Text>
            <Pressable onPress={() => router.replace('/')}>
                <Text> GO BACK </Text>
            </Pressable>
        </View>
    )
}

export default UnauthorizedScreen;