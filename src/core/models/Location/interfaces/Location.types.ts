import { FieldValue, GeoPoint, Timestamp } from "firebase/firestore";

export type LocationStatus = 
    | 'ACTIVE' 
    | 'APP_BACKGROUNDED' 
    | 'APP_RESUMED' 
    | 'GPS_SIGNAL_RESTORED' 
    | 'GPS_SIGNAL_LOST';

export interface ILocationBase<T> {
    id?: string;
    latitude: number;
    longitude: number;
    altitude: number;
    status: LocationStatus;
    timestamp: T;
    hikerName?: string;
}

export interface ILocationDB {
    id?: string;
    point: GeoPoint;
    altitude: number;
    status: LocationStatus;
    timestamp: Timestamp | FieldValue;
    hikerName?: string;
}

export type Location = ILocationBase<Date>;
export type ILocation = Location;

export interface Coordinates {
    latitude: number;
    longitude: number;
    altitude: number;
    timestamp: Date;
    status: LocationStatus;
    hikerName?: string;
}

export interface CoordinatesDB {
    point: GeoPoint;
    altitude: number;
    status: LocationStatus;
    timestamp: Timestamp | FieldValue;
    hikerName?: string;
}

export interface WriteLocation {
    groupId: string;
    userId: string;
    location: Location;
}
