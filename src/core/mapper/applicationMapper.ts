import { ApplicationDB, ApplicationUI } from "@/src/types/entities/Application";

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
            establishedOn: data.business.establishedOn,
            servicedLocation: data.business.servicedLocation,
            createdAt: data.createdAt,
            ...data.permits,
            
        }

        return application;
    },
    toDB(data: ApplicationUI): ApplicationDB{
        const application = {
            id: data.id,
            status: data.status,
            createdAt: data.createdAt,
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
                establishedOn: data.establishedOn,
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