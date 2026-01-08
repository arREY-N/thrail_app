import { OfferBlueprint } from "../models/blueprint";
import { validate } from "./utility";

export function createOfferObject({
    admin,
    trails,
    business,
    offerData
}){
    try {
        const trail = trails.find(t => t.id === offerData.trailId);
    
        const filledOffer = {
            businessId: business.id,
            businessName: business.businessName,
            createdBy: admin.id,
            trailId: trail?.id,
            trailName: trail?.name,
            price: offerData.price,
            date: offerData.date,
        }

        const errors = validate(OfferBlueprint, filledOffer);

        if(errors.length > 0) {
            throw new Error(`${errors.join(', ')} required`);
        }

        return filledOffer;
    } catch (err) {
        throw new Error(err.message);
    }
}

export function validateOffer(
    businessId = null,
    trailId = null,
    price = null,
    date = []
){    
    if(!businessId) throw new Error('Business ID missing') 

    if(!trailId) throw new Error('Trail ID missing')

    if(!price) throw new Error('Price missing')

    if(!date) throw new Error('Date missing')
}