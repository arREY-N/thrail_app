import { FieldValue, Timestamp } from "firebase/firestore";

type Status = 'pending' | 'reviewed' | 'approved' | 'rejected'  

export interface ApplicationDB {
    id?: string;
    status: Status;
    createdAt: Timestamp | FieldValue;
    applicant: {
        id: string;
        name: string;
        email: string;
        validId: string;
    },
    business: {
        name: string;
        address: string;
        establishedOn: Timestamp;
        servicedLocation: string[];
    },
    permits: {
        bir: string,
        denr: string,
        dti: string,
    }
}

export interface ApplicationUI {
    id?: string
    status: Status
    userId: string;
    name: string;
    email: string;
    validId: string;
    businessName: string;
    businessAddress: string;
    establishedOn: Timestamp,
    servicedLocation: string[],
    bir: string,
    denr: string,
    dti: string,
    createdAt: Timestamp | FieldValue;
}

export class ApplicationUI{ 
    status: Status = 'pending'
    userId: string = '';
    name: string = '';
    email: string = '';
    validId: string = '';
    businessName: string = ''; 
    businessAddress: string = '';
    establishedOn: Timestamp = Timestamp.fromDate(new Date());
    servicedLocation: string[]  = [];
    bir: string = '';
    denr: string = '';
    dti: string = '';

    constructor(init?: Partial<ApplicationUI>){
        Object.assign(this, init)
    }
}