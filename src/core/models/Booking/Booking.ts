import { FirestoreDataConverter, QueryDocumentSnapshot, Timestamp } from "firebase/firestore";
import { toDate } from "../../utility/date";
import { IBusinessSummary } from "../Business/Business.types";
import { IOfferInfo } from "../Offer/Offer.types";
import { IPaymentSummary } from "../Payment/Payment.types";
import { ITrailSummary } from "../Trail/Trail.types";
import { IUserSummary } from "../User/User.types";
import { BookingStatus, IBooking, IBookingDB } from "./Booking.types";

export class Booking implements IBooking {
    id: string = '';
    status: BookingStatus = 'reserved';
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
            }))
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