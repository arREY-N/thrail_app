import { useBookingsStore } from "@/src/core/models/Booking/Booking";
import { useNotificationsStore } from "@/src/core/models/Notification/Notification";
import { useReviewStore } from "@/src/core/models/Review/Review";
import { useTrailsStore } from "@/src/core/models/Trail/Trail";
import { useAuthStore } from "@/src/core/models/User/stores/authStore";
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