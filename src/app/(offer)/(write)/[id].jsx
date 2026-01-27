import CustomTextInput from "@/src/components/CustomTextInput";
import { OFFER_CONSTANTS } from '@/src/constants/offers';
import { useBusinessesStore } from "@/src/core/stores/businessesStore";
import { useOffersStore } from "@/src/core/stores/offersStore";
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function writeOffer(){
    const { id } = useLocalSearchParams();
    const router = useRouter();
    
    const system = useOffersStore(s => s.error);

    const trails = useTrailsStore(s => s.trails);

    const addOffer = useOffersStore(s => s.addOffer);
    const onIncludeDocument = useOffersStore(s => s.includeDocument);
    const onEditOffer = useOffersStore(s => s.editOffer);
    const offer = useOffersStore(s => s.offer);
    const resetOffer = useOffersStore(s => s.resetOffer);
    const onIncludeInclusions = useOffersStore(s => s.includeInclusions);
    const writeOffer = useOffersStore(s => s.writeOffer);
    const deleteOffer = useOffersStore(s => s.deleteOffer);

    const businessAccount = useBusinessesStore(s => s.businessAccount);

    useEffect(()=> {
        resetOffer();
        if(id) writeOffer(id);    
    }, [id]);

    const onSubmitOfferPress = async () => {
        await addOffer(businessAccount);
        router.back();    
    }

    const onDeleteOfferPress = async () => {
        const businessId = businessAccount?.id;
        alert('SURE?')
        if(id !== null) await deleteOffer(id, businessId);
        router.back();
    }

    return(
        <TESTOFFER
            trails={trails}
            system={system}
            offer={offer}
            docs={OFFER_CONSTANTS.DOCUMENT_LIST}
            durations={OFFER_CONSTANTS.HIKE_DURATION}
            inclusions={OFFER_CONSTANTS.OFFER_INCLUSIONS}
            
            onSubmitOfferPress={onSubmitOfferPress}
            onIncludeDocument={onIncludeDocument}
            onIncludeInclusion={onIncludeInclusions}
            onEditOffer={onEditOffer}
            onDeleteOfferPress={onDeleteOfferPress}
        />
    )
}

const TESTOFFER = ({
    trails,
    system,
    offer,
    docs,
    durations,
    inclusions,
    onSubmitOfferPress,
    onIncludeDocument,
    onIncludeInclusion,
    onEditOffer,
    onDeleteOfferPress
}) => {
    return (
        <ScrollView>
            <Text>Offer screen</Text>

            <View style={styles.offerForm}>
                { system && <Text>{system}</Text> }
                <CustomTextInput
                    placeholder="Trail"
                    value={offer.trail?.name || ''}
                    onChangeText={null}
                />

                { trails?.length > 0 &&
                    trails.map(t => {
                        return(
                            <Pressable onPress={() => onEditOffer({trail: t})}>
                                <Text>{t.name}</Text>
                            </Pressable>
                        )
                    })
                }

                <CustomTextInput
                    placeholder="Date"
                    value={offer.date || ''}
                    onChangeText={(date) => onEditOffer({date})}
                />
                
                <CustomTextInput
                    placeholder="Price"
                    value={offer.price || ''}
                    onChangeText={(price) => onEditOffer({price})}
                />
                
                <CustomTextInput
                    placeholder="Documents"
                    value={offer.documents?.join(', ')}
                    onChangeText={null}
                />

                { 
                    docs.map((t) => {
                        return(
                            <Pressable onPress={() => onIncludeDocument(t)}>
                                <Text>{t}</Text>
                            </Pressable>
                        )
                    })
                }
                
                <CustomTextInput
                    placeholder="Duration"
                    value={offer.duration || ''}
                    onChangeText={null}
                />

                { 
                    durations.map((duration) => {
                        return(
                            <Pressable onPress={() => onEditOffer({duration})}>
                                <Text>{duration}</Text>
                            </Pressable>
                        )
                    })
                }
                
                <CustomTextInput
                    placeholder="Inclusions"
                    value={offer.inclusions?.join(', ') || ''}
                    onChangeText={null}
                />

                { 
                    inclusions.map((inclusion) => {
                        return(
                            <Pressable onPress={() => onIncludeInclusion(inclusion)}>
                                <Text>{inclusion}</Text>
                            </Pressable>
                        )
                    })
                }

                <CustomTextInput
                    placeholder="Description"
                    value={offer.description || ''}
                    onChangeText={(description) => onEditOffer({description})}
                />

                <Pressable onPress={() => onSubmitOfferPress()}>
                    <Text>SAVE OFFER</Text>
                </Pressable>

                <Pressable onPress={() => onDeleteOfferPress()}>
                    <Text>DELETE OFFER</Text>
                </Pressable>
            </View>

            <View style={{margin: 50}}/>            
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    offerForm: {
        margin: 10,
        borderWidth: 1,
        padding: 10
    },
    loading: {
        textAlign: 'center',
        margin: 10,
        padding: 10,
    }
})