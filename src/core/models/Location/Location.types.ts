import { FieldValue, GeoPoint, Timestamp } from "firebase/firestore";

export interface Coordinates {
    latitude: number;
    longitude: number;
    altitude: number;
    timestamp: Date;
    status: 'ACTIVE' | 'APP_BACKGROUNDED' | 'APP_RESUMED' | 'GPS_SIGNAL_RESTORED' | 'GPS_SIGNAL_LOST';
    hikerName?: string;
}

export interface CoordinatesDB {
    point: GeoPoint;
    altitude: number;
    status: 'ACTIVE' | 'APP_BACKGROUNDED' | 'APP_RESUMED' | 'GPS_SIGNAL_RESTORED' | 'GPS_SIGNAL_LOST';
    timestamp: Timestamp | FieldValue;
    hikerName?: string;
}

export interface ILocationDB extends CoordinatesDB {}
export interface ILocation extends Coordinates {}