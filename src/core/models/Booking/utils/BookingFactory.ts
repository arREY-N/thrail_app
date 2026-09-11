import { Booking, IBookingDB } from "@/src/core/models/Booking/interfaces/Booking.types";
import { toDate, toDateOrNull } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";

export const newBooking = (init?: Partial<Booking>): Booking => {
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
            phoneVerifiedAt: null,
        },
        business: {
            id: "",
            name: ""
        },
        trail: {
            id: "",
            name: "",
            location: ""
        },
        emergencyContact: {
            name: "",
            contactNumber: "",
            phoneVerifiedAt: null,
        },
        documents: [],
        ...init
    };
};

const bookingFromFirestore = (id: string, data: IBookingDB): Booking => {
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
            phoneVerifiedAt: toDateOrNull(data.user.phoneVerifiedAt),
        },
        payment: (data.payment || []).map(p => ({
            ...p,
            refundableUntil: toDate(p.refundableUntil),
            createdAt: toDate(p.createdAt),
        })),
        emergencyContact: data.emergencyContact ? {
            ...data.emergencyContact,
            phoneVerifiedAt: toDateOrNull(data.emergencyContact.phoneVerifiedAt),
        } : {
            name: "",
            contactNumber: "",
            phoneVerifiedAt: null,
        },
        documents: data.documents || [],
    };
};

const bookingToFirestore = (booking: Booking): IBookingDB => {
    const isNew = booking.id === '';

    const data: IBookingDB = {
        id: booking.id,
        createdAt: isNew ? serverTimestamp() : (booking.createdAt instanceof Date && !isNaN(booking.createdAt.getTime()) ? Timestamp.fromDate(booking.createdAt) : serverTimestamp()),
        updatedAt: serverTimestamp(),
        status: booking.status,
        offer: {
            ...booking.offer,
            date: booking.offer.date instanceof Date && !isNaN(booking.offer.date.getTime()) ? Timestamp.fromDate(booking.offer.date) : Timestamp.now(),
        },
        user: {
            birthday: booking.user.birthday instanceof Date && !isNaN(booking.user.birthday.getTime()) ? Timestamp.fromDate(booking.user.birthday) : Timestamp.now(),
            phoneNumber: booking.user.phoneNumber,
            id: booking.user.id,
            username: booking.user.username,
            firstname: booking.user.firstname,
            lastname: booking.user.lastname,
            email: booking.user.email,
            phoneVerifiedAt: booking.user.phoneVerifiedAt instanceof Date && !isNaN(booking.user.phoneVerifiedAt.getTime())
                ? Timestamp.fromDate(booking.user.phoneVerifiedAt)
                : null,
        },
        business: booking.business,
        trail: booking.trail,
        payment: (booking.payment || []).map(p => ({
            ...p,
            refundableUntil: p.refundableUntil instanceof Date && !isNaN(p.refundableUntil.getTime()) ? Timestamp.fromDate(p.refundableUntil) : Timestamp.now(),
            createdAt: p.createdAt instanceof Date && !isNaN(p.createdAt.getTime()) ? Timestamp.fromDate(p.createdAt) : Timestamp.now(),
        })),
        emergencyContact: booking.emergencyContact ? {
            ...booking.emergencyContact,
            phoneVerifiedAt: booking.emergencyContact.phoneVerifiedAt instanceof Date && !isNaN(booking.emergencyContact.phoneVerifiedAt.getTime())
                ? Timestamp.fromDate(booking.emergencyContact.phoneVerifiedAt)
                : null,
        } : {
            name: "",
            contactNumber: "",
            phoneVerifiedAt: null,
        },
        documents: booking.documents || [],
    };

    if (booking.cancelledBy && booking.cancellationReason) {
        data.cancellationReason = booking.cancellationReason;
        data.cancelledBy = booking.cancelledBy;
    }

    return data;
};

export const bookingConverter: FirestoreDataConverter<Booking> = {
    toFirestore: (booking: Booking) => {
        return bookingToFirestore(booking);
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Booking => {
        const data = snapshot.data() as IBookingDB;
        return bookingFromFirestore(snapshot.id, data);
    }
};