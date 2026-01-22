import { useTrailsStore } from '@/src/core/stores/trailsStore';
import { useRouter } from 'expo-router';
import React from 'react';
// import { Pressable, Text, View } from 'react-native';

import ExploreScreen from '../../features/Explore/screens/ExploreScreen';

export default function explore(){
    const router = useRouter();

    const { trails } = useTrailsStore();

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