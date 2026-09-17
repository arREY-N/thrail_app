import { IMountainDB, Mountain } from "@/src/core/models/Mountain/interfaces/Mountain.types";
import { FirestoreDataConverter, QueryDocumentSnapshot } from "firebase/firestore";

export const newMountain = (init?: Partial<Mountain>): Mountain => {
    return {
        id: '',
        name: '',
        province: [],
        ...init,
    };
};

const mountainFromFirestore = (id: string, data: IMountainDB): Mountain => {
    return {
        id,
        name: data.name ?? '',
        province: Array.isArray(data.province) ? data.province : [],
    };
};

const mountainToFirestore = (mountain: Mountain): IMountainDB => {
    return {
        id: mountain.id,
        name: mountain.name ?? '',
        province: Array.isArray(mountain.province) ? mountain.province : [],
    };
};

export const mountainConverter: FirestoreDataConverter<Mountain> = {
    toFirestore: (mountain: Mountain) => {
        return mountainToFirestore(mountain);
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Mountain => {
        const data = snapshot.data() as IMountainDB;
        return mountainFromFirestore(snapshot.id, data);
    },
};
