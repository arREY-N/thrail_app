import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomFeedbackInput from '@/src/components/CustomFeedbackInput';
import CustomIcon from '@/src/components/CustomIcon';
import { FooterButtonConfig } from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import { useToast } from '@/src/components/Toast/Toast';
import {
    isTutorialMeasurementActive,
    registerMeasureCallback,
    registerTutorialLayout,
} from '@/src/components/Tutorial/Tutorial';
import { Colors } from '@/src/constants/colors';
import DocumentReviewCard from '@/src/features/Admin/screens/Booking/components/DocumentReviewCard';

import { Booking } from '@/src/core/models/Booking/Booking';
import { 
    DOCUMENT_REJECTION_REASONS, 
    PHONE_REJECTION_REASONS 
} from '@/src/features/Admin/utils/reviewMessages';

export type DocValidState = 'pending' | 'approved' | 'rejected';

export interface DocState {
    name: string;
    file: string;
    valid: DocValidState;
}

export const REJECTION_SUGGESTIONS: string[] = [
    ...DOCUMENT_REJECTION_REASONS,
    ...PHONE_REJECTION_REASONS,
];

/**
 * Props for DocumentTab component.
 * @param booking - The booking details object.
 * @param docStates - List of document validation states.
 * @param setDocStates - Callback to update document validation states.
 * @param viewedDocs - Record of viewed status per document index.
 * @param isReviewComplete - Flag indicating if review is complete.
 * @param isRejectedStatus - Flag indicating if booking was rejected.
 * @param isCancelledStatus - Flag indicating if booking was cancelled.
 * @param hasRejections - Flag indicating if any document is rejected.
 * @param showRejectionReason - Optional flag to force displaying rejection reason box.
 * @param rejectionReason - Text reason for rejection.
 * @param setRejectionReason - Callback to update rejection reason text.
 * @param onViewFile - Callback to trigger viewing document.
 * @param suggestions - Optional dynamic list of prioritized rejection reason suggestions.
 * @param onAttachmentRequired - Optional callback triggered when user taps decision without viewing attachment.
 * @param onInteraction - Optional callback tracking admin interactions.
 * @param firstCardRef - Optional ref for tutorial measurement of the first document card.
 * @param primaryButton - Optional primary action button configuration (e.g. Approve Booking / Submit Rejection).
 * @param secondaryButton - Optional secondary action button configuration (e.g. Reject Booking / Cancel Rejection).
 * @param isTutorialFooterPreview - Flag to force rendering buttons for tutorial inspection.
 */
export interface DocumentTabProps {
    booking: Booking;
    docStates: DocState[];
    setDocStates: (states: DocState[]) => void;
    viewedDocs: Record<number, boolean>;
    isReviewComplete: boolean;
    isRejectedStatus: boolean;
    isCancelledStatus: boolean;
    isCancellationPending?: boolean;
    hasRejections: boolean;
    showRejectionReason?: boolean;
    rejectionReason: string;
    setRejectionReason: (reason: string) => void;
    onViewFile: (fileUrl: string, index: number) => void;
    suggestions?: string[];
    onAttachmentRequired?: () => void;
    onInteraction?: () => void;
    firstCardRef?: React.RefObject<View | null>;
    primaryButton?: FooterButtonConfig;
    secondaryButton?: FooterButtonConfig;
    isTutorialFooterPreview?: boolean;
}

/**
 * DocumentTab — Displays the list of required documents for a booking and handles approvals/rejections.
 */
const DocumentTab: React.FC<DocumentTabProps> = ({ 
    booking: _booking, 
    docStates, 
    setDocStates, 
    viewedDocs, 
    isReviewComplete, 
    isRejectedStatus: _isRejectedStatus, 
    isCancelledStatus,
    isCancellationPending = false,
    hasRejections, 
    showRejectionReason = false,
    rejectionReason, 
    setRejectionReason, 
    onViewFile,
    suggestions,
    onAttachmentRequired,
    onInteraction,
    firstCardRef,
    primaryButton,
    secondaryButton,
    isTutorialFooterPreview = false,
}) => {
    const { showToast } = useToast();
    const actionsRef = useRef<View>(null);

    const measureActionsNow = useCallback(() => {
        actionsRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('booking_footer', { x, y, width, height });
            }
        });
    }, []);

    useEffect(() => {
        return registerMeasureCallback('booking_footer', measureActionsNow);
    }, [measureActionsNow]);

    const handleActionsLayout = () => {
        if (isTutorialMeasurementActive()) {
            measureActionsNow();
        }
    };

    const toggleDocDecision = (index: number, statusString: DocValidState) => {
        if (isReviewComplete || isCancellationPending) return; 
        
        if (!viewedDocs[index] && docStates[index].valid === 'pending') {
            if (onAttachmentRequired) {
                onAttachmentRequired();
                return;
            }
            showToast.error("Please open the attachment before recording a decision.");
            return;
        }
        
        onInteraction?.();
        const updated = [...docStates];
        updated[index] = { ...updated[index], valid: statusString };
        setDocStates(updated);
    };

    const shouldShowButtons = (!isReviewComplete || isTutorialFooterPreview) && !isCancellationPending && Boolean(primaryButton || secondaryButton);

    return (
        <View style={styles.tabContent}>
            {docStates.length === 0 ? (
                <View style={styles.emptyCard}>
                    <CustomIcon library="Feather" name="file-text" size={32} color={Colors.TEXT_SECONDARY} />
                    <CustomText style={styles.emptyTitle}>No Documents Required</CustomText>
                    <CustomText variant="caption" style={styles.emptySubtitle}>
                        This reservation has no document requirements.
                    </CustomText>
                </View>
            ) : (
                docStates.map((doc, index) => (
                    <View
                        key={index}
                        ref={index === 0 ? firstCardRef : undefined}
                        collapsable={false}
                    >
                        <DocumentReviewCard 
                            doc={doc} 
                            index={index} 
                            needsReview={!viewedDocs[index] && doc.valid === 'pending'}
                            isViewed={!!viewedDocs[index]}
                            isReviewComplete={isReviewComplete || isCancellationPending}
                            isCancelledStatus={isCancelledStatus}
                            onViewFile={onViewFile} 
                            onToggleDecision={toggleDocDecision}
                        />
                    </View>
                ))
            )}

            {!isReviewComplete && !isCancellationPending && (hasRejections || showRejectionReason) && (
                <View style={styles.reasonBox}>
                    <CustomFeedbackInput 
                        label="Rejection Reason *"
                        helperText="Explain why the booking or documents were rejected. The hiker will receive this exact message."
                        placeholder="Explain what needs to be fixed..."
                        value={rejectionReason}
                        onChangeText={setRejectionReason}
                        suggestions={suggestions || REJECTION_SUGGESTIONS}
                        variant="danger"
                    />
                </View>
            )}

            {shouldShowButtons && (
                <View
                    ref={actionsRef}
                    collapsable={false}
                    onLayout={handleActionsLayout}
                    style={styles.actionsContainer}
                >
                    {secondaryButton && (
                        <View style={styles.actionButtonWrapper}>
                            <CustomButton
                                title={secondaryButton.title}
                                onPress={secondaryButton.onPress}
                                variant={secondaryButton.variant || 'outline'}
                                style={[styles.actionButton, secondaryButton.style]}
                                textStyle={secondaryButton.textStyle}
                                disabled={secondaryButton.disabled}
                                isLoading={secondaryButton.isLoading}
                                validationState={secondaryButton.validationState}
                                isIdleDisabled={secondaryButton.isIdleDisabled}
                                numberOfLines={1}
                                adjustsFontSizeToFit={true}
                                minimumFontScale={0.75}
                            />
                        </View>
                    )}
                    {primaryButton && (
                        <View style={styles.actionButtonWrapper}>
                            <CustomButton
                                title={primaryButton.title}
                                onPress={primaryButton.onPress}
                                variant={primaryButton.variant || 'primary'}
                                style={[styles.actionButton, primaryButton.style]}
                                textStyle={primaryButton.textStyle}
                                disabled={primaryButton.disabled}
                                isLoading={primaryButton.isLoading}
                                validationState={primaryButton.validationState}
                                isIdleDisabled={primaryButton.isIdleDisabled}
                                numberOfLines={1}
                                adjustsFontSizeToFit={true}
                                minimumFontScale={0.75}
                            />
                        </View>
                    )}
                </View>
            )}
            
        </View>
    );
};

const styles = StyleSheet.create({
    tabContent: { 
        paddingTop: 4 
    },
    reasonBox: { 
        marginBottom: 20 
    },
    emptyCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        paddingVertical: 32,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        marginBottom: 16,
        gap: 8,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginTop: 4,
    },
    emptySubtitle: {
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
        marginBottom: 16,
        width: '100%',
        alignItems: 'stretch',
    },
    actionButtonWrapper: {
        flex: 1,
    },
    actionButton: {
        minHeight: 52,
        justifyContent: 'center',
    },
});

export default DocumentTab;
