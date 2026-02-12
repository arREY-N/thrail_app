import { FieldValue, Timestamp } from "firebase/firestore";

export interface BusinessDB {
    active: boolean;
    address: string;
    businessName: string;
    createdAt: Timestamp | FieldValue;
    id: string;
    province: string;
    updatedAt: Timestamp | FieldValue;
}

export interface BusinessUI {
    active: boolean;
    address: string;
    name: string;
    createdAt: string;
    id?: string;
    province: string;
    updatedAt: Date;
}

export class BusinessUI{
    active: boolean = false;
    address: string = '';
    name: string = '';
    createdAt: string = '';
    id?: string = '';
    province: string = '';
    updatedAt: Date = new Date();
}