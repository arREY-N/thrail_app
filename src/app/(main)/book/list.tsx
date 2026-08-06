import { useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { Platform } from "react-native";

import useBookOffer from "@/src/core/hook/book/useBookOffer";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import useLandingNavigation from "@/src/core/hook/navigation/useLandingNavigation";

import CustomLoading from "@/src/components/CustomLoading";
import ScreenWrapper from "@/src/components/ScreenWrapper";
import { Colors } from "@/src/constants/colors";

import useBook from '@/src/core/hook/book/useBook';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import MyBookingsScreen from "@/src/features/Book/screens/MyBookings/MyBookingsScreen";


const DUMMY_FUTURE_OFFERS = [
    {
        id: 'dummy-offer-1',
        date: new Date(new Date().setDate(new Date().getDate() + 14)),
        price: 1500,
        duration: 'Day Hike (12 hrs)',
        minPax: 5,
        maxPax: 12,
        business: { id: 'biz-1', name: 'Adventure Guides PH' },
        trail: { id: 'trail-1', name: 'Mt. Daraitan' },
        description: 'Experience the sea of clouds and the pristine waters of Tinipak River.',
        inclusions: ['Guide Fee', 'Environmental Fee', 'Roundtrip Transfer from Manila'],
        thingsToBring: ['2L Water', 'Packed Lunch', 'Trail Snacks', 'Extra Clothes'],
        schedule: [
            { day: 1, activities: [
                { time: new Date(new Date().setHours(4, 0, 0, 0)), event: 'Assembly at Greenfield District' },
                { time: new Date(new Date().setHours(6, 0, 0, 0)), event: 'Start Trek' }
            ]}
        ]
    },
    {
        id: 'dummy-offer-2',
        date: new Date(new Date().setDate(new Date().getDate() + 30)),
        price: 1800,
        duration: 'Overnight',
        minPax: 4,
        maxPax: 10,
        business: { id: 'biz-1', name: 'Adventure Guides PH' },
        trail: { id: 'trail-2', name: 'Mt. Batulao' },
        description: 'Perfect for beginners. Enjoy the rolling scenic views of Batangas.',
        inclusions: ['Guide Fee', 'Environmental Fee', 'Tent Rental'],
        thingsToBring: ['3L Water', 'Jacket', 'Headlamp', 'Sleeping Bag'],
        schedule: []
    }
];

export default function listBook(){
    const { 
        onBackPress 
    } = useAppNavigation();
    
    const { 
        onTerms: onTermsPress, 
        onPrivacy: onPrivacyPress 
    } = useLandingNavigation();

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
        onRescheduleBooking,
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
        <>
            <MyBookingsScreen 
                userBookings={displayBookings as any}
                isLoading={isLoading}
                error={error as any}
                onBackPress={onBackPress}
                onCancelBookingPress={onCancelBookingPress as any}
                onRefundBookingPress={onRefundBookingPress as any}
                onRescheduleBooking={onRescheduleBooking as any}
                onPayOffer={onPayOffer as any}
                getBookOffer={getBookOffer as any}
                availableFutureOffers={DUMMY_FUTURE_OFFERS as any}
                initialBookingId={bookingId as any}
                initialView={view as any}
                onTermsPress={onTermsPress}
                onPrivacyPress={onPrivacyPress}
            />
        </>
    );
}