import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useAuthStore } from '@/src/core/stores/authStore';
import { useBookingsStore } from '@/src/core/stores/bookingsStore';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";

import BookingManagementScreen from '@/src/features/Book/screens/ManagementFlow/BookingManagementScreen';

export default function listBook(){
    const userBookings = useBookingsStore((state) => state.userBookings);
    const bookingsIsLoading = useBookingsStore((state) => state.isLoading);
    const bookingErrors = useBookingsStore((state) => state.error);
    const cancelBooking = useBookingsStore((state) => state.cancelBooking);
    const profile = useAuthStore((state) => state.profile);

    const { onBackPress } = useAppNavigation();

    const onCancelBookingPress = (bookingData) => {
        try {
            cancelBooking({
                cancelledBy: profile.role,
                bookingData
            });
        } catch (err) {
            console.log(err.message);
        }
    }

    if (bookingsIsLoading) {
        return <Text style={{ textAlign: 'center', marginTop: 50 }}>Loading...</Text>;
    }

    return (
        <BookingManagementScreen 
            userBookings={userBookings}
            isLoading={bookingsIsLoading}
            error={bookingErrors}
            onBackPress={onBackPress}
            onCancelBookingPress={onCancelBookingPress}
        />
    );

    // return(
    //     !bookingsIsLoading ? 
    //         <TESTBOOKING
    //             bookings={userBookings}
    //             isLoading={bookingsIsLoading}
    //             error={bookingErrors}
    //             onCancelBookingPress={onCancelBookingPress}
    //         /> :
    //         <Text>Loading</Text>
    // )
}

const TESTBOOKING = ({
    bookings,
    error,
    onCancelBookingPress,
}) => {
    return (
        <ScrollView>
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

                            { (b.status === null || b.status !== 'CANCELLED') ? 
                                <Pressable onPress={() => onCancelBookingPress(b)}>
                                    <Text>CANCEL BOOKING</Text>
                                </Pressable> :
                                <Text>Status: CANCELLED-{b.cancelledBy}</Text>
                            }
                        </View>
                    )
                }): <Text style={styles.loading}>Empty, book new hikes!</Text>
            }
            <View style={{margin: 50}}/>
        </ScrollView>
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