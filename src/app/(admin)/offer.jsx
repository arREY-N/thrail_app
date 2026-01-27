import { useBusinessesStore } from "@/src/core/stores/businessesStore";
import { useOffersStore } from "@/src/core/stores/offersStore";
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const DOCUMENT_LIST = ['Valid ID', 'Medical Certificate', 'Waiver' ]
const HIKE_DURATION = ['1-3 hours', 'Half-day', 'Full-day', 'Overnight', 'Multi-day']
const OFFER_INCLUSIONS = ['Shuttle', 'Tent', 'Bag tag']

export default function offer(){
    const router = useRouter();

    const trails = useTrailsStore(s => s.trails);
    const loadTrails = useTrailsStore(s => s.loadTrails);

    const offers = useOffersStore(s => s.offers);
    const loadOffers = useOffersStore(s => s.loadOffers);
    const offersIsLoading = useOffersStore(s => s.isLoading);
    const resetOffer = useOffersStore(s => s.resetOffer);
    const businessAccount = useBusinessesStore(s => s.businessAccount);

    useEffect(()=> {
        loadTrails();
        loadOffers(businessAccount?.id);
        resetOffer();    
    }, [businessAccount?.id]);

    const onUpdateOffer = (id) => {
        router.push(`/(offer)/(write)/${id}`)    
    }
    
    const onCreateNew = () => {
        router.push(`/(offer)/(write)/${null}`)    
    }

    return(
        <TESTOFFER
            trails={trails}
            offers={offers}
            isLoading={offersIsLoading}
            onUpdateOffer={onUpdateOffer}
            onCreateNew={onCreateNew}
        />
    )
}

const TESTOFFER = ({
    trails,
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
            { !isLoading ?
                offers?.length > 0 && offers.map((o) => {
                        const trail = trails.find(t => t.id === o.trail?.id);
                        return (
                            <View style={styles.offerForm} key={o.id}>
                                <Text>Trail: {trail?.name}</Text>
                                <Text>Price: P{o.price}.00 </Text>
                                <Text>Date: {o.date}</Text>
                                <Text>Duration: {o.duration}</Text>
                                <Text>Documents: {o.documents?.join(', ')}</Text>
                                <Text>Inclusions: {o.inclusions?.join(', ')}</Text>
                                <Text>Description: {o.description}</Text>
                                
                                <Pressable onPress={() => onUpdateOffer(o.id)}>
                                    <Text>Edit Offer</Text>
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