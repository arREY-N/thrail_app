/**
 * Offer object shape
 * @typedef {Object} Offer
 * @property {string} provider
 * @property {number} price
 * @property {import("firebase/firestore").Timestamp} date
 */

export const OfferBlueprint = {
    businessId: 'Business ID',
    businessName: 'Business Name',
    createdBy: 'Admin ID',
    trailId: 'Trail',
    price: 'Price',
    date: 'Date',
}