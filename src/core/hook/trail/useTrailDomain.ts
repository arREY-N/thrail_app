import { Mode } from "@/src/core/types/Enum";
import { router } from "expo-router";
import { useEffect } from "react";
import { useTrailsStore } from "../../stores/trailsStore";

export type TrailParams = {
    trailId: string | null,
    mode: Mode
}

export default function useTrailDomain(params: TrailParams | null = null){
    const trails = useTrailsStore(s => s.data);
    const trail = useTrailsStore(s => s.current);
    const hikingTrail = useTrailsStore(s => s.hikingTrail);

    const setOnHike = useTrailsStore(s => s.setOnHike);
    const setHikingTrail = useTrailsStore(s => s.setHikingTrail);
    const fetchAllTrails = useTrailsStore(s => s.fetchAll);
    const load = useTrailsStore(s => s.load);

    useEffect(() => {
        fetchAllTrails();
        load(params?.trailId);
    }, [params?.trailId])

    const tempoTrails = [
        {
            id: 'mock_tagapo',
            name: 'Mount Tagapo',
            province: 'Rizal',
            address: 'Talim Island, Rizal',
            score: 4.8,
            masl: 438,
            length: 5,
            geography: { startLat: 14.3392772, startLong: 121.2325293 }
        },
        {
            id: 'mock_marami',
            name: 'Mount Marami',
            province: 'Rizal',
            address: 'Tanay, Rizal',
            score: 4.9,
            masl: 739,
            length: 7,
            geography: { startLat: 14.1986108, startLong: 120.6858334 }
        },
        {
            id: 'mock_batulao',
            name: 'Mount Batulao',
            province: 'Batangas',
            address: 'Nasugbu, Batangas',
            score: 4.7,
            masl: 811,
            length: 9,
            geography: { startLat: 14.0399434, startLong: 120.8023782    }
        },
        {
            id: 'mock_makiling',
            name: 'Mount Makiling',
            province: 'Laguna',
            address: 'Los Baños, Laguna',
            score: 4.6,
            masl: 1090,
            length: 12,
            geography: { startLat: 14.1352241, startLong: 121.1944517 }
        },
        {
            id: 'mock_maculot',
            name: 'Mount Maculot',
            province: 'Batangas',
            address: 'Cuenca, Batangas',
            score: 4.8,
            masl: 930,
            length: 4,
            geography: { startLat: 13.9208682, startLong: 121.0516961 }
        }
    ];

    let activeTrail = trail as any;
    const matchedMock = tempoTrails.find(t => t.id === params?.trailId);
    
    if (matchedMock) {
        activeTrail = {
            id: matchedMock.id,
            general: {
                name: matchedMock.name,
                address: matchedMock.address,
                province: [matchedMock.province],
                mountain: [matchedMock.name],
                rating: matchedMock.score,
                reviewCount: 150
            },
            geography: matchedMock.geography,
            difficulty: {
                length: matchedMock.length,
                gain: matchedMock.masl,
                slope: 10,
                hours: 4,
                circularity: 'Out and Back'
            },
            tourism: {}
        };
    }

    const onViewTrail = (trailId: string) => {
        router.push({
            pathname: '/(main)/trail/view',
            params: { trailId }
        })
    }

    const onHikePress = (trailId: string) => {
        setHikingTrail(trailId);
        
        router.push({
            pathname: '/(main)/hike/view',
            params: { 
                trailId,
                lon: activeTrail?.geography?.startLong,
                lat: activeTrail?.geography?.startLat, 
            },
        })
    }

    const onWriteTrail = (trailId: string) => {
        console.log('write: ', trailId)
        if(trailId){
            router.push({
                pathname: '/(main)/superadmin/trail/write',
                params: {trailId}
            });
        } else {
            router.push({
                pathname: '/(main)/superadmin/trail/write',
            });
        }
    }

    return{
        trails: [...tempoTrails, ...(trails || [])],
        trail: activeTrail,
        hikingTrail,
        setOnHike,
        onViewTrail,
        onHikePress,
        onWriteTrail,
    }
}