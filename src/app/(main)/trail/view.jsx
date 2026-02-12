import { useAppNavigation } from "@/src/core/hook/useAppNavigation";
import { useAuthHook } from "@/src/core/hook/useAuthHook";
import useTrailDomain from "@/src/core/hook/useTrailDomain";
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
        onBookPress,
        onWriteTrail, 
    } = useTrailDomain({ trailId });
    
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
                onBookPress={onBookPress}
                onEditPress={onWriteTrail}
            />
        </>
    )
}