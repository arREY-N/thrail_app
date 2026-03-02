import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";
import { IApplication, IOwner, IPermit } from "../Application/Application.types";
import { IBusiness, IBusinessBase, IBusinessDB } from "./Business.types";


export class Business implements IBusiness {
    id: string = '';
    createdAt: Date = new Date();
    updatedAt: Date = new Date();
    active: boolean = false;
    name: string = '';
    establishedOn: Date = new Date();
    address: string = ''; 
    servicedLocation: string[] = [];
    owner: IOwner = {
        id: '',
        name: '',
        email: '',
        validId: ''
    };
    permits: IPermit = {
        bir: '',
        denr: '',
        dti: ''
    };

    constructor(init?: Partial<IBusiness>){
        Object.assign(this, init);
    }

    static fromApplication(application: IApplication): Business {
        const mapped: IBusinessBase<Date> = {
            id: application.owner.id,
            name: application.name,
            establishedOn: application.establishedOn,
            address: application.address,
            servicedLocation: [],
            createdAt: application.createdAt,
            updatedAt: application.updatedAt,
            owner: application.owner,
            permits: application.permits,
            active: true,
        }

        return new Business(mapped);
    }

    static fromFirestore(id: string, data: IBusinessDB): Business {
        console.log('In model: ', data);
        const mapped: IBusiness = {
            id,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
            establishedOn: toDate(data.establishedOn),
            servicedLocation: data.servicedLocation,
            active: data.active,
            owner: data.owner,
            permits: data.permits,
            name: data.name,
            address: data.address
        }

        return new Business(mapped);
    }

    toFirestore(): IBusinessDB {
        const isNew = this.id === '';

        const mapped: IBusinessDB = {
            id: this.id,
            createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(this.createdAt),
            updatedAt: serverTimestamp(),
            active: this.active,
            name: this.name,
            establishedOn: Timestamp.fromDate(this.establishedOn),
            address: this.address,
            servicedLocation: this.servicedLocation,
            owner: this.owner,
            permits: this.permits
        }

        return mapped;
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