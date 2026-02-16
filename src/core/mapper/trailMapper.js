export const TrailMapper = {
    toUI(data){
        const trail = {
            id: data.id,
            ...data.general,
            ...data.geography,
            ...data.difficulty,
            ...data.tourism,
        }

        return data.id ? {id: data.id, ...trail} : trail;
    },
    toDB(data){
        const trail = {
            id: data.id,
            general:{
                name: data.name,
                address: data.address,
                province: data.province,
                mountain: data.mountain,
            },
            geography: {
                longitude: data.longitude,
                latitude: data.latitude,
                masl: data.masl,
                start: data.start,
                end: data.end,
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

        return trail
    }
}