import CustomTextInput from "@/src/components/CustomTextInput";
import { createOfferObject } from "@/src/core/domain/offerDomain";
import { useAuthStore } from "@/src/core/stores/authStore";
import { useBusinessesStore } from "@/src/core/stores/businessesStore";
import { useOffersStore } from "@/src/core/stores/offersStore";
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function offer(){
    const [system, setSystem] = useState(null);
    const trails = useTrailsStore((state) => state.trails);
    const loadTrails = useTrailsStore((state) => state.loadTrails);

    const addOffer = useOffersStore((state) => state.addOffer);
    const offers = useOffersStore((state) => state.offers);
    const loadOffers = useOffersStore((state) => state.loadOffers);
    const deleteOffer = useOffersStore((state) => state.deleteOffer);
    const offersIsLoading = useOffersStore((state) => state.isLoading);

    const profile = useAuthStore((state) => state.profile);
    const businessAccount = useBusinessesStore((state) => state.businessAccount);

    useEffect(()=> {
        loadTrails();
        loadOffers(businessAccount?.id);
    }, [businessAccount?.id]);

    const onSubmitOfferPress = async (offerData) => {
        try { 
            const filledOffer = createOfferObject({
                trails: trails,
                admin: profile,
                business: businessAccount,
                offerData,
            })

            await addOffer(filledOffer);
        } catch (err) {
            setSystem(err.message);
        }
    }

    const onDeleteOfferPress = (offerId) => {
        try {
            const businessId = businessAccount?.id;
            console.log('Delete ', offerId, ' by ', businessId);
            deleteOffer(offerId, businessId);
        } catch (err) {
            setSystem(err.message);
        }
    }

    return(
        <TESTOFFER
            trails={trails}
            offers={offers}
            onSubmitOfferPress={onSubmitOfferPress}
            system={system}
            onDeleteOfferPress={onDeleteOfferPress}
            isLoading={offersIsLoading}
        />
    )
}

const TESTOFFER = ({
    trails,
    onSubmitOfferPress,
    system,
    offers,
    onDeleteOfferPress,
    isLoading,
}) => {
    const [date, setDate] = useState('');
    const [trail, setTrail] = useState(null);
    const [price, setPrice] = useState(null);

    return (
        <ScrollView>
            <Text>Offer screen</Text>

            <View style={styles.offerForm}>
                { system && <Text>{system}</Text> }
                <CustomTextInput
                    placeholder="Trail"
                    value={trail?.name || ''}
                    onChangeText={null}
                />

                { trails?.length > 0 &&
                    trails.map((t) => {
                        return(
                            <Pressable onPress={() => setTrail(t)}>
                                <Text>{t.name}</Text>
                            </Pressable>
                        )
                    })
                }

                <CustomTextInput
                    placeholder="Date"
                    value={date}
                    onChangeText={setDate}
                />
                
                <CustomTextInput
                    placeholder="Price"
                    value={price}
                    onChangeText={setPrice}
                />

                <Pressable onPress={() => onSubmitOfferPress({
                    trailId: trail?.id,
                    price,
                    date
                })}>
                    <Text>SUBMIT OFFER</Text>
                </Pressable>
            </View>

            { !isLoading ?
                offers?.length > 0 && offers.map((o) => {
                        const trail = trails.find(t => t.id === o.trailId);
                        return (
                            <View style={styles.offerForm} key={o.id}>
                                <Text>Trail: {trail?.name}</Text>
                                <Text>Price: P{o.price}.00 </Text>
                                <Text>Date: {o.date}</Text>

                                <Pressable onPress={() => onDeleteOfferPress(o.id)}>
                                    <Text>Delete Offer</Text>
                                </Pressable>
                            </View>
                        )
                    })
                : <Text style={styles.loading}>New Offers loading</Text>
            }

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