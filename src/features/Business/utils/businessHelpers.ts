/**
 * @file businessHelpers.ts
 * @description Pure domain helpers for Business Profile data transformation,
 * offer filtering/sorting, province tab generation, personnel deduplication,
 * and latest-first organizer review sorting.
 */

import { FilterTabItem } from '@/src/components/CustomFilterTabs';
import { Admin } from '@/src/core/models/Admin/Admin';
import { IOwner } from '@/src/core/models/Application/Application';
import { Business } from '@/src/core/models/Business/Business';
import { BusinessReview } from '@/src/core/models/BusinessReview/interfaces/BusinessReview';
import { IOffer } from '@/src/core/models/Offer/Offer';
import { ITrail } from '@/src/core/models/Trail/Trail';
import { safeParseDateString } from '@/src/utils/dateFormatter';
import { getTrailsWithAliveOffers, isAliveOffer } from '@/src/utils/offerHelpers';

export type BusinessTabType = 'Offers' | 'About' | 'Reviews';

export interface ResolvedBusinessPersonnel {
    ownerAdminRecord?: Admin;
    teamMembers: Admin[];
    uniqueTeamCount: number;
}

/**
 * Deduplicates business admins against the registered owner and excludes removed members.
 *
 * @param owner - Business owner summary object.
 * @param admins - List of admin/coordinator personnel records.
 * @returns Resolved owner admin record, active non-owner team members, and total unique count.
 */
export const resolveBusinessPersonnel = (
    owner?: IOwner | null,
    admins: Admin[] = []
): ResolvedBusinessPersonnel => {
    const ownerId = owner?.id?.trim();
    const ownerEmail = owner?.email?.trim().toLowerCase();

    const ownerAdminRecord = owner
        ? admins.find((a) => {
              if (ownerId && a.id?.trim() === ownerId) return true;
              if (ownerEmail && a.email?.trim().toLowerCase() === ownerEmail) return true;
              return false;
          })
        : undefined;

    const teamMembers = admins.filter((a) => {
        if (a.status === 'removed') return false;
        if (ownerId && a.id?.trim() === ownerId) return false;
        if (ownerEmail && a.email?.trim().toLowerCase() === ownerEmail) return false;
        return true;
    });

    const uniqueTeamCount = (owner ? 1 : 0) + teamMembers.length;

    return {
        ownerAdminRecord,
        teamMembers,
        uniqueTeamCount,
    };
};

/**
 * Filters all offers to only active/alive upcoming offers belonging to the given business.
 *
 * @param business - Target tour business entity.
 * @param offers - Complete list of offers.
 * @returns Active upcoming offers belonging to this business.
 */
export const getAliveBusinessOffers = (
    business?: Business | null,
    offers: IOffer[] = []
): IOffer[] => {
    if (!business || offers.length === 0) return [];
    const bId = business.id?.trim();
    const bName = business.name?.trim().toLowerCase();

    return offers.filter((o) => {
        if (!isAliveOffer(o)) return false;
        if (bId && o.business?.id) {
            return o.business.id.trim() === bId;
        }
        if (bName && o.business?.name) {
            return o.business.name.trim().toLowerCase() === bName;
        }
        return false;
    });
};

/**
 * Returns the top N trails with soonest bookable upcoming offers (available hiker slots).
 *
 * @param aliveBusinessOffers - Active upcoming offers for the business.
 * @param trails - Complete trail catalog.
 * @param limit - Maximum number of featured trails to return (default: 3).
 * @returns Ordered array of featured ITrail items.
 */
export const getFeaturedUpcomingTrails = (
    aliveBusinessOffers: IOffer[] = [],
    trails: ITrail[] = [],
    limit: number = 3
): ITrail[] => {
    if (aliveBusinessOffers.length === 0 || trails.length === 0) return [];

    const bookableOffers = aliveBusinessOffers
        .filter((o) => {
            return (
                !o.maxPax ||
                Number(o.maxPax) <= 0 ||
                (Number(o.reservedPax) || 0) < Number(o.maxPax)
            );
        })
        .sort((a, b) => {
            const timeA = safeParseDateString(a.date).getTime();
            const timeB = safeParseDateString(b.date).getTime();
            return timeA - timeB;
        });

    const trailIdOrder: string[] = [];
    for (const offer of bookableOffers) {
        const trailId = offer.trail?.id;
        if (trailId && !trailIdOrder.includes(trailId)) {
            trailIdOrder.push(trailId);
        }
        if (trailIdOrder.length >= limit) break;
    }

    return trailIdOrder
        .map((id) => trails.find((t) => t.id === id))
        .filter((t): t is ITrail => Boolean(t));
};

/**
 * Returns all unique trails with alive offers from this business, sorted deterministically
 * by soonest upcoming departure date ascending, then offer count descending, then trail name.
 *
 * @param trails - Complete trail catalog.
 * @param aliveBusinessOffers - Active upcoming offers for the business.
 * @returns Sorted ITrail array.
 */
export const getSortedBusinessTrails = (
    trails: ITrail[] = [],
    aliveBusinessOffers: IOffer[] = []
): ITrail[] => {
    const activeTrails = getTrailsWithAliveOffers(trails, aliveBusinessOffers);
    if (activeTrails.length <= 1) return activeTrails;

    const earliestOfferTimeByTrail = new Map<string, number>();
    const offerCountByTrail = new Map<string, number>();

    for (const offer of aliveBusinessOffers) {
        const trailId = offer.trail?.id;
        if (!trailId) continue;

        const offerTime = safeParseDateString(offer.date).getTime();
        const existingEarliest = earliestOfferTimeByTrail.get(trailId);
        if (existingEarliest === undefined || offerTime < existingEarliest) {
            earliestOfferTimeByTrail.set(trailId, offerTime);
        }
        offerCountByTrail.set(trailId, (offerCountByTrail.get(trailId) ?? 0) + 1);
    }

    return [...activeTrails].sort((a, b) => {
        const timeA = earliestOfferTimeByTrail.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const timeB = earliestOfferTimeByTrail.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        if (timeA !== timeB) return timeA - timeB;

        const countA = offerCountByTrail.get(a.id) ?? 0;
        const countB = offerCountByTrail.get(b.id) ?? 0;
        if (countA !== countB) return countB - countA;

        const nameA = a.general?.name || '';
        const nameB = b.general?.name || '';
        return nameA.localeCompare(nameB);
    });
};

const getTrailProvinces = (trail: ITrail): string[] => {
    const provs = trail.general?.province;
    if (Array.isArray(provs)) {
        return provs
            .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
            .map((p) => p.trim());
    }
    if (typeof provs === 'string') {
        const trimmed = (provs as string).trim();
        return trimmed ? [trimmed] : [];
    }
    return [];
};

/**
 * Builds province filter tabs for CustomFilterTabs, ordered by trail count descending then A-Z.
 *
 * @param trails - All active trails offered by the business.
 * @returns Array of FilterTabItem starting with 'All'.
 */
export const buildProvinceFilterTabs = (trails: ITrail[] = []): FilterTabItem[] => {
    const provinceCounts = new Map<string, number>();

    for (const trail of trails) {
        const uniqueTrailProvinces = new Set(getTrailProvinces(trail));
        for (const prov of uniqueTrailProvinces) {
            provinceCounts.set(prov, (provinceCounts.get(prov) ?? 0) + 1);
        }
    }

    const sortedProvinces = Array.from(provinceCounts.entries()).sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].localeCompare(b[0]);
    });

    return [
        {
            id: 'All',
            label: 'All',
            count: trails.length,
        },
        ...sortedProvinces.map(([prov, count]) => ({
            id: prov,
            label: prov,
            count,
        })),
    ];
};

/**
 * Filters a trail list by the active province tab ID.
 *
 * @param trails - Sorted list of business trails.
 * @param selectedProvince - Active tab ID ('All' or a province name).
 * @returns Filtered ITrail array.
 */
export const filterTrailsByProvince = (
    trails: ITrail[] = [],
    selectedProvince: string = 'All'
): ITrail[] => {
    if (selectedProvince === 'All') return trails;
    return trails.filter((trail) => getTrailProvinces(trail).includes(selectedProvince));
};

/**
 * Sorts BusinessReview items from latest review to oldest using safeParseDateString.
 *
 * @param reviews - Array of BusinessReview entities.
 * @returns New sorted array of BusinessReview items (newest first).
 */
export const sortBusinessReviewsByLatest = (
    reviews: BusinessReview[] = []
): BusinessReview[] => {
    if (reviews.length <= 1) return reviews;
    return [...reviews].sort((a, b) => {
        const timeA = safeParseDateString(a.createdAt || a.updatedAt || a.hikeDate).getTime();
        const timeB = safeParseDateString(b.createdAt || b.updatedAt || b.hikeDate).getTime();
        return timeB - timeA;
    });
};
