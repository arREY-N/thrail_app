/**
 * @file OfferViewScreen.tsx
 * @description Admin screen displaying detailed information for an offer and its filtered, sortable recent bookings list.
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomFilterTabs from '@/src/components/CustomFilterTabs';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import {
    CustomTutorialModal,
    isTutorialMeasurementActive,
    registerMeasureCallback,
    registerTutorialLayout,
    requestTargetMeasurement,
    TutorialHelpButton,
    useTutorialGuide,
} from '@/src/components/Tutorial/Tutorial';

import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';

import { Booking } from '@/src/core/models/Booking/Booking';
import { Cancellation } from '@/src/core/models/Cancellation/Cancellation';
import { IOffer } from '@/src/core/models/Offer/Offer';
import useBookingFilters, { FILTER_OPTIONS } from '@/src/features/Admin/hooks/useBookingFilters';
import AdminBookingCard from '@/src/features/Admin/screens/Offer/components/AdminBookingCard';
import OfferSummaryCard from '@/src/features/Admin/screens/Offer/components/OfferSummaryCard';

/**
 * Props for the OfferViewScreen component.
 * 
 * @param offerId - The ID of the current offer.
 * @param offer - The offer details data object.
 * @param bookings - Array of all bookings associated with this offer.
 * @param cancellations - Optional array of all cancellations associated with the business.
 * @param onViewBooking - Callback to view booking details page.
 * @param onBackPress - Callback for the back navigation action.
 * @param error - Optional error message text.
 */
export interface OfferViewScreenProps {
    offerId: string;
    offer: IOffer;
    bookings: Booking[];
    cancellations?: Cancellation[];
    onViewBooking: (bookingId: string, offerId: string) => void;
    onBackPress: () => void;
    error?: string;
}

/**
 * OfferViewScreen — Displays an offer's summary and a list of related bookings that can be filtered.
 */
const OfferViewScreen: React.FC<OfferViewScreenProps> = ({ 
    offerId,
    offer, 
    bookings, 
    cancellations = [],
    onViewBooking, 
    onBackPress, 
    error 
}) => {

    const { 
        activeFilter, 
        setActiveFilter, 
        sortOrder, 
        setSortOrder, 
        filteredBookings 
    } = useBookingFilters(bookings, cancellations);

    const tutorial = useTutorialGuide('admin_offer_view', Boolean(offer));
    const scrollViewRef = useRef<ScrollView>(null);
    const summaryRef = useRef<View>(null);
    const filtersRef = useRef<View>(null);
    const firstBookingRef = useRef<View>(null);
    const emptyStateRef = useRef<View>(null);
    const bookingsOffsetY = useRef<number>(240);

    const measureSummaryNow = useCallback(() => {
        summaryRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('admin_view_summary', { x, y, width, height });
            }
        });
    }, []);

    const measureFiltersNow = useCallback(() => {
        filtersRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('admin_view_filters', { x, y, width, height });
            }
        });
    }, []);

    const measureBookingCardNow = useCallback(() => {
        const target = firstBookingRef.current || emptyStateRef.current;
        target?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('admin_view_booking_card', { x, y, width, height });
            }
        });
    }, []);

    useEffect(() => {
        const u1 = registerMeasureCallback('admin_view_summary', measureSummaryNow);
        const u2 = registerMeasureCallback('admin_view_filters', measureFiltersNow);
        const u3 = registerMeasureCallback('admin_view_booking_card', measureBookingCardNow);
        return () => {
            u1();
            u2();
            u3();
        };
    }, [measureSummaryNow, measureFiltersNow, measureBookingCardNow]);

    useEffect(() => {
        if (!tutorial.isVisible) return;
        const step = tutorial.currentStep?.targetSpotlight;
        if (!step) return;
        if (step === 'admin_view_summary' || step === 'header_help') {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        } else if (step === 'admin_view_filters') {
            scrollViewRef.current?.scrollTo({ y: Math.max(0, bookingsOffsetY.current - 80), animated: true });
        } else if (step === 'admin_view_booking_card') {
            scrollViewRef.current?.scrollTo({ y: Math.max(0, bookingsOffsetY.current - 16), animated: true });
            setTimeout(() => {
                requestTargetMeasurement('admin_view_booking_card');
            }, 250);
        }
        requestTargetMeasurement(step);
    }, [tutorial.isVisible, tutorial.currentStep?.targetSpotlight]);

    const cancellationsByBookingId = useMemo(() => {
        const map = new Map<string, Cancellation>();
        (cancellations || []).forEach(c => {
            if (!c.isDeleted && c.bookingId && !map.has(c.bookingId)) {
                map.set(c.bookingId, c);
            }
        });
        return map;
    }, [cancellations]);

    if (!offer) return null;
    
    const offerDate = new Date(offer.date || offer.hikeDate || 0);
    offerDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isOfferExpired = offerDate < today;
    const isOfferLocked = isOfferExpired || (offer.status || '').toLowerCase() === 'cancelled' || (offer.status || '').toLowerCase() === 'rescheduled';

    const trailName = offer.trail?.name || 'Unnamed Trail';

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                title="Offer Details" 
                centerTitle={true} 
                onBackPress={onBackPress}
                rightActions={<TutorialHelpButton onPress={tutorial.onReplayTour} hasGuide={tutorial.hasGuide} />} 
            />
            
            <ScrollView 
                showsVerticalScrollIndicator={false} 
                ref={scrollViewRef}
                contentContainerStyle={styles.scrollContent}
            >
                <View
                    style={styles.constrainer}
                >
                    
                    <View
                        ref={summaryRef}
                        collapsable={false}
                        style={styles.summaryCardWrapper}
                        onLayout={() => {
                            if (isTutorialMeasurementActive()) measureSummaryNow();
                        }}
                    >
                        <OfferSummaryCard 
                        offer={offer} 
                        trailName={trailName} 
                        bookings={bookings}
                        isOfferLocked={isOfferLocked}
                        style={styles.noMarginBottom}
                    />
                    </View>

                    <View
                        ref={filtersRef}
                        collapsable={false}
                        onLayout={(e) => {
                            bookingsOffsetY.current = e.nativeEvent.layout.y;
                            if (isTutorialMeasurementActive()) measureFiltersNow();
                        }}
                    >
                        <View style={styles.sectionHeaderRow}>
                        <CustomText variant="h3" style={styles.sectionTitle}>
                            Recent Bookings <CustomText style={styles.sectionTitleCounter}>({filteredBookings.length})</CustomText>
                        </CustomText>
                        
                        <TouchableOpacity 
                            style={styles.sortButton}
                            onPress={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                            activeOpacity={0.7}
                        >
                            <CustomText style={styles.sortButtonText}>
                                Date
                            </CustomText>
                            <CustomIcon 
                                library="Feather" 
                                name={sortOrder === 'desc' ? "arrow-down" : "arrow-up"} 
                                size={14} 
                                color={Colors.PRIMARY} 
                                style={styles.sortIcon}
                            />
                        </TouchableOpacity>
                    </View>

                    {bookings && bookings.length > 0 && (
                        <CustomFilterTabs
                            tabs={FILTER_OPTIONS}
                            activeTab={activeFilter}
                            onTabSelect={setActiveFilter}
                            variant="pill"
                            containerStyle={styles.filterScrollWrapper}
                        />
                    )}
                    </View>

                    {error && (
                        <CustomText style={styles.errorText}>
                            {error}
                        </CustomText>
                    )}

                    {filteredBookings && filteredBookings.length > 0 ? (
                        filteredBookings.map((b: Booking, index: number) => {
                            const cancellation = cancellationsByBookingId.get(b.id);
                            return (
                                <View
                                    key={b.id}
                                    ref={index === 0 ? firstBookingRef : undefined}
                                    collapsable={false}
                                    style={styles.bookingCardWrapper}
                                    onLayout={index === 0 ? () => {
                                        if (isTutorialMeasurementActive()) measureBookingCardNow();
                                    } : undefined}
                                >
                                    <AdminBookingCard 
                                        key={b.id} 
                                        booking={b} 
                                        offerId={offerId} 
                                        cancellation={cancellation}
                                        onViewBooking={onViewBooking} 
                                        isOfferLocked={isOfferLocked}
                                        style={styles.noMarginBottom}
                                    />
                                </View>
                            );
                        })) : (
                        <View
                            ref={emptyStateRef}
                            collapsable={false}
                            onLayout={() => {
                                if (isTutorialMeasurementActive()) measureBookingCardNow();
                            }}
                            style={styles.emptyState}
                        >
                            <CustomIcon 
                                library="Feather" 
                                name="inbox" 
                                size={40} 
                                color={Colors.GRAY_MEDIUM} 
                            />
                            <CustomText variant="caption" style={styles.emptyText}>
                                {bookings?.length > 0 
                                    ? `No bookings matched "${activeFilter}"` 
                                    : "No bookings found."
                                }
                            </CustomText>
                        </View>
                    )}
                </View>
            </ScrollView>

            <CustomTutorialModal
                visible={tutorial.isVisible}
                tourConfig={tutorial.tourConfig}
                currentStep={tutorial.currentStep}
                currentStepIndex={tutorial.currentStepIndex}
                totalSteps={tutorial.totalSteps}
                onNext={tutorial.onNextStep}
                onPrev={tutorial.onPrevStep}
                onSkip={tutorial.onSkipTour}
            />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: { 
        padding: 16, 
        paddingBottom: 40 
    },
    constrainer: { 
        width: '100%', 
        maxWidth: Layout.MAX_WIDTH, 
        alignSelf: 'center' 
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: { 
        fontWeight: 'bold', 
        marginLeft: 4,
        marginBottom: 0,
    },
    sectionTitleCounter: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 20,
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
        marginRight: 4,
    },
    sortButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
    },
    filterScrollWrapper: {
        position: 'relative',
        width: '100%',
        marginBottom: 16,
    },
    filterScroll: Platform.select({
        web: { 
            overflowX: 'auto', 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none' 
        },
        default: {}
    }),
    leftFade: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 30,
        zIndex: 10,
    },
    rightFade: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 30,
        zIndex: 10,
    },
    filterContainer: { 
        gap: 10, 
        flexDirection: 'row', 
        alignItems: 'center' 
    },
    sortIcon: {
        marginTop: 1,
    },
    filterChip: { 
        paddingHorizontal: 16, 
        paddingVertical: 8, 
        borderRadius: 20, 
        backgroundColor: Colors.BACKGROUND, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT 
    },
    filterChipActive: { 
        backgroundColor: Colors.PRIMARY, 
        borderColor: Colors.PRIMARY 
    },
    filterChipText: { 
        fontSize: 12, 
        fontWeight: '600', 
        color: Colors.TEXT_SECONDARY 
    },
    filterChipTextActive: { 
        color: Colors.WHITE 
    },
    errorText: { 
        color: Colors.ERROR, 
        marginBottom: 16, 
        marginLeft: 4 
    },
    emptyState: { 
        padding: 40, 
        alignItems: 'center', 
        backgroundColor: Colors.WHITE, 
        borderRadius: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT 
    },
    summaryCardWrapper: {
        marginBottom: 24,
    },
    bookingCardWrapper: {
        marginBottom: 12,
    },
    noMarginBottom: {
        marginBottom: 0,
    },
    emptyText: { 
        marginTop: 8, 
        color: Colors.TEXT_SECONDARY 
    }
});

export default OfferViewScreen;
