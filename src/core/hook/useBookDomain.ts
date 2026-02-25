import { useOffersStore } from "../stores/offersStore";

export default function useBookDomain(){
    const offer = useOffersStore(s => s.current);

    const onBookPress = (trailId: string) => {
        console.log('booking', trailId);
    }
}