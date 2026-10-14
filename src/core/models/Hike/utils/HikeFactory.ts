import { Hike, IHikeDB } from "@/src/core/models/Hike/interfaces/Hike.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, Timestamp } from "firebase/firestore";

export const newHike = (init?: Partial<Hike>): Hike => {
    if (init?.mode === 'booked' && !init.bookingId) throw new Error('Booking ID is required for booked mode');
    if (init?.trail && !init.trail.id) throw new Error('Trail ID is required');
    return {
        id: '',
        hikeDate: new Date(),
        status: 'unhiked',
        mode: 'direct',
        bookingId: undefined,
        startTime: undefined,
        endTime: undefined,
        distance: 0,
        duration: 0,
        elevation: 0,
        trail: {
            id: '',
            name: '',
            location: '',
        },
        user: {
            id: "",
            username: "",
            firstname: "",
            lastname: "",
            email: ""
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        ...init,
        ...(init?.hikeDate ? { hikeDate: toDate(init.hikeDate) } : {}),
        ...(init?.startTime ? { startTime: toDate(init.startTime) } : {}),
        ...(init?.endTime ? { endTime: toDate(init.endTime) } : {}),
    };
};

const hikeFromFirestore = (id: string, data: IHikeDB): Hike => {
    return {
        ...data,
        id,
        hikeDate: toDate(data.hikeDate),
        startTime: data.startTime ? toDate(data.startTime) : undefined,
        endTime: data.endTime ? toDate(data.endTime) : undefined,
        distance: data.distance || 0,
        duration: data.duration || 0,
        elevation: data.elevation || 0,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        user: data.user ? data.user : {
            id: "",
            username: "",
            firstname: "",
            lastname: "",
            email: ""
        }
    };
};

const hikeToFirestore = (hike: Hike): IHikeDB => {
    const mapped: IHikeDB = {
        id: hike.id,
        hikeDate: hike.hikeDate ? Timestamp.fromDate(toDate(hike.hikeDate)) : Timestamp.fromDate(new Date()),
        trail: hike.trail,
        mode: hike.mode,
        status: hike.status,
        distance: hike.distance || 0,
        duration: hike.duration || 0,
        elevation: hike.elevation || 0,
        user: hike.user ? hike.user : {
            id: "",
            username: "",
            firstname: "",
            lastname: "",
            email: ""
        },
        createdAt: hike.createdAt ? Timestamp.fromDate(toDate(hike.createdAt)) : Timestamp.fromDate(new Date()),
        updatedAt: hike.updatedAt ? Timestamp.fromDate(toDate(hike.updatedAt)) : Timestamp.fromDate(new Date()),
    };

    if (hike.mode === 'booked' && hike.bookingId) {
        mapped.bookingId = hike.bookingId;
    }

    if (hike.status !== 'unhiked' && hike.startTime) {
        try {
            mapped.startTime = Timestamp.fromDate(toDate(hike.startTime));
        } catch (error) {
            console.log('Error mapping startTime: ', error);
        }
    }

    if (hike.status === 'completed' && hike.endTime) {
        try {
            mapped.endTime = Timestamp.fromDate(toDate(hike.endTime));
        } catch (error) {
            console.log('Error mapping endTime: ', error);
        }
    }

    return mapped;
};

export const hikeConverter: FirestoreDataConverter<Hike> = {
    toFirestore: (hike: Hike) => {
        return hikeToFirestore(hike);
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Hike => {
        const data = snapshot.data() as IHikeDB;
        return hikeFromFirestore(snapshot.id, data);
    },
};
