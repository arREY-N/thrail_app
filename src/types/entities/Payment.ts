import { FieldValue, Timestamp } from "firebase/firestore";
import { PaymentMode } from "../Enum";

export interface PaymentUI{
    id?: string;
    receiptId: string;
    amount: number;
    receiptDate: Date;
    mode: PaymentMode;
    userId: string;
    lastname: string;
    firstname: string;
    email: string;
    businessId: string;
    businessName: string;
    offerId: string;
    trail: string;
    offerDate: Date;
    createdAt: Date;
}

export interface PaymentDB{
    id?: string;
    receipt: {
        id: string;
        amount: number;
        date: Timestamp | FieldValue;
        mode: PaymentMode;
    };
    user: {
        id: string;
        lastname: string;
        firstname: string;
        email: string;
    };
    business: {
        id: string;
        name: string;
    },
    offer: {
        id: string;
        trail: string;
        date: Timestamp | FieldValue
    }
    createdAt: Timestamp | FieldValue
}

export class PaymentUI{
    id?: string = '';
    receiptId: string = '';
    amount: number = 0;
    receiptDate: Date = new Date();
    mode: PaymentMode = null;
    userId: string = '';
    lastname: string = '';
    firstname: string = '';
    email: string = '';
    businessId: string = '';
    businessName: string = '';
    offerId: string = '';
    trail: string = '';
    offerDate: Date = new Date();
    createdAt: Date = new Date();

    constructor(init?: Partial<PaymentUI>){
        Object.assign(this, init);
    }
}