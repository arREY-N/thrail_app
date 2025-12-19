import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text, View } from "react-native";

export default function trail(){
    const { id } = useLocalSearchParams();
    const { trails } = useTrailsStore();
    const router = useRouter();

    const trail = trails.find((t) => t.id === id ? t : null);

    const onBook = () => {
        router.push('/(book)/book')
    }

    if(!trail) return <Text>Trail {id} not found</Text>
    
    return(
        <View>
            <Text>Trail View</Text>
            <Text>ID: {trail.id}</Text>
            <Text>Name: {trail.name}</Text>
            <Text>Location: {trail.location.join(',')}</Text>
        </View>
    )    
}