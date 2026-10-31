import { IBusinessSummary } from "@/src/core/models/Business/Business";
import { IOfferBase } from "@/src/core/models/Offer/Offer";
import { ITrailSummary } from "@/src/core/models/Trail/Trail";
import { IEmergencyContact, IUserSummary } from "@/src/core/models/User/User";
import { FieldValue, Timestamp } from "firebase/firestore";

export type BookingStatus =
    | "for-reservation"
    | "pending-docs" // @deprecated Legacy status normalized to 'for-reservation'
    | "approved-docs"
    | "cancelled"
    | "for-payment"
    | "paid"
    | "downpayment"
    | "completed"
    | "finished"
    | "reservation-rejected"
    | "for-cancellation"
    | "cancellation-rejected"
    | "refund"
    | "refunded"
    | "for-reschedule"
    | "reschedule-rejected"
    | "rescheduled"
    | "expired";

export type Requirements = {
    name: string;
    file: string;
    valid: "pending" | "approved" | "rejected";
};

export interface IPayment<T> {
    /** Name of the payment gateway used (paymongo) */
    gateway: string;
    /** Payment Gateway ID (e.g. pay_...) */
    gatewayId?: string;
    /** Specific payment method channel (gcash, maya, card) */
    method?: string;
    /** Records a reference to the checkout session */
    sessionId: string;

    /** Records the receipt ID once available, will be null initially */
    referenceCode?: string | null;

    status: "pending" | "captured" | "failed" | "refunded" | "abandoned" | "processing_refund" | "rejected";
    refundableUntil?: T;
    amount: number;
    refundedAmount?: number;
    createdAt: T;
    capturedAt?: T;
    paidAt?: T;
    refundedAt?: T;
    refundReason?: string;
    refundProofUrl?: string;
    refundMethod?: string;

    // Manual QR verification fields:
    receiptUrl?: string;
    classification?: 'full' | 'downpayment';
    adminNote?: string;
    verifiedBy?: string;
    verifiedAt?: T;
    editedBy?: string;
    editedAt?: T;
    revertedBy?: string;
    revertedAt?: T;
}

export interface IUserBooking<T> extends IUserSummary {
    birthday: T;
    phoneNumber: string;
    phoneVerifiedAt?: T | null;
}

export interface IOverpaymentDetails<T = Date> {
    excessAmount: number;
    originalVerifiedAmount: number;
    hikeAmountCaptured: number;
    status: 'awaiting_hiker_wallet' | 'awaiting_admin_payout' | 'awaiting_user_confirmation' | 'refund_disputed' | 'completed';
    userWallet?: {
        walletType: 'GCash' | 'Maya';
        accountNumber: string;
        accountName?: string;
        submittedAt: T;
    };
    adminRefundReceiptUrl?: string;
    adminRefundReceiptUploadedAt?: T;
    disputeCount?: number;
    disputeReason?: string;
    disputedAt?: T;
    userConfirmedReceivedAt?: T;
    createdAt: T;
    updatedAt: T;
}

export interface IBookingBase<T> {
    id: string;
    createdAt: T;
    updatedAt: T;
    offer: Pick<IOfferBase<T>, "date" | "price" | "id">;
    user: IUserBooking<T>;
    business: IBusinessSummary;
    trail: ITrailSummary;
    payment: IPayment<T>[];
    status: BookingStatus;
    emergencyContact: IEmergencyContact;
    documents: Requirements[];
    cancellationReason?: string;
    cancelledBy?: string;
    cancellationDeclineReason?: string;
    rescheduleReason?: string;
    rescheduleRequestId?: string | null;
    rescheduledToOfferId?: string | null;
    rescheduleDeclineReason?: string;
    totalAmount?: number;
    previousStatus?: BookingStatus;

    // Manual QR tracking fields:
    remainingBalance?: number;
    paymentVerificationStatus?: 'pending_verification' | 'downpayment' | 'fully_paid' | 'rejected' | 'refund_submitted' | 'refund_disputed' | 'refunded';
    paymentRejectionReason?: string;
    refundedAmount?: number;
    overpayment?: IOverpaymentDetails<T>;
}

export interface UsePayBookingParams {
    amount: number;
    bookingId: string;
    userId: string;
    type: string;
    returnUrl: string;
}

export type IBookingDB = IBookingBase<Timestamp | FieldValue>;
export type Booking = IBookingBase<Date>;
export type IBooking = Booking;
