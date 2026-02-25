import { BusinessDB, BusinessUI } from "@/src/types/entities/Business";

export const BusinessMapper = {
    toUI(data: BusinessDB): BusinessUI {
        return {
            active: data.active,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            ownerId: data.owner.id,
            ownerName: data.owner.name,
            email: data.owner.email,
            validId: data.owner.validId,
            businessName: data.business.name,
            address: data.business.address,
            establishedOn: data.business.establishedOn,
            servicedLocation: data.business.servicedLocation,
            ...data.permits,
            id: data.id,
        }
    },
    toDB(data: BusinessUI): BusinessDB {
        return {
            id: data.id,
            active: data.active, 
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            owner: {
                id: data.ownerId,
                name: data.ownerName,
                email: data.email,
                validId: data.validId,
            },
            business: {
                name: data.businessName,
                address: data.address,
                establishedOn: data.establishedOn,
                servicedLocation: data.servicedLocation,
            },
            permits: {
                bir: data.bir,
                denr: data.denr,
                dti: data.dti,
            }
        }
    }
}