import { IBookingBase, IPayment } from "@/src/core/models/Booking/Booking.types";
import { Offer } from "@/src/core/models/Offer/Offer";
import { Trail } from "@/src/core/models/Trail/Trail";
import { User } from "@/src/core/models/User/User";

export const BookingLogic = {
    toPay(draft: IBookingBase<Date>, payment: IPayment<Date>){

        const toPay = draft.offer.price
        
        if(payment.amount < toPay) {
            draft.status = 'downpayment';
        } else {
            draft.status = 'paid';
        }

        if (!draft.payment) draft.payment = [];
        draft.payment.push(payment)
    },

    setUser(draft: IBookingBase<Date>, user: User) {
        draft.user = {
            id: user.id,
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            birthday: user.birthday,
        }
    },

    setTrail(draft: IBookingBase<Date>, trail: Trail) {
        draft.trail = {
            id: trail.id,
            name: trail.general.name,
        }
    },

    setOffer(draft: IBookingBase<Date>, offer: Offer){
        draft.offer = {
            id: offer.id,
            date: offer.date,  
            price: offer.price, 
        }
        draft.business = offer.business
    },

    checkDocuments(draft: IBookingBase<Date>): boolean {
        if(!draft.documents || draft.documents.length === 0) {
            console.warn('No documents provided for booking: ', draft.id);
            return false;
        }

        if(!Array.isArray(draft.documents)){
            throw new Error('Documents should be an array');
        }

        const pending = draft.documents.filter(d => d.valid === 'pending');

        if(pending.length > 0) {
            console.warn('There are still pending documents for booking: ', draft.id, pending);
            return false;
        }
        return true;
    }
}