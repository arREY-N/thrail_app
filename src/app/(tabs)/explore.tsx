import { useLocalSearchParams } from 'expo-router';

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import useReview from '@/src/core/hook/review/useReview';
import { useOfferList } from '@/src/core/models/Offer/Offer';
import { useTrailList, useTrailNavigation } from '@/src/core/models/Trail/Trail';
import ExploreScreen from '@/src/features/Explore/screens/ExploreScreen';

/**
 * Controller component for the Explore tab.
 * Responsible for fetching trail data and passing navigation callbacks.
 */
export default function Explore() {
    const { filter } = useLocalSearchParams<{ filter?: string }>();

    const {
        trails,
        isLoading,
    } = useTrailList();

    const {
        onViewTrail
    } = useTrailNavigation();

    const {
        onGroupPress
    } = useAppNavigation();

    const {
        getItemRating,
    } = useReview();

    const {
        offers
    } = useOfferList();


    // Map query parameter filters to actual Explore tab category labels
    let initialCategory = "All";
    if (filter === 'recommendations') {
        initialCategory = "Recommended";
    } else if (filter === 'trending') {
        initialCategory = "Discover";
    } else if (filter === 'offers') {
        initialCategory = "Offers";
    }

    return (
        <ExploreScreen
            getItemRating={getItemRating}
            trails={trails}
            onViewMountain={onViewTrail}
            onGroupPress={onGroupPress}
            isLoading={isLoading}
            initialCategory={initialCategory}
            offers={offers}
        />
    );
}
