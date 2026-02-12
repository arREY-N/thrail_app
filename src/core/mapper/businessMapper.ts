import { BusinessDB, BusinessUI } from "@/src/types/entities/Business";
import { serverTimestamp } from "firebase/firestore";
import { timestampToISO, toDate } from "../utility/date";

export const BusinessMapper = {
    toUI(data: BusinessDB): BusinessUI {
        return {
            active: data.active,
            address: data.address,
            name: data.businessName,
            id: data.id,
            createdAt: timestampToISO(data.createdAt),
            province: data.province,
            updatedAt: toDate(data.updatedAt),
        }
    },
    toDB(data: BusinessUI): BusinessDB {
        return {
            active: data.active,
            address: data.address,
            businessName: data.name,
            createdAt: serverTimestamp(),
            id: data.id || '',
            province: data.province,
            updatedAt: serverTimestamp(),
        }
    }
}