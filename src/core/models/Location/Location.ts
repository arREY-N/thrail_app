import { ILocation, ILocationDB } from "@/src/core/models/Location/Location.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, GeoPoint, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";

export class Location implements ILocation {
    id?: string;
    latitude: number = 0;
    longitude: number = 0;
    altitude: number = 0;
    timestamp: Date = new Date();

    constructor(init?: Partial<ILocation>) {
        Object.assign(this, init);
    }

    static fromFirestore(data: ILocationDB): Location {
        const mapped: ILocation = {
            ...data,
            latitude: data.point.latitude,
            longitude: data.point.longitude,
            timestamp: data.timestamp ? toDate(data.timestamp) : new Date(),
        }

        return new Location(mapped)
    }

    toFirestore(): ILocationDB {
        const mapped: ILocationDB = {
            point: new GeoPoint(this.latitude, this.longitude),
            altitude: this.altitude,
            timestamp: this.timestamp ? Timestamp.fromDate(this.timestamp) : serverTimestamp(),
        };

        return mapped;
    }
}

export const locationConverter: FirestoreDataConverter<Location> = {
    toFirestore: (location: Location) => {
        return location.toFirestore();
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Location => {
        const data = snapshot.data() as ILocationDB;
        return Location.fromFirestore(data);
    }
}