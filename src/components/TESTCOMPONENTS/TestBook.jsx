import CustomTextInput from "@/src/components/CustomTextInput";
import { formatDate } from "@/src/core/utility/date";
import { Pressable, StyleSheet, Text, View } from "react-native";

const TESTBOOK = ({
    offer,
    profile,
    mode,
    setMode,
    modes,
    onPayPress,
    isLoading,
    system
}) => {
    console.log(offer);
    return (
        <View>    
            <Text>Book</Text>
            { system && <Text>{system}</Text> }
            { !isLoading 
                ? offer && 
                    <View>    
                        <View style={styles.card}>
                            <Text>Offer Information</Text>
                            <Text>Trail: {offer.trail.name ?? ''}</Text>
                            <Text>Price: {offer.price ?? ''}</Text>
                            <Text>Provider: {offer?.business.name ?? ''}</Text>
                            <Text>Date: {formatDate(offer.hikeDate) ?? ''}</Text>
                        </View>
                        <View style={styles.card}>
                            <Text>User Information</Text>
                            <Text>User: {profile.firstname} {profile?.lastname}</Text>
                            <Text>Email: {profile.email}</Text>
                        </View>
                        
                        <CustomTextInput
                            placeholder="Mode of Payment"
                            value={mode}
                            onChangeText={null}
                        />
                        {
                            modes.map(m => {
                                return (
                                    <Pressable onPress={() => setMode(m)}>
                                        <Text>{m}</Text>
                                    </Pressable>
                                )
                            })
                        }     

                        <Pressable onPress={() => onPayPress(mode)}>
                            <Text>Pay</Text>
                        </Pressable>
                    </View> 
                : <Text>Offer loading</Text>
            }
        </View>
    )
}

export default TESTBOOK;

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        margin: 10,
        padding: 5
    },
    loading: {
        margin: 10,
        padding: 5,
        textAlign: 'center'
    }
})