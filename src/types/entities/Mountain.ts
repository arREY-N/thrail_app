export interface MountainUI{
    id?: string;
    name: string;
    province: string[];
}

export interface MountainDB{
    id: string;
    general: {
        name: string;
        province: string[];
    }
}