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

export class MountainUI{
    name: string = '';
    province: string[] = [];
    
    constructor(init?: Partial<MountainUI>){
        Object.assign(this, init);
    }
}