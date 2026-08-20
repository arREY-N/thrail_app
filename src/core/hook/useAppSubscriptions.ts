import { useBookingsStore } from "@/src/core/models/Booking/Booking";
import { useAuthStore } from "@/src/core/stores/authStores/authStore";
import { useNotificationsStore } from "@/src/core/stores/notificationsStore";
import { useReviewStore } from "@/src/core/stores/reviewStore";
import { useTrailsStore } from "@/src/core/stores/trailStores/trailsStore";
import { useEffect } from "react";


export const useAppSubscriptions = () => {
    const profile = useAuthStore(s => s.profile);

    const subscribeToReviews = useReviewStore(s => s.subscribeToReviews);
    const subscribeToNotifications = useNotificationsStore(s => s.subscribeToNotifications);
    const subscribeToUserBookings = useBookingsStore(s => s.subscribeToUserBookings);
    const fetchAllTrails = useTrailsStore(s => s.fetchAll);

    useEffect(() => {
        if (!profile?.id) return;
        const unsubReview = subscribeToReviews();
        const unsubNotifications = subscribeToNotifications();
        const unsubUserBookings = subscribeToUserBookings(profile.id);
        fetchAllTrails();
        return () => {
            unsubReview?.();
            unsubNotifications?.();
            unsubUserBookings?.();
        };
    }, [profile?.id, subscribeToReviews, subscribeToNotifications, subscribeToUserBookings, fetchAllTrails]);
}