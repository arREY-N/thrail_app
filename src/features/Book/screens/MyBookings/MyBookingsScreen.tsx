import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomFilterModal from '@/src/components/CustomFilterModal';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomLoading from "@/src/components/CustomLoading";
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';

import BookingCard from '@/src/features/Book/components/BookingCard';
import BookTabs from '@/src/features/Book/components/BookTabs';
import useBookingFilters from '@/src/features/Book/hooks/useBookingFilters';

import BookingDetailsScreen from '@/src/features/Book/screens/MyBookings/BookingDetailsScreen';
import PaymentScreen from '@/src/features/Book/screens/Payment/PaymentScreen';
import ReceiptScreen from '@/src/features/Book/screens/Payment/ReceiptScreen';

import { IBooking } from '@/src/core/models/Booking/Booking.types';
import { IOffer } from '@/src/core/models/Offer/Offer.types';

export interface MyBookingsScreenProps {
    /** Array of user's bookings */
    userBookings: IBooking[];
    /** Error message, if any */
    error?: string | null;
    /** Loading state */
    isLoading?: boolean;
    /** Back button handler */
    onBackPress: () => void;
    /** Callback when cancel is pressed */
    onCancelBookingPress: (booking: IBooking, reason: string) => void;
    /** Callback when refund is pressed */
    onRefundBookingPress?: (booking: IBooking, reason: string) => void;
    /** Callback to reschedule */
    onRescheduleBooking?: (booking: IBooking, newOffer: unknown) => void;
    /** Callback to pay */
    onPayOffer: (amount: number, bookingId?: string, method?: string, returnUrl?: string) => Promise<any>;
    /** Function to fetch full offer */
    getBookOffer: (id: string) => Promise<IOffer>;
    /** Available future offers for rescheduling */
    availableFutureOffers?: IOffer[];
    /** Initial booking ID to open */
    initialBookingId?: string | null;
    /** Initial view mode */
    initialView?: 'list' | 'overview' | 'payment' | 'receipt';
    /** Callback for Terms of Service */
    onTermsPress: () => void;
    /** Callback for Privacy Policy */
    onPrivacyPress: () => void;
}

/**
 * Main container screen for a user's bookings list and details views.
 * 
 * @param {MyBookingsScreenProps} props - Component props
 */
const MyBookingsScreen = ({
    userBookings,
    error,
    isLoading,
    onBackPress,
    onCancelBookingPress,
    onRefundBookingPress,
    onRescheduleBooking,
    onPayOffer,
    getBookOffer,
    availableFutureOffers,
    initialBookingId,
    initialView,
    onTermsPress,
    onPrivacyPress
}: MyBookingsScreenProps) => {
    const [currentView, setCurrentView] = useState<'list' | 'overview' | 'payment' | 'receipt'>(initialView || 'list'); 
    const [selectedBookingId, setSelectedBookingId] = useState<string | null>(initialBookingId || null);
    const [showFilterModal, setShowFilterModal] = useState<boolean>(false);

    React.useEffect(() => {
        if (initialView && initialBookingId) {
            setSelectedBookingId(initialBookingId);
            setCurrentView(initialView);
        }
    }, [initialView, initialBookingId]);

    const selectedBooking = userBookings?.find(b => b.id === selectedBookingId) || null;

    const { 
        tabs, 
        activeTab, 
        setActiveTab, 
        filteredBookings,
        sortBy,
        setSortBy,
        filterBy,
        setFilterBy
    } = useBookingFilters(userBookings); // Handle internal mismatches

    const onHeaderBackPress = () => {
        if (currentView === 'overview') {
            setCurrentView('list');
            setSelectedBookingId(null);
        } else if (currentView === 'payment' || currentView === 'receipt') {
            setCurrentView('overview');
        } else {
            onBackPress();
        }
    };

    const onBookingSelectPress = (booking: IBooking) => {
        setSelectedBookingId(booking.id);
        setCurrentView('overview'); 
    };

    const onProceedToPaymentPress = () => {
        setCurrentView('payment');
    };

    const filterSections = [
        {
            id: 'sortBy',
            title: 'Sort By',
            type: 'radio' as const,
            options: [
                { label: 'Hike Date', value: 'hike-date' },
                { label: 'Date Booked', value: 'booked-date' },
                { label: 'Recently Updated', value: 'last-updated' } 
            ]
        },
        {
            id: 'filterBy',
            title: 'Filter By',
            type: 'pill' as const,
            multiSelect: false,
            options: [
                { label: 'Show All', value: 'all' },
                { label: 'Action Needed', value: 'action-needed' },
                { label: 'Waiting on Provider', value: 'waiting' },
                { label: 'Partially Paid', value: 'partial' }
            ]
        }
    ];

    const displayError = error === 'No trail ID provided' ? null : error;

    if (currentView === 'list') {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <CustomHeader 
                    title="My Bookings" 
                    centerTitle={true} 
                    onBackPress={onHeaderBackPress} 
                    rightActions={
                        <TouchableOpacity style={styles.headerOptionsBtn} onPress={() => setShowFilterModal(true)} activeOpacity={0.7}>
                            <CustomIcon library="Feather" name="sliders" size={22} color={Colors.PRIMARY} />
                        </TouchableOpacity>
                    }
                />

                <View style={styles.constrainer}>
                    <BookTabs 
                        tabs={tabs}
                        activeTab={activeTab}
                        onTabChange={(id: string) => setActiveTab(id as import('@/src/features/Book/hooks/useBookingFilters').TabId)}
                    />
                </View>

                <ScrollView 
                    showsVerticalScrollIndicator={false} 
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.constrainer}>
                        {displayError && (
                            <View style={styles.errorBox}>
                                <CustomText variant="caption" color={Colors.ERROR}>
                                    {displayError}
                                </CustomText>
                            </View>
                        )}

                        {filteredBookings.length > 0 ? (
                            filteredBookings.map((booking: IBooking) => (
                                <BookingCard 
                                    key={booking.id} 
                                    booking={booking} 
                                    onSelectBooking={(b) => { setSelectedBookingId(b.id); setCurrentView('overview'); }} 
                                />
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <CustomIcon library="Feather" name="inbox" size={48} color={Colors.GRAY_LIGHT} />
                                <CustomText variant="body" style={styles.emptyText}>
                                    No bookings found with current filters.
                                </CustomText>
                            </View>
                        )}
                    </View>
                </ScrollView>

                <CustomFilterModal
                    visible={showFilterModal}
                    onClose={() => setShowFilterModal(false)}
                    title="Sort & Filter"
                    sections={filterSections}
                    initialValues={{ sortBy, filterBy }}
                    defaultValues={{ sortBy: 'hike-date', filterBy: 'all' }}
                    onApply={(values: any) => {
                        setSortBy(values.sortBy);
                        setFilterBy(values.filterBy);
                    }}
                />

            </ScreenWrapper>
        );
    }

    if (currentView === 'overview') {
        if (!selectedBooking) {
            return (
                <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                    <CustomLoading visible={true} message="Loading booking details..." />
                </ScreenWrapper>
            );
        }

        return (
            <BookingDetailsScreen
                booking={selectedBooking}
                getBookOffer={getBookOffer}
                availableFutureOffers={availableFutureOffers}
                onBackPress={onHeaderBackPress}
                onProceedToPayment={onProceedToPaymentPress}
                onViewReceipt={() => setCurrentView('receipt')}
                onCancelConfirm={(booking, reason) => {
                    onCancelBookingPress(booking, reason);
                    setCurrentView('list');
                }}
                onRefundConfirm={(booking, reason) => {
                    if (onRefundBookingPress) {
                        onRefundBookingPress(booking, reason);
                        setCurrentView('list');
                    }
                }}
                onReschedule={(booking, newOffer) => {
                    if (onRescheduleBooking) {
                        onRescheduleBooking(booking, newOffer);
                        setCurrentView('list');
                    }
                }}
            />
        );
    }

    if (currentView === 'payment') {
        if (!selectedBooking) return null; 
        return (
            <PaymentScreen 
                bookingData={selectedBooking}
                onContinue={() => setCurrentView('overview')}
                onBackPress={onHeaderBackPress}
                onPayOffer={onPayOffer}
                onTermsPress={onTermsPress}
                onPrivacyPress={onPrivacyPress}
            />
        );
    }

    if (currentView === 'receipt') {
        if (!selectedBooking) return null; 
        return (
            <ReceiptScreen 
                bookingData={selectedBooking}
                onFinish={() => setCurrentView('overview')}
            />
        );
    }

    return null;
};

const styles = StyleSheet.create({
    constrainer: {
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: 'center',
    },
    scrollContent: { 
        padding: 16, 
        paddingBottom: 40,
    },
    headerOptionsBtn: {
        paddingHorizontal: 8
    },
    errorBox: { 
        backgroundColor: Colors.ERROR_BG, 
        padding: 12, 
        borderRadius: 8, 
        marginBottom: 16, 
        borderWidth: 1, 
        borderColor: Colors.ERROR_BORDER,
    },
    emptyState: { 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingVertical: 60, 
        backgroundColor: Colors.WHITE, 
        borderRadius: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT,
    },
    emptyText: { 
        marginTop: 12, 
        color: Colors.TEXT_SECONDARY,
    },
});

export default MyBookingsScreen;
