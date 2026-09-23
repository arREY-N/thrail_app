/**
 * @file OffersScreen.tsx
 * @description Screen component for exploring and selecting hiking offers by calendar date and guide package,
 * with dynamic offer counters, interactive booked states, multi-day overlap conflict blocking, consecutive hike confirmation modals, and CustomToast feedback.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomIcon from '@/src/components/CustomIcon';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import CustomToast from '@/src/components/CustomToast';
import ErrorMessage from '@/src/components/ErrorMessage';
import OfferCalendar from '@/src/features/Book/components/OfferCalendar';
import OfferCard from '@/src/features/Book/components/OfferCard';

import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { Booking, BookingLogic } from '@/src/core/models/Booking/Booking';
import { Offer } from '@/src/core/models/Offer/Offer';
import { formatDateToStandard, safeParseDateString } from '@/src/utils/dateFormatter';

/**
 * Props for the OffersScreen component.
 * @param offers - Available offers for the trail
 * @param selectedOfferId - Currently selected offer ID
 * @param bookedOfferIds - List of offer IDs the user already has an active reservation for
 * @param userBookings - Active bookings of the user across all trails
 * @param conflictOfferIds - List of offer IDs that have date conflicts with user's bookings
 * @param consecutiveOfferIds - List of offer IDs that are back-to-back/consecutive with user's bookings
 * @param error - Error message if offer loading or booking flow failed
 * @param onContinue - Callback when hiker confirms an offer selection
 */
export interface OffersScreenProps {
    offers?: Offer[];
    selectedOfferId?: string | null;
    bookedOfferIds?: string[];
    userBookings?: Booking[];
    conflictOfferIds?: string[];
    consecutiveOfferIds?: string[];
    error?: string | null;
    onContinue: (offerId: string | null) => void;
    onViewBookingDetails?: (bookingId?: string) => void;
}

const ADVANCE_BOOKING_CUTOFF_DAYS = 7;

interface OfferDateSpan {
    startDate: Date;
    endDate: Date;
    durationDays: number;
}

/**
 * Calculates start, end, and duration date span for an offer (supporting multi-day expeditions dynamically).
 * @param offer - Target offer object
 * @returns {OfferDateSpan} Calculated start date, end date, and total duration in days
 */
const getOfferDateSpan = (offer: Offer): OfferDateSpan => {
    const startDate = safeParseDateString(offer.date);
    startDate.setHours(0, 0, 0, 0);

    let durationDays = 1;
    if (offer.endDate) {
        const parsedEndDate = safeParseDateString(offer.endDate);
        parsedEndDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((parsedEndDate.getTime() - startDate.getTime()) / 86400000) + 1;
        if (diffDays > 0) {
            durationDays = diffDays;
        }
    } else if (Array.isArray(offer.schedule) && offer.schedule.length > 0) {
        durationDays = offer.schedule.length;
    } else if (typeof offer.duration === 'string') {
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
 * Resolves the optimal default date to display when opening the booking offers view:
 * 1. If an offer was explicitly pre-selected, use that offer's date.
 * 2. If the trail has upcoming offers, pick the one closest to today (preferring bookable offers >= 7 days ahead).
 * 3. Fallback: Today's date if no offers exist for this trail.
 * 
 * @param offersList - List of available trail offers
 * @param preferredOfferId - Optional pre-selected offer ID
 * @returns {string} Formatted standard date string
 */
const resolveBestOfferDate = (offersList: Offer[], preferredOfferId?: string | null): string => {
    if (preferredOfferId) {
        const matched = offersList.find((o) => o.id === preferredOfferId);
        if (matched?.date) {
            return formatDateToStandard(matched.date);
        }
    }

    const nowMidnight = new Date();
    nowMidnight.setHours(0, 0, 0, 0);

    const minCutoffDate = new Date(nowMidnight.getTime());
    minCutoffDate.setDate(minCutoffDate.getDate() + ADVANCE_BOOKING_CUTOFF_DAYS);

    // 1. Prefer first upcoming bookable offer (>= 7 days notice), sorted closest to today
    const upcomingBookableOffers = offersList
        .map((o) => ({ dateStr: formatDateToStandard(o.date), dateObj: safeParseDateString(o.date) }))
        .filter((item) => {
            const itemMidnight = new Date(item.dateObj);
            itemMidnight.setHours(0, 0, 0, 0);
            return itemMidnight >= minCutoffDate && Boolean(item.dateStr);
        })
        .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    if (upcomingBookableOffers.length > 0 && upcomingBookableOffers[0].dateStr) {
        return upcomingBookableOffers[0].dateStr;
    }

    // 2. Next prefer any upcoming offer (even within 7-day cutoff), sorted closest to today
    const upcomingAnyOffers = offersList
        .map((o) => ({ dateStr: formatDateToStandard(o.date), dateObj: safeParseDateString(o.date) }))
        .filter((item) => {
            const itemMidnight = new Date(item.dateObj);
            itemMidnight.setHours(0, 0, 0, 0);
            return itemMidnight >= nowMidnight && Boolean(item.dateStr);
        })
        .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    if (upcomingAnyOffers.length > 0 && upcomingAnyOffers[0].dateStr) {
        return upcomingAnyOffers[0].dateStr;
    }

    // 3. Fallback to today's date if no offers exist
    return formatDateToStandard(nowMidnight);
};

/**
 * OffersScreen — Allows hikers to filter and pick available hike offers by date,
 * viewing package details, schedules, and pricing while handling multi-day overlaps and consecutive hike notices.
 *
 * @param {OffersScreenProps} props - Component props
 * @returns {React.JSX.Element} The rendered component
 */
const OffersScreen = ({ 
    offers = [], 
    selectedOfferId, 
    bookedOfferIds = [],
    userBookings = [],
    conflictOfferIds = [],
    consecutiveOfferIds = [],
    error,
    onContinue,
    onViewBookingDetails,
}: OffersScreenProps): React.JSX.Element => {
    const safeOffers = useMemo(() => (Array.isArray(offers) ? offers : []), [offers]);
    const safeBookings = useMemo(() => (
        Array.isArray(userBookings) 
            ? userBookings.filter((b) => !BookingLogic.isInactiveStatus(b.status)) 
            : []
    ), [userBookings]);

    const [currentDate] = useState(() => new Date());

    const todayMidnight = useMemo(() => {
        const d = new Date(currentDate);
        d.setHours(0, 0, 0, 0);
        return d;
    }, [currentDate]);

    const minBookingDate = useMemo(() => {
        const d = new Date(todayMidnight.getTime());
        d.setDate(d.getDate() + ADVANCE_BOOKING_CUTOFF_DAYS);
        return d;
    }, [todayMidnight]);

    const todayFormatted = useMemo(() => formatDateToStandard(currentDate), [currentDate]);

    const uniqueDates = useMemo(() => {
        const dates = safeOffers
            .map((offer) => formatDateToStandard(offer?.date))
            .filter(Boolean) as string[];
        return [...new Set(dates)];
    }, [safeOffers]);

    // Live booked offer IDs from props or derived from active user bookings
    const effectiveBookedOfferIds = useMemo(() => {
        if (bookedOfferIds && bookedOfferIds.length > 0) {
            return bookedOfferIds;
        }
        return safeBookings.map((b) => b.offer?.id).filter(Boolean) as string[];
    }, [bookedOfferIds, safeBookings]);

    // Compute booked offers with their respective date spans from live data
    const bookedOfferSpans = useMemo(() => {
        const knownSpans = safeOffers
            .filter((o) => effectiveBookedOfferIds.includes(o.id))
            .map((o) => {
                const span = getOfferDateSpan(o);
                const startStr = formatDateToStandard(o.date);
                const endStr = formatDateToStandard(span.endDate);
                const formattedSpan = span.durationDays > 1 && startStr !== endStr
                    ? `${startStr} – ${endStr}`
                    : startStr;
                return {
                    id: o.id,
                    span,
                    formattedSpan,
                };
            });

        const knownIds = new Set(knownSpans.map((s) => s.id));
        safeBookings.forEach((b) => {
            if (b.offer?.id && !knownIds.has(b.offer.id) && b.offer.date) {
                const startDate = safeParseDateString(b.offer.date);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(startDate.getTime());
                endDate.setHours(23, 59, 59, 999);
                const startStr = formatDateToStandard(startDate);
                knownSpans.push({
                    id: b.offer.id,
                    span: { startDate, endDate, durationDays: 1 },
                    formattedSpan: startStr,
                });
            }
        });

        return knownSpans;
    }, [safeOffers, effectiveBookedOfferIds, safeBookings]);

    const [userHasManuallySelectedDate, setUserHasManuallySelectedDate] = useState(false);

    const [selectedDate, setSelectedDate] = useState<string>(() => 
        resolveBestOfferDate(safeOffers, selectedOfferId)
    );

    // Adjust selectedDate during render if safeOffers array updates and current selection has 0 offers
    const [prevSafeOffers, setPrevSafeOffers] = useState(safeOffers);
    if (safeOffers !== prevSafeOffers) {
        setPrevSafeOffers(safeOffers);
        if (safeOffers.length > 0 && !userHasManuallySelectedDate) {
            const currentHasOffers = safeOffers.some(
                (o) => formatDateToStandard(o?.date) === selectedDate
            );
            if (!currentHasOffers) {
                const bestDate = resolveBestOfferDate(safeOffers, selectedOfferId);
                setSelectedDate(bestDate);
            }
        }
    }

    const [localSelectedId, setLocalSelectedId] = useState<string | null>(selectedOfferId || null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Consecutive / back-to-back hike confirmation modal state
    const [isConsecutiveModalOpen, setIsConsecutiveModalOpen] = useState(false);
    const [consecutiveNoticeDetails, setConsecutiveNoticeDetails] = useState<{
        existingDate: string;
        newDate: string;
        targetOfferId: string;
    } | null>(null);

    const [prevSelectedOfferId, setPrevSelectedOfferId] = useState(selectedOfferId);
    if (selectedOfferId !== prevSelectedOfferId) {
        setPrevSelectedOfferId(selectedOfferId);
        if (selectedOfferId) {
            setLocalSelectedId(selectedOfferId);
            const preSelectedOffer = safeOffers.find((o) => o.id === selectedOfferId);
            if (preSelectedOffer && preSelectedOffer.date) {
                setSelectedDate(formatDateToStandard(preSelectedOffer.date));
                setUserHasManuallySelectedDate(true);
            }
        } else {
            setLocalSelectedId(null);
        }
    }

    const filteredOffers = useMemo(() => {
        if (!selectedDate) return [];
        return safeOffers.filter((offer) => formatDateToStandard(offer?.date) === selectedDate);
    }, [safeOffers, selectedDate]);

    // Detailed status evaluation for any offer
    const getOfferStatus = useCallback((candidate: Offer) => {
        const isExactBooked = effectiveBookedOfferIds.includes(candidate.id);
        const candidateSpan = getOfferDateSpan(candidate);
        const isToday = formatDateToStandard(candidate.date) === todayFormatted;
        const isPastDate = candidateSpan.startDate < todayMidnight;
        const isWithinAdvanceCutoff = candidateSpan.startDate >= todayMidnight && candidateSpan.startDate < minBookingDate;
        const isClosed = isPastDate || isWithinAdvanceCutoff;

        // Check for date-span overlap against any booked offer
        const overlappingBooking = bookedOfferSpans.find((b) => 
            b.id !== candidate.id &&
            candidateSpan.startDate.getTime() <= b.span.endDate.getTime() &&
            candidateSpan.endDate.getTime() >= b.span.startDate.getTime()
        );

        const isDateConflict = !isExactBooked && (
            conflictOfferIds.includes(candidate.id) || 
            !!overlappingBooking
        );

        // Check if consecutive (starts within 1–2 days of an active booked hike, with no overlap)
        let isConsecutive = false;
        let consecutiveSourceBooking: (typeof bookedOfferSpans)[number] | null = null;

        if (!isExactBooked && !isDateConflict && !isClosed) {
            if (consecutiveOfferIds.includes(candidate.id)) {
                isConsecutive = true;
            } else {
                const closeBooking = bookedOfferSpans.find((b) => {
                    const diffAfter = (candidateSpan.startDate.getTime() - b.span.endDate.getTime()) / 86400000;
                    const diffBefore = (b.span.startDate.getTime() - candidateSpan.endDate.getTime()) / 86400000;
                    return (diffAfter > 0 && diffAfter <= 2.5) || (diffBefore > 0 && diffBefore <= 2.5);
                });
                if (closeBooking) {
                    isConsecutive = true;
                    consecutiveSourceBooking = closeBooking;
                }
            }
        }

        return {
            isExactBooked,
            isDateConflict,
            isClosed,
            isToday,
            isWithinAdvanceCutoff,
            isConsecutive,
            overlappingBooking,
            consecutiveSourceBooking,
            candidateSpan
        };
    }, [effectiveBookedOfferIds, todayFormatted, todayMidnight, minBookingDate, bookedOfferSpans, conflictOfferIds, consecutiveOfferIds]);

    const [hasAttemptedBlockedSubmit, setHasAttemptedBlockedSubmit] = useState(false);

    const handleDateSelect = (date: string) => {
        setUserHasManuallySelectedDate(true);
        setSelectedDate(date);
        setLocalSelectedId(null);
        setHasAttemptedBlockedSubmit(false);
        setToastMessage(null);
    };

    const handleOfferSelect = (offerId: string) => {
        setLocalSelectedId(localSelectedId === offerId ? null : offerId);
        setHasAttemptedBlockedSubmit(false);
        setToastMessage(null);
    };

    const handleHideToast = useCallback(() => {
        setHasAttemptedBlockedSubmit(false);
        setToastMessage(null);
    }, []);

    // Evaluate selected offer status
    const selectedOffer = useMemo(() => {
        if (!localSelectedId) return null;
        return safeOffers.find((o) => o.id === localSelectedId) || null;
    }, [localSelectedId, safeOffers]);

    const selectedOfferStatus = useMemo(() => {
        if (!selectedOffer) return null;
        return getOfferStatus(selectedOffer);
    }, [selectedOffer, getOfferStatus]);

    const isSelectedOfferBlocked = selectedOfferStatus?.isExactBooked || selectedOfferStatus?.isDateConflict || selectedOfferStatus?.isClosed;

    const existingBookedBooking = useMemo(() => {
        if (!selectedOfferStatus?.isExactBooked || !localSelectedId) return null;
        return safeBookings.find((b) => b.offer?.id === localSelectedId) || null;
    }, [selectedOfferStatus?.isExactBooked, localSelectedId, safeBookings]);

    const handleContinue = () => {
        if (!localSelectedId) {
            setToastMessage("Please select an offer to continue.");
            return;
        }

        if (!selectedOfferStatus || !selectedOffer) return;

        if (selectedOfferStatus.isExactBooked) {
            if (onViewBookingDetails) {
                onViewBookingDetails(existingBookedBooking?.id || undefined);
                return;
            }
            setHasAttemptedBlockedSubmit(true);
            setToastMessage("You already have an active reservation for this package.");
            return;
        }

        if (selectedOfferStatus.isDateConflict) {
            setHasAttemptedBlockedSubmit(true);
            const overlapSpan = selectedOfferStatus.overlappingBooking?.formattedSpan || "this date";
            setToastMessage(`You already have an active reservation overlapping this date (${overlapSpan}).`);
            return;
        }

        if (selectedOfferStatus.isWithinAdvanceCutoff) {
            setHasAttemptedBlockedSubmit(true);
            if (selectedOfferStatus.isToday) {
                setToastMessage("Reservations for today are closed. Please choose an upcoming date at least 1 week ahead.");
            } else {
                setToastMessage("Reservations require at least 1 week advance notice. Please select an offer at least 7 days ahead.");
            }
            return;
        }

        if (selectedOfferStatus.isClosed) {
            setHasAttemptedBlockedSubmit(true);
            setToastMessage("This date is closed for reservations. Please choose an upcoming date at least 1 week ahead.");
            return;
        }

        // Check if consecutive notice modal is required
        if (selectedOfferStatus.isConsecutive) {
            const existingDate = selectedOfferStatus.consecutiveSourceBooking?.formattedSpan || "an existing reservation";
            const newDate = formatDateToStandard(selectedOffer.date);
            setConsecutiveNoticeDetails({
                existingDate,
                newDate,
                targetOfferId: localSelectedId
            });
            setIsConsecutiveModalOpen(true);
            return;
        }

        onContinue(localSelectedId);
    };

    const handleConfirmConsecutive = () => {
        setIsConsecutiveModalOpen(false);
        if (consecutiveNoticeDetails?.targetOfferId) {
            onContinue(consecutiveNoticeDetails.targetOfferId);
        }
    };

    // Compute footer button label
    const getFooterButtonTitle = () => {
        if (!localSelectedId) return "Select an Offer";
        if (selectedOfferStatus?.isExactBooked) {
            return onViewBookingDetails ? "View My Reservation" : "Already Booked";
        }
        if (selectedOfferStatus?.isDateConflict) return "Date Already Reserved";
        if (selectedOfferStatus?.isWithinAdvanceCutoff) {
            return selectedOfferStatus.isToday ? "Booking Closed for Today" : "Advance Notice Required (1 Week)";
        }
        if (selectedOfferStatus?.isClosed) return "Booking Closed";
        return "Continue";
    };

    // Compute footer button styling synced with DetailsScreen
    const getFooterButtonStyle = () => {
        if (!localSelectedId) {
            return styles.idleFooterButton;
        }
        if (selectedOfferStatus?.isExactBooked && onViewBookingDetails) {
            return styles.activeFooterButton;
        }
        if (isSelectedOfferBlocked) {
            if (hasAttemptedBlockedSubmit || !!toastMessage) {
                return styles.errorFooterButton;
            }
            return styles.blockedFooterButton;
        }
        return styles.activeFooterButton;
    };

    const getFooterButtonTextStyle = () => {
        if (!localSelectedId) {
            return styles.idleFooterButtonText;
        }
        if (selectedOfferStatus?.isExactBooked && onViewBookingDetails) {
            return styles.activeFooterButtonText;
        }
        if (isSelectedOfferBlocked) {
            if (hasAttemptedBlockedSubmit || !!toastMessage) {
                return styles.errorFooterButtonText;
            }
            return styles.blockedFooterButtonText;
        }
        return styles.activeFooterButtonText;
    };

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.constrainer}>
                    {error && (
                        <ErrorMessage error={error} />
                    )}

                    <View style={styles.calendarContainer}>
                        <CustomText variant="h2" style={[styles.sectionTitle, styles.calendarSectionTitle]}>
                            Select Date
                        </CustomText>
                        <OfferCalendar
                            uniqueDates={uniqueDates}
                            selectedDate={selectedDate}
                            onSelectDate={handleDateSelect}
                        />
                    </View>

                    <View style={styles.offersContainer}>
                        <View style={styles.sectionHeaderRow}>
                            <CustomText variant="h2" style={styles.sectionTitle}>
                                Available Offers <CustomText style={styles.sectionTitleCounter}>({filteredOffers.length})</CustomText>
                            </CustomText>
                        </View>

                        {filteredOffers.length > 0 ? (
                            filteredOffers.map((offer) => {
                                const status = getOfferStatus(offer);

                                return (
                                    <OfferCard
                                        key={offer.id}
                                        offer={offer}
                                        isSelected={localSelectedId === offer.id}
                                        isBooked={status.isExactBooked}
                                        isDateConflict={status.isDateConflict}
                                        isClosed={status.isClosed}
                                        isWithinAdvanceCutoff={status.isWithinAdvanceCutoff}
                                        isToday={status.isToday}
                                        onSelect={() => handleOfferSelect(offer.id)}
                                    />
                                );
                            })
                        ) : (
                            <View style={styles.emptyState}>
                                <CustomIcon 
                                    library="Feather" 
                                    name="calendar" 
                                    size={32} 
                                    color={Colors.GRAY_LIGHT} 
                                    style={styles.emptyIcon}
                                />
                                <CustomText variant="caption" style={styles.emptyCaption}>
                                    No offers available for this date.
                                </CustomText>
                            </View>
                        )}
                    </View>

                </View>
            </ScrollView>

            <CustomStickyFooter
                primaryButton={{
                    title: getFooterButtonTitle(),
                    onPress: handleContinue,
                    style: getFooterButtonStyle(),
                    textStyle: getFooterButtonTextStyle(),
                }}
            />

            {/* Consecutive / Back-to-Back Hike Notice Confirmation Modal */}
            <ConfirmationModal
                visible={isConsecutiveModalOpen}
                onClose={() => setIsConsecutiveModalOpen(false)}
                onConfirm={handleConfirmConsecutive}
                title="Consecutive Hike Notice"
                message={`You already have an active reservation on ${consecutiveNoticeDetails?.existingDate}. This hike starts on ${consecutiveNoticeDetails?.newDate}. Are you sure you want to schedule back-to-back mountain hikes?`}
                confirmText="Yes, Continue"
                cancelText="Review Dates"
                iconName="calendar"
                iconLibrary="Feather"
            />

            {/* Status Toast Notification */}
            <CustomToast 
                visible={!!toastMessage}
                message={toastMessage || ''}
                onHide={handleHideToast}
                type="error"
                mode="dismissible"
                position="sticky_footer"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: Colors.BACKGROUND, 
        paddingTop: 16 
    },
    scrollContent: { 
        paddingBottom: 100 
    },

    constrainer: {
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },

    calendarContainer: {
        width: '100%',
        marginBottom: 20,
    },
    calendarSectionTitle: {
        marginBottom: 12,
    },

    offersContainer: {
        width: '100%',
        gap: 16,
    },

    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    sectionTitle: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
        fontSize: 20,
        marginBottom: 0,
    },

    sectionTitleCounter: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 18,
    },

    emptyState: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    emptyIcon: {
        marginBottom: 12,
    },
    emptyCaption: {
        color: Colors.TEXT_SECONDARY,
    },

    idleFooterButton: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderColor: Colors.GRAY_LIGHT,
        borderWidth: 1.5,
    },
    idleFooterButtonText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: 'bold',
    },

    blockedFooterButton: {
        backgroundColor: Colors.BUTTON_DISABLED_BG,
        borderColor: Colors.GRAY_LIGHT,
        borderWidth: 1.5,
    },
    blockedFooterButtonText: {
        color: Colors.BUTTON_DISABLED_TEXT,
        fontWeight: 'bold',
    },

    errorFooterButton: {
        backgroundColor: Colors.STATUS_CANCELLED_BG,
        borderColor: Colors.STATUS_CANCELLED_TEXT,
        borderWidth: 1.5,
    },
    errorFooterButtonText: {
        color: Colors.STATUS_CANCELLED_TEXT,
        fontWeight: 'bold',
    },

    activeFooterButton: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
        borderWidth: 1.5,
    },
    activeFooterButtonText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
    },
});

export default OffersScreen;