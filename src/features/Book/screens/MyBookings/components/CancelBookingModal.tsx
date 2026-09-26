import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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
import CustomText from '@/src/components/CustomText';
import ExpandableText from '@/src/components/ExpandableText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface CancelBookingModalProps {
    /** Whether the modal is visible */
    visible: boolean;
    /** Callback to close the modal */
    onClose: () => void;
    /** Callback when user confirms reason */
    onConfirm: (reason: string) => Promise<void> | void;
    /** Type of action being performed */
    actionType: 'cancel' | 'refund' | 'update' | null | string;
    /** Pre-filled reason if editing or appealing */
    initialReason?: string;
    /** Previous reason submitted by user (shown as read-only card in update/appeal mode) */
    previousReason?: string;
    /** Whether the submission request is in progress */
    isSubmitting?: boolean;
    /** Error message to display, if any */
    errorMessage?: string | null;
}

/**
 * Universal Responsive Modal for booking cancellations, refund requests, and appeals.
 * Displays centered with breathable adaptive width on desktop/web,
 * and slides up as an interactive bottom sheet on mobile screens.
 */
const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
    visible,
    onClose,
    onConfirm,
    actionType,
    initialReason = '',
    previousReason = '',
    isSubmitting = false,
    errorMessage = null,
}) => {
    const insets = useSafeAreaInsets();
    const { isDesktop, isTablet } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;

    const isUpdate = actionType === 'update';

    const [renderModal, setRenderModal] = useState<boolean>(visible);
    if (visible && !renderModal) {
        setRenderModal(true);
    }

    const [reason, setReason] = useState<string>(isUpdate ? '' : (initialReason || ''));
    const [animValue] = useState(() => new Animated.Value(0));

    const [prevVisible, setPrevVisible] = useState(visible);
    if (visible !== prevVisible) {
        setPrevVisible(visible);
        if (visible) {
            setRenderModal(true);
            setReason(isUpdate ? '' : (initialReason || ''));
        }
    }

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

    const isRefund = actionType === 'refund';

    let title = 'Cancel Booking';
    let warningText = 'Once submitted, your cancellation request will be reviewed by the organizer. Refunds (if applicable) take 3–5 business days to process after approval.';
    let confirmLabel = 'Confirm Cancel';
    let suggestions = [
        'Schedule conflict',
        'Transportation issue',
        'Emergency',
        'Health concerns',
        'Weather forecast',
        'Change of plans',
    ];

    if (isRefund) {
        title = 'Request Refund';
        warningText = 'Refund requests are subject to organizer approval based on cancellation policy deadlines. Approved refunds are credited back via your original payment method.';
        confirmLabel = 'Submit Request';
        suggestions = [
            'Medical emergency',
            'Severe weather',
            'Booked incorrect date',
            'Event cancelled',
            'Family emergency',
        ];
    } else if (isUpdate) {
        title = 'Update Cancellation Reason';
        warningText = 'Provide updated or additional details for your cancellation request to help the organizer re-evaluate your appeal.';
        confirmLabel = 'Save Updates';
        suggestions = [
            'Clarified medical certificate',
            'Work travel documentation',
            'Transportation delay receipt',
            'Additional context provided',
        ];
    }

    const isConfirmDisabled = !reason.trim() || isSubmitting;

    const handleConfirm = async () => {
        if (isConfirmDisabled) return;
        await onConfirm(reason.trim());
    };

    if (!renderModal) return null;

    return (
        <Modal
            transparent={true}
            visible={renderModal}
            animationType="none"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.modalContainer}
            >
                <Animated.View style={[styles.backdrop, { opacity: animValue }]}>
                    <TouchableOpacity
                        style={styles.backdropTouch}
                        activeOpacity={1}
                        onPress={onClose}
                    />
                </Animated.View>

                <Animated.View
                    style={[
                        styles.modalContent,
                        isWideScreen ? styles.modalContentDesktop : styles.modalContentMobile,
                        { paddingBottom: isWideScreen ? 24 : Math.max(insets.bottom + 20, 24) },
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
                    <View style={styles.header}>
                        <View style={styles.headerSide} />
                        <CustomText variant="h3" style={styles.headerTitle}>
                            {title}
                        </CustomText>
                        <View style={[styles.headerSide, styles.headerSideRight]}>
                            <TouchableOpacity
                                onPress={onClose}
                                activeOpacity={0.7}
                                style={styles.closeBtn}
                                accessibilityLabel="Close modal"
                            >
                                <CustomIcon
                                    library="Feather"
                                    name="x"
                                    size={20}
                                    color={Colors.TEXT_PRIMARY}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollBody}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.warningBox}>
                            <CustomIcon
                                library="Feather"
                                name="alert-triangle"
                                size={18}
                                color={Colors.ERROR}
                            />
                            <CustomText variant="caption" style={styles.warningText}>
                                {warningText}
                            </CustomText>
                        </View>

                        {errorMessage ? (
                            <View style={styles.errorBox}>
                                <CustomIcon
                                    library="Feather"
                                    name="alert-circle"
                                    size={16}
                                    color={Colors.ERROR}
                                />
                                <CustomText variant="caption" style={styles.errorText}>
                                    {errorMessage}
                                </CustomText>
                            </View>
                        ) : null}

                        {isUpdate && Boolean(previousReason) ? (
                            <View style={styles.previousReasonBox}>
                                <CustomText variant="caption" style={styles.previousReasonLabel}>
                                    PREVIOUS SUBMITTED REASON
                                </CustomText>
                                <ExpandableText
                                    text={previousReason || ''}
                                    quote={true}
                                    textStyle={styles.previousReasonText}
                                    characterLimit={150}
                                    arrowColor={Colors.TEXT_PRIMARY}
                                />
                            </View>
                        ) : null}

                        <CustomFeedbackInput
                            label={isUpdate ? 'Updated Reason / Context' : `Reason for ${isRefund ? 'Refund' : 'Cancellation'}`}
                            placeholder={isUpdate ? 'Explain additional context or documents for your appeal...' : `Please tell us why you are ${isRefund ? 'requesting a refund' : 'canceling'}...`}
                            helperText="Tap a suggestion above or type your own detailed reason."
                            value={reason}
                            onChangeText={setReason}
                            suggestions={suggestions}
                            variant="danger"
                        />

                        <View style={styles.counterRow}>
                            <CustomText variant="caption" style={styles.counterText}>
                                {reason.length} / 300 characters
                            </CustomText>
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={onClose}
                            activeOpacity={0.7}
                            disabled={isSubmitting}
                        >
                            <CustomText style={styles.cancelBtnText}>
                                {isUpdate ? 'Cancel' : 'Keep Booking'}
                            </CustomText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.confirmBtn,
                                isConfirmDisabled && styles.confirmBtnDisabled,
                            ]}
                            onPress={handleConfirm}
                            disabled={isConfirmDisabled}
                            activeOpacity={0.8}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color={Colors.WHITE} />
                            ) : (
                                <CustomText
                                    style={[
                                        styles.confirmBtnText,
                                        isConfirmDisabled && styles.confirmBtnTextDisabled,
                                    ]}
                                >
                                    {confirmLabel}
                                </CustomText>
                            )}
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
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
        backgroundColor: Colors.MODAL_OVERLAY,
    },
    backdropTouch: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: Colors.WHITE,
        width: '100%',
        maxHeight: '90%',
        ...GlobalStyles.dropShadow(3),
    },
    modalContentMobile: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    modalContentDesktop: {
        alignSelf: 'center',
        marginBottom: 'auto',
        marginTop: 'auto',
        width: '92%',
        maxWidth: 580,
        borderRadius: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 16,
    },
    headerSide: {
        width: 32,
    },
    headerSideRight: {
        alignItems: 'flex-end',
    },
    headerTitle: {
        fontSize: 18,
        color: Colors.ERROR,
        marginBottom: 0,
        textAlign: 'center',
        flex: 1,
    },
    closeBtn: {
        padding: 6,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 16,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        width: '100%',
    },
    scrollBody: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 12,
    },
    warningBox: {
        flexDirection: 'row',
        backgroundColor: Colors.ERROR_BG,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.ERROR_BORDER,
        gap: 12,
        marginBottom: 20,
        alignItems: 'flex-start',
    },
    warningText: {
        flex: 1,
        color: Colors.ERROR,
        lineHeight: 18,
        fontSize: 13,
    },
    errorBox: {
        flexDirection: 'row',
        backgroundColor: Colors.ERROR_BG,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.ERROR_BORDER,
        gap: 8,
        marginBottom: 16,
        alignItems: 'center',
    },
    errorText: {
        flex: 1,
        color: Colors.ERROR,
        fontSize: 12,
        fontWeight: '500',
    },
    previousReasonBox: {
        backgroundColor: Colors.BACKGROUND,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        marginBottom: 16,
    },
    previousReasonLabel: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: 'bold',
        fontSize: 11,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    previousReasonText: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 13,
        fontStyle: 'italic',
        lineHeight: 19,
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
    footer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: Colors.GRAY_LIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.WHITE,
    },
    cancelBtnText: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        fontSize: 14,
    },
    confirmBtn: {
        flex: 1.2,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: Colors.ERROR,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmBtnDisabled: {
        backgroundColor: Colors.BUTTON_DISABLED_BG,
    },
    confirmBtnText: {
        fontWeight: 'bold',
        color: Colors.WHITE,
        fontSize: 14,
    },
    confirmBtnTextDisabled: {
        color: Colors.BUTTON_DISABLED_TEXT,
    },
});

export default CancelBookingModal;
