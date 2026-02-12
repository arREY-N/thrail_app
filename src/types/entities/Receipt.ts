import { FieldValue, Timestamp } from "firebase/firestore";

export interface ReceiptUI{
    id?: string;
    amount: number;
    date: string;
    mode: string;
}

export interface ReceiptDB{
    id?: string;
    amount: number;
    date: Timestamp | FieldValue;
    mode: string;
}