import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { TEdit } from "@/src/core/interface/domainHookInterface";
import { BusinessLogic } from "@/src/core/models/Business/logic/Business.logic";
import { Group } from "@/src/core/models/Group/Group";
import { Offer } from "@/src/core/models/Offer/Offer";
import { TrailLogic } from "@/src/core/models/Trail/logic/Trail.logic";
import { Trail } from "@/src/core/models/Trail/Trail";
import { UserLogic } from "@/src/core/models/User/logic/User.logic";
import { useBusinessesStore } from "@/src/core/stores/businessesStore";
import { useGroupStore } from "@/src/core/stores/groupStores/groupStoreCreator";
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

export type FormMode = 'create' | 'edit';

export function useOfferWrite(params: UseOfferParams = {}){
    const { offerId, businessId } = params
    const { profile } = useAuthHook();

    const businessAccount = useBusinessesStore(s => s.current);
    const offers = useOffersStore(s => s.businessOffers);
    const error = useOffersStore(s => s.error);
    const isLoading = useOffersStore(s => s.isLoading);
    const remove = useOffersStore(s => s.delete);
    const create = useOffersStore(s => s.create);
    const createGroup = useGroupStore(s => s.createGroup);
    const [mode, setMode] = useState<FormMode>('create');
    const [localError, setLocalError] = useState<string | null>(null);
    const [offer, setOffer] = useState<Offer>(() => {
        const existing = offers.find(offer => offer.id === offerId);
        
        if(!businessAccount) {
            setLocalError('No business account');
            return new Offer();
        }

        const businessSummary = BusinessLogic.toSummary(businessAccount);

        if(existing) {
            alert('editing existing offer');
            setMode('edit');
        }

        return existing
            ? new Offer({ ...existing })
            : new Offer({ business: businessSummary });
    })

    const onUpdatePress = (params: TEdit<Offer>) => {
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
            if(!profile)
                throw new Error('User profile not found');

            if(mode === 'edit'){
                alert('Message from business regarding the changes made; to be used for the notification.');
            }
            

            const success = await create(offer);
            const group = new Group({
                admins: [UserLogic.toSummary(profile)],
                participantsIds: [profile.id],
                business: offer.business,
                trail: offer.trail,
                offer: {
                    id: offer.id,
                    date: offer.date,
                    documents: offer.documents,
                    schedule: offer.schedule,
                    endDate: offer.endDate,
                    duration: offer.duration,
                    price: offer.price,
                    maxPax: offer.maxPax,
                    minPax: offer.minPax,
                    reservedPax: offer.reservedPax,
                    inclusions: offer.inclusions,
                    thingsToBring: offer.thingsToBring,
                    reminders: offer.reminders,
                    description: offer.description
                },
                status: 'active',
            })
            
            createGroup(group);

            if(!success) throw new Error('Failed') 
            router.back();
        } catch (error) {
            setLocalError((error as Error).message || 'Failed submitting')
        }

    }


    const onRemovePress = async (id: string) => {
        try {
            if(!businessId) throw new Error('Business ID missing');
            if(!id) throw new Error('Offer ID missing');

            remove({ id, businessId });
            router.back();
        } catch (error) {
            setLocalError((error as Error).message || 'Failed removing offer')  
        }
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