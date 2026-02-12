import { OFFER_INFORMATION } from "@/src/fields/offerFields";
import { UseOfferParams } from "@/src/types/entities/Offer";
import { Property } from "@/src/types/Property";
import { router } from "expo-router";
import { useEffect } from "react";
import { useBusinessesStore } from "../stores/businessesStore";
import { useOffersStore } from "../stores/offersStore";
import { useTrailsStore } from "../stores/trailsStore";

export function useOfferWrite(params: UseOfferParams){
    const { offerId, businessId } = params
    const loadBusinessAccount = useBusinessesStore(s => s.load);
    const businessAccount = useBusinessesStore(s => s.current);

    const loadOffer = useOffersStore(s => s.load);
    const offer = useOffersStore(s => s.current);
    const create = useOffersStore(s => s.create);
    const remove = useOffersStore(s => s.delete);
    const edit = useOffersStore(s => s.edit);
    
    const error = useOffersStore(s => s.error);
    const isLoading = useOffersStore(s => s.isLoading);
    const information = OFFER_INFORMATION;

    const loadTrails = useTrailsStore(s => s.fetchAll);
    const trails = useTrailsStore(s => s.data);

    useEffect(() => {
        loadTrails();
        loadBusinessAccount(businessId);
        loadOffer({id: offerId, businessId});
    }, [offerId, businessId])

    const onEditProperty = (property: Property) => {
        const { value, type } = property;
        let finalValue = value;

        if(type === 'object-select'){
            const object = trails.find(t => t.name === property.value);
            finalValue = object 
                ? {id: object.id, name : object.name} 
                : {trailId: '', trailName : '' };
        }

        edit({
            ...property,
            value: finalValue
        })
    }

    const onSubmitPress = async () => {
        console.log(businessAccount);
        const id = await create(businessAccount);
        if(!id) return;
        router.back();    
    }

    const options = {
        trails: [...trails.map(m => m.name)]
    }

    const onRemovePress = (id: string) => {
        remove({id, businessId: businessAccount?.id});
        router.back();
    }

    return {
        information,
        offer,
        options,
        error,
        isLoading,
        onRemovePress,
        onEditProperty,
        onSubmitPress,
    }
}