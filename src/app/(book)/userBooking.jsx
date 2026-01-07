import { useBookingsStore } from '@/src/core/stores/bookingsStore';
import { StyleSheet, Text, View } from "react-native";

export default function userBooking(){
    const userBookings = useBookingsStore((state) => state.userBookings);
    const bookingsIsLoading = useBookingsStore((state) => state.isLoading);
    const bookingErrors = useBookingsStore((state) => state.error);

    return(
        !bookingsIsLoading ? 
            <TESTBOOKING
                bookings={userBookings}
                isLoading={bookingsIsLoading}
                error={bookingErrors}
            /> :
            <Text>Loading</Text>
    )
}

const TESTBOOKING = ({
    bookings,
    error
}) => {
    return (
        <View>
            { error && <Text>{error}</Text>}
            <Text>User bookings</Text>
            { bookings?.length > 0 ? bookings.map(b => {
                    return (
                        <View style={styles.form}>
                            <Text>Trail: {b.trailName}</Text>
                            <Text>Date: {b.date}</Text>
                            <Text>Provider: {b.businessName}</Text>
                            <Text>Price: {b.price}</Text>
                            <Text>Payment: {b.mode}</Text>
                        </View>
                    )
                }): <Text style={styles.loading}>Empty, book new hikes!</Text>
            }
        </View>
    )
}

const styles = StyleSheet.create({
    form: {
        margin: 10,
        borderWidth: 1,
        padding: 10
    },
    loading: {
        textAlign: 'center',
        margin: 10,
        padding: 10,
    }
})