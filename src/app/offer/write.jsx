import WriteComponent from "@/src/components/CustomWriteComponents";
import { OFFER_CONSTANTS } from '@/src/constants/offers';
import { useBusinessesStore } from "@/src/core/stores/businessesStore";
import { useOffersStore } from "@/src/core/stores/offersStore";
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

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
    const loadTrails = useTrailsStore(s => s.loadAllTrails);

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
        console.log(property);
        if(type === 'object-select'){
            const object = trails.find(t => t.name === property.value);
            finalValue = {
                id: object.id,
                name: object.name,
            }
            console.log(finalValue);
            
        }

        editProperty({
            ...property,
            value: finalValue
        })
    }

    let options = [];
    
    trails.map(t => options.push(t.name));

    if(!offer) return;
    
    return(
        <TestWriteOffer
            offerInformation={offerInformation}
            offer={offer}
            options={options}
            system={system}
            isLoading={isLoading}
            onSubmit={onSubmitOfferPress}
            onDelete={onDeleteOfferPress}
            onEditProperty={onEditProperty}
        />
    )
}

const TestWriteOffer = ({
    offerInformation,
    offer,
    options,
    system,
    isLoading,
    onSubmit,
    onDelete,
    onEditProperty
}) => {
    return(
        <ScrollView>
            <WriteComponent
                informationSet={offerInformation}
                object={offer}
                options={options}
                system={system}
                isLoading={isLoading}
                onSubmit={onSubmit}
                onDelete={onDelete}
                onEditProperty={onEditProperty}
            />

            { isLoading && <Text>LOADING</Text>}
            { system && <Text>{system}</Text>}
            <Pressable onPress={() => onSubmit()}>
                <Text>Submit</Text>
            </Pressable>
            <Pressable onPress={() => onDelete()}>
                <Text>Delete</Text>
            </Pressable>
            <View style={{margin: 50}}/>

        </ScrollView>
    )
}