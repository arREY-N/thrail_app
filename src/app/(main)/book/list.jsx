// TODO: remove the unused import once front end implemented
import React from 'react';

import useBookOffer from '@/src/core/hook/book/useBookOffer';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';

import CustomLoading from '@/src/components/CustomLoading';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';

import useBook from '@/src/core/hook/book/useBook';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import MyBookingsScreen from '@/src/features/Book/screens/MyBookings/MyBookingsScreen';

export default function listBook(){
    const { onBackPress } = useAppNavigation();
    const { profile } = useAuthHook();

    const { 
        bookings,
        error,
        onCancelBookingPress,
        getBookOffer,
    } = useBookOffer();

    const {
        isLoading
    } = useBook({userId: profile?.id});

    if (isLoading) {
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
    
    return (
        <MyBookingsScreen 
            userBookings={displayBookings}
            isLoading={isLoading}
            error={error}
            onBackPress={onBackPress}
            onCancelBookingPress={onCancelBookingPress}
            getBookOffer={getBookOffer}
        />
    );
}

//Todo: remove this when the dummy data is not gonna use
const DummyBookings = [
    // 1. PAYMENT UNLOCKED (Documents Approved)
    {
        id: "dummy_002",
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "for-payment",
        cancellationReason: "",
        cancelledBy: "",
        pax: 4,
        documents: [
            { name: "Valid ID", valid: "approved", file: "https://example.com/id.jpg" }
        ],
        user: { 
            id: "user_1", 
            username: "juan_dela", 
            firstname: "Juan", 
            lastname: "Dela Cruz", 
            email: "juan@example.com" 
        },
        emergencyContact: { 
            name: "Maria Dela Cruz", 
            contactNumber: "09171234567" 
        },
        business: { id: "bus_2", name: "Peakline Outdoor Co." },
        trail: { id: "trail_2", name: "Mt. Batulao", location: "Nasugbu, Batangas" },
        payment: [],
        offer: { 
            id: "fake_offer_2",
            date: new Date("2026-05-18T05:30:00Z"), 
            endDate: new Date("2026-05-18T18:30:00Z"),
            duration: "1 Day",
            price: 1200,
            inclusions: ["Guide Fee", "Registration Fee", "Environmental Fee"],
            thingsToBring: ["Sun protection (Arm sleeves, Cap)", "Trail water (2L)", "Trekking pole"],
            reminders: ["Open trail, highly exposed to the sun.", "Expect dusty conditions."],
            schedule: [
                {
                    day: 1,
                    activities: [
                        { time: new Date("2026-05-18T05:30:00Z"), event: "Assembly at Evercrest" },
                        { time: new Date("2026-05-18T06:30:00Z"), event: "Start Ascent" },
                        { time: new Date("2026-05-18T09:30:00Z"), event: "Arrival at Camp 8" },
                        { time: new Date("2026-05-18T10:30:00Z"), event: "Summit View" },
                        { time: new Date("2026-05-18T13:30:00Z"), event: "Descent & Wash Up" }
                    ]
                }
            ]
        }
    },
    // 2. VERIFYING PAYMENT
    {
        id: "dummy_003",
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "paid",
        cancellationReason: "",
        cancelledBy: "",
        pax: 2,
        documents: [
            { name: "Valid ID", valid: "approved", file: "https://example.com/id.jpg" }
        ],
        user: { 
            id: "user_1", 
            username: "juan_dela", 
            firstname: "Juan", 
            lastname: "Dela Cruz", 
            email: "juan@example.com" 
        },
        emergencyContact: { 
            name: "Maria Dela Cruz", 
            contactNumber: "09171234567" 
        },
        business: { id: "bus_3", name: "Rizal Hikers Club" },
        trail: { id: "trail_3", name: "Mt. Pamitinan", location: "Rodriguez, Rizal" },
        payment: [
            { 
                id: "pay_2", 
                date: new Date(), 
                amount: 1000, 
                method: "gcash", 
                type: "full" 
            }
        ],
        offer: { 
            id: "fake_offer_3",
            date: new Date("2026-05-25T06:00:00Z"), 
            endDate: new Date("2026-05-25T18:00:00Z"),
            duration: "1 Day",
            price: 1000,
            inclusions: ["Guide Fee", "Environmental Fee"],
            thingsToBring: ["Gloves for rock scrambling", "Trail water (2L)"],
            reminders: ["Sharp limestone rocks, wear proper gloves."],
            schedule: [
                {
                    day: 1,
                    activities: [
                        { time: new Date("2026-05-25T06:00:00Z"), event: "Meetup at Brgy. Wawa" },
                        { time: new Date("2026-05-25T07:00:00Z"), event: "Start Ascent" }
                    ]
                }
            ]
        }
    },
    // 3. CONFIRMED (Fully Paid & Verified)
    {
        id: "dummy_004",
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "completed",
        cancellationReason: "",
        cancelledBy: "",
        pax: 1,
        documents: [
            { name: "Valid ID", valid: "approved", file: "https://example.com/id.jpg" },
            { name: "Medical Certificate", valid: "approved", file: "https://example.com/med.jpg" }
        ],
        user: { 
            id: "user_1", 
            username: "juan_dela", 
            firstname: "Juan", 
            lastname: "Dela Cruz", 
            email: "juan@example.com" 
        },
        emergencyContact: { 
            name: "Maria Dela Cruz", 
            contactNumber: "09171234567" 
        },
        business: { id: "bus_4", name: "Northwind Trek Services" },
        trail: { id: "trail_4", name: "Mt. Pulag (Ambangeag Trail)", location: "Kabayan, Benguet" },
        payment: [
            { 
                id: "pay_1", 
                date: new Date("2026-04-01T10:00:00Z"), 
                amount: 3500, 
                method: "gcash", 
                type: "full" 
            }
        ],
        offer: { 
            id: "fake_offer_4",
            date: new Date("2026-06-05T03:00:00Z"), 
            endDate: new Date("2026-06-06T12:00:00Z"),
            duration: "2 Days, 1 Night",
            price: 3500,
            inclusions: ["Guide Fee", "DENR Fee", "Homestay Accommodation"],
            thingsToBring: ["Fleece jacket", "Gloves and bonnet", "Sleeping bag"],
            reminders: ["Temperatures can drop near freezing.", "Observe silence at the homestay."],
            schedule: [
                {
                    day: 1,
                    activities: [
                        { time: new Date("2026-06-04T12:00:00Z"), event: "Meetup at Baguio City" },
                        { time: new Date("2026-06-04T14:30:00Z"), event: "DENR Briefing & Registration" },
                        { time: new Date("2026-06-04T17:00:00Z"), event: "Homestay Arrival & Dinner" }
                    ]
                },
                {
                    day: 2,
                    activities: [
                        { time: new Date("2026-06-05T01:30:00Z"), event: "Wake up call & Preparation" },
                        { time: new Date("2026-06-05T03:00:00Z"), event: "Trek to Summit" },
                        { time: new Date("2026-06-05T05:30:00Z"), event: "Sea of Clouds & Sunrise - Summit" },
                        { time: new Date("2026-06-05T11:00:00Z"), event: "Back at Homestay - Wash up & Logout" }
                    ]
                }
            ]
        }
    }
];