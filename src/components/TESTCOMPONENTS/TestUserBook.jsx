import { formatDate } from "@/src/core/utility/date";
import { Pressable, StyleSheet, Text, View } from "react-native";

const TESTUSERBOOK = ({
    offers,
    onBookNowPress,
    system,
}) => {
    return (
        <View>
            { system && <Text>{system}</Text>}

            { offers.length > 0 
                ? offers.map((o) => {
                    console.log(o);
                    return (
                        <View style={styles.offerForm} key={o.id}>
                            <Text>Trail: {o.trail.name}</Text>
                            <Text>Price: P{o.price}.00 </Text>
                            <Text>Date: {formatDate(o.hikeDate)}</Text>
                            <Text>Duration: {o.hikeDuration}</Text>
                            <Text>Documents: {o.documents.join(', ')}</Text>
                            <Text>Inclusions: {o.inclusions.length > 0 ? o.inclusions.join(', ') : 'None'}</Text>
                            <Text>Description: {o.description}</Text>
                        
                            <Pressable onPress={() => onBookNowPress(o.id)}>
                                <Text>BOOK NOW</Text>
                            </Pressable>
                        </View>
                    )
                })
                : <Text>No Offers</Text>
            }
        </View>
    )
}

export default TESTUSERBOOK;

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