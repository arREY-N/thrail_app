import { Cancellation, ICancellationDB } from "@/src/core/models/Cancellation/interfaces/Cancellation.types";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";

export const newCancellation = (
    required: Pick<Cancellation, "userId" | "bookingId" | "businessId" | "reason" | "offerId" | "cancelledBy">,
    optional: Partial<Pick<Cancellation, "id" | "status" | "createdAt" | "updatedAt" | "adminNote" | "refundAmount" | "refundedAt" | "handshakeStep" | "userWallet" | "refundDecision" | "adminRefundReceiptUrl" | "adminRefundReceiptUploadedAt" | "disputeCount" | "disputeReason" | "disputedAt" | "userConfirmedReceivedAt">> = {}
): Cancellation => {
    const currentDate = new Date();

    if (!required.userId) {
        throw new Error("User ID is required to create a cancellation request.");
    }

    if (!required.bookingId) {
        throw new Error("Booking ID is required to create a cancellation request.");
    }

    if (!required.businessId) {
        throw new Error("Business ID is required to create a cancellation request.");
    }

    if (!required.offerId) {
        throw new Error("Offer ID is required to create a cancellation request.");
    }

    if (!required.reason || required.reason.trim() === "") {
        throw new Error("Reason is required to create a cancellation request.");
    }

    if (!required.cancelledBy) {
        throw new Error("Cancelled By is required to create a cancellation request.");
    }

    if (optional.status && optional.status === "rejected" && (!optional.adminNote || optional.adminNote.trim() === "")) {
        throw new Error("Admin note is required when flagging a cancellation request as rejected.");
    }

    return {
        id: "",
        status: "pending",
        createdAt: currentDate,
        updatedAt: currentDate,
        ...required,
        ...optional,
    };
};

export const createCancellationRequest = newCancellation;

const cancellationFromFirestore = (id: string, data: ICancellationDB): Cancellation => {
    const request: Cancellation = {
        id,
        userId: data.userId,
        cancelledBy: data.cancelledBy,
        bookingId: data.bookingId,
        offerId: data.offerId,
        businessId: data.businessId,
        reason: data.reason,
        status: data.status,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
    };

    if (data.adminNote) {
        request.adminNote = data.adminNote;
    }

    if (data.refundAmount !== undefined) {
        request.refundAmount = data.refundAmount;
    }

    if (data.refundedAt) {
        request.refundedAt = toDate(data.refundedAt);
    }

    if (data.handshakeStep) {
        request.handshakeStep = data.handshakeStep;
    }

    if (data.refundDecision) {
        request.refundDecision = data.refundDecision;
    }

    if (data.userWallet) {
        request.userWallet = {
            walletType: data.userWallet.walletType,
            accountNumber: data.userWallet.accountNumber,
            accountName: data.userWallet.accountName,
            submittedAt: toDate(data.userWallet.submittedAt),
        };
    }

    if (data.adminRefundReceiptUrl) {
        request.adminRefundReceiptUrl = data.adminRefundReceiptUrl;
    }

    if (data.adminRefundReceiptUploadedAt) {
        request.adminRefundReceiptUploadedAt = toDate(data.adminRefundReceiptUploadedAt);
    }

    if (data.disputeCount !== undefined) {
        request.disputeCount = data.disputeCount;
    }

    if (data.disputeReason) {
        request.disputeReason = data.disputeReason;
    }

    if (data.disputedAt) {
        request.disputedAt = toDate(data.disputedAt);
    }

    if (data.userConfirmedReceivedAt) {
        request.userConfirmedReceivedAt = toDate(data.userConfirmedReceivedAt);
    }

    return request;
};

const cancellationToFirestore = (cancellation: Cancellation): ICancellationDB => {
    const request: ICancellationDB = {
        id: cancellation.id,
        userId: cancellation.userId,
        cancelledBy: cancellation.cancelledBy,
        bookingId: cancellation.bookingId,
        offerId: cancellation.offerId,
        businessId: cancellation.businessId,
        reason: cancellation.reason,
        status: cancellation.status,
        createdAt: cancellation.createdAt ? Timestamp.fromDate(toDate(cancellation.createdAt)) : serverTimestamp(),
        updatedAt: cancellation.updatedAt ? Timestamp.fromDate(toDate(cancellation.updatedAt)) : serverTimestamp(),
    };

    if (cancellation.adminNote) {
        request.adminNote = cancellation.adminNote;
    }

    if (cancellation.refundAmount !== undefined) {
        request.refundAmount = cancellation.refundAmount;
    }

    if (cancellation.refundedAt) {
        request.refundedAt = Timestamp.fromDate(toDate(cancellation.refundedAt));
    }

    if (cancellation.handshakeStep) {
        request.handshakeStep = cancellation.handshakeStep;
    }

    if (cancellation.refundDecision) {
        request.refundDecision = cancellation.refundDecision;
    }

    if (cancellation.userWallet) {
        request.userWallet = {
            walletType: cancellation.userWallet.walletType,
            accountNumber: cancellation.userWallet.accountNumber,
            accountName: cancellation.userWallet.accountName,
            submittedAt: cancellation.userWallet.submittedAt instanceof Date
                ? Timestamp.fromDate(cancellation.userWallet.submittedAt)
                : serverTimestamp(),
        };
    }

    if (cancellation.adminRefundReceiptUrl) {
        request.adminRefundReceiptUrl = cancellation.adminRefundReceiptUrl;
    }

    if (cancellation.adminRefundReceiptUploadedAt) {
        request.adminRefundReceiptUploadedAt = cancellation.adminRefundReceiptUploadedAt instanceof Date
            ? Timestamp.fromDate(cancellation.adminRefundReceiptUploadedAt)
            : serverTimestamp();
    }

    if (cancellation.disputeCount !== undefined) {
        request.disputeCount = cancellation.disputeCount;
    }

    if (cancellation.disputeReason) {
        request.disputeReason = cancellation.disputeReason;
    }

    if (cancellation.disputedAt) {
        request.disputedAt = cancellation.disputedAt instanceof Date
            ? Timestamp.fromDate(cancellation.disputedAt)
            : serverTimestamp();
    }

    if (cancellation.userConfirmedReceivedAt) {
        request.userConfirmedReceivedAt = cancellation.userConfirmedReceivedAt instanceof Date
            ? Timestamp.fromDate(cancellation.userConfirmedReceivedAt)
            : serverTimestamp();
    }

    return request;
};

export const cancellationConverter: FirestoreDataConverter<Cancellation> = {
    toFirestore: (cancellation: Cancellation): ICancellationDB => {
        return cancellationToFirestore(cancellation);
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Cancellation => {
        const data = snapshot.data() as ICancellationDB;
        return cancellationFromFirestore(snapshot.id, data);
    },
};