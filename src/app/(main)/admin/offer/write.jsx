import LoadingScreen from "@/src/app/loading";
import WriteComponent from "@/src/components/CustomWriteComponents";
import { useAuthHook } from "@/src/core/hook/useAuthHook";
import { useOfferWrite } from "@/src/core/hook/useOfferWrite";
import { useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function writeOffer(){
    const { offerId } = useLocalSearchParams();
    const { businessId } = useAuthHook();

    const {
        information,
        offer,
        options,
        error,
        isLoading,
        onRemovePress,
        onEditProperty,
        onSubmitPress,
    } = useOfferWrite({ offerId, businessId })
    
    if(isLoading || !offer) return <LoadingScreen/>

    return(
        <TESTWRITEOFFER
            informationSet={information}
            object={offer}
            optionSet={options}
            system={error}
            isLoading={isLoading}
            onSubmit={onSubmitPress}
            onDelete={onRemovePress}
            onEditProperty={onEditProperty}
        />
    )
}
    
const TESTWRITEOFFER = ({    
        informationSet,
        object,
        optionSet,
        system,
        isLoading,
        onSubmit,
        onDelete,
        onEditProperty,
}) => {
    return (
        <ScrollView>
            <WriteComponent
                informationSet={informationSet}
                object={object}
                optionSet={optionSet}
                onEditProperty={onEditProperty}
            />

            { system && <Text>{system}</Text>}
            { isLoading && <Text>Loading</Text>}
            <Pressable onPress={onSubmit}>
                <Text>SAVE</Text>
            </Pressable>
            <Pressable onPress={() => onDelete(object.id)}>
                <Text>DELETE</Text>
            </Pressable>

            <View style={{margin: 50}}/>
        </ScrollView>
    )
}