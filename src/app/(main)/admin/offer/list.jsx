import CustomTextInput from "@/src/components/CustomTextInput";
import { useAdmin } from "@/src/core/hook/useAdmin";
import { toDate } from "@/src/core/utility/date";
import { useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function adminOfferList(){
    const { businessId } = useLocalSearchParams();
    
    const {
        filteredOffers,
        isLoading,
        onWriteOffer,
        onFilterOffers,
    } = useAdmin({ businessId });

    return (
        <ScrollView>
            <CustomTextInput
                placeholder='Date'
                value={undefined}
                type='date'
                label={'Offer Date'}
                onChangeText={(date) => onFilterOffers(date)}
            />
            <Pressable onPress={() => onFilterOffers()}>
                <Text>SEARCH</Text>
            </Pressable>

            <Pressable onPress={() => onFilterOffers()}>
                <Text>RESET</Text>
            </Pressable>

            { businessId && 
                <Pressable onPress={() => onWriteOffer()}>
                    <Text>ADD NEW</Text>
                </Pressable>
            }

            { isLoading 
                ? <Text>LOADING OFFERS</Text>  
                : <View>
                    { filteredOffers.length > 0
                        ? <ADMINBOOK
                            offers={filteredOffers}
                            onWriteOffer={onWriteOffer}
                        />
                        : <Text style={styles.loading}>No Offers</Text>
                    }
                </View> 
            }
        </ScrollView>
    )
}


const ADMINBOOK = ({
    offers,
    onWriteOffer,
}) => {
    return (
        <View>
            
            { offers.map(o => {
                return (
                    <View style={styles.offerForm} key={o.id}>
                        <Text>Trail: {o.trail.name}</Text>
                        <Text>Price: P{o.price}.00 </Text>
                        <Text>Date: {toDate(o.hikeDate).toDateString()}</Text>
                        <Text>Duration: {o.hikeDuration}</Text>
                        <Text>Documents: {o.documents?.join(', ')}</Text>
                        <Text>Inclusions: {o.inclusions.length > 0 ? o.inclusions?.join(', ') : 'None'}</Text>
                        <Text>Description: {o.description}</Text>
                        
                        <Pressable onPress={() => onWriteOffer(o.id)}>
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