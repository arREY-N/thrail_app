/**
 * @file OfferListScreen.tsx
 * @description Admin screen displaying a list of created offers and basic booking stats, including search, filter, and sorting features.
 */

import React, { useState, useRef, useEffect } from 'react';
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

import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { IBooking } from '@/src/core/models/Booking/Booking.types';
import { safeParseDateString } from '@/src/utils/dateFormatter';

import useOfferFilters, { FILTER_OPTIONS } from '@/src/features/Admin/hooks/useOfferFilters';
import OfferCard from '@/src/features/Admin/screens/Offer/components/OfferCard';

/**
 * Props for the OfferListScreen component.
 * 
 * @param offers - List of created offers to display.
 * @param bookingByOffer - Map of bookings indexed by offer ID to display reserved/booking counts.
 * @param isLoading - Boolean representing loading state.
 * @param error - Optional error message text.
 * @param onAddOffer - Callback to navigate to the Add Offer screen.
 * @param onEditOffer - Callback to navigate to the Edit Offer screen.
 * @param onViewOfferBookings - Callback to open the booking details sheet for the selected offer.
 * @param onBackPress - Callback for the back navigation action.
 */
export interface OfferListScreenProps {
    offers: Record<string, unknown>[];
    bookingByOffer: Record<string, IBooking[]>;
    isLoading: boolean;
    error?: string;
    onAddOffer: () => void;
    onEditOffer: (offerId: string) => void;
    onViewOfferBookings: (offerId: string) => void;
    onBackPress: () => void;
}

/**
 * OfferListScreen — Admin screen displaying a list of created offers and basic booking stats.
 */
const OfferListScreen: React.FC<OfferListScreenProps> = ({ 
    offers,
    bookingByOffer, 
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
    
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedEditId, setSelectedEditId] = useState<string | null>(null);
    const [showFilterModal, setShowFilterModal] = useState(false);

    const scrollViewRef = useRef<ScrollView>(null);

    const handleTabSelect = (tab: string) => {
        setActiveFilter(tab);
        // Scroll instantly before React finishes the render cycle to prevent jumps
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    };

    const handleEditPress = (offerId: string) => {
        setSelectedEditId(offerId);
        setShowEditModal(true);
    };

    const confirmEdit = () => {
        setShowEditModal(false);
        if (selectedEditId) {
            onEditOffer(selectedEditId);
        }
    };

    const HeaderAddAction = (
        <TouchableOpacity 
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

    const getOfferStatusDetails = (offer: Record<string, unknown>) => {
        const status = (offer.status || '').toString().toLowerCase();
        const offerDate = safeParseDateString(offer.date || offer.hikeDate);
        offerDate.setHours(0, 0, 0, 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (status === 'cancelled') {
            return { 
                label: 'Cancelled', 
                color: Colors.ERROR, 
                bg: Colors.ERROR_BG 
            };
        }
        if (status === 'rescheduled') {
            return { 
                label: 'Rescheduled', 
                color: Colors.WARNING, 
                bg: Colors.STATUS_WARNING_BG 
            };
        }
        if (offerDate < today) {
            return { 
                label: 'Expired', 
                color: Colors.TEXT_SECONDARY, 
                bg: Colors.GRAY_ULTRALIGHT 
            };
        }
        return { 
            label: 'Active', 
            color: Colors.SUCCESS, 
            bg: Colors.STATUS_APPROVED_BG 
        };
    };

    const getActionableBookingsCount = (offerId: string) => {
        if (!bookingByOffer || !bookingByOffer[offerId]) return 0;
        
        return bookingByOffer[offerId].filter(b => {
            const status = (b.status as string) || '';
            return status === 'pending-docs' || 
                   status === 'for-reservation' || 
                   status === 'paid' || 
                   status === 'downpayment';
        }).length;
    };

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

    const handleApplyFilters = (values: Record<string, any>) => {
        setSortBy(values.sortBy);
        setFilterTrailNames(values.filterTrailNames || []);
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <View style={styles.container}>
                <View style={styles.headerWrapper}>
                    <CustomHeader 
                        title="Manage Offers" 
                        centerTitle={true} 
                        onBackPress={onBackPress}
                        rightActions={HeaderAddAction} 
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

                        {isLoading && (
                            <View style={styles.centerContent}>
                                <ActivityIndicator 
                                    size="large" 
                                    color={Colors.PRIMARY} 
                                />
                            </View>
                        )}

                        {!isLoading && offers?.length === 0 && (
                            <View style={styles.emptyState}>
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

                        {!isLoading && offers?.length > 0 && filteredAndSortedOffers.length === 0 && (
                            <View style={styles.emptyState}>
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

                        {!isLoading && filteredAndSortedOffers.length > 0 && (
                            <>
                                <View style={styles.listContainer}>
                                    {filteredAndSortedOffers.map((offer: Record<string, unknown>) => (
                                        <OfferCard 
                                            key={offer.id as string}
                                            offer={offer}
                                            bookings={bookingByOffer[offer.id as string] || []}
                                            statusDetails={getOfferStatusDetails(offer)}
                                            actionableCount={getActionableBookingsCount(offer.id as string)}
                                            onViewBookings={onViewOfferBookings}
                                            onEditPress={handleEditPress}
                                        />
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
    }
});

export default OfferListScreen;
