
export const MountainMapper = {
    toUI(data){
        const mountain = {
            id: data.id,
            name: data.general.name || '',
            province: data.general.province || [],
        }

        return mountain;
    },
    toDB(data){
        const mountain = {
            id: data.id,
            general: {
                name: data.name,
                province: data.province
            },
        }
        return mountain;
    }
}