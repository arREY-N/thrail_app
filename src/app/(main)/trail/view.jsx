import { useAppNavigation } from "@/src/core/hook/useAppNavigation";
import useSuperadmin from "@/src/core/hook/useSuperadmin";
import useTrailHook from "@/src/core/hook/useTrailHook";
import TrailScreen from "@/src/features/Trail/screens/TrailScreen";
import { useLocalSearchParams } from "expo-router";
import { Pressable, Text } from "react-native";

export default function viewTrail(){
    const { trailId } = useLocalSearchParams();

    const { onBackPress, onDownloadPress } = useAppNavigation();

    const { 
        role, 
        onWriteTrail 
    } = useSuperadmin();

    const {
        trail,
        onHikePress,
        onBookPress, 
    } = useTrailHook({ trailId, mode: 'view' });
    
    return(
        <>
            { role === 'superadmin' && 
                <Pressable onPress={() => onWriteTrail(trailId)}>
                    <Text>EDIT</Text>
                </Pressable>
            }

            <TrailScreen 
                role={role}
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