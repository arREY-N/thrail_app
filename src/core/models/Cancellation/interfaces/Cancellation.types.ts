import { FieldValue, Timestamp } from "firebase/firestore";

export type HandshakeStep = 
    | 'awaiting_admin_approval'
    | 'awaiting_user_acceptance'
    | 'awaiting_admin_refund_decision'
    | 'awaiting_user_wallet'
    | 'awaiting_admin_payout'
    | 'awaiting_user_confirmation'
    | 'refund_disputed'
    | 'completed';

export interface IUserWalletDetails<T = Date> {
    walletType: 'GCash' | 'Maya';
    accountNumber: string;
    accountName?: string;
    submittedAt: T;
}

export interface ICancellationBase<T> {
    id: string;
    userId: string;
    cancelledBy: 'user' | 'admin';
    bookingId: string;
    offerId: string;
    businessId: string;
    reason: string;
    status: "pending" | "approved" | "rejected" | "user_accepted" | "refund_pending" | "refund_submitted" | "refund_completed" | "refund_disputed";
    adminNote?: string;
    refundAmount?: number;
    refundedAt?: T | null;
    createdAt: T;
    updatedAt: T;

    // 2-Way Handshake extensions:
    handshakeStep?: HandshakeStep;
    refundDecision?: 'issue_refund' | 'no_refund';
    userWallet?: IUserWalletDetails<T>;
    adminRefundReceiptUrl?: string;
    adminRefundReceiptUploadedAt?: T;
    disputeCount?: number;
    disputeReason?: string;
    disputedAt?: T;
    userConfirmedReceivedAt?: T;
    isDeleted?: boolean;
}

export type Cancellation = ICancellationBase<Date>;
export type ICancellation = Cancellation;

export type ICancellationDB = ICancellationBase<Timestamp | FieldValue>;
export type CancellationDB = ICancellationDB;

export type CancellationRequest = Required<Pick<Cancellation, 'reason' | 'offerId' | 'businessId' | 'bookingId'>> & {
    userWallet?: IUserWalletDetails<Date>;
};
