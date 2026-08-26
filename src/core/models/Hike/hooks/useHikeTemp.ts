import useHike from "@/src/core/hook/hike/useHike";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useBookingUserList } from "@/src/core/models/Booking/Booking";
import { useGroupList } from "@/src/core/models/Group/Group";
import { Trail, useTrailList } from "@/src/core/models/Trail/Trail";

import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Keyboard } from "react-native";

export function useHikeTemp() {
    const [isFocused, setIsFocused] = useState(false);

    const { profile, isNotUser } = useAuthHook();

    const { groups } = useGroupList(profile?.id || "");

    const { bookings } = useBookingUserList();

    const { viewHike, isLoading: hikeLoading } = useHike();

    const { trails } = useTrailList();

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);

    const filteredTrails = useMemo(() => {
        if (!searchQuery.trim()) return [];
        return trails.filter(t =>
            t.general?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, trails]);

    const currentDate = useMemo(() => {
        return new Date();
    }, [])

    currentDate.setHours(0, 0, 0, 0);

    const upcomingBookings = useMemo(() => {
        if (!bookings) return [];
        return bookings.filter(b => {
            if (b.status !== 'completed') return false;
            if (!b.offer?.date) return false;

            const bDate = new Date(b.offer.date);
            bDate.setHours(0, 0, 0, 0);
            return bDate.getTime() >= currentDate.getTime();
        }).sort((a, b) => new Date(a.offer.date).getTime() - new Date(b.offer.date).getTime());
    }, [bookings, currentDate]);

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

    const handleStartTracking = (bookingContext?: any) => {
        if (bookingContext) {
            console.log('Booking context provided:', bookingContext);
            const targetGroup = groups?.find(g =>
                g.members?.some((m: any) => m.id === profile?.id && m.bookingId === bookingContext.id)
            );

            router.push({
                pathname: '/(main)/hike/view',
                params: {
                    trailId: bookingContext.trail.id,
                    groupId: targetGroup?.id,
                    bookingId: bookingContext.id
                }
            });
        } else if (selectedTrail) {
            console.log('Starting new hike with trail:', selectedTrail.id);
            viewHike(selectedTrail.id);
        } else {
            console.log('Starting new hike without specific trail');
            viewHike("new_diy_session");
        }
    };

    const handleDeveloperBypass = (bookingContext: any) => {
        console.log('handleDeveloperBypass:', bookingContext);
        if (!bookingContext) return;
        const targetGroup = groups?.find(g =>
            g.members?.some((m: any) => m.id === profile?.id && m.bookingId === bookingContext.id)
        );
        router.push({
            pathname: '/(main)/hike/view',
            params: {
                trailId: bookingContext.trail.id,
                groupId: targetGroup?.id,
                bookingId: bookingContext.id
            }
        });
    };

    useFocusEffect(
        useCallback(() => {
            setIsFocused(true);
            return () => setIsFocused(false);
        }, [])
    );

    return {
        isFocused,
        setIsFocused,
        profile,
        bookings,
        groups,
        viewHike,
        hikeLoading,
        trails,
        searchQuery,
        setSearchQuery,
        selectedTrail,
        setSelectedTrail,
        upcomingBookings,
        filteredTrails,
        handleStartTracking,
        handleDeveloperBypass,
        handleSearchChange,
        handleSearchSubmit,
        handleTrailSelect,
        isAdmin: isNotUser
    }
}