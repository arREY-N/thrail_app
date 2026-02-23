import LoadingScreen from "@/src/app/loading";
// import TESTUSERBOOK from "@/src/components/TESTCOMPONENTS/TestUserBook";
import { useOfferView } from '@/src/core/hook/useOfferView';
import BookingScreen from "@/src/features/Book/screens/BookingScreen";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function listOffer(){
    const { trailId } = useLocalSearchParams();
    const router = useRouter();

    const {
        filteredOffers,
        onBookNowPress,
        bookingError,
        offerError,
        isLoading,
    } = useOfferView({ trailId });

    const handleBack = () => {
        router.back();
    };

    if(isLoading) return <LoadingScreen/>;

    return (
        <BookingScreen 
            offers={DUMMY_OFFERS}
            onBookNowPress={onBookNowPress}
            onBackPress={handleBack}
        />

        // <TESTUSERBOOK 
        //     offers={filteredOffers}
        //     onBookNowPress={onBookNowPress}
        //     system={bookingError || offerError}
        // />
    )
}

const DUMMY_OFFERS = [
    {
        id: 'offer-1',
        price: 500,
        date: 'Nov 30, 2025',
        duration: '1 Day',
        documents: ['Medical Certificate', 'Valid ID'],
        inclusions: ['Certified Local Guide', 'First-aid Support'],
        description: 'A great beginner-friendly hike.',
        trail: { id: 'trail-1', name: 'Mt. Parawagan' },
        business: { name: 'Guide/Business Name 1' }
    },
    {
        id: 'offer-2',
        price: 400,
        date: 'Nov 30, 2025',
        duration: '1 Day',
        documents: ['Valid ID'],
        inclusions: ['Local Guide'],
        description: 'Standard hike package.',
        trail: { id: 'trail-1', name: 'Mt. Parawagan' },
        business: { name: 'Guide/Business Name 2' }
    },
    {
        id: 'offer-3',
        price: 850,
        date: 'Dec 5, 2025',
        duration: '1 Day',
        documents: ['Medical Certificate', 'Valid ID', 'Waiver'],
        inclusions: ['Premium Guide', 'Lunch Included'],
        description: 'Premium package.',
        trail: { id: 'trail-1', name: 'Mt. Parawagan' },
        business: { name: 'Guide/Business Name 3' }
    },
    {
        id: 'offer-4',
        price: 650,
        date: 'Oct 21, 2025',
        duration: '1 Day',
        documents: ['Medical Certificate', 'Valid ID', 'Waiver'],
        inclusions: ['Certified Local Guide', 'First-aid Support', 'Lunch Included'],
        description: 'Premium package.',
        trail: { id: 'trail-3', name: 'Mt. Parawagan' },
        business: { name: 'Guide/Business Name 4' }
    },
];