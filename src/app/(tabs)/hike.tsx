import { useIsFocused } from "@react-navigation/native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import { Keyboard, View } from "react-native";

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { Trail } from "@/src/core/models/Trail/Trail";
import { formatDate } from "@/src/core/utility/date";

import useBook from "@/src/core/hook/book/useBook";
import useBookOffer from "@/src/core/hook/book/useBookOffer";
import { useGroupList } from "@/src/core/hook/group/useGroupList";
import useHike from "@/src/core/hook/hike/useHike";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useTrailsStore } from "@/src/core/stores/trailsStore";

import NavigationScreen from "@/src/features/Navigation/screens/NavigationScreen";

export default function hike() {
    const isFocused = useIsFocused();
    const { onGroupPress, onBookingPress } = useAppNavigation();
    
    // Fetch User Profile
    const { profile } = useAuthHook();
    
    // Fetch background sync for bookings
    useBook({ userId: profile?.id }); 
    const { bookings } = useBookOffer(); 
    const { groups } = useGroupList(profile?.id || "");
    
    // Fetch hike state & trails database
    const { viewHike, isLoading: hikeLoading } = useHike({});
    const trailsDb = useTrailsStore(s => s.data);

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);

    // Filter the list of trails dynamically
    const filteredTrails = useMemo(() => {
        if (!searchQuery.trim()) return [];
        return trailsDb.filter(t => 
            t.general?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, trailsDb]);

    // Find the closest upcoming booking directly from the bookings database
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const upcomingBookings = bookings?.filter(b => {
        if (!b.offer?.date) return false;
        if ([
            'for-reservation',
            'for-payment',
            'downpayment',
            'reservation-rejected', 
            'for-cancellation', 
            'cancellation-rejected', 
            'refund', 
            'for-reschedule', 
            'reschedule-rejected', 
            'rescheduled'
        ].includes(b.status)) return false;
        
        const bDate = new Date(b.offer.date);
        bDate.setHours(0, 0, 0, 0);
        return bDate.getTime() >= currentDate.getTime();
    }).sort((a, b) => new Date(a.offer.date).getTime() - new Date(b.offer.date).getTime());

    const nextBooking = upcomingBookings?.[0] || null;

    let isFutureBooking = false;
    let formattedBookingDate = "";

    if (nextBooking) {
        const targetDate = new Date(nextBooking.offer.date);
        targetDate.setHours(0, 0, 0, 0);

        if (targetDate.getTime() > currentDate.getTime()) {
            isFutureBooking = true;
            formattedBookingDate = formatDate(nextBooking.offer.date);
        }
    }

    const handleSearchChange = (text: string) => {
        setSearchQuery(text);
        if (text.trim() === "") {
            setSelectedTrail(null);
            Keyboard.dismiss(); 
        }
    };

    const handleTrailSelect = (trail: Trail) => {
        setSelectedTrail(trail);
        setSearchQuery(trail.general?.name || "");
        Keyboard.dismiss();
    };

    const handleSearchSubmit = () => {
        if (filteredTrails.length > 0 && !selectedTrail) {
            handleTrailSelect(filteredTrails[0]);
        }
        Keyboard.dismiss();
    };

    const handleBookedGroupChatPress = () => {
        if (!nextBooking) return;
        const targetGroup = groups?.find(g => 
            g.members?.some((m: any) => m.id === profile?.id && m.bookingId === nextBooking.id)
        );

        if (targetGroup) {
            router.push({
                pathname: '/(main)/group/room',
                params: { roomId: targetGroup.id }
            });
        } else {
            onGroupPress();
        }
    };

    const handleStartTracking = () => {
        const targetGroup = groups?.find(g => 
            g.members?.some((m: any) => m.id === profile?.id && m.bookingId === nextBooking?.id)
        );

        if (nextBooking && !isFutureBooking) {
            router.push({ pathname: '/(main)/hike/view', params: { trailId: nextBooking.trail.id, groupId: targetGroup?.id } });
        } else {
            viewHike(selectedTrail ? selectedTrail.id : "new_diy_session");
        }
    };

    // Secure Bypass Logic
    const handleDeveloperBypass = () => {
        if (!nextBooking) return;
        const targetGroup = groups?.find(g => 
            g.members?.some((m: any) => m.id === profile?.id && m.bookingId === nextBooking.id)
        );
        router.push({ pathname: '/(main)/hike/view', params: { trailId: nextBooking.trail.id, groupId: targetGroup?.id } });
    };

    const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';

    console.log("Upcoming Bookings:", upcomingBookings);

    return (
        <View style={{ flex: 1 }}>
            <StatusBar style="dark" translucent backgroundColor="transparent" />
            
            {isFocused && (
                <NavigationScreen
                    bookingContext={nextBooking}
                    isFutureBooking={isFutureBooking}
                    formattedDate={formattedBookingDate}
                    
                    searchQuery={searchQuery}
                    filteredTrails={filteredTrails}
                    selectedTrail={selectedTrail}
                    isLoading={hikeLoading}
                    
                    onSearchChange={handleSearchChange}
                    onSearchSubmit={handleSearchSubmit}
                    onTrailSelect={handleTrailSelect}
                    
                    onGroupChatPress={onGroupPress}
                    onBookedGroupChatPress={handleBookedGroupChatPress}
                    onBookingPress={onBookingPress}
                    onStartTracking={handleStartTracking}

                    onDeveloperBypass={isAdmin ? handleDeveloperBypass : undefined}
                />
            )}
        </View>
    );
}