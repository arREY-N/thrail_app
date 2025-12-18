import { useAuth } from "@/src/core/context/AuthProvider";
import { finishOnboarding } from "@/src/core/FirebaseAuthUtil";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function preference(){
    const router = useRouter();
    const { user } = useAuth();
    
    const onFinishedPreference = async () => {
        console.log('Finished onboarding', user.uid);
        await finishOnboarding(user.uid);
    }

    // const [preference, setPreference] = useState({
    //     q1: {
    //         question: 'Question A:',
    //         type: 'boolean',
    //         answer: null,
    //         followUp: q1_a,
    //     },
    //     q1_a: {
    //         question: 'Question A1',
    //         type: ''
    //     },
    //     q2: {
    //         question: 'Question B: ',
    //         type: 'select',
    //     }
    // });

    return(
        <View>
            <Text>Preference Screen (Test Screen Only)</Text>
            <Pressable onPress={onFinishedPreference}>
                <Text>Finish Onboarding</Text>
            </Pressable>

            <Pressable onPress={() => router.replace('/(tabs)/home')}>
                <Text>Skip for now</Text>
            </Pressable>
        </View>
    )
}