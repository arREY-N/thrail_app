import React, { useEffect, useState } from 'react';

import useBookOffer from '@/src/core/hook/book/useBookOffer';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useAuthStore } from '@/src/core/stores/authStore';
import useBookingsStore from '@/src/core/stores/bookingsStore';

import CustomLoading from '@/src/components/CustomLoading';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';

import BookingManagementScreen from '@/src/features/Book/screens/ManagementFlow/BookingManagementScreen';

export default function listBook(){
    const { onBackPress } = useAppNavigation();

    const { 
        bookings,
        isLoading,
        error,
        onCancelBookingPress,
    } = useBookOffer();

    const profile = useAuthStore((s) => s.profile);
    const loadBookings = useBookingsStore((s) => s.load);

    const [reason, setReason] = useState('');

    useEffect(() => {
        if (profile?.id) {
            loadBookings(profile.id);
        }
    }, [profile?.id, loadBookings]);

    // TODO: move loading display inside the component
    if (isLoading || !bookings) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <CustomLoading 
                    visible={true} 
                    message="Loading your bookings..." 
                />
            </ScreenWrapper>
        );
    }

    console.log(error);
    return (
        <>
            {/* {
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
            } */}
            {/* <CustomTextInput
                label="Reason for cancellation"
                value={reason}
                onChangeText={setReason}
            /> */}
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