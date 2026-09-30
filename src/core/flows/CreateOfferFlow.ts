import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { TEdit } from "@/src/core/interface/domainHookInterface";
import { BusinessLogic, useBusinessesStore } from "@/src/core/models/Business/Business";
import { newGroup, useGroupStore } from "@/src/core/models/Group/Group";
import { newOffer, Offer, useOfferStore } from "@/src/core/models/Offer/Offer";
import { Trail, TrailLogic, useTrailList } from "@/src/core/models/Trail/Trail";
import { useAuthHook, UserLogic } from "@/src/core/models/User/User";

import { produce } from "immer";
import { useState } from "react";

export type UseOfferParams = {
    trailId?: string | null,
    businessId?: string | null,
    offerId?: string | null,
    mode?: string | null,
}

export type FormMode = 'create' | 'edit';

export function CreateOfferFlow(params: UseOfferParams = {}) {
    const { offerId } = params
    const { profile, businessId } = useAuthHook();
    const { onBackPress } = useAppNavigation();
    const {
        trails
    } = useTrailList();

    const [loadingFlow, setLoadingFlow] = useState(false);

    const businessAccount = useBusinessesStore(s => s.current);
    const offers = useOfferStore(s => s.businessOffers);
    const error = useOfferStore(s => s.error);
    const remove = useOfferStore(s => s.delete);
    const create = useOfferStore(s => s.newOffer);

    const createGroup = useGroupStore(s => s.createGroup);
    const [localError, setLocalError] = useState<string | null>(null);

    const [offer, setOffer] = useState<Offer>(() => {
        const existing = offers.find(offer => offer.id === offerId);

        if (!businessAccount) {
            setLocalError('No business account');
            return newOffer();
        }

        const businessSummary = BusinessLogic.toSummary(businessAccount);

        return existing
            ? newOffer(existing)
            : newOffer({ business: businessSummary });
    })

    const onUpdatePress = (params: TEdit<Offer>) => {
        const { section, id, value } = params;

        try {
            setOffer(prev =>
                produce(prev, (draft) => {
                    if (section === 'root') {
                        (draft as Record<string, any>)[id] = value;
                    } else {
                        const nestedSection = section as keyof Offer;
                        if (draft[nestedSection] && typeof draft[nestedSection] === 'object') {
                            (draft[nestedSection] as Record<string, any>)[id] = value;
                        }
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
            setLoadingFlow(true);

            if (!profile)
                throw new Error('User profile not found');

            const success = await create(offer);
            if (!success) throw new Error('Failed creating/updating offer');

            const groupBlueprint = newGroup({
                id: success.id,
                admins: [UserLogic.toSummary(profile)],
                participantsIds: [profile.id],
                business: offer.business,
                trail: offer.trail,
                offer: {
                    id: success.id,
                    date: success.date,
                    documents: success.documents,
                    schedule: success.schedule,
                    endDate: success.endDate,
                    duration: success.duration,
                    price: success.price,
                    maxPax: success.maxPax,
                    minPax: success.minPax,
                    reservedPax: success.reservedPax,
                    inclusions: success.inclusions,
                    thingsToBring: success.thingsToBring,
                    reminders: success.reminders,
                    description: success.description
                },
                status: 'active',
            });

            await createGroup(groupBlueprint);
            // if (mode === 'create') {
            // } else if (mode === 'edit') {
            //     let groupExists = false;

            //     try {
            //         const existingGroup = await checkGroupExists(offer.id);
            //         if (existingGroup) {
            //             groupExists = true;
            //         }
            //     } catch (e) {
            //         console.log('Group not found in DB. Catching error to heal the offer.');
            //         groupExists = false;
            //     }

            //     if (!groupExists) {
            //         console.log('Healing broken offer: Creating missing group...');
            //         await createGroup(groupBlueprint);
            //     } else {
            //         console.log('Offer updated successfully. Existing group preserved.');
            //     }
            // }

            onBackPress();
            setLoadingFlow(false);
        } catch (error) {
            setLoadingFlow(false);
            setLocalError((error as Error).message || 'Failed submitting');
        }
    }

    const onRemovePress = async (id: string) => {
        try {
            if (!businessId) throw new Error('Business ID missing');
            if (!id) throw new Error('Offer ID missing');

            await remove({ id, businessId });

            onBackPress();
        } catch (error) {
            setLocalError((error as Error).message || 'Failed removing offer')
        }
    }

    return {
        offer,
        error: error || localError,
        isLoading: loadingFlow,
        businessId,
        trails,
        onRemovePress,
        onUpdatePress,
        onSubmitPress,
        onSetTrail,
        onBackPress,
    }
}