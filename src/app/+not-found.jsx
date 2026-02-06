import { Stack } from "expo-router";
import { Text, View } from "react-native";

export default function notFound(){
    return(
        <>
            <Stack.Screen options={{title: 'Page not found'}}/>
            <View>
                <Text>Sorry, but the page you requested is unavailable</Text>
            </View>
        </>
    )
}