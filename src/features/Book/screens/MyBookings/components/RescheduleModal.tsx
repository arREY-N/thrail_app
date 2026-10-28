import React, { useMemo, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomFeedbackInput from '@/src/components/CustomFeedbackInput';
import CustomIcon from '@/src/components/CustomIcon';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

import { useBookingsStore } from '@/src/core/models/Booking/Booking';
import { IOffer } from '@/src/core/models/Offer/Offer';
import OfferCard, { OfferData } from '@/src/features/Book/components/OfferCard';
import { formatDateToStandard } from '@/src/utils/dateFormatter';

export interface RescheduleModalProps {
    /** Whether the modal is visible */
    visible: boolean;
    /** Callback to close the modal */
    onClose: () => void;
    /** Callback when user confirms selection with reason */
    onConfirm: (selectedOffer: IOffer | 'explore', reason?: string) => void;
    /** Array of available future offers */
    availableFutureOffers?: IOffer[];
}

const RESCHEDULE_SUGGESTIONS = [
    'Schedule conflict',
    'Work commitment',
    'Health / Medical concern',
    'Weather forecast',
    'Personal emergency',
    'Transportation issue',
    'Change of plans',
];

/**
 * Modal to select a reason and a new date from future offers to reschedule.
 * 
 * @param {RescheduleModalProps} props - Component props
 */
const RescheduleModal = ({ 
    visible, 
    onClose, 
    onConfirm, 
    availableFutureOffers = [] 
}: RescheduleModalProps) => {
    const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
    const [reason, setReason] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRef = useRef(false);

    // Safeguard: Filter out any offers that the user already has an active booking for
    const userBookings = useBookingsStore(s => s.userBookings);
    const activeBookedOfferIds = useMemo(() => {
        const ids = new Set<string>();
        for (const b of userBookings || []) {
            if (!['cancelled', 'refunded', 'expired', 'rescheduled'].includes(b.status)) {
                const offId = b.offer?.id || (b as any).offerId;
                if (offId) ids.add(offId);
            }
        }
        return ids;
    }, [userBookings]);

    const selectableOffers = useMemo(() => {
        return availableFutureOffers.filter(o => o.id && !activeBookedOfferIds.has(o.id));
    }, [availableFutureOffers, activeBookedOfferIds]);

    const [prevVisible, setPrevVisible] = useState(visible);
    if (visible !== prevVisible) {
        setPrevVisible(visible);
        if (!visible) {
            setIsSubmitting(false);
            setSelectedOfferId(null);
            setReason('');
        }
    }

    const isReasonValid = reason.trim().length >= 5;

    const handleConfirm = () => {
        if (isSubmittingRef.current || isSubmitting) return;
        const selected = selectableOffers.find(o => o.id === selectedOfferId);
        if (selected) {
            isSubmittingRef.current = true;
            setIsSubmitting(true);
            onConfirm(selected, reason.trim());
            setSelectedOfferId(null);
            setReason('');
        }
    };

    const handleClose = () => {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        setSelectedOfferId(null);
        setReason('');
        onClose();
    };

    if (!visible) return null;

    return (
        <Modal 
            transparent 
            visible={visible} 
            animationType="slide" 
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView 
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.modalContent}>
                    
                    <View style={styles.header}>
                        <CustomText variant="h2" style={styles.title}>
                            Reschedule Hike
                        </CustomText>
                        <TouchableOpacity 
                            onPress={handleClose} 
                            style={styles.closeBtn} 
                            activeOpacity={0.7}
                        >
                            <CustomIcon 
                                library="Feather" 
                                name="x" 
                                size={24} 
                                color={Colors.TEXT_PRIMARY} 
                            />
                        </TouchableOpacity>
                    </View>

                    <ScrollView 
                        showsVerticalScrollIndicator={false} 
                        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Reschedule Reason Input Section */}
                        <View style={styles.reasonSection}>
                            <CustomFeedbackInput
                                label="Reason for Reschedule"
                                placeholder="Please explain why you need to reschedule this hike..."
                                helperText="Tap a suggestion above or type your own reason."
                                value={reason}
                                onChangeText={setReason}
                                suggestions={RESCHEDULE_SUGGESTIONS}
                                variant="primary"
                            />
                            <View style={styles.counterRow}>
                                <CustomText variant="caption" style={styles.counterText}>
                                    {reason.length} / 300 characters
                                </CustomText>
                            </View>
                        </View>

                        {/* Offers Section Header */}
                        <View style={styles.offersHeader}>
                            <CustomText variant="h3" style={styles.sectionTitle}>
                                Select New Date
                            </CustomText>
                            <CustomText variant="caption" style={styles.sectionSubtitle}>
                                Choose an available upcoming schedule from this organizer.
                            </CustomText>
                        </View>

                        {selectableOffers.length > 0 ? (
                            selectableOffers.map((offer, idx) => (
                                <View key={offer.id || `offer-${idx}`} style={styles.cardWrapper}>
                                    <CustomText variant="label" style={styles.trailLabel}>
                                        {offer.trail?.name || 'Hike'} — {formatDateToStandard(offer.date)}
                                    </CustomText>
                                    
                                    <OfferCard 
                                        offer={offer as unknown as OfferData}
                                        isSelected={Boolean(offer.id && selectedOfferId === offer.id)}
                                        onSelect={() => {
                                            if (offer.id) {
                                                setSelectedOfferId(
                                                    selectedOfferId === offer.id ? null : offer.id
                                                );
                                            }
                                        }}
                                    />
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <CustomIcon 
                                    library="Feather" 
                                    name="calendar" 
                                    size={48} 
                                    color={Colors.GRAY_LIGHT} 
                                />
                                <CustomText style={styles.emptyText}>
                                    No future dates available for this organizer.
                                </CustomText>
                            </View>
                        )}
                    </ScrollView>

                    <View style={styles.footerContainer}>
                        <CustomStickyFooter 
                            style={{ backgroundColor: Colors.WHITE, borderTopWidth: 1, borderTopColor: Colors.GRAY_ULTRALIGHT }}
                            secondaryButton={{
                                title: "Keep Current Date",
                                onPress: handleClose,
                                disabled: isSubmitting,
                                variant: "outline"
                            }}
                            primaryButton={{
                                title: selectableOffers.length === 0 
                                    ? "Explore Mountains" 
                                    : (isSubmitting ? "Rescheduling..." : "Confirm Reschedule"),
                                onPress: selectableOffers.length === 0 
                                    ? () => {
                                        if (isSubmittingRef.current || isSubmitting) return;
                                        isSubmittingRef.current = true;
                                        setIsSubmitting(true);
                                        onConfirm('explore');
                                    } 
                                    : handleConfirm,
                                disabled: (selectableOffers.length > 0 && (!selectedOfferId || !isReasonValid)) || isSubmitting,
                                isLoading: isSubmitting
                            }}
                        />
                    </View>

                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        justifyContent: 'flex-end' 
    },
    modalContent: { 
        backgroundColor: Colors.BACKGROUND, 
        borderTopLeftRadius: 24, 
        borderTopRightRadius: 24, 
        height: '90%' 
    },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 20, 
        borderBottomWidth: 1, 
        borderBottomColor: Colors.GRAY_ULTRALIGHT, 
        backgroundColor: Colors.WHITE, 
        borderTopLeftRadius: 24, 
        borderTopRightRadius: 24 
    },
    title: { 
        marginBottom: 0 
    },
    closeBtn: { 
        padding: 4, 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        borderRadius: 20 
    },
    scrollContent: { 
        padding: 20, 
        paddingBottom: 100 
    },
    reasonSection: {
        marginBottom: 20,
    },
    counterRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 6,
        marginRight: 4,
    },
    counterText: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
    },
    offersHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 4,
    },
    sectionSubtitle: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
    },
    cardWrapper: { 
        marginBottom: 20 
    },
    trailLabel: { 
        marginBottom: 12, 
        color: Colors.PRIMARY, 
        fontWeight: 'bold' 
    },
    emptyState: { 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingVertical: 60 
    },
    emptyText: { 
        marginTop: 12, 
        color: Colors.TEXT_SECONDARY 
    },
    footerContainer: { 
        backgroundColor: Colors.WHITE, 
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_ULTRALIGHT,
        paddingBottom: 20 
    }
});

export default RescheduleModal;
