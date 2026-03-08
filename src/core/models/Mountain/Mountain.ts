import { FirestoreDataConverter, QueryDocumentSnapshot } from "firebase/firestore";
import { immerable } from "immer";
import { IMountain } from "./Mountain.types";


export class Mountain implements IMountain{
    [key: string]: any;
    [immerable] = true
    id: string = '';
    name: string = '';
    province: string[] = [];
    
    constructor(init?: Partial<IMountain>){
        Object.assign(this, init);
    }

    static fromFirestore(id: string, data: IMountain): Mountain {
        return new Mountain({
            ...data,
            id,
        })
    }

    toFirestore(): IMountain {
        return { 
            id: this.id,
            name: this.name,
            province: this.province,
        }
    }
}

export const mountainConverter: FirestoreDataConverter<Mountain> = {
    toFirestore: (mountain: Mountain) => {
        return mountain.toFirestore();
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Mountain => {
        const data = snapshot.data() as IMountain;
        return Mountain.fromFirestore(snapshot.id, data);
    }
}