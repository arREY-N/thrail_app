import { IBusinessSummary } from "@/src/core/models/Business/Business.types";
import { IOfferBase } from "@/src/core/models/Offer/Offer.types";
import { ITrailSummary } from "@/src/core/models/Trail/Trail.types";
import { IEmergencyContact, IUserSummary } from "@/src/core/models/User/User.types";
import { FieldValue, Timestamp } from "firebase/firestore";

export type BookingStatus = 
    'for-reservation' | 
    'for-payment' | 
    'paid'  |
    'completed' |

    'reservation-rejected' |
    
    'for-cancellation' |
    'cancellation-rejected' | 
    'refund' | 

    'for-reschedule' |
    'reschedule-rejected' |
    'rescheduled';

export type Requirements = {
    name: string;
    file: string;
    valid: 'pending' | 'approved' | 'rejected';
}

export interface IPayment<T> {
    gateway: string;
    gatewayId: string;
    referenceCode: string;
    status: 'pending' | 'captured' | 'failed' | 'refunded';
    refundableUntil: T;
}

export interface IBookingBase<T> {
    id: string;
    createdAt: T;
    updatedAt: T;
    offer: Pick<IOfferBase<T>, 'date' | 'price' | 'id'>;
    user: IUserSummary,
    business: IBusinessSummary
    trail: ITrailSummary
    payment: IPayment<T>[];
    status: BookingStatus
    emergencyContact: IEmergencyContact;
    documents: Requirements[]
    cancellationReason?: string;
    cancelledBy?: string;
}

export interface IBookingDB extends IBookingBase<Timestamp | FieldValue> {}
export interface IBooking extends IBookingBase<Date>{}