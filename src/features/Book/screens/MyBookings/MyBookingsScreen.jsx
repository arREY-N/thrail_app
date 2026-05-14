import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomFilterModal from '@/src/components/CustomFilterModal';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomLoading from "@/src/components/CustomLoading";
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';

import BookingCard from '@/src/features/Book/components/BookingCard';
import BookTabs from '@/src/features/Book/components/BookTabs';
import useBookingFilters from '@/src/features/Book/hooks/useBookingFilters';

import BookingDetailsScreen from '@/src/features/Book/screens/MyBookings/BookingDetailsScreen';
import PaymentScreen from '@/src/features/Book/screens/Payment/PaymentScreen';
import ReceiptScreen from '@/src/features/Book/screens/Payment/ReceiptScreen';

const MyBookingsScreen = ({
    userBookings,
    error,
    onBackPress,
    onCancelBookingPress,
    onRefundBookingPress,
    onRescheduleBooking,
    onPayOffer,
    getBookOffer,
    availableFutureOffers,
    initialBookingId,
    initialView
}) => {
    const [currentView, setCurrentView] = useState(initialView || 'list'); 
    const [selectedBookingId, setSelectedBookingId] = useState(initialBookingId || null);
    const [showFilterModal, setShowFilterModal] = useState(false);

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
    } = useBookingFilters(userBookings);

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

    const onBookingSelectPress = (booking) => {
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
            type: 'radio',
            options: [
                { label: 'Hike Date', value: 'hike-date' },
                { label: 'Date Booked', value: 'booked-date' },
                { label: 'Recently Updated', value: 'last-updated' } 
            ]
        },
        {
            id: 'filterBy',
            title: 'Filter By',
            type: 'pill',
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

                <BookTabs 
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                <ScrollView 
                    showsVerticalScrollIndicator={false} 
                    contentContainerStyle={styles.scrollContent}
                >
                    {displayError && (
                        <View style={styles.errorBox}>
                            <CustomText variant="caption" color={Colors.ERROR}>
                                {displayError}
                            </CustomText>
                        </View>
                    )}

                    {filteredBookings.length > 0 ? (
                        filteredBookings.map((booking) => (
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
                </ScrollView>

                <CustomFilterModal
                    visible={showFilterModal}
                    onClose={() => setShowFilterModal(false)}
                    title="Sort & Filter"
                    sections={filterSections}
                    initialValues={{ sortBy, filterBy }}
                    defaultValues={{ sortBy: 'hike-date', filterBy: 'all' }}
                    onApply={(values) => {
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