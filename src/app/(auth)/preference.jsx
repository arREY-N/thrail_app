import { useAccount } from "@/src/core/context/AccountProvider";
import { useAuth } from "@/src/core/context/AuthProvider";
import { finishOnboarding } from "@/src/core/FirebaseAuthUtil";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function preference(){
    const router = useRouter();
    const { user } = useAuth();
    const [error, setError] = useState();
    const { questions, setAnswer, savePreference, resetPreferences } = useAccount(); 

    const onFinishedPreference = async () => {
        try {
            const finalPreferences = savePreference();
            console.log('Trying to save preference');
            await finishOnboarding(user.uid, finalPreferences);
            resetPreferences();
        } catch (err) {
            setError(err.message);
        }
    }

    return(
        <View>
            {error && <Text>{error}</Text>}
            <Text>Preference Screen (Test Screen Only)</Text>
            {
                Object.entries(questions).map(([id, value]) => { // iterates through the preferences object
                    return( // ito yung UI to display each qustion
                        // dapat may 'key' lagi pag nag i-iterate ng objects
                        <View style={styles.prefQuestion} key={id}>
                            {/**value[question] = looks for the specific question */} 
                            <Text>{ value['question']} </Text>
                            {
                                // value['options'] = looks for the options don sa question
                                value['options'].map(opt => {
                                    return (
                                        // setAnswer( question id, then yung sagot)
                                        <Pressable onPress={() => setAnswer(id, opt)}>
                                            <Text>{opt}</Text>
                                        </Pressable>
                                    )
                                })
                            }
                            {/** test lang kung na-s-save yung answer */}
                            <Text>Answer: {value['answer']}</Text>
                        </View>
                    )
                })
            }

            <Pressable onPress={onFinishedPreference}>
                <Text>Finish Onboarding</Text>
            </Pressable>

            <Pressable onPress={() => router.replace('/(tabs)/home')}>
                <Text>Skip for now</Text>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    prefQuestion: {
        marginVertical: 10
    }
})