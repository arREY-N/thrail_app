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
        price: 1999,
        date: 'Mar 14, 2026', 
        duration: '2 Days',
        business: { name: 'Basic Mountaineering Course' },
        description: 'Learn the basics of mountaineering while enjoying the scenic views of Mt. Tagapo. Topics: Leave No Trace, Tent Pitching, Camp Management.',
        inclusions: ['Roundtrip van & boat', 'Guide & Camp fee', 'Registration fee', 'BMC digital certificate'],
        documents: ['Valid ID'],
        schedule: [
            {
                day: 'Day 1',
                activities: [
                    { time: '3:00 AM', event: 'Meet at Mayflower Parking' },
                    { time: '5:30 AM', event: 'Buy supplies / Start lecture' },
                    { time: '9:00 AM', event: 'Arrival at office / Start hike' },
                    { time: '1:30 PM', event: 'Arrival at the summit' },
                    { time: '6:00 PM', event: 'Food preparation / Socials' },
                ]
            },
            {
                day: 'Day 2',
                activities: [
                    { time: '7:00 AM', event: 'Wake-up call' },
                    { time: '9:00 AM', event: 'Start descent' },
                    { time: '11:00 AM', event: 'Wash up' },
                    { time: '4:00 PM', event: 'Arrival in Manila' },
                ]
            }
        ],
        thingsToBring: [
            'Water bottle', 'Snacks & Trail food', 'Extra Clothes', 
            'Hygiene kit', 'First-aid kit', 'Tent', 'Sleeping gear'
        ],
        reminders: [
            'PHP 1,000 reservation fee is required to secure your slot.',
            'The reservation fee is NON-REFUNDABLE but transferable.',
            'Balance must be paid 10 days before the event.',
            'Organizer may cancel if 12 participants are not met.'
        ]
    },
    {
        id: 'offer-2',
        price: 400,
        date: 'Mar 14, 2026',
        duration: '1 Day',
        documents: ['Valid ID'],
        inclusions: ['Local Guide'],
        description: 'Standard hike package. Good for beginners.',
        business: { name: 'Local Guide Coop' }
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