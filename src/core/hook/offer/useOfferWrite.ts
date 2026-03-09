import { TEdit } from "@/src/core/interface/domainHookInterface";
import { BusinessLogic } from "@/src/core/models/Business/logic/Business.logic";
import { Offer } from "@/src/core/models/Offer/Offer";
import { TrailLogic } from "@/src/core/models/Trail/logic/Trail.logic";
import { Trail } from "@/src/core/models/Trail/Trail";
import { useBusinessesStore } from "@/src/core/stores/businessesStore";
import { useOffersStore } from "@/src/core/stores/offersStore";
import { router } from "expo-router";
import { produce } from "immer";
import { useState } from "react";

export type UseOfferParams = {
    trailId?: string | null,
    businessId?: string | null,
    offerId?: string | null,
    mode?: string | null,
}

export function useOfferWrite(params: UseOfferParams = {}){
    const { offerId, businessId } = params

    const businessAccount = useBusinessesStore(s => s.current);
    
    const offers = useOffersStore(s => s.data);
    const error = useOffersStore(s => s.error);
    const isLoading = useOffersStore(s => s.isLoading);

    const create = useOffersStore(s => s.create);

    const [localError, setLocalError] = useState<string | null>(null);
    const [offer, setOffer] = useState<Offer>(() => {
        const existing = offers.find(offer => offer.id === offerId);

        if(!businessAccount) {
            setLocalError('No business account');
            return new Offer();
        }

        const businessSummary = BusinessLogic.toSummary(businessAccount);

        return existing
            ? new Offer({ ...existing })
            : new Offer({ business: businessSummary });
    })

    const onUpdatePress = (params: TEdit) => {
        const { section, id, value } = params;
    
        try {
            setOffer(prev => 
                produce(prev, (draft) => {
                    if(section === 'root'){
                        draft[id] = value;
                    } else {
                        draft[section][id] = value;
                    }
                })
            )
        } catch (error) {
            setLocalError((error as Error).message || 'Failed editing property')
        }
    }

    const onSetTrail = (trail: Trail) => {
        try {
            setOffer(prev => 
                produce(prev, (draft) => {
                    const trailSummary = TrailLogic.toSummary(trail);

                    draft.trail = trailSummary;
                })
            )
        } catch (error) {
            setLocalError((error as Error).message || 'Failed editing property')
        }
    }

    const onSubmitPress = async () => {
        try {
            const success = await create(offer);
            if(!success) throw new Error('Failed') 
            router.back();
        } catch (error) {
            setLocalError((error as Error).message || 'Failed submitting')
        }

    }


    const onRemovePress = async (id: string) => {
        
        
        // remove({id, businessId: businessAccount?.id});
        // router.back();
    }

    return {
        offer,
        error: error || localError,
        isLoading,
        onRemovePress,
        onUpdatePress,
        onSubmitPress,
        onSetTrail,
    }
}