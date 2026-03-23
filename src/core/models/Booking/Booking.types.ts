import { IBusinessSummary } from "@/src/core/models/Business/Business.types";
import { IOfferInfo } from "@/src/core/models/Offer/Offer.types";
import { IPaymentSummary } from "@/src/core/models/Payment/Payment.types";
import { ITrailSummary } from "@/src/core/models/Trail/Trail.types";
import { IEmergencyContact, IUserSummary } from "@/src/core/models/User/User.types";
import { FieldValue, Timestamp } from "firebase/firestore";

export type BookingStatus = 
    'for-reservation' | 
    'for-payment' | 
    'paid'  |
    'completed' |

    'for-cancellation' |
    'cancellation-rejected' | 
    'refund' | 

    'for-reschedule' |
    'reschedule-rejected' |
    'rescheduled';


export interface IBookingBase<T> {
    id: string;
    createdAt: T;
    updatedAt: T;
    offer: Pick<IOfferInfo<T>, 'date' | 'price'>;
    user: IUserSummary,
    business: IBusinessSummary
    trail: ITrailSummary
    payment: IPaymentSummary<T>[];
    status: BookingStatus
    emergencyContact: IEmergencyContact;
    documents: Record<string, boolean>; // New
    cancellationReason?: string;
    cancelledBy?: string;
}

export interface IBookingDB extends IBookingBase<Timestamp | FieldValue> {}
export interface IBooking extends IBookingBase<Date>{}