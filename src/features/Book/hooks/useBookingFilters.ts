import { useMemo, useState } from 'react';

import { Booking } from '@/src/core/models/Booking/Booking';
import { Cancellation } from '@/src/core/models/Cancellation/Cancellation';
import { TabItem } from '@/src/features/Book/components/BookTabs';
import { FilterSection } from '@/src/components/CustomFilterModal';
import { safeParseDateString } from '@/src/utils/dateFormatter';

export type TabId = 'upcoming' | 'pending' | 'history';
export type SortBy = 'hike-date' | 'booked-date' | 'last-updated';
export type SortOrder = 'asc' | 'desc';
export type FilterBy = 'all' | 'action-needed' | 'waiting' | 'partial';

/**
 * Derives the effective status of a booking considering active cancellation requests.
 */
export const getBookingEffectiveStatus = (
    booking: Booking,
    userCancellations?: Cancellation[]
): string => {
    const cancellationDoc = userCancellations?.find(
        c => c.bookingId === booking.id
    );
    if (cancellationDoc?.status === 'approved') {
        return 'cancelled';
    }
    if (cancellationDoc?.status === 'pending') {
        return 'for-cancellation';
    }
    if (
        cancellationDoc?.status === 'rejected' &&
        booking.status !== 'cancelled' &&
        booking.status !== 'refund' &&
        booking.status !== 'refunded'
    ) {
        return 'cancellation-rejected';
    }
    return booking.status;
};

/**
 * Checks whether a booking status requires user action or attention.
 */
export const isActionNeededStatus = (status: string): boolean => {
    return [
        'reservation-rejected',
        'approved-docs',
        'for-payment',
        'downpayment',
        'cancellation-rejected',
        'reschedule-rejected',
    ].includes(status);
};

/**
 * Calculates the latest update timestamp across booking, payments, and cancellation requests.
 */
export const getEffectiveUpdateTime = (
    b: Booking,
    userCancellations?: Cancellation[]
): number => {
    const cancelDoc = userCancellations?.find(c => c.bookingId === b.id);
    const cancelTime = cancelDoc?.updatedAt
        ? safeParseDateString(cancelDoc.updatedAt).getTime()
        : (cancelDoc?.createdAt ? safeParseDateString(cancelDoc.createdAt).getTime() : 0);
    const bookingUpdateTime = b.updatedAt ? safeParseDateString(b.updatedAt).getTime() : 0;
    const bookingCreateTime = b.createdAt ? safeParseDateString(b.createdAt).getTime() : 0;
    return Math.max(cancelTime, bookingUpdateTime, bookingCreateTime);
};

/**
 * Computes the optimal default active tab based on hiker action requirements.
 */
export const computeOptimalTab = (
    bookings: Booking[],
    cancellations: Cancellation[]
): TabId => {
    if (!bookings || bookings.length === 0) return 'upcoming';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hasPendingAction = bookings.some((b) => {
        const st = getBookingEffectiveStatus(b, cancellations);
        const hikeDate = safeParseDateString(b.offer?.date);
        const isPast = hikeDate.getTime() < today.getTime();
        return !isPast && isActionNeededStatus(st) && [
            'for-reservation',
            'reservation-rejected',
            'approved-docs',
            'for-payment',
            'for-reschedule',
            'for-cancellation',
            'cancellation-rejected',
            'reschedule-rejected',
        ].includes(st);
    });
    if (hasPendingAction) return 'pending';

    const hasUpcomingAction = bookings.some((b) => {
        const st = getBookingEffectiveStatus(b, cancellations);
        const hikeDate = safeParseDateString(b.offer?.date);
        const isPast = hikeDate.getTime() < today.getTime();
        return !isPast && st === 'downpayment';
    });
    if (hasUpcomingAction) return 'upcoming';

    const hasUpcoming = bookings.some((b) => {
        const st = getBookingEffectiveStatus(b, cancellations);
        const hikeDate = safeParseDateString(b.offer?.date);
        const isPast = hikeDate.getTime() < today.getTime();
        return !isPast && ['paid', 'downpayment', 'rescheduled', 'completed'].includes(st);
    });
    if (hasUpcoming) return 'upcoming';

    const hasPending = bookings.some((b) => {
        const st = getBookingEffectiveStatus(b, cancellations);
        const hikeDate = safeParseDateString(b.offer?.date);
        const isPast = hikeDate.getTime() < today.getTime();
        return !isPast && [
            'for-reservation',
            'reservation-rejected',
            'approved-docs',
            'for-payment',
            'for-reschedule',
            'for-cancellation',
            'cancellation-rejected',
            'reschedule-rejected',
        ].includes(st);
    });
    if (hasPending) return 'pending';

    return 'history';
};

/**
 * Gets the contextual default sort direction for a given tab and sort field.
 */
export const getDefaultSortOrderForTab = (tab: TabId, currentSortBy: SortBy): SortOrder => {
    if (currentSortBy === 'hike-date') {
        return tab === 'history' ? 'desc' : 'asc';
    }
    return 'desc';
};

/**
 * Custom hook to manage booking filters, sorting, tab badge indicators, and smart tab selection.
 * 
 * @param {Booking[]} userBookings - Array of bookings to filter and sort
 * @param {Cancellation[]} [userCancellations] - Array of user cancellation requests
 * @returns Object containing state and setter functions for filters
 */
export default function useBookingFilters(
    userBookings: Booking[] = [],
    userCancellations: Cancellation[] = []
) {
    const [activeTab, setActiveTab] = useState<TabId>(() => computeOptimalTab(userBookings, userCancellations));
    const [hasAutoSelected, setHasAutoSelected] = useState<boolean>(userBookings.length > 0);
    const [customSortBy, setCustomSortBy] = useState<SortBy | null>(null);
    const [customSortOrder, setCustomSortOrder] = useState<SortOrder | null>(null);
    const [filterBy, setFilterBy] = useState<FilterBy>('all');

    // Auto-select the tab requiring hiker action when bookings arrive after initial empty render
    if (!hasAutoSelected && userBookings.length > 0) {
        setHasAutoSelected(true);
        setActiveTab(computeOptimalTab(userBookings, userCancellations));
    }

    const defaultSortForTab: SortBy = activeTab === 'pending' ? 'last-updated' : 'hike-date';
    const sortBy: SortBy = customSortBy || defaultSortForTab;
    const sortOrder: SortOrder = customSortOrder || getDefaultSortOrderForTab(activeTab, sortBy);

    const actionCounts = useMemo(() => {
        const counts: Record<TabId, number> = {
            upcoming: 0,
            pending: 0,
            history: 0,
        };
        if (!userBookings || userBookings.length === 0) return counts;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        userBookings.forEach((booking) => {
            const status = getBookingEffectiveStatus(booking, userCancellations);
            const hikeDate = safeParseDateString(booking.offer?.date);
            const isPast = hikeDate.getTime() < today.getTime();
            const isDead = [
                'cancelled',
                'refund',
                'refunded',
                'finished',
                'expired',
            ].includes(status);

            // History bookings are terminal/archived records — they never increment action counts
            if (isDead || isPast) {
                return;
            }

            let tab: TabId = 'upcoming';
            if ([
                'for-reservation',
                'reservation-rejected',
                'approved-docs',
                'for-payment',
                'for-reschedule',
                'for-cancellation',
                'cancellation-rejected',
                'reschedule-rejected',
            ].includes(status)) {
                tab = 'pending';
            }

            if (isActionNeededStatus(status)) {
                counts[tab] += 1;
            }
        });

        return counts;
    }, [userBookings, userCancellations]);

    const tabs: TabItem[] = useMemo(() => [
        {
            id: 'upcoming',
            label: 'Upcoming',
            badgeCount: actionCounts.upcoming,
            hasActionNeeded: actionCounts.upcoming > 0,
        },
        {
            id: 'pending',
            label: 'Pending',
            badgeCount: actionCounts.pending,
            hasActionNeeded: actionCounts.pending > 0,
        },
        {
            id: 'history',
            label: 'History',
            badgeCount: undefined,
            hasActionNeeded: false,
        },
    ], [actionCounts]);

    const filteredBookings = useMemo(() => {
        if (!userBookings || userBookings.length === 0) return [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let filtered = userBookings.filter((booking) => {
            const status = getBookingEffectiveStatus(booking, userCancellations);
            const hikeDate = safeParseDateString(booking.offer?.date);
            const isPast = hikeDate.getTime() < today.getTime();
            const isDead = [
                'cancelled',
                'refund',
                'refunded',
                'finished',
                'expired',
            ].includes(status);

            if (isDead || isPast) {
                return activeTab === 'history';
            }

            if (activeTab === 'pending') {
                return [
                    'for-reservation',
                    'reservation-rejected',
                    'approved-docs',
                    'for-payment',
                    'for-reschedule',
                    'for-cancellation',
                    'cancellation-rejected',
                    'reschedule-rejected',
                ].includes(status);
            }

            if (activeTab === 'upcoming') {
                return ['paid', 'downpayment', 'rescheduled', 'completed'].includes(status);
            }

            return false;
        });

        if (filterBy === 'action-needed') {
            filtered = filtered.filter(b => isActionNeededStatus(getBookingEffectiveStatus(b, userCancellations)));
        } else if (filterBy === 'waiting') {
            filtered = filtered.filter(b => [
                'for-reservation',
                'for-reschedule',
                'for-cancellation',
            ].includes(getBookingEffectiveStatus(b, userCancellations)));
        } else if (filterBy === 'partial') {
            filtered = filtered.filter(b => getBookingEffectiveStatus(b, userCancellations) === 'downpayment');
        }

        filtered.sort((a, b) => {
            // 1. Smart Action-First: prioritize action-needed bookings in pending and upcoming
            if (activeTab === 'pending' || activeTab === 'upcoming') {
                const aAction = isActionNeededStatus(getBookingEffectiveStatus(a, userCancellations));
                const bAction = isActionNeededStatus(getBookingEffectiveStatus(b, userCancellations));
                if (aAction !== bAction) {
                    return aAction ? -1 : 1;
                }
            }

            // 2. Sort by chosen criterion with respect to sortOrder
            if (sortBy === 'hike-date') {
                const dateA = safeParseDateString(a.offer?.date).getTime();
                const dateB = safeParseDateString(b.offer?.date).getTime();
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            } else if (sortBy === 'booked-date') {
                const timeA = safeParseDateString(a.createdAt).getTime();
                const timeB = safeParseDateString(b.createdAt).getTime();
                return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
            } else if (sortBy === 'last-updated') {
                const timeA = getEffectiveUpdateTime(a, userCancellations);
                const timeB = getEffectiveUpdateTime(b, userCancellations);
                return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
            }
            return 0;
        });

        return filtered;
    }, [userBookings, userCancellations, activeTab, sortBy, sortOrder, filterBy]);

    const handleTabChange = (tabId: TabId) => {
        setActiveTab(tabId);
    };

    const handleSortChange = (newSort: SortBy) => {
        setCustomSortBy(newSort);
    };

    const handleSortOrderChange = (newOrder: SortOrder) => {
        setCustomSortOrder(newOrder);
    };

    const filterSections = useMemo<FilterSection[]>(() => [
        {
            id: 'sortBy',
            title: 'Sort By',
            type: 'radio',
            sortOrderKey: 'sortOrder',
            options: [
                {
                    label: 'Hike Date',
                    value: 'hike-date',
                    defaultSortOrder: activeTab === 'history' ? 'desc' : 'asc',
                },
                {
                    label: 'Date Booked',
                    value: 'booked-date',
                    defaultSortOrder: 'desc',
                },
                {
                    label: 'Recently Updated',
                    value: 'last-updated',
                    defaultSortOrder: 'desc',
                },
            ],
        },
        {
            id: 'filterBy',
            title: 'Filter By Status',
            type: 'pill',
            multiSelect: false,
            options: [
                { label: 'Show All', value: 'all' },
                { label: 'Action Needed', value: 'action-needed' },
                { label: 'Waiting on Provider', value: 'waiting' },
                { label: 'Partially Paid', value: 'partial' },
            ],
        },
    ], [activeTab]);

    return {
        tabs,
        activeTab,
        setActiveTab: handleTabChange,
        filteredBookings,
        filterSections,
        sortBy,
        setSortBy: handleSortChange,
        sortOrder,
        setSortOrder: handleSortOrderChange,
        filterBy,
        setFilterBy,
        actionCounts,
    };
}
