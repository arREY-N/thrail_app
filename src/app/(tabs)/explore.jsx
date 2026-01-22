import { useTrailsStore } from '@/src/core/stores/trailsStore';
import ExploreScreen from '@/src/features/Explore/screens/ExploreScreen';
import { useRouter } from 'expo-router';
import React from 'react';
// import { Pressable, Text, View } from 'react-native';


export default function explore(){
    const router = useRouter();

    const trails = useTrailsStore(s => s.trails);

    const onViewMountain = (id) => {  
        console.log(id);
        router.push(`/(mountain)/${id}`)
    }

    return (
        <ExploreScreen
            trails={trails}
            onViewMountain={onViewMountain}
        />
        // <View>
        //     <Text>Explore</Text>
        //     {
        //         trails.map((t) => {
        //             return(
        //                 <Pressable onPress={() => onViewMountain(t.id)} key={t.id}>
        //                     <Text>{t.name}</Text>
        //                 </Pressable>
        //             )
        //         })
        //     }
        // </View>
    )
}