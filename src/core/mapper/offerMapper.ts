import { OfferDB, OfferUI } from "@/src/types/entities/Offer";
import { serverTimestamp, Timestamp } from "firebase/firestore";
import { toDate } from "../utility/date";

export const OfferMapper = {
    toUI(data: OfferDB): OfferUI{
        const offer = {
            id: data.id,
            ...data.general,
            hikeDate: toDate(data.hike.date),
            hikeDuration: data.hike.duration,
            inclusions: data.hike.inclusions, 
            business: {
                name: data.business.name,
                id: data.business.id
            },
            trail: {
                name: data.trail.name,
                id: data.trail.id,
            },
            createdAt: toDate(data.createdAt),
        }
        return offer;
    },
    toDB(data: OfferUI): OfferDB{
        const offerData: OfferDB = {
            business: {
                id: data.business.id,
                name: data.business.name,
            },
            general: {
                description: data.description,
                documents: data.documents,
                price: data.price,
            },
            hike: {
                date: Timestamp.fromDate(data.hikeDate),
                duration: data.hikeDuration,
                inclusions: data.inclusions,
            },
            trail: {
                id: data.trail.id,
                name: data.trail.name
            },
            createdAt: data.id 
                ? Timestamp.fromDate(data.createdAt) 
                : serverTimestamp()
        }

        console.log(offerData);
        
        return data.id 
                ? { id: data.id, ...offerData}
                : offerData
    }
}