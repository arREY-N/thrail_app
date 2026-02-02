import { Stack } from "expo-router"

export default function HikeLayout(){
    return(
        <Stack>
            <Stack.Screen 
                name="[id]"
                options={{
                    headerShown: true,
                    title: 'Hike'
                }}
                />
        </Stack>
    )
}