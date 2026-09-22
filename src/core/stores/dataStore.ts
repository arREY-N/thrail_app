import { useAdminStore } from '@/src/core/models/Admin/Admin';
import { useApplicationsStore } from '@/src/core/models/Application/Application';
import { useBookingsStore } from '@/src/core/models/Booking/Booking';
import { useBusinessesStore } from '@/src/core/models/Business/Business';
import { useHikeStore } from '@/src/core/models/Hike/Hike';
import { useLeaderboardStore } from '@/src/core/models/Leaderboard/Leaderboard';
import { useLocationStore } from '@/src/core/models/Location/Location';
import { useMessageStore } from '@/src/core/models/Message/Message';
import { useMountainStore } from '@/src/core/models/Mountain/Mountain';
import { useNotificationStore } from '@/src/core/models/Notification/Notification';
import { useOfferStore } from '@/src/core/models/Offer/Offer';
import { usePaymentStore } from '@/src/core/models/Payment/Payment';
import { useRecommendationsStore } from '@/src/core/models/Recommendation/Recommendation';
import { useRescheduleStore } from '@/src/core/models/Reschedule/Reschedule';
import { useReviewStore } from '@/src/core/models/Review/Review';
import { useTrailsStore } from "@/src/core/models/Trail/Trail";
import { useUsersStore } from '@/src/core/models/User/User';
import { useFilesStore } from '@/src/core/stores/fileStore';
import { usePaymentsStore } from '@/src/core/stores/paymentsStore';
import { useWeatherStore } from '@/src/core/stores/weatherStore';

export const resetData = () => {
    try {
        useAdminStore.getState().reset();
        useApplicationsStore.getState().reset();
        useBookingsStore.getState().reset();
        useBusinessesStore.getState().reset();
        useFilesStore.getState().reset();
        useHikeStore.getState().reset();
        useLeaderboardStore.getState().reset();
        useLocationStore.getState().reset();
        useMessageStore.getState().reset();
        useMountainStore.getState().reset();
        useNotificationStore.getState().reset();
        useOfferStore.getState().reset();
        usePaymentStore.getState().reset();
        usePaymentsStore.getState().reset();
        useRecommendationsStore.getState().reset();
        useRescheduleStore.getState().reset();
        useReviewStore.getState().reset();
        useTrailsStore.getState().reset();
        useUsersStore.getState().reset();
        useWeatherStore.getState().reset();
    } catch (err) {
        throw new Error((err as Error).message || 'Failed resetting data');
    }
};



