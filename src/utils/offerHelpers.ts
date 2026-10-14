/**
 * @file offerHelpers.ts
 * @description Universal utility functions for computing trail offer counts.
 */

import { IOffer } from '@/src/core/models/Offer/Offer';
import { safeParseDateString } from '@/src/utils/dateFormatter';

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
