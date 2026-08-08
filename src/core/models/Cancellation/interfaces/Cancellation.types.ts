import { Cancellation } from "@/src/core/models/Cancellation/interfaces/ICancellation";

export type CancellationRequest = Required<Pick<Cancellation, 'reason' | 'offerId' | 'businessId' | 'bookingId'>>
