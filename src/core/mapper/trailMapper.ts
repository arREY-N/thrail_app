import { TrailDB, TrailUI } from "@/src/types/entities/Trail";
import { GeoPoint } from "firebase/firestore";

export const TrailMapper = {
    toUI(data: TrailDB): TrailUI{
        return {
            id: data.id,
            ...data.general,
            masl: data.geography.masl,
            startLat: data.geography.start.latitude,
            startLong: data.geography.start.longitude,
            endLat: data.geography.end.latitude,
            endLong: data.geography.end.longitude,
            ...data.difficulty,
            ...data.tourism,
        }
    },
    toDB(data: TrailUI): TrailDB{
        console.log(data);
        return {
            id: data.id,
            general:{
                name: data.name,
                address: data.address,
                province: data.province,
                mountain: data.mountain,
                reviewCount: data.reviewCount,
                rating: data.rating,
            },
            geography: {
                masl: data.masl,
                start: new GeoPoint(data.startLat, data.startLong),
                end: new GeoPoint(data.endLat, data.endLong),
            },
            difficulty: {
                length: data.length,
                gain: data.gain,
                slope: data.slope,
                obstacles: data.obstacles,
                hours: data.hours,
                circularity: data.circularity,
                quality: data.quality,
                difficulty_points: data.difficulty_points
            },
            tourism: {
                shelter: data.shelter,
                resting: data.resting,
                information_board: data.information_board,
                clean_water: data.clean_water,
                river: data.river,
                lake: data.lake,
                waterfall: data.waterfall,
                monument: data.monument,
                community: data.community,
                viewpoint: data.viewpoint,
            }
        }
    }
}