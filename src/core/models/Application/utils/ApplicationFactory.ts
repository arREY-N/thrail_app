import { Application, IApplicationDB } from "@/src/core/models/Application/interfaces/Application.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";

export const newApplication = (init?: Partial<Application>): Application => {
    return {
        id: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending',
        message: '',
        name: '',
        establishedOn: new Date(),
        address: '',
        servicedLocation: [],
        owner: {
            id: '',
            name: '',
            email: '',
            validId: '',
        },
        permits: {
            bir: '',
            dti: '',
            denr: '',
        },
        ...init,
    };
};

const applicationFromFirestore = (id: string, data: IApplicationDB): Application => {
    return {
        id,
        status: data.status || 'pending',
        message: data.message || '',
        name: data.name || '',
        address: data.address || '',
        servicedLocation: data.servicedLocation || [],
        owner: data.owner || { id: '', name: '', email: '', validId: '' },
        permits: data.permits || { bir: '', dti: '', denr: '' },
        establishedOn: toDate(data.establishedOn),
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
    };
};

const applicationToFirestore = (application: Application): IApplicationDB => {
    const isNew = application.id === '';

    return {
        id: application.id,
        createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(application.createdAt),
        updatedAt: serverTimestamp(),
        status: application.status,
        message: application.message,
        owner: application.owner,
        establishedOn: Timestamp.fromDate(application.establishedOn),
        permits: application.permits,
        name: application.name,
        address: application.address,
        servicedLocation: application.servicedLocation || [],
    };
};

export const applicationConverter: FirestoreDataConverter<Application> = {
    toFirestore: (application: Application) => {
        return applicationToFirestore(application);
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Application => {
        const data = snapshot.data() as IApplicationDB;
        return applicationFromFirestore(snapshot.id, data);
    },
};
