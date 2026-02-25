import { toDate } from "@/src/core/utility/date";
import { FieldValue, FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";
import { Application } from "./Application";

export interface IPermit { 
    bir: string;
    denr: string;
    dti: string; 
}

export interface IOwner {
    id: string;
    name: string;
    email: string;
    validId: string;
}

export interface IInfo {
    name: string;
    active: boolean;
    address: string;
    establishedOn: Timestamp;
    servicedLocation: string[];
}

export interface IBusinessDB {
    id: string;
    createdAt: Timestamp | FieldValue;
    updatedAt: Timestamp | FieldValue;
    owner: IOwner,
    business: IInfo,
    permits: IPermit,
}

export interface IBusiness {
    id: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    ownerId: string;
    ownerName: string;
    email: string;
    validId: string;
    businessName: string;
    address: string;
    establishedOn: Date;
    servicedLocation: string[];
    bir: string,
    denr: string,
    dti: string,

}

export class Business implements IBusiness {
    id: string = '';
    createdAt: Date = new Date();
    updatedAt: Date = new Date();
    
    ownerId: string = '';
    ownerName: string = '';
    email: string = '';
    validId: string = '';
    
    businessName: string = ''; 
    active: boolean = false;
    address: string = '';
    establishedOn: Date = new Date();
    servicedLocation: string[] = [];
    
    bir: string = '';
    denr: string = '';
    dti: string = '';

    constructor(init?: Partial<Business>){
        Object.assign(this, init);
    }

    static fromApplication(application: Application): Business {
        const business = new Business({
            active: true,
            ownerId: application?.userId,
            ownerName: application?.name,
            email: application?.email,
            validId: application?.validId,
            businessName: application?.businessName,
            address: application?.businessAddress,
            establishedOn: application?.establishedOn,
            servicedLocation: application?.servicedLocation,
            bir: application?.bir,
            denr: application?.denr,
            dti: application?.dti,
        })

        console.log(business);
        
        return business;
    }

    static fromFirestore(id: string, data: IBusinessDB): Business {
        return new Business ({
            id,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
            ownerId: data.owner.id,
            ownerName: data.owner.name,
            email: data.owner.email,
            validId: data.owner.validId,
            businessName: data.business.name,
            active: data.business.active,
            address: data.business.address,
            establishedOn: toDate(data.business.establishedOn),
            servicedLocation: data.business.servicedLocation,
            bir: data.permits.bir,
            denr: data.permits.denr,
            dti: data.permits.dti,
        });
    }

    
    toFirestore(): Omit<IBusinessDB, 'id' | 'createdAt'>{
        return {
            updatedAt: serverTimestamp(),
            owner: {
                id: this.ownerId,
                name: this.ownerName,
                email: this.email,
                validId: this.validId,
            },
            business: {
                name: this.businessName,
                active: this.active,
                address: this.address,
                establishedOn: Timestamp.fromDate(this.establishedOn),
                servicedLocation: this.servicedLocation,
            },
            permits: {
                denr: this.denr,
                dti: this.dti,
                bir: this.bir,
            },
        }
    }
}

export const businessConverter: FirestoreDataConverter<Business> = {
    toFirestore: (business: Business) => {
        return business.toFirestore();
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Business => {
        const data = snapshot.data() as IBusinessDB;
        return Business.fromFirestore(snapshot.id, data);
    }
};