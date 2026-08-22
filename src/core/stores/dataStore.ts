import { useApplicationsStore } from '@/src/core/models/Application/Application';
import { useBookingsStore } from '@/src/core/models/Booking/Booking';
import { useBusinessesStore } from '@/src/core/models/Business/Business';
import { useOfferStore } from '@/src/core/models/Offer/Offer';
import { useRecommendationsStore } from '@/src/core/models/Recommendation/Recommendation';
import { useTrailsStore } from "@/src/core/models/Trail/Trail";
import { usePaymentsStore } from '@/src/core/stores/paymentsStore';
import { useUsersStore } from '@/src/core/stores/usersStore';
import { useWeatherStore } from '@/src/core/stores/weatherStore';


export const resetData = () => {
    try {
        useApplicationsStore.getState().reset();
        useBookingsStore.getState().reset();
        useBusinessesStore.getState().reset();
        useOfferStore.getState().reset();
        usePaymentsStore.getState().reset();
        useRecommendationsStore.getState().reset();
        useTrailsStore.getState().reset();
        useUsersStore.getState().reset();
        useWeatherStore.getState().reset();
    } catch (err) {
        throw new Error((err as Error).message || 'Failed resetting data');
    }
}


