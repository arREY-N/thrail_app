import { ILocationDB, Location } from "@/src/core/models/Location/interfaces/Location.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, GeoPoint, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";

export const newLocation = (init?: Partial<Location>): Location => {
    return {
        id: init?.id,
        latitude: init?.latitude ?? 0,
        longitude: init?.longitude ?? 0,
        altitude: init?.altitude ?? 0,
        status: init?.status ?? 'ACTIVE',
        timestamp: init?.timestamp ? toDate(init.timestamp) : new Date(),
        hikerName: init?.hikerName,
    };
};

const locationFromFirestore = (id: string, data: ILocationDB): Location => {
    return {
        id,
        latitude: data.point?.latitude ?? 0,
        longitude: data.point?.longitude ?? 0,
        altitude: data.altitude ?? 0,
        status: data.status ?? 'ACTIVE',
        timestamp: data.timestamp ? toDate(data.timestamp) : new Date(),
        hikerName: data.hikerName,
    };
};

const locationToFirestore = (location: Location): ILocationDB => {
    const mapped: ILocationDB = {
        point: new GeoPoint(location.latitude ?? 0, location.longitude ?? 0),
        altitude: location.altitude ?? 0,
        status: location.status ?? 'ACTIVE',
        timestamp: location.timestamp ? Timestamp.fromDate(toDate(location.timestamp)) : serverTimestamp(),
    };

    if (location.id) {
        mapped.id = location.id;
    }

    if (location.hikerName) {
        mapped.hikerName = location.hikerName;
    }

    return mapped;
};

export const locationConverter: FirestoreDataConverter<Location> = {
    toFirestore: (location: Location) => {
        return locationToFirestore(location);
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Location => {
        const data = snapshot.data() as ILocationDB;
        return locationFromFirestore(snapshot.id, data);
    },
};
