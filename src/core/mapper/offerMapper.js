export const OfferMapper = {
    toUI(data){
        console.log({
            id: data.id,
            ...data.general,
            ...data.hike,
            trail: data.trail,
            business: data.business,
        })
        
        return {
            id: data.id,
            ...data.general,
            ...data.hike,
            trail: data.trail,
            business: data.business,
        }
    },
    toDB(data){
        const offerData = {
            business: data.business,
            general: {
                description: data.description,
                documents: data.documents,
                price: data.price,
            },
            hike: {
                date: data.date,
                duration: data.duration,
                inclusions: data.inclusions,
            },
            trail: data.trail,
        }

        return data.id 
                ? { id: data.id, ...offerData}
                : offerData
    }
}