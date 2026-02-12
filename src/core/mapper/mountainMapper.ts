import { MountainDB, MountainUI } from "@/src/types/entities/Mountain";

export const MountainMapper = {
    toUI(data: MountainDB): MountainUI {
        return {
            id: data.id,
            name: data.general.name || '',
            province: data.general.province || [],
        }
    },
    toDB(data: MountainUI): MountainDB{
        return {
            id: data.id || '',
            general: {
                name: data.name,
                province: data.province
            },
        }
    }
}