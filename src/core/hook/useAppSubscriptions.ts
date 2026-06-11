import { useAuthStore } from "@/src/core/stores/authStores/authStore";
import useBookingsStore from "@/src/core/stores/bookingsStore";
import { useNotificationsStore } from "@/src/core/stores/notificationsStore";
import { useReviewStore } from "@/src/core/stores/reviewStore";
import { useTrailsStore } from "@/src/core/stores/trailStores/trailsStore";
import { useEffect } from "react";


export const useAppSubscriptions = () => {
    const profile = useAuthStore(s => s.profile);

    const reviewStore = useReviewStore();
    const notifStore = useNotificationsStore();
    const userBookingsStore = useBookingsStore();
    const fetchAllTrails = useTrailsStore(s => s.fetchAll); 


    useEffect(() => {
        if(!profile) return;
        console.log('Subscribing to app subscriptions for user: ', profile.id);
        const unsubReview = reviewStore.subscribeToReviews();
        const unsubNotifications = notifStore.subscribeToNotifications();
        const unsubUserBookings = userBookingsStore.subscribeToUserBookings();
        fetchAllTrails();
        return () => {
            console.log('Cleaning up app subscriptions for user: ', profile.id);
            unsubReview?.();
            unsubNotifications?.();
            unsubUserBookings?.();
        }
    },[profile?.id]);

    return null;
}