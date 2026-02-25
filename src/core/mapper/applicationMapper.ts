import { ApplicationDB, ApplicationUI } from "@/src/types/entities/Application";
import { serverTimestamp, Timestamp } from "firebase/firestore";
import { timestampToISO } from "../utility/date";

export const ApplicationMapper = {
    toUI(data: ApplicationDB): ApplicationUI {
        const application = {
            id: data.id,
            status: data.status,
            userId: data.applicant.id,
            name: data.applicant.name,
            email: data.applicant.email,
            validId: data.applicant.validId,
            businessName: data.business.name,
            businessAddress: data.business.address,
            establishedOn: new Date(timestampToISO(data.business.establishedOn)),
            servicedLocation: data.business.servicedLocation,
            createdAt: new Date(timestampToISO(data.createdAt)),
            updatedAt: new Date(timestampToISO(data.updatedAt)),
            message: data.message,
            ...data.permits,
        }

        return application;
    },
    toDB(data: ApplicationUI): ApplicationDB{
        const application = {
            id: data.id,
            status: data.status,
            createdAt: Timestamp.fromDate(data.createdAt) ?? serverTimestamp(),
            updatedAt: serverTimestamp(),
            message: data.message,
            applicant: {
                id: data.userId,
                email: data.email,
                validId: data.validId,
                name: data.name,
            }, 
            business: {
                name: data.businessName,
                address: data.businessAddress,
                servicedLocation: data.servicedLocation,
                establishedOn: Timestamp.fromDate(data.establishedOn),
            },
            permits: {
                denr: data.denr,
                dti: data.dti,
                bir: data.bir,
            }
        }

        return application;
    }
}