import { IBookingBase } from "@/src/core/models/Booking/Booking.types";
import { Offer } from "@/src/core/models/Offer/Offer";
import { IPaymentSummary } from "@/src/core/models/Payment/Payment.types";
import { Trail } from "@/src/core/models/Trail/Trail";
import { User } from "@/src/core/models/User/User";

export const BookingLogic = {
    toPay(draft: IBookingBase<Date>, payment: IPaymentSummary<Date>){
        draft.status = 'paid';
        if (!draft.payment) draft.payment = [];
        draft.payment.push(payment)
    },

    setUser(draft: IBookingBase<Date>, user: User) {
        draft.user = {
            id: user.id,
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.lastname
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
    
}