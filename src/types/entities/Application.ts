import { toDate } from "@/src/core/utility/date";
import { FieldValue, FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";
import { IInfo, IOwner, IPermit } from "./Business";

export type Status = 'pending' | 'reviewed' | 'approved' | 'rejected'  

export interface IApplicationDB {
    id: string;
    status: Status;
    message: string;
    createdAt: Timestamp | FieldValue;
    updatedAt: Timestamp | FieldValue;
    applicant: IOwner;
    business: Omit<IInfo, 'active'>;
    permits: IPermit;
}

export interface IApplication {
    id: string
    status: Status
    userId: string;
    name: string;
    email: string;
    validId: string;
    businessName: string;
    businessAddress: string;
    establishedOn: Date,
    servicedLocation: string[],
    bir: string,
    denr: string,
    dti: string,
    createdAt: Date;
    updatedAt: Date;
    message: string;
}

export class Application implements IApplication{ 
    id: string = '';
    createdAt: Date = new Date();
    updatedAt: Date = new Date();
    status: Status = 'pending'
    userId: string = '';
    name: string = '';
    email: string = '';
    validId: string = '';
    businessName: string = ''; 
    businessAddress: string = '';
    establishedOn: Date = new Date();
    servicedLocation: string[]  = [];
    bir: string = '';
    denr: string = '';
    dti: string = '';
    message: string = '';

    constructor(init?: Partial<Application>){
        Object.assign(this, init)
    }

    static fromFirestore(id: string, data: IApplicationDB): Application {
        return new Application({
            id,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
            status: data.status,
            userId: data.applicant.id,
            name: data.applicant.name,
            email: data.applicant.email,
            validId: data.applicant.validId,
            businessName: data.business.name,
            businessAddress: data.business.address,
            establishedOn: toDate(data.business.establishedOn),
            servicedLocation: data.business.servicedLocation,
            bir: data.permits.bir,
            denr: data.permits.denr,
            dti: data.permits.dti,
            message: data.message,
        })
    }

    toFirestore(): Omit<IApplicationDB, 'id' | 'createdAt'> {
        return {
            updatedAt: serverTimestamp(),
            status: this.status,
            message: this.message,
            applicant: {
                id: this.userId,
                name: this.name,
                email: this.email,
                validId: this.validId,
            },
            business: {
                name: this.businessName,
                establishedOn: Timestamp.fromDate(this.establishedOn),
                address: this.businessAddress,
                servicedLocation: this.servicedLocation,
            },
            permits: {
                bir: this.bir,
                dti: this.dti,
                denr: this.denr,
            }
        }
    }
}

export const applicationConverter: FirestoreDataConverter<Application> = {
    toFirestore: (application: Application) => {
        return application.toFirestore();
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Application => {
        const data = snapshot.data() as IApplicationDB;
        return Application.fromFirestore(snapshot.id, data);
    }
}