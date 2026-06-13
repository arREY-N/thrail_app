import React from 'react';
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
const OfferViewScreen = ({ 
    offerId,
    offer, 
    bookings, 
    onViewBooking, 
    onBackPress, 
    error 
}: OfferViewScreenProps) => {

    const { 
        activeFilter, 
        setActiveFilter, 
        filteredBookings 
    } = useBookingFilters(bookings);

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

                    <CustomText variant="h3" style={styles.sectionTitle}>
                        Recent Bookings ({filteredBookings.length})
                    </CustomText>

                    {bookings && bookings.length > 0 && (
                        <ScrollView 
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.filterScroll}
                            contentContainerStyle={styles.filterContainer}
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
                                name={bookings?.length > 0 ? "filter" : "inbox"} 
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
    sectionTitle: { 
        marginBottom: 12, 
        fontWeight: 'bold', 
        marginLeft: 4 
    },
    filterScroll: Platform.select({
        web: { 
            marginBottom: 16, 
            overflowX: 'auto', 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none' 
        },
        default: { 
            marginBottom: 16 
        }
    }),
    filterContainer: { 
        gap: 10, 
        flexDirection: 'row', 
        alignItems: 'center' 
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
