import { Stack } from "expo-router";

export default function BookLayout(){
    return(
        <Stack>
            <Stack.Screen 
                name='[id]'
                options={{
                    title: 'Book'
                }}/>
            <Stack.Screen 
                name='userBooking'
                options={{
                    title: 'Booked Offers'
                }}/>
        </Stack>
    )
}