import LoadingScreen from "@/src/app/loading";
import CustomTextInput from "@/src/components/CustomTextInput";
import { useOfferWrite } from "@/src/core/hook/offer/useOfferWrite";
import useTrail from "@/src/core/hook/trail/useTrail";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { TEdit } from "@/src/core/interface/domainHookInterface";
import { Offer } from "@/src/core/models/Offer/Offer";
import { Trail } from "@/src/core/models/Trail/Trail";
import getSearchParam from "@/src/core/utility/getSearchParam";
import { useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function writeOffer(){
    const { offerId: rawOfferId } = useLocalSearchParams();
    const { businessId } = useAuthHook();

    const offerId = getSearchParam(rawOfferId);

    const {
        trails
    } = useTrail();

    const {
        offer,
        error,
        isLoading,
        onRemovePress,
        onUpdatePress,
        onSubmitPress,
        onSetTrail,
    } = useOfferWrite({ offerId, businessId })
    
    if(isLoading || !offer) return <LoadingScreen/>
    
    console.log(offer)
    
    return(
        <TESTWRITEOFFER
            trails={trails}
            offer={offer}
            error={error}
            isLoading={isLoading}
            onSubmitOffer={onSubmitPress}
            onDeleteOffer={onRemovePress}
            onUpdateOffer={onUpdatePress}
            onSetTrail={onSetTrail}
        />
    ) 
}
  
export type TestWriteOfferParams = {
    offer: Offer;
    error: string | null;
    isLoading: boolean;
    trails: Trail[];
    onSubmitOffer: () => Promise<void>;
    onDeleteOffer: (id: string) => Promise<void>;
    onUpdateOffer: (params: TEdit<Offer>) => void;
    onSetTrail: (trail: Trail) => void;
}

const TESTWRITEOFFER = ({
    trails,
    offer,
    error,
    isLoading,
    onSubmitOffer,
    onDeleteOffer,
    onUpdateOffer,
    onSetTrail,
}: TestWriteOfferParams) => {
    return (
        <ScrollView>
            <CustomTextInput 
                label={'Description'}
                placeholder={'Offer description'}
                value={offer.description}
                onChangeText={(text: string) => onUpdateOffer({
                    section: 'root',
                    id: 'description',
                    value: text
                })}
                secureTextEntry={undefined}
                keyboardType={undefined}
                isPasswordVisible={undefined}
                onTogglePassword={undefined}
                style={undefined}
                icon={undefined}
                prefix={undefined}
                children={undefined} showTodayButton={undefined} allowFutureDates={undefined}            />

            <Text>TRAIL: {offer.trail.name}</Text>
            
            {
                trails.map(trail => {
                    return (
                        <Pressable onPress={() => onSetTrail(trail)}>
                            <Text>{trail.general.name}</Text>
                        </Pressable>
                    )
                })
            }


            { error && <Text>{error}</Text> }
            { isLoading && <Text>Loading</Text>}
            <Pressable onPress={() => onSubmitOffer()}>
                <Text>SAVE</Text>
            </Pressable>
            <Pressable onPress={() => onDeleteOffer(offer.id)}>
                <Text>DELETE</Text>
            </Pressable>

            <View style={{margin: 50}}/>
        </ScrollView>
    )
}