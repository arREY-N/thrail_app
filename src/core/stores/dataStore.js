import { useApplicationsStore } from '@/src/core/stores/applicationsStore';
import { useAuthStore } from '@/src/core/stores/authStore';
import { useBusinessesStore } from '@/src/core/stores/businessesStore';
import { useOffersStore } from '@/src/core/stores/offersStore';
import { useRecommendationsStore } from '@/src/core/stores/recommendationsStore';
import { useTrailsStore } from '@/src/core/stores/trailsStore';
import { useUsersStore } from '@/src/core/stores/usersStore';
import { useWeatherStore } from '@/src/core/stores/weatherStore';
import { useBookingsStore } from './bookingsStore';
import { usePaymentsStore } from './paymentsStore';


export const resetData = () => {
    try {
        useApplicationsStore.getState().reset();
        useAuthStore.getState().reset();
        useBookingsStore.getState().reset();
        useBusinessesStore.getState().reset();
        useOffersStore.getState().reset();
        usePaymentsStore.getState().reset();
        useRecommendationsStore.getState().reset();
        useTrailsStore.getState().reset();
        useUsersStore.getState().reset();
        useWeatherStore.getState().reset();
    } catch (err) {
        throw new Error(err.message || 'Failed resetting data');
    }
}


