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
            validId: [],
            validIdFront: '',
            validIdBack: '',
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
    const rawOwner = data.owner;
    const rawValidId = rawOwner?.validId;
    const validIdList: string[] = Array.isArray(rawValidId)
        ? rawValidId
        : typeof rawValidId === 'string' && rawValidId.trim()
            ? [rawValidId]
            : [];
    const validIdFront = rawOwner?.validIdFront || validIdList[0] || '';
    const validIdBack = rawOwner?.validIdBack || validIdList[1] || '';

    return {
        id,
        status: data.status || 'pending',
        message: data.message || '',
        name: data.name || '',
        address: data.address || '',
        servicedLocation: data.servicedLocation || [],
        owner: {
            id: rawOwner?.id || '',
            name: rawOwner?.name || '',
            email: rawOwner?.email || '',
            validId: validIdList.length > 0 ? validIdList : [validIdFront, validIdBack].filter(Boolean),
            validIdFront,
            validIdBack,
        },
        permits: data.permits || { bir: '', dti: '', denr: '' },
        establishedOn: toDate(data.establishedOn),
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
    };
};

const applicationToFirestore = (application: Application): IApplicationDB => {
    const isNew = application.id === '';
    const validIdArray: string[] = Array.isArray(application.owner?.validId)
        ? (application.owner.validId as string[])
        : [application.owner?.validIdFront, application.owner?.validIdBack].filter((item): item is string => Boolean(item));

    return {
        id: application.id,
        createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(application.createdAt),
        updatedAt: serverTimestamp(),
        status: application.status,
        message: application.message,
        owner: {
            id: application.owner?.id || '',
            name: application.owner?.name || '',
            email: application.owner?.email || '',
            validId: validIdArray,
            validIdFront: application.owner?.validIdFront || validIdArray[0] || '',
            validIdBack: application.owner?.validIdBack || validIdArray[1] || '',
        },
        establishedOn: application.establishedOn instanceof Date
            ? Timestamp.fromDate(application.establishedOn)
            : serverTimestamp(),
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
