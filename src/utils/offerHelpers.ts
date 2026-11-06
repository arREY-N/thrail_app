/**
 * @file offerHelpers.ts
 * @description Universal utility functions for computing trail offer counts, multi-day date spans,
 * active booking status checks, pending reschedule dual-date locks, and schedule conflict evaluation.
 */

import { Booking } from '@/src/core/models/Booking/Booking';
import { Cancellation } from '@/src/core/models/Cancellation/Cancellation';
import { IOffer } from '@/src/core/models/Offer/Offer';
import { ITrail } from '@/src/core/models/Trail/Trail';
import { formatDateToStandard, safeParseDateString } from '@/src/utils/dateFormatter';

export interface IOfferDateSpan {
    startDate: Date;
    endDate: Date;
    durationDays: number;
}

export interface IBookedOfferSpan {
    /** The offer ID being locked (either primary booking.offer.id or pending rescheduledToOfferId) */
    offerId: string;
    /** The parent booking ID that owns this lock */
    bookingId: string;
    /** Whether this lock is from the booking's current offer or a pending reschedule target offer */
    lockKind: 'primary' | 'pending-reschedule';
    /** Calculated start, end, and duration in days */
    span: IOfferDateSpan;
    /** Human-readable date range string (e.g., "May 10, 2026" or "May 10, 2026 – May 12, 2026") */
    formattedSpan: string;
}

/**
 * Terminal / inactive booking statuses that do NOT block schedule dates or cause conflicts.
 * Note: 'rescheduled' is the archived status on the old booking after a reschedule is approved.
 */
const NON_CONFLICTING_BOOKING_STATUSES = new Set<string>([
    'cancelled',
    'refund',
    'refunded',
    'finished',
    'expired',
    'rescheduled',
]);

/**
 * Checks whether a booking status is terminal/inactive and therefore does NOT cause schedule conflicts.
 *
 * @param status - The booking status string to evaluate.
 * @returns {boolean} True if the status is inactive/non-conflicting.
 */
export const isNonConflictingBookingStatus = (status?: string | null): boolean => {
    if (!status) return false;
    return NON_CONFLICTING_BOOKING_STATUSES.has(status.toLowerCase());
};

/**
 * Checks whether a booking actively blocks its schedule date(s).
 * Excludes terminal statuses ('cancelled', 'refund', 'refunded', 'finished', 'expired', 'rescheduled')
 * and bookings whose associated cancellation request has already been approved/completed.
 *
 * @param booking - The user booking to evaluate.
 * @param userCancellations - Optional list of user cancellation records for cross-checking.
 * @returns {boolean} True if the booking actively locks its schedule.
 */
export const isBookingActivelyBlocking = (
    booking?: Partial<Booking> | null,
    userCancellations: Cancellation[] = []
): boolean => {
    if (!booking) return false;
    if (isNonConflictingBookingStatus(booking.status)) return false;

    if (booking.id && Array.isArray(userCancellations) && userCancellations.length > 0) {
        const matchingCancellation = userCancellations.find((c) => c.bookingId === booking.id);
        if (matchingCancellation) {
            const cancelStatus = (matchingCancellation.status || '').toLowerCase();
            const handshake = (matchingCancellation.handshakeStep || '').toLowerCase();
            if (
                cancelStatus === 'approved' ||
                cancelStatus === 'completed' ||
                cancelStatus === 'refund_completed' ||
                handshake === 'completed'
            ) {
                return false;
            }
        }
    }

    return true;
};

/**
 * Calculates start (00:00:00.000), end (23:59:59.999), and duration in days for an offer.
 * Supports multi-day expeditions dynamically via endDate, schedule array length, or duration string.
 *
 * @param offer - Target offer object (or partial offer metadata).
 * @param fallbackDate - Fallback start date if offer is only a stub or undefined.
 * @returns {IOfferDateSpan} Calculated start date, end date, and total duration in days.
 */
export const getOfferDateSpan = (
    offer?: Partial<IOffer> | null,
    fallbackDate?: Date | string | null
): IOfferDateSpan => {
    const rawStart = offer?.date ?? fallbackDate;
    const startDate = rawStart instanceof Date
        ? new Date(rawStart.getTime())
        : safeParseDateString(rawStart as string);
    startDate.setHours(0, 0, 0, 0);

    let durationDays = 1;
    if (offer?.endDate) {
        const parsedEndDate = offer.endDate instanceof Date
            ? new Date(offer.endDate.getTime())
            : safeParseDateString(offer.endDate as string);
        parsedEndDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((parsedEndDate.getTime() - startDate.getTime()) / 86400000) + 1;
        if (diffDays > 0) {
            durationDays = diffDays;
        }
    } else if (Array.isArray(offer?.schedule) && offer.schedule.length > 0) {
        durationDays = offer.schedule.length;
    } else if (typeof offer?.duration === 'string') {
        const dStr = offer.duration.toLowerCase();
        const matchDays = dStr.match(/(\d+)\s*(?:d|day)/);
        if (matchDays && matchDays[1]) {
            durationDays = parseInt(matchDays[1], 10) || 1;
        } else if (dStr.includes('overnight')) {
            durationDays = 2;
        }
    }

    const endDate = new Date(startDate.getTime() + (durationDays - 1) * 86400000);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate, durationDays };
};

/**
 * Formats an IOfferDateSpan into a human-readable date or multi-day range string.
 *
 * @param span - The calculated offer date span.
 * @returns {string} Standard formatted date or range (e.g., "May 10, 2026 – May 12, 2026").
 */
export const formatOfferDateSpan = (span: IOfferDateSpan): string => {
    const startStr = formatDateToStandard(span.startDate);
    const endStr = formatDateToStandard(span.endDate);
    return span.durationDays > 1 && startStr !== endStr
        ? `${startStr} – ${endStr}`
        : startStr;
};

/**
 * Computes all active schedule spans locked by the user's bookings across all trails.
 * Includes:
 * 1. Primary booking offer spans (resolved against allOffers for full multi-day accuracy).
 * 2. Pending reschedule target offer spans (`rescheduledToOfferId` when `status === 'for-reschedule'`),
 *    protecting both the original date (if rejected) and the target date (if approved) while pending.
 *
 * @param userBookings - All bookings belonging to the user.
 * @param allOffers - Complete list of offers across trails (used to resolve multi-day endDate/schedule/duration).
 * @param userCancellations - Optional cancellation records to exclude already-approved cancellations.
 * @param excludeBookingId - Optional booking ID to exclude (e.g. the booking currently being rescheduled in RescheduleModal).
 * @returns {IBookedOfferSpan[]} Array of active locked offer spans.
 */
export const getActiveBookingSpans = (
    userBookings: Booking[] = [],
    allOffers: Partial<IOffer>[] = [],
    userCancellations: Cancellation[] = [],
    excludeBookingId?: string | null
): IBookedOfferSpan[] => {
    if (!Array.isArray(userBookings) || userBookings.length === 0) return [];

    const offerLookup = new Map<string, Partial<IOffer>>();
    if (Array.isArray(allOffers)) {
        for (const offer of allOffers) {
            if (offer?.id) {
                offerLookup.set(offer.id, offer);
            }
        }
    }

    const spans: IBookedOfferSpan[] = [];
    const seenKeys = new Set<string>();

    for (const booking of userBookings) {
        if (!booking || (excludeBookingId && booking.id === excludeBookingId)) continue;
        if (!isBookingActivelyBlocking(booking, userCancellations)) continue;

        const primaryOfferId = booking.offer?.id || (booking as { offerId?: string }).offerId;
        if (primaryOfferId) {
            const fullPrimaryOffer = offerLookup.get(primaryOfferId);
            const fallbackDate = booking.offer?.date;
            if (fullPrimaryOffer?.date || fallbackDate) {
                const span = getOfferDateSpan(fullPrimaryOffer, fallbackDate);
                const key = `primary:${primaryOfferId}`;
                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    spans.push({
                        offerId: primaryOfferId,
                        bookingId: booking.id,
                        lockKind: 'primary',
                        span,
                        formattedSpan: formatOfferDateSpan(span),
                    });
                }
            }
        }

        // If booking is pending reschedule ('for-reschedule'), also lock the requested target offer span
        if (
            booking.status === 'for-reschedule' &&
            booking.rescheduledToOfferId &&
            booking.rescheduledToOfferId !== primaryOfferId
        ) {
            const targetOfferId = booking.rescheduledToOfferId;
            const fullTargetOffer = offerLookup.get(targetOfferId);
            if (fullTargetOffer?.date) {
                const targetSpan = getOfferDateSpan(fullTargetOffer);
                const key = `pending-reschedule:${targetOfferId}`;
                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    spans.push({
                        offerId: targetOfferId,
                        bookingId: booking.id,
                        lockKind: 'pending-reschedule',
                        span: targetSpan,
                        formattedSpan: formatOfferDateSpan(targetSpan),
                    });
                }
            }
        }
    }

    return spans;
};

/**
 * Compares two offer date spans using midnight-normalized calendar days to determine:
 * 1. `isOverlap`: Whether the two spans share at least one calendar day.
 * 2. `gapDays`: Whole calendar days between the end of one span and the start of the other
 *    (`1` = immediate next calendar day / 0 rest days in between; `2` = 1 rest day in between).
 *
 * @param candidateSpan - The candidate offer date span.
 * @param bookedSpan - An existing active booked offer date span.
 * @returns {{ isOverlap: boolean; gapDays: number | null }} Overlap flag and calendar day gap.
 */
export const getCalendarDayGap = (
    candidateSpan: IOfferDateSpan,
    bookedSpan: IOfferDateSpan
): { isOverlap: boolean; gapDays: number | null } => {
    const candStartMidnight = new Date(candidateSpan.startDate.getTime());
    candStartMidnight.setHours(0, 0, 0, 0);

    const candEndMidnight = new Date(candidateSpan.endDate.getTime());
    candEndMidnight.setHours(0, 0, 0, 0);

    const bookStartMidnight = new Date(bookedSpan.startDate.getTime());
    bookStartMidnight.setHours(0, 0, 0, 0);

    const bookEndMidnight = new Date(bookedSpan.endDate.getTime());
    bookEndMidnight.setHours(0, 0, 0, 0);

    const isOverlap =
        candStartMidnight.getTime() <= bookEndMidnight.getTime() &&
        candEndMidnight.getTime() >= bookStartMidnight.getTime();

    if (isOverlap) {
        return { isOverlap: true, gapDays: 0 };
    }

    if (candStartMidnight.getTime() > bookEndMidnight.getTime()) {
        const daysAfter = Math.round((candStartMidnight.getTime() - bookEndMidnight.getTime()) / 86400000);
        return { isOverlap: false, gapDays: daysAfter };
    }

    const daysBefore = Math.round((bookStartMidnight.getTime() - candEndMidnight.getTime()) / 86400000);
    return { isOverlap: false, gapDays: daysBefore };
};

/**
 * Checks whether an offer is active and has not expired past today's date.
 *
 * @param offer - The offer to evaluate.
 * @returns {boolean} True if the offer date is on or after today midnight.
 */
export const isAliveOffer = (offer?: Partial<IOffer> | null): boolean => {
    if (!offer?.date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const offerDate = offer.date instanceof Date
        ? new Date(offer.date)
        : safeParseDateString(offer.date as string);
    offerDate.setHours(0, 0, 0, 0);

    return offerDate.getTime() >= today.getTime();
};

/**
 * Calculates the total number of alive/available offers for a specific trail.
 * Excludes dead and expired offers whose dates are in the past.
 *
 * @param trailId - The ID of the trail.
 * @param offers - List of offers.
 * @returns The total count of active upcoming offers associated with the trail.
 */
export const getTrailOffersCount = (
    trailId?: string | null,
    offers: Partial<IOffer>[] = []
): number => {
    if (!trailId || !offers || offers.length === 0) return 0;
    return offers.filter((o) => {
        const offerTrailId = o.trail?.id || (o as { trailId?: string }).trailId;
        const matchesTrail = Boolean(offerTrailId && offerTrailId === trailId);
        return matchesTrail && isAliveOffer(o);
    }).length;
};

/**
 * Filters a list of trails to only those that have at least one alive/upcoming offer.
 * Ensures 1-to-1 consistency with the MountainCard offer badge across Home and Explore.
 *
 * @param trails - Complete list of trails.
 * @param offers - Complete list of offers.
 * @returns Array of trails with active upcoming offers.
 */
export const getTrailsWithAliveOffers = (
    trails: ITrail[] = [],
    offers: Partial<IOffer>[] = []
): ITrail[] => {
    if (!trails || trails.length === 0 || !offers || offers.length === 0) return [];
    return trails.filter((trail) => getTrailOffersCount(trail.id, offers) > 0);
};
