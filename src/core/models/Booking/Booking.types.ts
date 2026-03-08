import { IBusinessSummary } from "@/src/core/models/Business/Business.types";
import { IOfferInfo } from "@/src/core/models/Offer/Offer.types";
import { IPaymentSummary } from "@/src/core/models/Payment/Payment.types";
import { ITrailSummary } from "@/src/core/models/Trail/Trail.types";
import { IEmergencyContact, IUserSummary } from "@/src/core/models/User/User.types";
import { FieldValue, Timestamp } from "firebase/firestore";

export type BookingStatus = 'reserved' | 'approved' | 'paid'  | 'cancelled' | 'refund' | 'reschedule' | 'pending';


export interface IBookingBase<T> {
    id: string;
    offer: Pick<IOfferInfo<T>, 'date' | 'price'>;
    user: IUserSummary,
    business: IBusinessSummary
    trail: ITrailSummary
    payment: IPaymentSummary<T>[];
    status: BookingStatus
    cancelledBy: string | null;
    emergencyContact: IEmergencyContact;
}

export interface IBookingDB extends IBookingBase<Timestamp | FieldValue> {}
export interface IBooking extends IBookingBase<Date>{}