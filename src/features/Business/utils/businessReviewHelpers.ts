/**
 * @file businessReviewHelpers.ts
 * @description Pure helper utilities for filtering community reviews associated with a tour
 * business's booked hikes and offers, and dynamically computing the business's rating and review count.
 */

import { Booking } from '@/src/core/models/Booking/Booking';
import { Business } from '@/src/core/models/Business/Business';
import { IOffer } from '@/src/core/models/Offer/Offer';
import { Review } from '@/src/core/models/Review/Review';

export interface BusinessReviewMetrics {
    businessReviews: Review[];
    rating: number;
    reviewsCount: number;
}

/**
 * Collects all reviews linked to a business's booked hikes and offered trails,
 * and calculates the aggregate rating score and review count.
 *
 * @param business - Target tour business entity.
 * @param offers - List of hike offers to match business-offered trails.
 * @param reviews - Global list of hiker reviews.
 * @param businessBookings - Optional list of bookings associated with the business.
 * @returns BusinessReviewMetrics containing matched reviews, average rating, and total review count.
 */
export const getBusinessReviewsAndMetrics = (
    business?: Business | null,
    offers: IOffer[] = [],
    reviews: Review[] = [],
    businessBookings: Booking[] = []
): BusinessReviewMetrics => {
    if (!business || reviews.length === 0) {
        return {
            businessReviews: [],
            rating: 0,
            reviewsCount: 0,
        };
    }

    const businessId = business.id?.trim();
    const businessName = business.name?.trim().toLowerCase();

    const offerTrailIds = new Set<string>();
    const offerTrailNames = new Set<string>();

    offers.forEach((offer) => {
        const matchesId = Boolean(
            businessId && offer.business?.id && offer.business.id.trim() === businessId
        );
        const matchesName = Boolean(
            businessName &&
            offer.business?.name &&
            offer.business.name.trim().toLowerCase() === businessName
        );

        if (matchesId || matchesName) {
            if (offer.trail?.id) {
                offerTrailIds.add(offer.trail.id.trim());
            }
            if (offer.trail?.name) {
                offerTrailNames.add(offer.trail.name.trim().toLowerCase());
            }
        }
    });

    const bookingIds = new Set<string>();
    const bookedUserTrailPairs = new Set<string>();

    businessBookings.forEach((booking) => {
        if (booking.status === 'cancelled' || booking.status === 'reservation-rejected') {
            return;
        }

        const matchesId = Boolean(
            businessId && booking.business?.id && booking.business.id.trim() === businessId
        );
        const matchesName = Boolean(
            businessName &&
            booking.business?.name &&
            booking.business.name.trim().toLowerCase() === businessName
        );

        if (matchesId || matchesName) {
            if (booking.id) {
                bookingIds.add(booking.id.trim());
            }
            const uId = booking.user?.id?.trim();
            const tId = booking.trail?.id?.trim();
            const tName = booking.trail?.name?.trim().toLowerCase();

            if (uId && tId) {
                bookedUserTrailPairs.add(`${uId}::${tId}`);
            }
            if (uId && tName) {
                bookedUserTrailPairs.add(`${uId}::${tName}`);
            }
            if (tId) {
                offerTrailIds.add(tId);
            }
            if (tName) {
                offerTrailNames.add(tName);
            }
        }
    });

    const matchedReviews = reviews.filter((review) => {
        const rBookingId = review.bookingId?.trim();
        if (rBookingId && bookingIds.has(rBookingId)) {
            return true;
        }

        const rUserId = review.user?.id?.trim();
        const rTrailId = review.trail?.id?.trim();
        const rTrailName = review.trail?.name?.trim().toLowerCase();

        if (rUserId && rTrailId && bookedUserTrailPairs.has(`${rUserId}::${rTrailId}`)) {
            return true;
        }
        if (rUserId && rTrailName && bookedUserTrailPairs.has(`${rUserId}::${rTrailName}`)) {
            return true;
        }

        if (rTrailId && offerTrailIds.has(rTrailId)) {
            return true;
        }
        if (rTrailName && offerTrailNames.has(rTrailName)) {
            return true;
        }

        return false;
    });

    const sortedReviews = [...matchedReviews].sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
        return (Number.isNaN(timeB) ? 0 : timeB) - (Number.isNaN(timeA) ? 0 : timeA);
    });

    const reviewsCount = sortedReviews.length;
    const totalScore = sortedReviews.reduce(
        (sum, item) => sum + (Number(item.overallRating) || 0),
        0
    );
    const rating = reviewsCount > 0 ? Math.round((totalScore / reviewsCount) * 10) / 10 : 0;

    return {
        businessReviews: sortedReviews,
        rating,
        reviewsCount,
    };
};

