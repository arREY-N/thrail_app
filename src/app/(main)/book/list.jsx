import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { Pressable, Text } from "react-native";

import CustomTextInput from '@/src/components/CustomTextInput';
import useBookOffer from '@/src/core/hook/book/useBookOffer';
import BookingManagementScreen from '@/src/features/Book/screens/ManagementFlow/BookingManagementScreen';
import { useState } from 'react';

export default function listBook(){
    const { onBackPress } = useAppNavigation();

    const { 
        booking,
        bookings,
        isLoading,
        error,
        onCancelBookingPress,
    } = useBookOffer();

    const [reason, setReason] = useState('');

    // TODO: move loading display inside the component
    if (isLoading || !bookings) {
        return <Text style={{ textAlign: 'center', marginTop: 50 }}>Loading...</Text>;
    }

    console.log(error);
    return (
        <>
            {
                bookings.length > 0 && bookings.map(u => {
                    return (
                        <>
                            <Pressable onPress={() => onCancelBookingPress(u, reason)}>
                                <Text>{u.trail.name}</Text>
                                <Text>Cancel</Text>
                            </Pressable>
                        </>
                    )
                })
            }
            <CustomTextInput
                label="Reason for cancellation"
                value={reason}
                onChangeText={setReason}
            />
            <BookingManagementScreen 
                userBookings={bookings}
                isLoading={isLoading}
                error={error}
                onBackPress={onBackPress}
                onCancelBookingPress={onCancelBookingPress}
            />
        </>
    );
}