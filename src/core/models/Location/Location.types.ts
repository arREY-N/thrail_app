import { FieldValue, GeoPoint, Timestamp } from "firebase/firestore";

export interface Coordinates {
    latitude: number;
    longitude: number;
    altitude: number;
    timestamp: Date;
    status: 'ACTIVE' | 'APP_BACKGROUNDED' | 'APP_RESUMED' | 'GPS_SIGNAL_RESTORED' | 'GPS_SIGNAL_LOST' 
}

export interface CoordinatesDB {
    point: GeoPoint;
    altitude: number;
    status: 'ACTIVE' | 'APP_BACKGROUNDED' | 'APP_RESUMED' | 'GPS_SIGNAL_RESTORED' | 'GPS_SIGNAL_LOST' 
    timestamp: Timestamp | FieldValue;
}

export interface ILocationDB extends CoordinatesDB {}
export interface ILocation extends Coordinates {}