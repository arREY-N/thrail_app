export function createOfferObject(
    businessId = null,
    businessName = null,
    trailId = null,
    trailName = null,
    price = null,
    date = [],
    inclusion = [],
){

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