import React, { useMemo, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';

const formatDate = (dateObj) => {
    if (!dateObj) return 'TBA';
    let d;
    
    if (typeof dateObj.toDate === 'function') d = dateObj.toDate();
    else if (dateObj instanceof Date) d = dateObj;
    else if (dateObj.seconds) d = new Date(dateObj.seconds * 1000);
    else d = new Date(dateObj);

    if (isNaN(d.getTime())) return 'Invalid Date';

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} • ${hours}:${minutes} ${ampm}`;
};

const getStatusConfig = (status) => {
    switch (status) {
        case 'paid':
        case 'completed':
            return { label: 'Approved', bgColor: Colors.PRIMARY, textColor: Colors.WHITE, icon: 'check-circle' };
        case 'for-reservation':
        case 'for-payment':
        case 'for-reschedule':
            return { label: 'Pending', bgColor: Colors.PRIMARY, textColor: Colors.WHITE, icon: 'refresh-ccw' };
        case 'for-cancellation':
        case 'refund':
        case 'cancellation-rejected':
            return { label: 'Cancelled', bgColor: Colors.ERROR, textColor: Colors.WHITE, icon: 'x-circle' };
        default:
            return { label: status || 'Unknown', bgColor: Colors.GRAY_LIGHT, textColor: Colors.TEXT_PRIMARY, icon: 'help-circle' };
    }
};

const BookingManagementScreen = ({
    userBookings,
    error,
    onBackPress,
    onCancelBookingPress,
}) => {
    const [activeTab, setActiveTab] = useState('All');
    const [cancellingBooking, setCancellingBooking] = useState(null);
    const [cancelReason, setCancelReason] = useState('');

    const tabs = ['All', 'This month', 'Cancelled'];

    const filteredBookings = useMemo(() => {
        if (!userBookings) return [];
        
        const cancelledStatuses = ['for-cancellation', 'refund', 'cancellation-rejected'];
        
        return userBookings.filter(booking => {
            const isCancelled = cancelledStatuses.includes(booking.status);

            if (activeTab === 'All') {
                return !isCancelled;
            }
            
            if (activeTab === 'Cancelled') {
                return isCancelled;
            }
            
            if (activeTab === 'This month') {
                if (isCancelled) return false;

                let d = booking.offer?.date;
                if (d && typeof d.toDate === 'function') d = d.toDate();
                else if (d && d.seconds) d = new Date(d.seconds * 1000);
                else d = new Date(d);
                
                const now = new Date();
                return d instanceof Date && !isNaN(d) && 
                       d.getMonth() === now.getMonth() && 
                       d.getFullYear() === now.getFullYear();
            }
            
            return true;
        });
    }, [userBookings, activeTab]);

    const displayError = error === 'No trail ID provided' ? null : error;

    const handleCancelSubmit = () => {
        if (cancellingBooking && cancelReason.trim()) {
            onCancelBookingPress(cancellingBooking, cancelReason);
            setCancellingBooking(null);
            setCancelReason('');
        }
    };

    const handleCloseModal = () => {
        setCancellingBooking(null);
        setCancelReason('');
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader
                title="My Bookings"
                centerTitle={true}
                onBackPress={onBackPress}
            />

            <View style={styles.tabContainer}>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabScrollContent}
                >
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <TouchableOpacity
                                key={tab}
                                style={[
                                    styles.tabPill,
                                    isActive ? styles.tabPillActive : styles.tabPillInactive
                                ]}
                                onPress={() => setActiveTab(tab)}
                                activeOpacity={0.7}
                            >
                                <CustomText
                                    variant="label"
                                    style={[
                                        styles.tabText,
                                        isActive ? styles.tabTextActive : styles.tabTextInactive
                                    ]}
                                >
                                    {tab}
                                </CustomText>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

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
                    filteredBookings.map((booking) => {
                        const statusConfig = getStatusConfig(booking.status);
                        const canCancel = !['completed', 'for-cancellation', 'refund'].includes(booking.status);

                        return (
                            <View key={booking.id} style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.cardInfo}>
                                        <CustomText variant="h2" style={styles.trailName} numberOfLines={1}>
                                            {booking.trail?.name || 'Hiking Package'}
                                        </CustomText>
                                        <CustomText variant="body" style={styles.guideName} numberOfLines={1}>
                                            {booking.business?.name || 'Independent Guide'}
                                        </CustomText>
                                        <CustomText variant="caption" style={styles.dateText}>
                                            {formatDate(booking.offer?.date)}
                                        </CustomText>
                                    </View>

                                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                                        <CustomIcon 
                                            library="Feather" 
                                            name={statusConfig.icon} 
                                            size={14} 
                                            color={statusConfig.textColor} 
                                        />
                                        <CustomText
                                            variant="caption"
                                            style={[styles.statusText, { color: statusConfig.textColor }]}
                                        >
                                            {statusConfig.label}
                                        </CustomText>
                                    </View>
                                </View>

                                {canCancel && (
                                    <View style={styles.cardFooter}>
                                        <TouchableOpacity
                                            style={styles.cancelButton}
                                            onPress={() => setCancellingBooking(booking)}
                                            activeOpacity={0.7}
                                        >
                                            <CustomText variant="caption" style={styles.cancelButtonText}>
                                                Cancel Booking
                                            </CustomText>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        );
                    })
                ) : (
                    <View style={styles.emptyState}>
                        <CustomIcon
                            library="Feather"
                            name="inbox"
                            size={48}
                            color={Colors.GRAY_LIGHT}
                        />
                        <CustomText variant="body" style={styles.emptyText}>
                            No bookings found in this category.
                        </CustomText>
                    </View>
                )}
            </ScrollView>

            <Modal
                visible={!!cancellingBooking}
                transparent={true}
                animationType="fade"
                onRequestClose={handleCloseModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <CustomText variant="h2" style={styles.modalTitle}>
                            Canceling
                        </CustomText>
                        
                        <CustomText variant="body" style={styles.modalSubtitle}>
                            Please provide a reason for canceling your reservation for <CustomText style={{ fontWeight: 'bold' }}>{cancellingBooking?.trail?.name}</CustomText>.
                        </CustomText>

                        <CustomTextInput
                            label="Reason for cancellation *"
                            placeholder="Type your reason here..."
                            value={cancelReason}
                            onChangeText={setCancelReason}
                            multiline={true}
                            style={styles.reasonInputWrapper}
                            inputStyle={styles.reasonInput}
                        />

                        <View style={styles.warningBox}>
                            <CustomText variant="label" style={styles.warningTitle}>
                                What happens if you cancel:
                            </CustomText>
                            <View style={styles.warningItem}>
                                <CustomIcon library="Feather" name="alert-circle" size={14} color={Colors.TEXT_PRIMARY} />
                                <CustomText variant="body" style={styles.warningText}>
                                    Booking becomes permanently canceled
                                </CustomText>
                            </View>
                            <View style={styles.warningItem}>
                                <CustomIcon library="Feather" name="credit-card" size={14} color={Colors.TEXT_PRIMARY} />
                                <CustomText variant="body" style={styles.warningText}>
                                    Refund takes 3–7 business days
                                </CustomText>
                            </View>
                        </View>

                        <View style={styles.modalActions}>
                            <View style={styles.flexHalf}>
                                <CustomButton
                                    title="Cancel"
                                    variant="outline"
                                    onPress={handleCloseModal}
                                />
                            </View>
                            <View style={styles.flexHalf}>
                                <CustomButton
                                    title="Confirm"
                                    variant="primary"
                                    onPress={handleCancelSubmit}
                                    disabled={!cancelReason.trim()}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    tabContainer: {
        paddingVertical: 12,
        backgroundColor: Colors.BACKGROUND,
    },
    tabScrollContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    tabPill: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    tabPillActive: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    tabPillInactive: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderColor: Colors.GRAY_LIGHT,
    },
    tabText: {
        fontSize: 14,
    },
    tabTextActive: {
        color: Colors.WHITE,
    },
    tabTextInactive: {
        color: Colors.TEXT_SECONDARY,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    errorBox: {
        backgroundColor: Colors.ERROR_BG,
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.ERROR_BORDER,
    },
    card: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardInfo: {
        flex: 1,
        paddingRight: 12,
    },
    trailName: {
        fontSize: 18,
        color: Colors.TEXT_PRIMARY,
        marginBottom: 4,
    },
    guideName: {
        fontSize: 14,
        color: Colors.TEXT_PRIMARY,
        marginBottom: 4,
    },
    dateText: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        textTransform: 'uppercase',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    statusText: {
        fontWeight: 'bold',
        fontSize: 13,
    },
    cardFooter: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_LIGHT,
        alignItems: 'flex-end',
    },
    cancelButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.ERROR,
    },
    cancelButtonText: {
        color: Colors.ERROR,
        fontWeight: 'bold',
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
    modalOverlay: {
        flex: 1,
        backgroundColor: Colors.MODAL_OVERLAY,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: Colors.BACKGROUND,
        borderRadius: 24,
        padding: 24,
        elevation: 5,
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    modalTitle: {
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        color: Colors.TEXT_SECONDARY,
        marginBottom: 20,
        textAlign: 'center',
    },
    reasonInputWrapper: {
        marginBottom: 20,
    },
    reasonInput: {
        minHeight: 100,
        paddingTop: 16,
    },
    warningBox: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    warningTitle: {
        marginBottom: 8,
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
    },
    warningItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    warningText: {
        fontSize: 14,
        color: Colors.TEXT_PRIMARY,
        fontWeight: '500',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    flexHalf: {
        flex: 1,
    },
});

export default BookingManagementScreen;