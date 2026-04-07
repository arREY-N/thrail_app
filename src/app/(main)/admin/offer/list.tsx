import useAdminOffer from "@/src/core/hook/admin/useAdminOffer";
import useAdminNavigation from "@/src/core/hook/navigation/useAdminNavigation";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { toDate } from "@/src/core/utility/date";
import getSearchParam from "@/src/core/utility/getSearchParam";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function adminOfferList(){
    const { businessId: rawId } = useLocalSearchParams();
    const id = getSearchParam(rawId);

    const { onBackPress } = useAppNavigation();

    const {
        onWriteOffer,
    } = useAdminNavigation({ businessId: id });

    const { 
        isLoading,
        error,
        businessOffers,
        onViewOfferBookings,
    } = useAdminOffer();

    // return (
    //     <>
    //         <Stack.Screen options={{ headerShown: false }} />
            
    //         <OfferListScreen 
    //             offers={businessOffers}
    //             isLoading={isLoading}
    //             onAddOffer={onWriteOffer} 
    //             onEditOffer={onWriteOffer}
    //             onBackPress={onBackPress}
    //         />
    //     </>
    // );

    return (
        <ScrollView>
            <Pressable onPress={() => onWriteOffer()}>
                <Text>ADD NEW</Text>
            </Pressable>

            { isLoading 
                ? <Text>LOADING OFFERS</Text>  
                : <View>
                    { businessOffers.length > 0
                        ? businessOffers.map(o => {
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
                                    <Pressable onPress={() => onViewOfferBookings(o.id)}>
                                        <Text>View Bookings</Text>
                                    </Pressable>
                                </View>
                            )})
                            
                        : <Text style={styles.loading}>No Offers</Text>
                    }
                </View> 
            }
        </ScrollView>
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