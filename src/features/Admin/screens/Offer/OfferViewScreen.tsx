/**
 * @file OfferViewScreen.tsx
 * @description Admin screen displaying detailed information for an offer and its filtered, sortable recent bookings list.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';

import { IBooking } from '@/src/core/models/Booking/Booking.types';
import { IOffer } from '@/src/core/models/Offer/Offer.types';
import useBookingFilters, { FILTER_OPTIONS } from '@/src/features/Admin/hooks/useBookingFilters';
import AdminBookingCard from '@/src/features/Admin/screens/Offer/components/AdminBookingCard';
import OfferSummaryCard from '@/src/features/Admin/screens/Offer/components/OfferSummaryCard';
import { useScrollFades } from '@/src/hooks/useScrollFades';
import { useWebDragScroll } from '@/src/hooks/useWebDragScroll';

/**
 * Props for the OfferViewScreen component.
 * 
 * @param offerId - The ID of the current offer.
 * @param offer - The offer details data object.
 * @param bookings - Array of all bookings associated with this offer.
 * @param onViewBooking - Callback to view booking details page.
 * @param onBackPress - Callback for the back navigation action.
 * @param error - Optional error message text.
 */
export interface OfferViewScreenProps {
    offerId: string;
    offer: IOffer;
    bookings: IBooking[];
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
    } = useBookingFilters(bookings);

    const filterScrollRef = useRef<ScrollView>(null);
    const { 
        showLeftFade,
        showRightFade,
        scrollProps
    } = useScrollFades();

    // Enable drag-to-scroll functionality on Web platforms
    useWebDragScroll(filterScrollRef, bookings?.length > 0);

    if (!offer) return null;
    
    const trailName = offer.trail?.name || 'Unnamed Trail';

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                title="Offer Details" 
                centerTitle={true} 
                onBackPress={onBackPress} 
            />
            
            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.constrainer}>
                    
                    <OfferSummaryCard 
                        offer={offer} 
                        trailName={trailName} 
                    />

                    <View style={styles.sectionHeaderRow}>
                        <CustomText variant="h3" style={styles.sectionTitle}>
                            Recent Bookings <CustomText style={styles.sectionTitleCounter}>({filteredBookings.length})</CustomText>
                        </CustomText>
                        
                        {activeFilter !== 'All' && (
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
                        )}
                    </View>

                    {bookings && bookings.length > 0 && (
                        <View style={styles.filterScrollWrapper}>
                            <ScrollView 
                                ref={filterScrollRef}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.filterScroll}
                                contentContainerStyle={styles.filterContainer}
                                {...scrollProps}
                            >
                                {FILTER_OPTIONS.map((filter: string) => {
                                    const isActive = activeFilter === filter;
                                    return (
                                        <TouchableOpacity 
                                            key={filter}
                                            style={[
                                                styles.filterChip, 
                                                isActive && styles.filterChipActive
                                            ]}
                                            onPress={() => setActiveFilter(filter)}
                                            activeOpacity={0.7}
                                        >
                                            <CustomText 
                                                style={[
                                                    styles.filterChipText, 
                                                    isActive && styles.filterChipTextActive
                                                ]}
                                            >
                                                {filter}
                                            </CustomText>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            {showLeftFade && (
                                <LinearGradient 
                                    colors={[Colors.BACKGROUND, Colors.BACKGROUND_FADE, Colors.BACKGROUND_TRANSPARENT]} 
                                    start={{ x: 0, y: 0 }} 
                                    end={{ x: 1, y: 0 }} 
                                    style={styles.leftFade} 
                                    pointerEvents="none" 
                                />
                            )}

                            {showRightFade && (
                                <LinearGradient 
                                    colors={[Colors.BACKGROUND_TRANSPARENT, Colors.BACKGROUND_FADE, Colors.BACKGROUND]} 
                                    start={{ x: 0, y: 0 }} 
                                    end={{ x: 1, y: 0 }} 
                                    style={styles.rightFade} 
                                    pointerEvents="none" 
                                />
                            )}
                        </View>
                    )}

                    {error && (
                        <CustomText style={styles.errorText}>
                            {error}
                        </CustomText>
                    )}

                    {filteredBookings && filteredBookings.length > 0 ? (
                        filteredBookings.map((b: IBooking) => (
                            <AdminBookingCard 
                                key={b.id} 
                                booking={b} 
                                offerId={offerId} 
                                onViewBooking={onViewBooking} 
                            />
                        ))
                    ) : (
                        <View style={styles.emptyState}>
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
    emptyText: { 
        marginTop: 8, 
        color: Colors.TEXT_SECONDARY 
    }
});

export default OfferViewScreen;
