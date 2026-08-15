import { useOfferStore } from '@/src/core/models/Offer/stores/offerStore';
import { useApplicationsStore } from '@/src/core/stores/applicationsStore';
import { useBookingsStore } from '@/src/core/stores/bookingsStore';
import { useBusinessesStore } from '@/src/core/stores/businessesStore';
import { usePaymentsStore } from '@/src/core/stores/paymentsStore';
import { useRecommendationsStore } from '@/src/core/stores/recommendationsStore';
import { useTrailsStore } from "@/src/core/stores/trailStores/trailsStore";
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


