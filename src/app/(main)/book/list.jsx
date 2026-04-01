// TODO: remove the unused import once front end implemented
import React, { useEffect, useState } from 'react';

import useBookOffer from '@/src/core/hook/book/useBookOffer';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useAuthStore } from '@/src/core/stores/authStore';
import useBookingsStore from '@/src/core/stores/bookingsStore';

import CustomLoading from '@/src/components/CustomLoading';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';

import BookingManagementScreen from '@/src/features/Book/screens/MyBookings/MyBookingsScreen';

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

    //Todo: remove this when the dummy data is not gonna use
    const displayBookings = [...DummyBookings, ...(bookings || [])]

    console.log(error);
    return (
        <>
            {/* {
                bookings.length > 0 && bookings.map(u => {
                    return (
                        <>
                            <Pressable onPress={() => onCancelBookingPress(u, reason)} key={u.id}>
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
                userBookings={displayBookings}
                isLoading={isLoading}
                error={error}
                onBackPress={onBackPress}
                onCancelBookingPress={onCancelBookingPress}
            />
        </>
    );
}

const DummyBookings = [
    {
        id: "dummy_001",
        status: "pending-docs",
        pax: 2,
        trail: { name: "Mt. Daraitan Traverse" },
        business: { name: "Cloudstep Adventures" },
        offer: { 
            date: new Date("2026-05-12T07:00:00Z"), 
            price: 1500,
            inclusions: ["Guide Fee", "Environmental Fee", "Barangay Fee", "Tricycle Transfer (Jumpoff)"],
            thingsToBring: ["Headlamp", "Trail water (2L)", "Packed lunch", "Extra clothes", "Trekking sandals/shoes"],
            reminders: ["Expect river crossings.", "Prepare for a steep, technical descent to Tinipak River.", "Leave no trace."]
        },
        user: { firstname: "Juan", lastname: "Dela Cruz" },
        emergencyContact: { contactNumber: "09171234567" },
        payment: [],
    },
    {
        id: "dummy_002",
        status: "approved-docs",
        pax: 4,
        trail: { name: "Mt. Batulao" },
        business: { name: "Peakline Outdoor Co." },
        offer: { 
            date: new Date("2026-05-18T05:30:00Z"), 
            price: 1200,
            inclusions: ["Guide Fee", "Registration Fee", "Environmental Fee"],
            thingsToBring: ["Sun protection (Arm sleeves, Cap)", "Trail water (2L)", "Trail snacks", "Trekking pole"],
            reminders: ["Open trail, highly exposed to the sun.", "Bring an umbrella or wide-brim hat.", "Expect dusty conditions."]
        },
        user: { firstname: "Juan", lastname: "Dela Cruz" },
        emergencyContact: { contactNumber: "09171234567" },
        payment: [],
    },
    {
        id: "dummy_003",
        status: "paid",
        pax: 1,
        trail: { name: "Mt. Pulag (Ambangeag Trail)" },
        business: { name: "Northwind Trek Services" },
        offer: { 
            date: new Date("2026-06-05T03:00:00Z"), 
            price: 3500,
            inclusions: ["Guide Fee", "DENR Fee", "Cultural Fee", "Jeepney Transfer (Monster Jeep)", "Homestay Accommodation"],
            thingsToBring: ["Fleece jacket/Thermal wear", "Gloves and bonnet", "Sleeping bag", "Medical Certificate (Fit to climb)"],
            reminders: ["Medical certificate is STRICTLY required by DENR.", "Temperatures can drop near freezing.", "Observe silence at the campsite/homestay."]
        },
        user: { firstname: "Juan", lastname: "Dela Cruz" },
        emergencyContact: { contactNumber: "09171234567" },
        payment: [
            { amount: 3500, date: new Date("2026-04-01T10:00:00Z") }
        ],
    },
    {
        id: "dummy_004",
        status: "cancelled",
        pax: 3,
        trail: { name: "Mt. Makiling" },
        business: { name: "Summit Seekers" },
        offer: { 
            date: new Date("2026-04-20T06:00:00Z"), 
            price: 900,
            inclusions: ["Guide Fee", "Environmental Fee", "UPLB Registration Fee"],
            thingsToBring: ["Leech (limatik) protection", "Raincoat/Poncho", "Trail water (3L)", "First-aid kit", "Salt or alcohol (for leeches)"],
            reminders: ["Beware of limatik (blood leeches), especially if it rained recently.", "Wear trekking pants or leggings.", "Do not stray from the marked trail."]
        },
        user: { firstname: "Juan", lastname: "Dela Cruz" },
        emergencyContact: { contactNumber: "09171234567" },
        payment: [],
    }
];