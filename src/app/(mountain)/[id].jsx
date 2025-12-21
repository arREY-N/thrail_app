import CustomButton from "@/src/components/CustomButton";
import { useAppNavigation } from "@/src/core/hook/useAppNavigation";
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function trail(){
    const { id } = useLocalSearchParams();
    const { trails } = useTrailsStore();
    const { onDownloadPress } = useAppNavigation();

    const trail = trails.find((t) => t.id === id ? t : null);

    const onBookPress = (id) => {
        console.log('Booking: ', id);
        //router.push('/(book)/book')
    }

    const onHikePress = (id) => {
        console.log('Hiking: ', id);
    }

    if(!trail) return <Text>Trail {id} not found</Text>
    
    return(
        <View>
            <Text>Trail View</Text>
            <Text>ID: {trail?.id}</Text>
            <Text>Name: {trail?.name}</Text>
            <Text>Location: {trail?.location?.join(',')}</Text>
            <CustomButton title={'Download'} onPress={() => onDownloadPress(id)}/>
            <CustomButton title={'Book'} onPress={() => onBookPress(id)}/>
            <CustomButton title={'Hike'} onPress={() => onHikePress(id)}/>
        </View>
    )    
}