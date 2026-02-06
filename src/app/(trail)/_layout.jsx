import { Stack } from "expo-router";

export default function MountainLayout(){
    return(
        <Stack>
            <Stack.Screen
                name='[id]'
                options={{
                    title: 'Trail',
                    headerShown: false
                }}
                />
        </Stack>
    )
}