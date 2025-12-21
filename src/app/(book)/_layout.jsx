import { Stack } from "expo-router";

export default function BookLayout(){
    return(
        <Stack>
            <Stack.Screen
                name='book'
                options={{
                    title: 'Book',
                }}
            />
            <Stack.Screen
                name='booking'
                options={{
                    title: 'Booking',
                }}
            />
        </Stack>
    )
}