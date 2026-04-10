// TODO: remove the unused import once front end implemented
import React, { useEffect } from 'react';

import useBookOffer from '@/src/core/hook/book/useBookOffer';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useAuthStore } from '@/src/core/stores/authStore';
import useBookingsStore from '@/src/core/stores/bookingsStore';

import CustomLoading from '@/src/components/CustomLoading';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';

import MyBookingsScreen from '@/src/features/Book/screens/MyBookings/MyBookingsScreen';

export default function listBook(){
    const { onBackPress } = useAppNavigation();

    const { 
        bookings,
        isLoading,
        error,
        onCancelBookingPress,
        getBookOffer,
    } = useBookOffer();

    const profile = useAuthStore((s) => s.profile);
    const loadBookings = useBookingsStore((s) => s.load);

    useEffect(() => {
        if (profile?.id) {
            loadBookings(profile.id);
        }
    }, [profile?.id, loadBookings]);

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
            <MyBookingsScreen 
                userBookings={displayBookings}
                isLoading={isLoading}
                error={error}
                onBackPress={onBackPress}
                onCancelBookingPress={onCancelBookingPress}
                getBookOffer={getBookOffer}
            />
        </>
    );
}

//Todo: remove this when the dummy data is not gonna use
const DummyBookings = [
    // 1. PENDING VERIFICATION (Documents Uploaded)
    {
        id: "dummy_001",
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "for-reservation",
        cancellationReason: "",
        cancelledBy: "",
        pax: 2,
        documents: { "Valid ID": false, "Medical Certificate": false },
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
        business: { id: "bus_1", name: "Cloudstep Adventures" },
        trail: { id: "trail_1", name: "Mt. Daraitan Traverse", location: "Tanay, Rizal" },
        payment: [],
        offer: { 
            date: new Date("2026-05-12T07:00:00Z"), 
            duration: "1 Day",
            price: 1500,
            inclusions: ["Guide Fee", "Environmental Fee", "Barangay Fee", "Tricycle Transfer"],
            thingsToBring: ["Headlamp", "Trail water (2L)", "Packed lunch", "Trekking sandals/shoes"],
            reminders: ["Expect river crossings.", "Leave no trace."],
            schedule: [
                {
                    day: 1,
                    activities: [
                        { time: new Date("2026-05-12T07:00:00Z"), event: "Meetup at Jump-off" },
                        { time: new Date("2026-05-12T08:00:00Z"), event: "Start Trek" },
                        { time: new Date("2026-05-12T11:30:00Z"), event: "Summit - Lunch and Photo Ops" },
                        { time: new Date("2026-05-12T14:00:00Z"), event: "Descend to Tinipak River" },
                        { time: new Date("2026-05-12T15:30:00Z"), event: "Tinipak River - Swimming & Wash Up" }
                    ]
                }
            ]
        }
    },
    // 2. PAYMENT UNLOCKED (Documents Approved)
    {
        id: "dummy_002",
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "for-payment",
        cancellationReason: "",
        cancelledBy: "",
        pax: 4,
        documents: { "Valid ID": true },
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
            date: new Date("2026-05-18T05:30:00Z"), 
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
    // 3. VERIFYING PAYMENT
    {
        id: "dummy_003",
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "paid",
        cancellationReason: "",
        cancelledBy: "",
        pax: 2,
        documents: { "Valid ID": true },
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
            date: new Date("2026-05-25T06:00:00Z"), 
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
    // 4. CONFIRMED (Fully Paid & Verified)
    {
        id: "dummy_004",
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "completed",
        cancellationReason: "",
        cancelledBy: "",
        pax: 1,
        documents: { "Valid ID": true, "Medical Certificate": true },
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
            date: new Date("2026-06-05T03:00:00Z"), 
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
    },
    // 5. CANCELLED / HISTORY
    {
        id: "dummy_005",
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "refund",
        cancellationReason: "User requested due to emergency.",
        cancelledBy: "user_1",
        pax: 3,
        documents: { "Valid ID": true },
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
        business: { id: "bus_5", name: "Summit Seekers" },
        trail: { id: "trail_5", name: "Mt. Makiling", location: "Los Baños, Laguna" },
        payment: [],
        offer: { 
            date: new Date("2026-04-20T06:00:00Z"), 
            duration: "1 Day",
            price: 900,
            inclusions: ["Guide Fee", "Environmental Fee"],
            thingsToBring: ["Leech protection", "Raincoat", "Salt/Alcohol"],
            reminders: ["Beware of limatik (blood leeches).", "Do not stray from the marked trail."],
            schedule: [
                {
                    day: 1,
                    activities: [
                        { time: new Date("2026-04-20T06:00:00Z"), event: "Meetup at UPLB College of Forestry" },
                        { time: new Date("2026-04-20T07:00:00Z"), event: "Start Trek" },
                        { time: new Date("2026-04-20T09:30:00Z"), event: "Agila Base" },
                        { time: new Date("2026-04-20T12:00:00Z"), event: "Peak 2 Summit - Lunch" },
                        { time: new Date("2026-04-20T15:30:00Z"), event: "Return to Jump-off" }
                    ]
                }
            ]
        }
    }
];