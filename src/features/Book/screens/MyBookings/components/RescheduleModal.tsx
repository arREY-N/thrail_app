import React, { useRef, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

import { IOffer } from '@/src/core/models/Offer/Offer';
import OfferCard, { OfferData } from '@/src/features/Book/components/OfferCard';
import { formatDateToStandard } from '@/src/utils/dateFormatter';

export interface RescheduleModalProps {
    /** Whether the modal is visible */
    visible: boolean;
    /** Callback to close the modal */
    onClose: () => void;
    /** Callback when user confirms selection */
    onConfirm: (selectedOffer: IOffer | 'explore') => void;
    /** Array of available future offers */
    availableFutureOffers?: IOffer[];
}

/**
 * Modal to select a new date from future offers to reschedule.
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRef = useRef(false);

    const [prevVisible, setPrevVisible] = useState(visible);
    if (visible !== prevVisible) {
        setPrevVisible(visible);
        if (!visible) {
            setIsSubmitting(false);
            setSelectedOfferId(null);
        }
    }

    const handleConfirm = () => {
        if (isSubmittingRef.current || isSubmitting) return;
        const selected = availableFutureOffers.find(o => o.id === selectedOfferId);
        if (selected) {
            isSubmittingRef.current = true;
            setIsSubmitting(true);
            onConfirm(selected);
            setSelectedOfferId(null);
        }
    };

    const handleClose = () => {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        setSelectedOfferId(null);
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
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    
                    <View style={styles.header}>
                        <CustomText variant="h2" style={styles.title}>
                            Select New Date
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
                        contentContainerStyle={styles.scrollContent}
                    >
                        {availableFutureOffers.length > 0 ? (
                            availableFutureOffers.map((offer) => (
                                <View key={offer.id} style={styles.cardWrapper}>
                                    <CustomText variant="label" style={styles.trailLabel}>
                                        {offer.trail?.name || 'Hike'} — {formatDateToStandard(offer.date)}
                                    </CustomText>
                                    
                                    <OfferCard 
                                        offer={offer as unknown as OfferData}
                                        isSelected={selectedOfferId === offer.id}
                                        onSelect={() => {
                                            setSelectedOfferId(
                                                selectedOfferId === offer.id ? null : offer.id
                                            );
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
                                disabled: (availableFutureOffers.length > 0 && !selectedOfferId) || isSubmitting,
                                isLoading: isSubmitting
                            }}
                        />
                    </View>

                </View>
            </View>
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
        backgroundColor: 'transparent', 
        paddingBottom: 20 
    }
});

export default RescheduleModal;
