import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomFeedbackInput from '@/src/components/CustomFeedbackInput';
import CustomIcon from '@/src/components/CustomIcon';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';

import { useBookingsStore } from '@/src/core/models/Booking/Booking';
import { IOffer } from '@/src/core/models/Offer/Offer';
import OfferCard, { OfferData } from '@/src/features/Book/components/OfferCard';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { formatDateToStandard, safeParseDateString } from '@/src/utils/dateFormatter';
import {
    getActiveBookingSpans,
    getCalendarDayGap,
    getOfferDateSpan,
} from '@/src/utils/offerHelpers';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface RescheduleModalProps {
    /** Whether the modal is visible */
    visible: boolean;
    /** Callback to close the modal */
    onClose: () => void;
    /** Callback when user confirms selection with reason */
    onConfirm: (selectedOffer: IOffer | 'explore', reason?: string) => void;
    /** Array of available future offers */
    availableFutureOffers?: IOffer[];
    /** Global list of offers across all trails for multi-day cross-trail conflict resolution */
    allOffers?: IOffer[];
    /** ID of the booking currently being rescheduled */
    currentBookingId?: string;
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
 * Adheres to responsive container layout (centered card on web, bottom-sheet on mobile)
 * and enforces comprehensive Offer Calendar conditions.
 */
const RescheduleModal = ({ 
    visible, 
    onClose, 
    onConfirm, 
    availableFutureOffers = [],
    allOffers = [],
    currentBookingId,
}: RescheduleModalProps) => {
    const insets = useSafeAreaInsets();
    const { isDesktop, isTablet } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;

    const [renderModal, setRenderModal] = useState<boolean>(visible);
    if (visible && !renderModal) {
        setRenderModal(true);
    }

    const [animValue] = useState(() => new Animated.Value(0));
    const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
    const [reason, setReason] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRef = useRef(false);

    useEffect(() => {
        if (visible) {
            Animated.timing(animValue, {
                toValue: 1,
                duration: 300,
                useNativeDriver: Platform.OS !== 'web',
            }).start();
        } else {
            Animated.timing(animValue, {
                toValue: 0,
                duration: 250,
                useNativeDriver: Platform.OS !== 'web',
            }).start(() => setRenderModal(false));
        }
    }, [visible, animValue]);

    // Active booked offer IDs and multi-day spans across all trails
    const userBookings = useBookingsStore(s => s.userBookings);

    const mergedOffers = useMemo(() => {
        const map = new Map<string, IOffer>();
        if (Array.isArray(allOffers)) {
            allOffers.forEach((o) => {
                if (o?.id) map.set(o.id, o);
            });
        }
        if (Array.isArray(availableFutureOffers)) {
            availableFutureOffers.forEach((o) => {
                if (o?.id) map.set(o.id, o);
            });
        }
        return Array.from(map.values());
    }, [allOffers, availableFutureOffers]);

    const activeBookingSpans = useMemo(() => {
        return getActiveBookingSpans(userBookings || [], mergedOffers, [], currentBookingId);
    }, [userBookings, mergedOffers, currentBookingId]);

    const activeBookedOfferIds = useMemo(() => {
        return new Set<string>(activeBookingSpans.map((s) => s.offerId));
    }, [activeBookingSpans]);

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
        const selected = availableFutureOffers.find(o => o.id === selectedOfferId);
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

    if (!renderModal) return null;

    const now = new Date();

    return (
        <Modal 
            transparent={true} 
            visible={renderModal} 
            animationType="none" 
            onRequestClose={handleClose}
        >
            <View style={styles.modalContainer}>
                {/* Backdrop with Fade */}
                <Animated.View style={[styles.backdrop, { opacity: animValue }]}>
                    <TouchableOpacity 
                        style={styles.backdropTouch} 
                        activeOpacity={1} 
                        onPress={handleClose} 
                    />
                </Animated.View>

                {/* Animated Modal Surface */}
                <Animated.View
                    style={[
                        styles.modalContent,
                        isWideScreen ? styles.modalContentDesktop : styles.modalContentMobile,
                        {
                            transform: [
                                {
                                    translateY: animValue.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: isWideScreen ? [50, 0] : [SCREEN_HEIGHT, 0],
                                    }),
                                },
                            ],
                            opacity: isWideScreen ? animValue : 1,
                        },
                    ]}
                >
                    <KeyboardAvoidingView 
                        style={styles.keyboardContainer}
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    >
                        {/* Header */}
                        <View style={[styles.header, isWideScreen ? styles.headerDesktop : styles.headerMobile]}>
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
                                    size={20} 
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

                            {availableFutureOffers.length > 0 ? (
                                availableFutureOffers.map((offer, idx) => {
                                    const isBooked = Boolean(offer.id && activeBookedOfferIds.has(offer.id));
                                    const offerDate = safeParseDateString(offer.date);
                                    const candidateSpan = getOfferDateSpan(offer);
                                    const isDateConflict = !isBooked && activeBookingSpans.some(
                                        (b) => b.offerId !== offer.id && getCalendarDayGap(candidateSpan, b.span).isOverlap
                                    );

                                    const hasPaxLimit = Boolean(offer.maxPax && offer.maxPax > 0);
                                    const remainingSlots = hasPaxLimit ? Math.max(0, (offer.maxPax || 0) - (offer.reservedPax || 0)) : null;
                                    const isFullyBooked = hasPaxLimit && remainingSlots === 0;

                                    const isToday = offerDate.toDateString() === now.toDateString();
                                    const offerWithCutoff = offer as unknown as OfferData;
                                    const cutoffDays = typeof offerWithCutoff.advanceBookingCutoffDays === 'number' ? offerWithCutoff.advanceBookingCutoffDays : 7;
                                    const cutoffMs = cutoffDays * 24 * 60 * 60 * 1000;
                                    const isWithinAdvanceCutoff = (offerDate.getTime() - now.getTime()) < cutoffMs;
                                    const offerStatusLower = (offer.status || '').toLowerCase();
                                    const isClosed = offerStatusLower === 'closed' || offerStatusLower === 'cancelled';

                                    const isDisabled = isBooked || isDateConflict || isFullyBooked || isWithinAdvanceCutoff || isClosed;

                                    return (
                                        <View key={offer.id || `offer-${idx}`} style={styles.cardWrapper}>
                                            <CustomText variant="label" style={styles.trailLabel}>
                                                {offer.trail?.name || 'Hike'} — {formatDateToStandard(offer.date)}
                                            </CustomText>
                                            
                                            <OfferCard 
                                                offer={offer as unknown as OfferData}
                                                isSelected={Boolean(offer.id && selectedOfferId === offer.id)}
                                                isBooked={isBooked}
                                                isDateConflict={isDateConflict}
                                                isClosed={isClosed}
                                                isWithinAdvanceCutoff={isWithinAdvanceCutoff}
                                                isToday={isToday}
                                                onSelect={() => {
                                                    if (isDisabled) return;
                                                    if (offer.id) {
                                                        setSelectedOfferId(
                                                            selectedOfferId === offer.id ? null : offer.id
                                                        );
                                                    }
                                                }}
                                            />
                                        </View>
                                    );
                                })
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

                        <View style={[styles.footerContainer, { paddingBottom: isWideScreen ? 16 : Math.max(insets.bottom, 16) }]}>
                            <CustomStickyFooter 
                                style={{ backgroundColor: Colors.WHITE, borderTopWidth: 1, borderTopColor: Colors.GRAY_ULTRALIGHT }}
                                secondaryButton={{
                                    title: "Keep Current Date",
                                    onPress: handleClose,
                                    disabled: isSubmitting,
                                    variant: "outline"
                                }}
                                primaryButton={{
                                    title: availableFutureOffers.length === 0 
                                        ? "Explore Mountains" 
                                        : (isSubmitting ? "Rescheduling..." : "Confirm Reschedule"),
                                    onPress: availableFutureOffers.length === 0 
                                        ? () => {
                                            if (isSubmittingRef.current || isSubmitting) return;
                                            isSubmittingRef.current = true;
                                            setIsSubmitting(true);
                                            onConfirm('explore');
                                        } 
                                        : handleConfirm,
                                    disabled: (availableFutureOffers.length > 0 && (!selectedOfferId || !isReasonValid)) || isSubmitting,
                                    isLoading: isSubmitting
                                }}
                            />
                        </View>
                    </KeyboardAvoidingView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
    },
    backdropTouch: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: Colors.BACKGROUND,
        overflow: 'hidden',
    },
    modalContentDesktop: {
        alignSelf: 'center',
        width: '92%',
        maxWidth: 580,
        borderRadius: 24,
        maxHeight: SCREEN_HEIGHT * 0.88,
        marginBottom: 'auto',
        marginTop: 'auto',
        ...GlobalStyles.dropShadow(5),
    },
    modalContentMobile: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '90%',
    },
    keyboardContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
        backgroundColor: Colors.WHITE,
    },
    headerDesktop: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    headerMobile: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 0,
    },
    closeBtn: {
        padding: 6,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 20,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
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
        marginBottom: 20,
    },
    trailLabel: {
        marginBottom: 12,
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 12,
        color: Colors.TEXT_SECONDARY,
    },
    footerContainer: {
        backgroundColor: Colors.WHITE,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_ULTRALIGHT,
    },
});

export default RescheduleModal;
