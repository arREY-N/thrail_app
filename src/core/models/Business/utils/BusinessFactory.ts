import { IApplication } from "@/src/core/models/Application/Application";
import { Business, IBusinessDB } from "@/src/core/models/Business/interfaces/Business.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";

export const newBusiness = (init?: Partial<Business>): Business => {
    return {
        id: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        active: false,
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
            denr: '',
            dti: '',
        },
        ...init,
    };
};

export const businessFromApplication = (application: IApplication): Business => {
    return newBusiness({
        id: application.owner?.id || application.id || '',
        name: application.name,
        establishedOn: application.establishedOn,
        address: application.address,
        servicedLocation: application.servicedLocation,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: application.owner,
        permits: application.permits,
        active: true,
    });
};

const businessFromFirestore = (id: string, data: IBusinessDB): Business => {
    return {
        id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        establishedOn: toDate(data.establishedOn),
        servicedLocation: data.servicedLocation || [],
        active: data.active ?? false,
        owner: data.owner || { id: '', name: '', email: '', validId: '' },
        permits: data.permits || { bir: '', denr: '', dti: '' },
        name: data.name || '',
        address: data.address || '',
    };
};

const businessToFirestore = (business: Business): IBusinessDB => {
    const isNew = business.id === '';

    return {
        id: business.id,
        createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(business.createdAt),
        updatedAt: serverTimestamp(),
        active: business.active,
        name: business.name,
        establishedOn: Timestamp.fromDate(business.establishedOn),
        address: business.address,
        servicedLocation: business.servicedLocation || [],
        owner: business.owner,
        permits: business.permits,
    };
};

export const businessConverter: FirestoreDataConverter<Business> = {
    toFirestore: (business: Business) => {
        return businessToFirestore(business);
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Business => {
        const data = snapshot.data() as IBusinessDB;
        return businessFromFirestore(snapshot.id, data);
    },
};
