import { useBusinessesStore } from "@/src/core/stores/businessesStore";
import { useOffersStore } from "@/src/core/stores/offersStore";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function offer(){
    const router = useRouter();

    const offers = useOffersStore(s => s.offers);
    const loadOffers = useOffersStore(s => s.loadOffers);
    const offersIsLoading = useOffersStore(s => s.isLoading);
    const resetOffer = useOffersStore(s => s.resetOffer);
    const businessAccount = useBusinessesStore(s => s.businessAccount);

    useEffect(()=> {
        resetOffer();    
        loadOffers(businessAccount?.id);
    }, [businessAccount?.id]);

    const onUpdateOffer = (id) => {
        router.push({
            pathname: '/(offer)/write',
            params: { offerId: id }
        })    
    }
    
    const onCreateNew = () => {
        router.push('/(offer)/write')
    }

    return(
        <TESTOFFER
            offers={offers}
            isLoading={offersIsLoading}
            onUpdateOffer={onUpdateOffer}
            onCreateNew={onCreateNew}
        />
    )
}

const TESTOFFER = ({
    offers,
    isLoading,
    onUpdateOffer,
    onCreateNew
}) => {
    return (
        <ScrollView>
            <Pressable onPress={onCreateNew}>
                <Text>ADD NEW</Text>
            </Pressable>
            { !isLoading 
                ? offers?.length > 0 && offers.map((o) => {
                    const general = o.general;
                    const trail = o.trail;
                    const hike = o.hike;

                    return (
                        <View style={styles.offerForm} key={o.id}>
                            <Text>Trail: {trail?.name}</Text>
                            <Text>Price: P{general?.price}.00 </Text>
                            <Text>Date: {general?.date}</Text>
                            <Text>Duration: {hike?.duration}</Text>
                            <Text>Documents: {general?.documents?.join(', ')}</Text>
                            <Text>Inclusions: {hike?.inclusions?.join(', ')}</Text>
                            <Text>Description: {general?.description}</Text>
                            
                            <Pressable onPress={() => onUpdateOffer(o.id)}>
                                <Text>Edit Offer</Text>
                            </Pressable>
                        </View>
                    )})
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