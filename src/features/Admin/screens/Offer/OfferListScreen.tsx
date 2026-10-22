/**
 * @file OfferListScreen.tsx
 * @description Admin screen displaying a list of created offers and basic booking stats, including search, filter, and sorting features.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomFilterModal from '@/src/components/CustomFilterModal';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ErrorMessage from '@/src/components/ErrorMessage';
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
import { Offer } from '@/src/core/models/Offer/Offer';
import { DateInput, safeParseDateString } from '@/src/utils/dateFormatter';

import useOfferFilters, { FILTER_OPTIONS } from '@/src/features/Admin/hooks/useOfferFilters';
import OfferCard from '@/src/features/Admin/screens/Offer/components/OfferCard';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

/**
 * Props for the OfferListScreen component.
 * 
 * @param offers - List of created offers to display.
 * @param bookingByOffer - Map of bookings indexed by offer ID to display reserved/booking counts.
 * @param cancellations - Optional list of business cancellations to calculate pending cancellation badges.
 * @param isLoading - Boolean representing loading state.
 * @param error - Optional error message text.
 * @param onAddOffer - Callback to navigate to the Add Offer screen.
 * @param onEditOffer - Callback to navigate to the Edit Offer screen.
 * @param onViewOfferBookings - Callback to open the booking details sheet for the selected offer.
 * @param onBackPress - Callback for the back navigation action.
 */
export interface OfferListScreenProps {
    offers: Offer[];
    bookingByOffer: Record<string, Booking[]>;
    cancellations?: Cancellation[];
    isLoading: boolean;
    error: string | null;
    onAddOffer: () => void;
    onEditOffer: (offerId: string) => void;
    onViewOfferBookings: (offerId: string) => void;
    onBackPress: () => void;
}

const EMPTY_BOOKINGS: Booking[] = [];

const STATUS_DETAILS = {
    cancelled: { 
        label: 'Cancelled', 
        color: Colors.ERROR, 
        bg: Colors.ERROR_BG 
    },
    rescheduled: { 
        label: 'Rescheduled', 
        color: Colors.WARNING, 
        bg: Colors.STATUS_WARNING_BG 
    },
    expired: { 
        label: 'Expired', 
        color: Colors.TEXT_SECONDARY, 
        bg: Colors.GRAY_ULTRALIGHT 
    },
    active: { 
        label: 'Active', 
        color: Colors.SUCCESS, 
        bg: Colors.STATUS_APPROVED_BG 
    }
} as const;

/**
 * OfferListScreen — Admin screen displaying a list of created offers and basic booking stats.
 */
const OfferListScreen: React.FC<OfferListScreenProps> = ({ 
    offers,
    bookingByOffer, 
    cancellations = [],
    isLoading, 
    error,
    onAddOffer, 
    onEditOffer,
    onViewOfferBookings,
    onBackPress 
}) => {
    
    const { 
        searchQuery, 
        setSearchQuery, 
        activeFilter, 
        setActiveFilter, 
        sortBy,
        setSortBy,
        filterTrailNames,
        setFilterTrailNames,
        uniqueTrailNames,
        filteredAndSortedOffers 
    } = useOfferFilters(offers);

    const tutorial = useTutorialGuide('admin_offer_list', !isLoading);
    
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedEditId, setSelectedEditId] = useState<string | null>(null);
    const [showFilterModal, setShowFilterModal] = useState(false);

    const { width } = useBreakpoints();
    const gap = 16;
    const padding = 16;
    const maxConstrainedWidth = Layout.MAX_WIDTH;
    const containerWidth = Math.min(width, maxConstrainedWidth) - (padding * 2);

    let numColumns = 1;
    if (containerWidth >= 1200) numColumns = 3;
    else if (containerWidth >= 768) numColumns = 2;

    const cardWidth = (containerWidth - gap * (numColumns - 1)) / numColumns;
    const scrollViewRef = useRef<ScrollView>(null);
    const addBtnRef = useRef<View>(null);
    const searchFiltersRef = useRef<View>(null);
    const firstOfferRef = useRef<View>(null);

    const measureAddBtnNow = useCallback(() => {
        addBtnRef.current?.measureInWindow((x, y, w, h) => {
            if (w > 0 && h > 0) {
                registerTutorialLayout('admin_offer_add_btn', { x, y, width: w, height: h });
            }
        });
    }, []);

    const measureFiltersNow = useCallback(() => {
        searchFiltersRef.current?.measureInWindow((x, y, w, h) => {
            if (w > 0 && h > 0) {
                registerTutorialLayout('admin_offer_filters', { x, y, width: w, height: h });
            }
        });
    }, []);

    const measureFirstOfferNow = useCallback(() => {
        firstOfferRef.current?.measureInWindow((x, y, w, h) => {
            if (w > 0 && h > 0) {
                registerTutorialLayout('admin_offer_card', { x, y, width: w, height: h });
            }
        });
    }, []);

    useEffect(() => {
        const u1 = registerMeasureCallback('admin_offer_add_btn', measureAddBtnNow);
        const u2 = registerMeasureCallback('admin_offer_filters', measureFiltersNow);
        const u3 = registerMeasureCallback('admin_offer_card', measureFirstOfferNow);
        return () => {
            u1();
            u2();
            u3();
        };
    }, [measureAddBtnNow, measureFiltersNow, measureFirstOfferNow]);

    useEffect(() => {
        if (!tutorial.isVisible) return;
        const stepTarget = tutorial.currentStep?.targetSpotlight;
        if (stepTarget) {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            requestTargetMeasurement(stepTarget);
        }
    }, [tutorial.isVisible, tutorial.currentStep?.targetSpotlight]);

    const handleTabSelect = (tab: string) => {
        setActiveFilter(tab);
        // Scroll instantly before React finishes the render cycle to prevent jumps
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    };

    const handleEditPress = useCallback((offerId: string) => {
        setSelectedEditId(offerId);
        setShowEditModal(true);
    }, []);

    const confirmEdit = () => {
        setShowEditModal(false);
        if (selectedEditId) {
            onEditOffer(selectedEditId);
        }
    };

    const HeaderAddAction = (
        <TouchableOpacity 
            ref={addBtnRef}
            onLayout={() => {
                if (isTutorialMeasurementActive()) measureAddBtnNow();
            }}
            style={styles.headerAddButton}
            onPress={onAddOffer}
            activeOpacity={0.7}
        >
            <CustomIcon 
                library="Feather" 
                name="plus" 
                size={16} 
                color={Colors.WHITE} 
            />
            <CustomText style={styles.headerAddText}>
                New
            </CustomText>
        </TouchableOpacity>
    );

    const getOfferStatusDetails = useCallback((offer: Offer) => {
        const status = (offer.status || '').toString().toLowerCase();
        const offerDate = safeParseDateString((offer.date || offer.hikeDate) as DateInput);
        offerDate.setHours(0, 0, 0, 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (status === 'cancelled') return STATUS_DETAILS.cancelled;
        if (status === 'rescheduled') return STATUS_DETAILS.rescheduled;
        if (offerDate < today) return STATUS_DETAILS.expired;
        return STATUS_DETAILS.active;
    }, []);

    const actionableCountsByOffer = useMemo(() => {
        const counts: Record<string, number> = {};

        // 1. Group cancellations by offerId
        const cancellationsByOffer = new Map<string, Cancellation[]>();
        (cancellations || []).forEach(c => {
            if (!cancellationsByOffer.has(c.offerId)) {
                cancellationsByOffer.set(c.offerId, []);
            }
            cancellationsByOffer.get(c.offerId)!.push(c);
        });

        // 2. Compute actionable count for each offer in a single pass
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
                // If cancellation is approved or booking is cancelled, it is resolved and not actionable for admin
                if (cancellation?.status === 'approved' || b.status === 'cancelled') {
                    return;
                }
                // If cancellation was initiated by admin, admin is waiting on hiker action
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

            // Also count pending cancellation requests submitted by hikers
            offerCancellations.forEach(c => {
                if (c.status === 'pending' && c.cancelledBy !== 'admin') {
                    actionableBookingIds.add(c.bookingId);
                }
            });

            counts[offer.id] = actionableBookingIds.size;
        });

        return counts;
    }, [offers, bookingByOffer, cancellations]);

    const filterSections = [
        {
            id: 'sortBy',
            title: 'Sort By',
            type: 'radio' as const,
            options: [
                { label: 'Date: Earliest First', value: 'date-asc' },
                { label: 'Date: Latest First', value: 'date-desc' },
                { label: 'Price: Low to High', value: 'price-asc' },
                { label: 'Price: High to Low', value: 'price-desc' }
            ]
        },
        {
            id: 'filterTrailNames',
            title: 'Filter By Trail',
            type: 'pill' as const,
            multiSelect: true,
            options: uniqueTrailNames.map((name: string) => ({ label: name, value: name }))
        }
    ];

    const handleApplyFilters = (values: Record<string, unknown>) => {
        setSortBy(values.sortBy as string);
        setFilterTrailNames((values.filterTrailNames as string[]) || []);
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <View style={styles.container}>
                <View
                    style={styles.headerWrapper}
                >
                    <CustomHeader 
                        searchContainerRef={searchFiltersRef}
                        title="Manage Offers" 
                        centerTitle={true} 
                        onBackPress={onBackPress}
                        rightActions={
                            <View style={styles.headerRightActions}>
                                <TutorialHelpButton onPress={tutorial.onReplayTour} />
                                {HeaderAddAction}
                            </View>
                        } 
                        hasSearch={true}
                        searchProps={{
                            searchPlaceholder: "Search by trail name...",
                            searchValue: searchQuery,
                            onSearchChange: setSearchQuery,
                            rightIconLibrary: "Feather",
                            rightIconName: "sliders",
                            onRightButtonPress: () => setShowFilterModal(true),
                            tabs: FILTER_OPTIONS,
                            activeTab: activeFilter,
                            onTabSelect: handleTabSelect
                        }}
                    />
                </View>

                <ScrollView 
                    ref={scrollViewRef}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.constrainer}>
                        <ErrorMessage error={error} />

                        {isLoading && (!offers || offers.length === 0) && (
                            <View style={styles.centerContent}>
                                <ActivityIndicator 
                                    size="large" 
                                    color={Colors.PRIMARY} 
                                />
                            </View>
                        )}

                        {!isLoading && (!offers || offers.length === 0) && (
                            <View
                                ref={firstOfferRef}
                                collapsable={false}
                                onLayout={() => {
                                    if (isTutorialMeasurementActive()) measureFirstOfferNow();
                                }}
                                style={styles.emptyState}
                            >
                                <CustomIcon 
                                    library="Feather" 
                                    name="inbox" 
                                    size={48} 
                                    color={Colors.GRAY_MEDIUM} 
                                />
                                <CustomText variant="h3" style={styles.emptyTitle}>
                                    No Offers Yet
                                </CustomText>
                                <CustomText variant="body" style={styles.emptySubtitle}>
                                    Create your first hiking package to start receiving bookings.
                                </CustomText>
                            </View>
                        )}

                        {offers?.length > 0 && filteredAndSortedOffers.length === 0 && (
                            <View
                                ref={firstOfferRef}
                                collapsable={false}
                                onLayout={() => {
                                    if (isTutorialMeasurementActive()) measureFirstOfferNow();
                                }}
                                style={styles.emptyState}
                            >
                                <CustomIcon 
                                    library="Feather" 
                                    name="search" 
                                    size={48} 
                                    color={Colors.GRAY_MEDIUM} 
                                />
                                <CustomText variant="h3" style={styles.emptyTitle}>
                                    No Results
                                </CustomText>
                                <CustomText variant="body" style={styles.emptySubtitle}>
                                    No offers matched your search or filters.
                                </CustomText>
                            </View>
                        )}

                        {filteredAndSortedOffers.length > 0 && (
                            <>
                                <View style={styles.listContainer}>
                                    {filteredAndSortedOffers.map((offer: Offer, index: number) => (
                                        <View
                                            key={offer.id}
                                            ref={index === 0 ? firstOfferRef : undefined}
                                            collapsable={false}
                                            onLayout={index === 0 ? () => {
                                                if (isTutorialMeasurementActive()) measureFirstOfferNow();
                                            } : undefined}
                                            style={{ width: cardWidth }}
                                        >
                                            <OfferCard 
                                                offer={offer}
                                                bookings={(bookingByOffer && Object.prototype.hasOwnProperty.call(bookingByOffer, offer.id)) ? bookingByOffer[offer.id] : EMPTY_BOOKINGS}
                                                statusDetails={getOfferStatusDetails(offer)}
                                                actionableCount={actionableCountsByOffer[offer.id] ?? 0}
                                                onViewBookings={onViewOfferBookings}
                                                onEditPress={handleEditPress}
                                                style={{ width: '100%' }}
                                            />
                                        </View>
                                    ))}
                                </View>
                                <View style={styles.footerContainer}>
                                    <CustomText style={styles.footerText}>
                                        No more offers to show.
                                    </CustomText>
                                </View>
                            </>
                        )}
                    </View>
                </ScrollView>
            </View>

            <ConfirmationModal 
                visible={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Active Offer?"
                message="Editing this offer will change the details and requirements for all future bookings. Are you sure you want to proceed?"
                iconName="edit-3"
                confirmText="Yes, Edit Offer"
                cancelText="Cancel"
                onConfirm={confirmEdit}
            />

            <CustomFilterModal
                visible={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                title="Sort & Filter Offers"
                sections={filterSections}
                initialValues={{ sortBy, filterTrailNames }}
                defaultValues={{ sortBy: 'date-asc', filterTrailNames: [] }}
                onApply={handleApplyFilters}
            />

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
    container: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
        position: 'relative'
    },
    headerWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100
    },
    scrollContent: { 
        paddingTop: 215,
        paddingBottom: 40, 
        paddingHorizontal: 16
    },
    constrainer: { 
        width: '100%', 
        maxWidth: Layout.MAX_WIDTH, 
        alignSelf: 'center' 
    },
    centerContent: { 
        paddingVertical: 60, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    headerAddButton: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: Colors.PRIMARY, 
        paddingHorizontal: 16, 
        height: 32, 
        alignSelf: 'center', 
        borderRadius: 16, 
        gap: 4 
    },
    headerAddText: { 
        color: Colors.WHITE, 
        fontWeight: 'bold', 
        fontSize: 12,
        marginTop: -2
    },
    emptyState: { 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingVertical: 60, 
        backgroundColor: Colors.WHITE, 
        borderRadius: 24, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_ULTRALIGHT 
    },
    emptyTitle: { 
        marginTop: 16, 
        marginBottom: 8, 
        color: Colors.TEXT_PRIMARY 
    },
    emptySubtitle: { 
        color: Colors.TEXT_SECONDARY, 
        textAlign: 'center', 
        paddingHorizontal: 32 
    },
    listContainer: { 
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16 
    },
    footerContainer: {
        paddingVertical: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerText: {
        color: Colors.TEXT_PLACEHOLDER,
        fontStyle: 'italic',
        fontSize: 14,
    },
    headerRightActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
});

export default OfferListScreen;
