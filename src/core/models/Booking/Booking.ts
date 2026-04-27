import { BookingStatus, IBooking, IBookingDB, IPayment, IUserBooking, Requirements } from "@/src/core/models/Booking/Booking.types";
import { IBusinessSummary } from "@/src/core/models/Business/Business.types";
import { IOfferBase } from "@/src/core/models/Offer/Offer.types";
import { ITrailSummary } from "@/src/core/models/Trail/Trail.types";
import { IEmergencyContact } from "@/src/core/models/User/User.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";
import { immerable } from "immer";

export class Booking implements IBooking {
    [key: string]: any;
    [immerable] = true
    id: string = '';
    createdAt: Date = new Date();
    updatedAt: Date = new Date();
    status: BookingStatus = 'for-reservation';
    payment: IPayment<Date>[] = [];
    cancellationReason?: string = '';
    cancelledBy?: string = '';
    offer: Pick<IOfferBase<Date>, "date" | "price" | "id"> = {
        date: new Date(),
        price: 0,
        id: ""
    };
    user: IUserBooking<Date> = {
        id: "",
        username: "",
        firstname: "",
        lastname: "",
        email: "",
        phoneNumber: "",
        birthday: new Date(),
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
    documents: Requirements[] = [];

    constructor(init?: Partial<Booking>){
        Object.assign(this, init)
    }

    static fromFirestore(id: string, data: IBookingDB): Booking {
        const mapped: IBooking = {
            ...data,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt), 
            id,
            offer: {
                ...data.offer,
                date: toDate(data.offer.date),
            },
            user: {
                ...data.user,
                birthday: toDate(data.user.birthday),
            },
            payment: (data.payment || []).map(p => ({
                ...p,
                refundableUntil: toDate(p.refundableUntil),
                createdAt: toDate(p.createdAt),
            })),
            documents: data.documents || {}, // New
        }

        return new Booking(mapped);
    }

    toFirestore(): IBookingDB {
        const isNew = this.id === '';

        const mapped: IBookingDB = {
            id: this.id,
            createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(this.createdAt),
            updatedAt: serverTimestamp(),
            status: this.status,
            cancelledBy: this.cancelledBy,
            cancellationReason: this.cancellationReason,
            offer: {
                ...this.offer,
                date: Timestamp.fromDate(this.offer.date),
            },
            user: {
                birthday: Timestamp.fromDate(this.user.birthday),
                phoneNumber: this.user.phoneNumber,
                id: this.user.id,
                username: this.user.username,
                firstname: this.user.firstname,
                lastname: this.user.lastname,
                email: this.user.email,
            },
            business: this.business,
            trail: this.trail,
            payment: (this.payment || []).map(p => ({
                ...p,
                refundableUntil: this.refundableUntil ? Timestamp.fromDate(this.refundableUntil) : serverTimestamp(),
                createdAt: this.createdAt ? Timestamp.fromDate(this.createdAt) : serverTimestamp(),
            })),
            emergencyContact: this.emergencyContact,
            documents: this.documents,
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