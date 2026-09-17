import { useOfferStore } from "@/src/core/models/Offer/stores/offerStore";
import { catchError } from "@/src/core/utility/errorFormatter";

export function useOfferSimilarList() {
    const similarOffers = useOfferStore(s => s.similarOffers);
    const findSimilarOffers = useOfferStore(s => s.findSimilarOffers);
    const error = useOfferStore(s => s.error);
    /**
     * See similar offers to the one provided.
     * @param offerId - The ID of the offer to find similar ones for.
     */
    const seeSimilarOffers = async (offerId: string) => {
        try {
            await findSimilarOffers(offerId);
            return similarOffers
        } catch (error) {
            catchError(error as Error, 'writingError', 'seeSimilarOffer()');
        }
    }
    
    return { 
        seeSimilarOffers,
        similarOffers,
        error
    };
}