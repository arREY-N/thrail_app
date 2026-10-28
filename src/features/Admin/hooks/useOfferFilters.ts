/**
 * @file useOfferFilters.ts
 * @description Custom hook for searching, filtering, and sorting offers in the Admin Offer List screen.
 */

import { useCallback, useMemo, useState } from 'react';

import { FilterSection } from '@/src/components/CustomFilterModal';
import { Booking } from '@/src/core/models/Booking/Booking';
import { Cancellation } from '@/src/core/models/Cancellation/Cancellation';
import { Offer } from '@/src/core/models/Offer/Offer';
import { DateInput, safeParseDateString } from '@/src/utils/dateFormatter';
export type OfferFilterTab = 'Active' | 'Expired' | 'Rescheduled' | 'Cancelled';
export type OfferSortBy = 'date' | 'price';
export type OfferSortOrder = 'asc' | 'desc';
export type OfferStatusFilter = 'all' | 'action-needed' | 'no-action';

/**
 * Gets the contextual default sort direction for a given offer tab and sort field.
 *
 * @param tab - Currently active offer filter tab.
 * @param currentSortBy - Selected sort field ('date' | 'price').
 * @returns Default sort order ('desc' for Expired hike dates, 'asc' otherwise).
 */
export const getDefaultSortOrderForOfferTab = (
    tab: string,
    currentSortBy: OfferSortBy
): OfferSortOrder => {
    if (currentSortBy === 'date') {
        return tab === 'Expired' ? 'desc' : 'asc';
    }
    return 'asc';
};

export const FILTER_OPTIONS = ['Active', 'Expired', 'Rescheduled', 'Cancelled'];

/**
 * useOfferFilters — Manages search querying, active filter tabs, status filters, and priority sorting.
 * 
 * @param offers - The array of raw offers to search and filter against.
 * @param bookingByOffer - Map of bookings indexed by offer ID.
 * @param cancellations - Optional list of business cancellation records.
 * @returns State and setter functions for filters and the filtered/sorted offers array.
 */
export default function useOfferFilters(
    offers: Offer[],
    bookingByOffer: Record<string, Booking[]> = {},
    cancellations: Cancellation[] = []
) {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [activeFilter, setActiveFilter] = useState<string>('Active');
    const [customSortBy, setCustomSortBy] = useState<OfferSortBy | null>(null);
    const [customSortOrder, setCustomSortOrder] = useState<OfferSortOrder | null>(null);
    const [filterByStatus, setFilterByStatus] = useState<OfferStatusFilter>('all');

    const sortBy: OfferSortBy = customSortBy || 'date';
    const sortOrder: OfferSortOrder = customSortOrder || getDefaultSortOrderForOfferTab(activeFilter, sortBy);

    const setSortBy = useCallback((newSort: OfferSortBy) => {
        setCustomSortBy(newSort);
    }, []);

    const setSortOrder = useCallback((newOrder: OfferSortOrder) => {
        setCustomSortOrder(newOrder);
    }, []);

    const actionableCountsByOffer = useMemo(() => {
        const counts: Record<string, number> = {};
        const cancellationsByOffer = new Map<string, Cancellation[]>();

        (cancellations || []).forEach(c => {
            if (!cancellationsByOffer.has(c.offerId)) {
                cancellationsByOffer.set(c.offerId, []);
            }
            cancellationsByOffer.get(c.offerId)!.push(c);
        });

        (offers || []).forEach(offer => {
            const list = (bookingByOffer && Object.prototype.hasOwnProperty.call(bookingByOffer, offer.id))
                ? bookingByOffer[offer.id] || []
                : [];
            const offerCancellations = cancellationsByOffer.get(offer.id) || [];

            const cancellationByBooking = new Map<string, Cancellation>();
            offerCancellations.forEach(c => {
                cancellationByBooking.set(c.bookingId, c);
            });

            const actionableBookingIds = new Set<string>();
            list.forEach(b => {
                const cancellation = cancellationByBooking.get(b.id);
                if (cancellation?.status === 'approved' || b.status === 'cancelled') {
                    return;
                }
                if (cancellation && cancellation.cancelledBy === 'admin') {
                    return;
                }

                const status = (b.status as string) || '';
                if (
                    status === 'for-reservation' ||
                    status === 'paid' ||
                    status === 'downpayment' ||
                    status === 'for-cancellation' ||
                    status === 'for-reschedule'
                ) {
                    actionableBookingIds.add(b.id);
                }
            });

            offerCancellations.forEach(c => {
                if (c.status === 'pending' && c.cancelledBy !== 'admin') {
                    actionableBookingIds.add(c.bookingId);
                }
            });

            counts[offer.id] = actionableBookingIds.size;
        });

        return counts;
    }, [offers, bookingByOffer, cancellations]);

    const filteredAndSortedOffers = useMemo(() => {
        if (!offers) return [];
        
        let filtered = [...offers];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (searchQuery.trim() !== '') {
            filtered = filtered.filter(offer => {
                const trailName = offer.trail?.name || '';
                return trailName.toLowerCase().includes(searchQuery.toLowerCase());
            });
        }

        filtered = filtered.filter(offer => {
            const status = (offer.status || '').toLowerCase();
            const offerDate = safeParseDateString((offer.date || offer.hikeDate) as DateInput);
            offerDate.setHours(0, 0, 0, 0);
            
            const isPast = offerDate < today;
            const isUpcomingOrToday = offerDate >= today;

            if (activeFilter === 'Cancelled') {
                return status === 'cancelled';
            } else if (activeFilter === 'Rescheduled') {
                return status === 'rescheduled';
            } else if (activeFilter === 'Expired') {
                return isPast && status !== 'cancelled' && status !== 'rescheduled';
            } else if (activeFilter === 'Active') {
                return isUpcomingOrToday && status !== 'cancelled' && status !== 'rescheduled';
            }
            
            return true;
        });

        if (filterByStatus === 'action-needed') {
            filtered = filtered.filter(offer => (actionableCountsByOffer[offer.id] ?? 0) > 0);
        } else if (filterByStatus === 'no-action') {
            filtered = filtered.filter(offer => (actionableCountsByOffer[offer.id] ?? 0) === 0);
        }

        return filtered.sort((a, b) => {
            if (activeFilter === 'Active') {
                const countA = actionableCountsByOffer[a.id] ?? 0;
                const countB = actionableCountsByOffer[b.id] ?? 0;
                const aNeedsAttention = countA > 0;
                const bNeedsAttention = countB > 0;

                if (aNeedsAttention !== bNeedsAttention) {
                    return aNeedsAttention ? -1 : 1;
                }
            }
            if (sortBy === 'price') {
                const priceA = Number(a.price) || 0;
                const priceB = Number(b.price) || 0;
                
                if (priceA !== priceB) {
                    return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
                }
            }

            const dateA = safeParseDateString((a.date || a.hikeDate) as DateInput).getTime();
            const dateB = safeParseDateString((b.date || b.hikeDate) as DateInput).getTime();

            const timeA = isNaN(dateA) ? 0 : dateA;
            const timeB = isNaN(dateB) ? 0 : dateB;

            if (timeA !== timeB) {
                if (sortOrder === 'desc') {
                    return timeB - timeA;
                }
                return timeA - timeB;
            }

            if (activeFilter === 'Active') {
                const countDiff = (actionableCountsByOffer[b.id] ?? 0) - (actionableCountsByOffer[a.id] ?? 0);
                if (countDiff !== 0) return countDiff;
            }

            const nameA = a.trail?.name || '';
            const nameB = b.trail?.name || '';
            return nameA.localeCompare(nameB);
        });
    }, [offers, searchQuery, activeFilter, sortBy, sortOrder, filterByStatus, actionableCountsByOffer]);

    const filterSections = useMemo<FilterSection[]>(() => [
        {
            id: 'sortBy',
            title: 'Sort By',
            type: 'radio',
            sortOrderKey: 'sortOrder',
            options: [
                {
                    label: 'Hike Date',
                    value: 'date',
                    defaultSortOrder: activeFilter === 'Expired' ? 'desc' : 'asc',
                },
                {
                    label: 'Price',
                    value: 'price',
                    defaultSortOrder: 'asc',
                },
            ],
        },
        {
            id: 'filterByStatus',
            title: 'Filter By Status',
            type: 'pill',
            multiSelect: false,
            options: [
                { label: 'Show All', value: 'all' },
                { label: 'Action Needed', value: 'action-needed' },
                { label: 'No Pending Actions', value: 'no-action' },
            ],
        },
    ], [activeFilter]);

    return {
        searchQuery,
        setSearchQuery,
        activeFilter,
        setActiveFilter,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        filterByStatus,
        setFilterByStatus,
        actionableCountsByOffer,
        filterSections,
        filteredAndSortedOffers,
    };
}