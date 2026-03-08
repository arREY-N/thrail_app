import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";
import { immerable } from "immer";
import { toDate } from "../../utility/date";
import { IAdmin, IAdminDB, Status } from "./Admin.types";

export class Admin implements IAdmin {
    [key: string]: any;
    [immerable] = true
    id: string = '';
    createdAt: Date = new Date;
    updatedAt: Date = new Date;
    status: Status = 'active';
    username: string = '';
    firstname: string = '';
    lastname: string = '';
    email: string = '';

    constructor(init?: Partial<IAdmin>){
        Object.assign(this, init);
    }

    static fromFirestore(id: string, data: IAdminDB): Admin {
        const mapped: IAdmin = {
            ...data,
            id,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
        }

        return new Admin(mapped);
    }

    toFirestore(): IAdminDB {
        const isNew = this.id === '';

        const mapped: IAdminDB = {
            id: this.id,
            createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(this.createdAt),
            updatedAt: Timestamp.fromDate(this.updatedAt),
            status: this.status,
            username: this.username,
            firstname: this.firstname,
            lastname: this.lastname,
            email: this.email,
        }

        return mapped;
    }
}

export const adminConverter: FirestoreDataConverter<Admin> = {
    toFirestore: (admin: Admin) => {
        return admin.toFirestore();
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Admin => {
        const data = snapshot.data() as IAdminDB;
        return Admin.fromFirestore(snapshot.id, data);
    }
}