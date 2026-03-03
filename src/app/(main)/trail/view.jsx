import { useOfferDomain } from "@/src/core/hook/offer/useOfferDomain";
import useTrailDomain from "@/src/core/hook/trail/useTrailDomain";
import { useAppNavigation } from "@/src/core/hook/useAppNavigation";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import TrailScreen from "@/src/features/Trail/screens/TrailScreen";
import { useLocalSearchParams } from "expo-router";
import { Pressable, Text } from "react-native";
import LoadingScreen from "../../loading";

export default function viewTrail(){
    const { trailId } = useLocalSearchParams();
    
    const { onBackPress, onDownloadPress } = useAppNavigation();

    const { isSuperadmin } = useAuthHook();
    
    const {
        trail,
        onHikePress,
        onWriteTrail, 
    } = useTrailDomain({ trailId });

    const {
        onSeeTrailOffers
    } = useOfferDomain({});
    
    if(!trail) return <LoadingScreen/>;

    return(
        <>
            { isSuperadmin && 
                <Pressable onPress={() => onWriteTrail(trailId)}>
                    <Text>EDIT</Text>
                </Pressable>
            }

            <TrailScreen 
                trail={trail} 
                onBackPress={onBackPress} 
                onDownloadPress={onDownloadPress} 
                onHikePress={onHikePress}
                onBookPress={onSeeTrailOffers}
                onEditPress={onWriteTrail}
            />
        </>
    )
}