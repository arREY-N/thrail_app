import CustomTextInput from "@/src/components/CustomTextInput";
import TESTUSERBOOK from "@/src/components/TESTCOMPONENTS/TestUserBook";
import useBookingsStore from "@/src/core/stores/bookingsStore";
import { useOffersStore } from "@/src/core/stores/offersStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function view(){
    const { trailId, businessId } = useLocalSearchParams();
    const router = useRouter();

    const bookingError = useBookingsStore(s => s.error);
    const offerError = useOffersStore(s => s.error);
    const loadTrailOffers = useOffersStore(s => s.loadTrailOffers);
    const loadBusinessOffers = useOffersStore(s => s.loadBusinessOffers);
    const isLoading = useOffersStore(s => s.isLoading)
    const checkBookings = useBookingsStore(s => s.checkBookings);
    const offers = useOffersStore(s => s.offers);
    const reset = useOffersStore(s => s.reset);

    const [date, setDate] = useState('');
    const [filteredOffers, setFilteredOffers] = useState(offers);
    
    useEffect(() => {        
        reset();
        if(businessId) loadBusinessOffers(businessId);
        if(trailId) loadTrailOffers(trailId);
    }, [trailId, businessId]);

    useEffect(() => {
        setFilteredOffers(offers);
    }, [offers])

    
    const filterOffers = () => {
        if(date) {
            setFilteredOffers(() => 
                offers.filter(o => o.date === date)
            )
        } else {
            setFilteredOffers(offers);
        }
    }

    const onBookNowPress = (id) => {
        console.log('WILL BOOK: ', id);
        if(!checkBookings(id)) return;
        router.push({
            pathname: '/(book)/book',
            params: { offerId: id }
        });
    }

    const onUpdateOffer = (id) => {
        router.push({
            pathname: '/offer/write',
            params: { offerId: id }
        })    
    }
    
    const onCreateNew = () => {
        router.push('/offer/write')
    }
    
    return (
        <ScrollView>
            <CustomTextInput
                placeholder="Date"
                value={date}
                onChangeText={(date) => setDate(date)}
            />
            <Pressable onPress={filterOffers}>
                <Text>SEARCH</Text>
            </Pressable>

            { businessId && 
                <Pressable onPress={onCreateNew}>
                    <Text>ADD NEW</Text>
                </Pressable>
            }

            { isLoading 
                ? <Text>LOADING OFFERS</Text>  
                : <View>
                    { offers.length > 0
                        ? <View>
                            {trailId && 
                                <TESTUSERBOOK 
                                    offers={filteredOffers}
                                    onBookNowPress={onBookNowPress}
                                    system={bookingError || offerError}
                                />
                            }
                
                            { businessId && 
                                <ADMINBOOK
                                    offers={filteredOffers}
                                    onUpdateOffer={onUpdateOffer}
                                    onCreateNew={onCreateNew}
                                />
                            }
                        </View>
                        : <Text style={styles.loading}>No Offers</Text>
                    }
                </View> 
            }
        </ScrollView>
    )
}



const ADMINBOOK = ({
    offers,
    onUpdateOffer,
    
}) => {
    return (
        <View>
            
            { offers.map((o) => {
                const general = o.general;
                const trail = o.trail;
                const hike = o.hike;
                return (
                    <View style={styles.offerForm} key={o.id}>
                        <Text>Trail: {o.trail?.name}</Text>
                        <Text>Price: P{o.price}.00 </Text>
                        <Text>Date: {o.date}</Text>
                        <Text>Duration: {o.duration}</Text>
                        <Text>Documents: {o.documents?.join(', ')}</Text>
                        <Text>Inclusions: {o.inclusions.length > 0 ? o.inclusions?.join(', ') : 'None'}</Text>
                        <Text>Description: {o.description}</Text>
                        
                        <Pressable onPress={() => onUpdateOffer(o.id)}>
                            <Text>Edit Offer</Text>
                        </Pressable>
                    </View>
                )})
            }
            <View style={{margin: 50}}/>
        </View>
    )
}

const styles = StyleSheet.create({
    offerForm: {
        borderWidth: 1,
        margin: 10,
        padding: 5
    },
    loading: {
        textAlign: 'center',
        margin: 10,
        padding: 10,
    }
})