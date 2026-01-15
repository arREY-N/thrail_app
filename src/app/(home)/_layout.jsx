import { Stack } from "expo-router";

export default function HomeLayout(){
    return(
        <Stack>
            <Stack.Screen
                name='weather'
                options={{
                    title: 'Weather',
                    headerShown: false
                }}
            />
            
            <Stack.Screen
                name='recommendations'
                options={{
                    title: 'Recommendation'
                }}
            />
            
            <Stack.Screen
                name='trending'
                options={{
                    title: 'Trending'
                }}
            />
            
            <Stack.Screen
                name='notification'
                options={{
                    title: 'Notification'
                }}
            />
        </Stack>
    )
}