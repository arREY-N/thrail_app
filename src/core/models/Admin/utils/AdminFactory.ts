import { Admin, IAdminDB } from "@/src/core/models/Admin/interfaces/Admin.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";

export const newAdmin = (init?: Partial<Admin>): Admin => {
    return {
        id: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active',
        username: '',
        firstname: '',
        lastname: '',
        email: '',
        ...init,
    };
};

const adminFromFirestore = (id: string, data: IAdminDB): Admin => {
    return {
        id: id === 'owner' ? (data.id || id) : id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        status: data.status ?? 'active',
        username: data.username ?? '',
        firstname: data.firstname ?? '',
        lastname: data.lastname ?? '',
        email: data.email ?? '',
    };
};

const adminToFirestore = (admin: Admin): IAdminDB => {
    const isNew = admin.id === '';

    return {
        id: admin.id,
        createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(admin.createdAt),
        updatedAt: serverTimestamp(),
        status: admin.status ?? 'active',
        username: admin.username ?? '',
        firstname: admin.firstname ?? '',
        lastname: admin.lastname ?? '',
        email: admin.email ?? '',
    };
};

export const adminConverter: FirestoreDataConverter<Admin> = {
    toFirestore: (admin: Admin) => {
        return adminToFirestore(admin);
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Admin => {
        const data = snapshot.data() as IAdminDB;
        return adminFromFirestore(snapshot.id, data);
    },
};
