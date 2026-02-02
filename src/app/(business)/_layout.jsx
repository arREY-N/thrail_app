import { Stack } from "expo-router";

export default function BusinessLayout(){
    return(
        <Stack>
            <Stack.Screen 
                name="apply" 
                options = {{
                        headerShown: false,
                    }}
            />
        </Stack>
    )
}