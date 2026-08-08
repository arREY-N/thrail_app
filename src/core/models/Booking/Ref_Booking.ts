import { IBooking, IBookingDB } from "@/src/core/models/Booking/Booking.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";

export interface Booking extends IBooking {}

export const createBooking = (init?: Partial<Booking>): Booking => {
    return {
        id: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'for-reservation',
        payment: [],
        offer: {
            date: new Date(),
            price: 0,
            id: ""
        },
        user: {
            id: "",
            username: "",
            firstname: "",
            lastname: "",
            email: "",
            phoneNumber: "",
            birthday: new Date(),
        },
        business: {
            id: "",
            name: ""
        },
        trail: {
            id: "", 
            name: ""
        },
        emergencyContact: {
            name: "",
            contactNumber: "",
        },
        documents: [],
        ...init
    };
}

export const bookingFromFirestore = (id: string, data: IBookingDB): Booking => {
    return {
        ...data,
        id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        offer: {
            ...data.offer,
            date: toDate(data.offer.date),
        },
        user: {
            ...data.user,
            birthday: toDate(data.user.birthday),
            phoneVerifiedAt: data.user.phoneVerifiedAt ? toDate(data.user.phoneVerifiedAt) : null,
        },
        payment: data.payment.map(p => ({
            ...p,
            refundableUntil: toDate(p.refundableUntil),
            createdAt: toDate(p.createdAt),
        })),
        documents: data.documents || [],
    };
}

export const bookingToFirestore = (booking: Booking): IBookingDB => {
    const isNew = booking.id === ''; 

    return {
        id: booking.id,
        createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(booking.createdAt),
        updatedAt: serverTimestamp(),
        status: booking.status,
        cancelledBy: booking.cancelledBy,
        cancellationReason: booking.cancellationReason,
        offer: {
            ...booking.offer,
            date: Timestamp.fromDate(booking.offer.date),
        },
        user: {
            birthday: Timestamp.fromDate(booking.user.birthday),
            phoneNumber: booking.user.phoneNumber,
            id: booking.user.id,
            username: booking.user.username,
            firstname: booking.user.firstname,
            lastname: booking.user.lastname,
            email: booking.user.email,
        },
        business: booking.business,
        trail: booking.trail,
        payment: (booking.payment || []).map(p => ({
            ...p,
            refundableUntil: p.refundableUntil ? Timestamp.fromDate(p.refundableUntil) : Timestamp.now(),
            createdAt: p.createdAt ? Timestamp.fromDate(p.createdAt) : Timestamp.now(),
        })),
        emergencyContact: booking.emergencyContact,
        documents: booking.documents,
    }
}
export const bookingConverter: FirestoreDataConverter<Booking> = {
    toFirestore: (booking: Booking) => {
        return bookingToFirestore(booking);
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Booking => {
        const data = snapshot.data() as IBookingDB;
        return bookingFromFirestore(snapshot.id, data);
    }
}