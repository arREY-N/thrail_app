import LoadingScreen from "@/src/app/loading";
import useBookOffer from "@/src/core/hook/book/useBookOffer";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useTrailOffer } from "@/src/core/hook/offer/useTrailOffer";
import BookingScreen from "@/src/features/Book/screens/ReservationFlow/BookingScreen";
import { useLocalSearchParams } from "expo-router";

export default function listOffer(){
    const { trailId } = useLocalSearchParams();
    const { onBackPress } = useAppNavigation();

    const {
        isLoading: trailIsLoading,
        error: offerError,
        trailOffers,
    } = useTrailOffer({ trailId });

    const { 
        isLoading: bookIsLoading,
        error: bookError,
        booking,
        onUpdatePress,
        onCompleteOffer,
        onSetOffer,
    } = useBookOffer({ trailId });

    if(trailIsLoading || bookIsLoading) return <LoadingScreen/>;

    return (        
        <BookingScreen 
            // TODO: Swap DUMMY_OFFERS back to trailOffers
            // offers={trailOffers}
            offers={DUMMY_OFFERS}
            booking={booking}
            error={offerError || bookError}
            onSetOffer={onSetOffer}
            onBookNowPress={onCompleteOffer}
            onBackPress={onBackPress}
            onUpdatePress={onUpdatePress}
            onCompleteOffer={onCompleteOffer}
        />
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
        date: 'Feb 15, 2026',
        duration: '1 Day',
        documents: ['Medical Certificate', 'Valid ID', 'Waiver'],
        inclusions: ['Premium Guide', 'Lunch Included'],
        description: 'Premium package (This event has already concluded).',
        business: { name: 'Peak Explorers' }
    },
    {
        id: 'offer-4',
        price: 650,
        date: 'Feb 28, 2026',
        duration: '1 Day',
        documents: ['Medical Certificate', 'Valid ID', 'Waiver'],
        inclusions: ['Certified Local Guide', 'First-aid Support'],
        description: 'Weekend joiner hike (This event has already concluded).',
        business: { name: 'Weekend Warriors' }
    },
    {
        id: 'offer-5',
        price: 500,
        date: 'Apr 5, 2026',
        duration: '1 Day',
        documents: ['Valid ID'],
        inclusions: ['Local Guide', 'Trail Snacks'],
        description: 'Early morning hike to catch the sea of clouds.',
        business: { name: 'Cloud Chasers' }
    },
    {
        id: 'offer-6',
        price: 1200,
        date: 'Apr 20, 2026',
        duration: '1 Day',
        documents: ['Medical Certificate', 'Valid ID'],
        inclusions: ['Roundtrip Transpo', 'Guide Fee', 'Lunch'],
        description: 'All-inclusive day trip package.',
        business: { name: 'All-In Adventures' }
    },
];