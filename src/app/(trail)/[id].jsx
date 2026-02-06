import { useLocalSearchParams, useRouter } from "expo-router";
import React from 'react';
import { Text } from "react-native";

import { useAppNavigation } from "@/src/core/hook/useAppNavigation";
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import TrailScreen from "@/src/features/Trail/screens/TrailScreen";

export default function trail(){
    const { id } = useLocalSearchParams();
    const trails = useTrailsStore((state) => state.trails);
    const { onDownloadPress } = useAppNavigation();
    const router = useRouter();

    const trail = trails.find((t) => t.id === id ? t : null);

    const onBackPress = () => {
        router.back();
    }

    const onBookPress = (id) => {
        router.push(`/(offer)/${id}`)
    }

    const onHikePress = (id) => {
        router.push(`(hike)/${id}`);
    }

    if(!trail) return <Text>Trail {id} not found</Text>
    
    return(
        <TrailScreen 
            trail={trail}
            onBackPress={onBackPress}
            onDownloadPress={() => onDownloadPress(id)}
            onBookPress={onBookPress}
            onHikePress={onHikePress}
        />
        // <TESTTRAIL 
        //     trail={trail}
        //     onDownloadPress={onDownloadPress}
        //     onBookPress={onBookPress}
        //     onHikePress={onHikePress}
        // />
    );
}

// const TESTTRAIL = ({
//     trail,
//     onDownloadPress,
//     onBookPress,
//     onHikePress
// }) => {
//     const general = trail?.general;

//     return(
//         <View>
//             <Text>Trail View</Text>
//             <Text>ID: {trail?.id}</Text>
//             <Text>Name: {general.name}</Text>
//             <Text>Province: {general.province?.join(',')}</Text>
//             <Text>Address: {general.address}</Text>
            
//             <CustomButton title={'Download'} onPress={() => onDownloadPress(trail?.id)}/>
//             <CustomButton title={'Book'} onPress={() => onBookPress(trail?.id)}/>
//             <CustomButton title={'Hike'} onPress={() => onHikePress(trail?.id)}/>
//         </View>

//     )
// }