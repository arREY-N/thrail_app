import { Coordinates, CoordinatesDB } from "@/src/core/models/Hike/Hike.types";

export interface ILocationBase<T> {
    id: string;
    updatedAt: T;
    latitude: number;
    longitude: number;
    altitude: number;
    userId: string;
}

export interface ILocationDB extends CoordinatesDB {}
export interface ILocation extends Coordinates {}