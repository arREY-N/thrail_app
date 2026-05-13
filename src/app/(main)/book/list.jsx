import { useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { Platform } from "react-native";

import useBookOffer from "@/src/core/hook/book/useBookOffer";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";

import CustomLoading from "@/src/components/CustomLoading";
import ScreenWrapper from "@/src/components/ScreenWrapper";
import { Colors } from "@/src/constants/colors";

import useBook from '@/src/core/hook/book/useBook';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import MyBookingsScreen from "@/src/features/Book/screens/MyBookings/MyBookingsScreen";

export default function listBook(){
    const { onBackPress } = useAppNavigation();
    const { profile } = useAuthHook();

	const { bookingId, view } = useLocalSearchParams();

	useEffect(() => {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.opener) {
            window.close();
        }
    }, []);

    const { 
        bookings,
        error,
        onCancelBookingPress,
        onRefundBookingPress,
        onPayOffer,
        getBookOffer,
    } = useBookOffer();

    const {
        isLoading
    } = useBook({userId: profile?.id});

	if (isLoading) {
		return (
			<ScreenWrapper backgroundColor={Colors.BACKGROUND}>
				<CustomLoading visible={true} message="Loading your bookings..." />
			</ScreenWrapper>
		);
	}

    const displayBookings = [...(bookings || [])];
    
    return(
		<MyBookingsScreen 
			userBookings={displayBookings}
			isLoading={isLoading}
			error={error}
			onBackPress={onBackPress}
			onCancelBookingPress={onCancelBookingPress}
			onRefundBookingPress={onRefundBookingPress}
			onPayOffer={onPayOffer}
			getBookOffer={getBookOffer}
			initialBookingId={bookingId}
            initialView={view}
		/>
    );
}