import WriteComponent from "@/src/components/CustomWriteComponents";
import { OFFER_CONSTANTS } from '@/src/constants/offers';
import { useBusinessesStore } from "@/src/core/stores/businessesStore";
import { useOffersStore } from "@/src/core/stores/offersStore";
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";

export default function writeOffer(){
    const { offerId } = useLocalSearchParams();
    const router = useRouter();
    
    const offerInformation = OFFER_CONSTANTS.OFFER_INFORMATION;
    const system = useOffersStore(s => s.error);
    const trails = useTrailsStore(s => s.trails);
    const offer = useOffersStore(s => s.offer);
    const isLoading = useOffersStore(s => s.isLoading);
    
    const addOffer = useOffersStore(s => s.addOffer);
    const writeOffer = useOffersStore(s => s.writeOffer);
    const deleteOffer = useOffersStore(s => s.deleteOffer);
    const resetOffer = useOffersStore(s => s.resetOffer);
    const editProperty = useOffersStore(s => s.editProperty);
    const businessAccount = useBusinessesStore(s => s.businessAccount);
    const loadTrails = useTrailsStore(s => s.loadTrails);

    useEffect(()=> {
        resetOffer();
        writeOffer(offerId);    
        loadTrails();
    }, [offerId]);

    const onSubmitOfferPress = async () => {
        const id = await addOffer(businessAccount);
        if(!id) return;
        router.back();    
    }

    const onDeleteOfferPress = async () => {
        const businessId = businessAccount?.id;
        if(offerId) await deleteOffer(offerId, businessId);
        router.back();
    }

    const onEditProperty = (property) => {
        const { value, type } = property;
        let finalValue = value;

        if(type === 'object-select'){
            const object = trails.find(t => t.general.name === property.value);

            finalValue = {
                ...object.general,
                id: object.id,
            }
            
        }

        editProperty({
            ...property,
            value: finalValue
        })
    }

    let options = [];
    
    trails.map(t => options.push(t.general.name));

    if(!offer) return;
    
    return(
        <WriteComponent
            informationSet={offerInformation}
            object={offer}
            options={options}
            system={system}
            isLoading={isLoading}
            onSubmit={onSubmitOfferPress}
            onDelete={onDeleteOfferPress}
            onEditProperty={onEditProperty}
        />
    )
}