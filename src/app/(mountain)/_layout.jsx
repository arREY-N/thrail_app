import { Stack } from "expo-router";

export default function MountainLayout(){
    return(
        <Stack>
            <Stack.Screen
                name='mountain'
                options={{
                    title: 'Mountain',
                }}
                />
        </Stack>
    )
}