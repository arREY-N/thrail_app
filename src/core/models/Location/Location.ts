import { ILocation, ILocationDB } from "@/src/core/models/Location/Location.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, GeoPoint, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";

export class Location implements ILocation {
    id?: string;
    latitude: number = 0;
    longitude: number = 0;
    altitude: number = 0;
    status: 'ACTIVE' | 'APP_BACKGROUNDED' | 'APP_RESUMED' | 'GPS_SIGNAL_RESTORED' | 'GPS_SIGNAL_LOST' = 'ACTIVE';
    timestamp: Date = new Date();
    hikerName?: string;

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
        if (data.hikerName) {
            mapped.hikerName = data.hikerName;
        }

        return new Location(mapped)
    }

    toFirestore(): ILocationDB {
        const mapped: ILocationDB = {
            status: this.status,
            point: new GeoPoint(this.latitude, this.longitude),
            altitude: this.altitude,
            timestamp: this.timestamp ? Timestamp.fromDate(this.timestamp) : serverTimestamp(),
        };
        if (this.hikerName) {
            mapped.hikerName = this.hikerName;
        }

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