import CustomButton from "@/src/components/CustomButton";
import { useAppNavigation } from "@/src/core/hook/useAppNavigation";
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text, View } from "react-native";

export default function trail(){
    const { id } = useLocalSearchParams();
    const trails = useTrailsStore((state) => state.trails);
    const { onDownloadPress } = useAppNavigation();
    const router = useRouter();

    const trail = trails.find((t) => t.id === id ? t : null);

    const onBookPress = (id) => {
        router.push(`/(offer)/${id}`)
    }

    const onHikePress = (id) => {
        console.log('Hiking: ', id);
    }

    if(!trail) return <Text>Trail {id} not found</Text>
    
    return(
        <TESTTRAIL 
            trail={trail}
            onDownloadPress={onDownloadPress}
            onBookPress={onBookPress}
            onHikePress={onHikePress}
        />
    )    
}

const TESTTRAIL = ({
    trail,
    onDownloadPress,
    onBookPress,
    onHikePress
}) => {
    return(
        <View>
            <Text>Trail View</Text>
            <Text>ID: {trail?.id}</Text>
            <Text>Name: {trail?.name}</Text>
            <Text>Province: {trail?.province?.join(',')}</Text>
            <Text>Address: {trail?.address}</Text>
            
            <CustomButton title={'Download'} onPress={() => onDownloadPress(trail?.id)}/>
            <CustomButton title={'Book'} onPress={() => onBookPress(trail?.id)}/>
            <CustomButton title={'Hike'} onPress={() => onHikePress(trail?.id)}/>
        </View>

    )
}