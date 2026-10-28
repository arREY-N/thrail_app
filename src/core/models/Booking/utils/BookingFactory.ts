import { Booking, IBookingDB, IPayment } from "@/src/core/models/Booking/interfaces/Booking.types";
import { toDate, toDateOrNull } from "@/src/core/utility/date";
import { FieldValue, FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";

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
    const rawStatus = data.status as string;
    const normalizedStatus: Booking['status'] = rawStatus === 'pending-docs' ? 'for-reservation' : data.status;

    return {
        ...data,
        id,
        status: normalizedStatus,
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
            capturedAt: p.capturedAt ? toDate(p.capturedAt) : undefined,
            paidAt: p.paidAt ? toDate(p.paidAt) : undefined,
            refundedAt: p.refundedAt ? toDate(p.refundedAt) : undefined,
            verifiedAt: p.verifiedAt ? toDate(p.verifiedAt) : undefined,
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
        remainingBalance: data.remainingBalance,
        paymentVerificationStatus: data.paymentVerificationStatus,
        paymentRejectionReason: data.paymentRejectionReason,
        overpayment: data.overpayment ? {
            ...data.overpayment,
            createdAt: toDate(data.overpayment.createdAt),
            updatedAt: toDate(data.overpayment.updatedAt),
            userWallet: data.overpayment.userWallet ? {
                ...data.overpayment.userWallet,
                submittedAt: toDate(data.overpayment.userWallet.submittedAt),
            } : undefined,
            adminRefundReceiptUploadedAt: data.overpayment.adminRefundReceiptUploadedAt ? toDate(data.overpayment.adminRefundReceiptUploadedAt) : undefined,
            disputedAt: data.overpayment.disputedAt ? toDate(data.overpayment.disputedAt) : undefined,
            userConfirmedReceivedAt: data.overpayment.userConfirmedReceivedAt ? toDate(data.overpayment.userConfirmedReceivedAt) : undefined,
        } : undefined,
    };
};

function sanitizeFirestoreData<T>(val: T): T {
    if (val === null || val === undefined) {
        return val;
    }
    if (
        val instanceof Timestamp ||
        val instanceof Date ||
        (typeof val === 'object' && '_methodName' in (val as Record<string, unknown>))
    ) {
        return val;
    }
    if (Array.isArray(val)) {
        return val
            .filter((item) => item !== undefined)
            .map((item) => sanitizeFirestoreData(item)) as unknown as T;
    }
    if (typeof val === 'object') {
        const cleaned: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
            if (v !== undefined) {
                cleaned[k] = sanitizeFirestoreData(v);
            }
        }
        return cleaned as T;
    }
    return val;
}

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
        payment: (booking.payment || []).map(p => {
            const paymentItem: IPayment<Timestamp | FieldValue> = {
                gateway: p.gateway || '',
                sessionId: p.sessionId || '',
                status: p.status || 'pending',
                amount: typeof p.amount === 'number' ? p.amount : 0,
                createdAt: p.createdAt instanceof Date && !isNaN(p.createdAt.getTime()) ? Timestamp.fromDate(p.createdAt) : Timestamp.now(),
            };

            if (p.refundableUntil instanceof Date && !isNaN(p.refundableUntil.getTime())) {
                paymentItem.refundableUntil = Timestamp.fromDate(p.refundableUntil);
            }

            if (p.referenceCode !== undefined && p.referenceCode !== null) paymentItem.referenceCode = p.referenceCode;
            if (p.gatewayId !== undefined && p.gatewayId !== null) paymentItem.gatewayId = p.gatewayId;
            if (p.method !== undefined && p.method !== null) paymentItem.method = p.method;
            if (typeof p.refundedAmount === 'number') paymentItem.refundedAmount = p.refundedAmount;
            if (p.refundReason !== undefined && p.refundReason !== null) paymentItem.refundReason = p.refundReason;
            if (p.receiptUrl !== undefined && p.receiptUrl !== null) paymentItem.receiptUrl = p.receiptUrl;
            if (p.classification !== undefined && p.classification !== null) paymentItem.classification = p.classification;
            if (p.adminNote !== undefined && p.adminNote !== null) paymentItem.adminNote = p.adminNote;
            if (p.verifiedBy !== undefined && p.verifiedBy !== null) paymentItem.verifiedBy = p.verifiedBy;

            if (p.capturedAt instanceof Date && !isNaN(p.capturedAt.getTime())) {
                paymentItem.capturedAt = Timestamp.fromDate(p.capturedAt);
            }
            if (p.paidAt instanceof Date && !isNaN(p.paidAt.getTime())) {
                paymentItem.paidAt = Timestamp.fromDate(p.paidAt);
            }
            if (p.refundedAt instanceof Date && !isNaN(p.refundedAt.getTime())) {
                paymentItem.refundedAt = Timestamp.fromDate(p.refundedAt);
            }
            if (p.verifiedAt instanceof Date && !isNaN(p.verifiedAt.getTime())) {
                paymentItem.verifiedAt = Timestamp.fromDate(p.verifiedAt);
            }

            return paymentItem;
        }),
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

    if (booking.rescheduleRequestId !== undefined && booking.rescheduleRequestId !== null) {
        data.rescheduleRequestId = booking.rescheduleRequestId;
    }
    if (booking.rescheduleDeclineReason !== undefined && booking.rescheduleDeclineReason !== null) {
        data.rescheduleDeclineReason = booking.rescheduleDeclineReason;
    }
    if (booking.previousStatus !== undefined && booking.previousStatus !== null) {
        data.previousStatus = booking.previousStatus;
    }

    if (booking.remainingBalance !== undefined && booking.remainingBalance !== null) {
        data.remainingBalance = booking.remainingBalance;
    }
    if (booking.paymentVerificationStatus !== undefined && booking.paymentVerificationStatus !== null) {
        data.paymentVerificationStatus = booking.paymentVerificationStatus;
    }
    if (booking.paymentRejectionReason !== undefined && booking.paymentRejectionReason !== null && booking.paymentRejectionReason !== '') {
        data.paymentRejectionReason = booking.paymentRejectionReason;
    }
    if (booking.overpayment) {
        data.overpayment = {
            ...booking.overpayment,
            createdAt: booking.overpayment.createdAt instanceof Date && !isNaN(booking.overpayment.createdAt.getTime())
                ? Timestamp.fromDate(booking.overpayment.createdAt)
                : serverTimestamp(),
            updatedAt: serverTimestamp(),
            userWallet: booking.overpayment.userWallet ? {
                ...booking.overpayment.userWallet,
                submittedAt: booking.overpayment.userWallet.submittedAt instanceof Date && !isNaN(booking.overpayment.userWallet.submittedAt.getTime())
                    ? Timestamp.fromDate(booking.overpayment.userWallet.submittedAt)
                    : Timestamp.now(),
            } : undefined,
            adminRefundReceiptUploadedAt: booking.overpayment.adminRefundReceiptUploadedAt instanceof Date && !isNaN(booking.overpayment.adminRefundReceiptUploadedAt.getTime())
                ? Timestamp.fromDate(booking.overpayment.adminRefundReceiptUploadedAt)
                : undefined,
            disputedAt: booking.overpayment.disputedAt instanceof Date && !isNaN(booking.overpayment.disputedAt.getTime())
                ? Timestamp.fromDate(booking.overpayment.disputedAt)
                : undefined,
            userConfirmedReceivedAt: booking.overpayment.userConfirmedReceivedAt instanceof Date && !isNaN(booking.overpayment.userConfirmedReceivedAt.getTime())
                ? Timestamp.fromDate(booking.overpayment.userConfirmedReceivedAt)
                : undefined,
        } as unknown as NonNullable<IBookingDB['overpayment']>;
    }

    return sanitizeFirestoreData(data);
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