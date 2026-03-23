import { BookingStatus, IBooking, IBookingDB } from "@/src/core/models/Booking/Booking.types";
import { IBusinessSummary } from "@/src/core/models/Business/Business.types";
import { IOfferInfo } from "@/src/core/models/Offer/Offer.types";
import { IPaymentSummary } from "@/src/core/models/Payment/Payment.types";
import { ITrailSummary } from "@/src/core/models/Trail/Trail.types";
import { IEmergencyContact, IUserSummary } from "@/src/core/models/User/User.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, Timestamp } from "firebase/firestore";
import { immerable } from "immer";

export class Booking implements IBooking {
    [key: string]: any;
    [immerable] = true
    id: string = '';
    status: BookingStatus = 'pending';
    payment: IPaymentSummary<Date>[] = [];
    cancelledBy: string | null = null;
    offer: Pick<IOfferInfo<Date>, "date" | "price"> = {
        date: new Date(),
        price: 0,
    };
    user: IUserSummary = {
        id: "",
        username: "",
        firstname: "",
        lastname: "",
        email: ""
    };
    business: IBusinessSummary = {
        id: "",
        name: ""
    };
    trail: ITrailSummary = {
        id: "",
        name: ""
    };
    emergencyContact: IEmergencyContact = {
        name: "",
        contactNumber: "",
    }
    documents: Record<string, boolean> = {}; // New

    constructor(init?: Partial<Booking>){
        Object.assign(this, init)
    }

    static fromFirestore(id: string, data: IBookingDB): Booking {
        const mapped: IBooking = {
            ...data,
            id,
            offer: {
                ...data.offer,
                date: toDate(data.offer.date),
            },
            payment: (data.payment || []).map(p => ({
                ...p,
                date: toDate(p.date),
            })),
            documents: data.documents || {}, // New
        }

        return new Booking(mapped);
    }

    toFirestore(): IBookingDB {
        const isNew = this.id === '';

        const mapped: IBookingDB = {
            id: this.id,
            status: this.status,
            cancelledBy: this.cancelledBy,
            offer: {
                ...this.offer,
                date: Timestamp.fromDate(this.offer.date),
            },
            user: this.user,
            business: this.business,
            trail: this.trail,
            payment: (this.payment || []).map(p => ({
                ...p,
                date: Timestamp.fromDate(p.date),
            })),
            emergencyContact: this.emergencyContact,
            documents: this.documents, // New
        }

        return mapped;
    }
}

export const bookingConverter: FirestoreDataConverter<Booking> = {
    toFirestore: (booking: Booking) => {
        return booking.toFirestore();
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Booking => {
        const data = snapshot.data() as IBookingDB;
        return Booking.fromFirestore(snapshot.id, data);
    }
}