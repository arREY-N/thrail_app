import CustomTextInput from "@/src/components/CustomTextInput";
import useBookingsStore from "@/src/core/stores/bookingsStore";
import { useOffersStore } from "@/src/core/stores/offersStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function book(){
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const bookingError = useBookingsStore(s => s.error);
    const offerError = useOffersStore(s => s.error);
    const loadTrailOffers = useOffersStore(s => s.loadTrailOffers);
    const trailOffers = useOffersStore(s => s.trailOffers);
    const offerIsLoading = useOffersStore(s => s.isLoading)
    const checkBookings = useBookingsStore(s => s.checkBookings);
    const [date, setDate] = useState('');
    const [filteredOffers, setFilteredOffers] = useState(trailOffers);
    
    useEffect(() => {        
        loadTrailOffers(id);
        setFilteredOffers(trailOffers);
    }, [id, trailOffers]);
    
    const filterOffers = () => {
        if(date) {
            setFilteredOffers(() => 
                trailOffers.filter(o => o.date === date)
            )
        } else {
            setFilteredOffers(trailOffers);
        }
    }

    const onBookNowPress = (id) => {
        if(!checkBookings(id)) return;
        router.push(`/(book)/${id}`);
    }
    
    return(
        <TESTBOOK 
            offers={filteredOffers}
            isLoading={offerIsLoading}
            onBookNowPress={onBookNowPress}
            system={bookingError || offerError}
            date={date}
            setDate={setDate}
            filterOffers={filterOffers}
        />
    )
}

const TESTBOOK = ({
    offers,
    isLoading,
    onBookNowPress,
    system,
    date,
    setDate,
    filterOffers,
}) => {
    return (
        <View>
            { system && <Text>{system}</Text>}

            <CustomTextInput
                placeholder="Date"
                value={date}
                onChangeText={(date) => setDate(date)}
            />
            <Pressable onPress={filterOffers}>
                <Text>SEARCH</Text>
            </Pressable>

            { !isLoading ?  
                offers?.length > 0 &&
                    offers.map((o) => {
                        const hike = o.hike;
                        const general = o.general;
                        return (
                            <View style={styles.offerForm} key={o.id}>
                                <Text>Trail: {hike?.trail?.name}</Text>
                                <Text>Price: P{general.price}.00 </Text>
                                <Text>Date: {general.date}</Text>
                                <Text>Duration: {hike.duration}</Text>
                                <Text>Documents: {general.documents?.join(', ')}</Text>
                                <Text>Inclusions: {hike.inclusions?.join(', ')}</Text>
                                <Text>Description: {general.description}</Text>
                            
                                <Pressable onPress={() => onBookNowPress(o.id)}>
                                    <Text>BOOK NOW</Text>
                                </Pressable>
                            </View>
                        )
                    })
                : <Text style={styles.loading}>New Offers loading</Text>
            }
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