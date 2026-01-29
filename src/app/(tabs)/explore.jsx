import { useTrailsStore } from '@/src/core/stores/trailsStore';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
// import { Pressable, Text, View } from 'react-native';

import ExploreScreen from '../../features/Explore/screens/ExploreScreen';

const DUMMY_TRAILS = [
    {
        id: '1',
        name: 'Mt. Binicayan',
        address: 'Rodriguez, Rizal',
        length: 3.06,
        elevation: 424,
        duration: '2h 30m',
        score: 4.5,
        rating: 4.5
    },
    {
        id: '2',
        name: 'Mt. Pamitinan',
        address: 'Rodriguez, Rizal',
        length: 2.8,
        elevation: 426,
        duration: '2h 15m',
        score: 4.7,
        rating: 4.7
    },
    {
        id: '3',
        name: 'Mt. Daraitan',
        address: 'Tanay, Rizal',
        length: 4.5,
        elevation: 739,
        duration: '4h 00m',
        score: 4.8,
        rating: 4.8
    },
    {
        id: '4',
        name: 'Mt. Batulao',
        address: 'Nasugbu, Batangas',
        length: 12.0,
        elevation: 811,
        duration: '5h 30m',
        score: 4.6,
        rating: 4.6
    },
    {
        id: '5',
        name: 'Mt. Ulap',
        address: 'Itogon, Benguet',
        length: 9.4,
        elevation: 1846,
        duration: '6h 00m',
        score: 4.9,
        rating: 4.9
    }
];

export default function explore(){
    const router = useRouter();

    const { trails, loadTrails } = useTrailsStore();

    useEffect(() => {
        loadTrails();
    }, []);

    const onViewMountain = (id) => {  
        console.log(id);
        router.push(`/(mountain)/${id}`)
    }

    const displayTrails = (trails && trails.length > 0) ? trails : DUMMY_TRAILS;

    return (
        <ExploreScreen
            trails={displayTrails}
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