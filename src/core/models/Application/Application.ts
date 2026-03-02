import { IApplication, IApplicationDB, IOwner, IPermit, Status } from "@/src/core/models/Application/Application.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";

export class Application implements IApplication{ 
    id: string = '';
    createdAt: Date = new Date();
    updatedAt: Date = new Date();
    status: Status = 'pending'
    message: string = '';
    name: string = '';
    establishedOn: Date = new Date();
    address: string = ''; 
    servicedLocation: string[] = []; 
    owner: IOwner = { 
        id: '',
        name: '', 
        email: '', 
        validId: '', 
    };
    permits: IPermit = { 
        bir: '',
        dti: '', 
        denr: '', 
    };

    constructor(init?: Partial<IApplication>){
        Object.assign(this, init)
    }

    static fromFirestore(id: string, data: IApplicationDB): Application {
        const mapped: IApplication = {
            ...data,
            id,
            establishedOn: toDate(data.establishedOn),
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
        }

        return new Application(mapped)
    }

    toFirestore(): IApplicationDB {
        const isNew = this.id === '';

        const mapped: IApplicationDB = {
            id: this.id,
            createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(this.createdAt),
            updatedAt: serverTimestamp(),
            status: this.status,
            message: this.message,
            owner: this.owner,
            establishedOn: Timestamp.fromDate(this.establishedOn),
            permits: this.permits,
            name: this.name,
            address: this.address,
            servicedLocation: this.servicedLocation,
        }

        return mapped;
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