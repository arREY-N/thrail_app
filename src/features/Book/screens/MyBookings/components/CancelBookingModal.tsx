import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomButton from '@/src/components/CustomButton';
import CustomFeedbackInput from '@/src/components/CustomFeedbackInput';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import { CustomToast } from '@/src/components/Toast/Toast';
import ExpandableText from '@/src/components/ExpandableText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { IUserWalletDetails } from '@/src/core/models/Cancellation/Cancellation';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface CancelBookingModalProps {
    /** Whether the modal is visible */
    visible: boolean;
    /** Callback to close the modal */
    onClose: () => void;
    /** Callback when user confirms reason and optional refund wallet details */
    onConfirm: (reason: string, userWallet?: IUserWalletDetails<Date>) => Promise<void> | void;
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
    /** Whether the booking has captured payments (requires wallet details for refund) */
    isPaidBooking?: boolean;
}

/**
 * Universal Responsive Modal for booking cancellations, refund requests, and appeals.
 * Displays centered with breathable adaptive width on desktop/web,
 * and slides up as an interactive bottom sheet with physical keyboard lifting on mobile.
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
    isPaidBooking = false,
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
    // E-wallet states for refunds (never auto-filled, starts blank)
    const [walletType, setWalletType] = useState<'GCash' | 'Maya'>('GCash');
    const [accountNumber, setAccountNumber] = useState<string>('');
    const [accountName, setAccountName] = useState<string>('');

    const [animValue] = useState(() => new Animated.Value(0));
    const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

    const [toastConfig, setToastConfig] = useState<{
        message: string | null;
        type: 'error' | 'warning' | 'info' | 'success';
    }>({
        message: null,
        type: 'error',
    });
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);

    const showModalToast = (
        message: string,
        type: 'error' | 'warning' | 'info' | 'success' = 'error'
    ) => {
        setToastConfig({ message, type });
    };

    const [prevVisible, setPrevVisible] = useState(visible);
    if (visible !== prevVisible) {
        setPrevVisible(visible);
        if (visible) {
            setRenderModal(true);
            setReason(isUpdate ? '' : (initialReason || ''));
            // Explicitly reset wallet inputs to blank (do not auto-fill registered user number)
            setWalletType('GCash');
            setAccountNumber('');
            setAccountName('');
            setToastConfig({ message: null, type: 'error' });
            setHasAttemptedSubmit(false);
        }
    }

    // Sync external error messages into in-modal toast
    const [prevErrorMessage, setPrevErrorMessage] = useState(errorMessage);
    if (errorMessage !== prevErrorMessage) {
        setPrevErrorMessage(errorMessage);
        if (errorMessage) {
            showModalToast(errorMessage, 'error');
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

    const isSubmittingRef = useRef(false);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        if (!visible) {
            isSubmittingRef.current = false;
        }
    }, [visible]);

    // Keyboard listener: tracks exact pixel height for physical bottom sheet lift on mobile
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, (e) => {
            setKeyboardHeight(e.endCoordinates.height);
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setKeyboardHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    // Physical Escape key dismissal on Web
    const handleClose = useCallback(() => {
        setToastConfig({ message: null, type: 'error' });
        setHasAttemptedSubmit(false);
        onClose();
    }, [onClose]);

    useEffect(() => {
        if (Platform.OS !== 'web' || !visible) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [visible, handleClose]);

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

    const isReasonValid = reason.trim().length >= 5;
    const shouldPromptWallet = (isPaidBooking || actionType === 'refund') && !isUpdate;
    const cleanedNumber = accountNumber.replace(/\D/g, '');
    const isWalletValid = !shouldPromptWallet || (
        cleanedNumber.length === 11 &&
        cleanedNumber.startsWith('09') &&
        accountName.trim().length >= 2
    );
    const isOverallValid = isReasonValid && isWalletValid;

    const handleConfirm = async () => {
        if (isSubmittingRef.current || isSubmitting) return;

        if (!isReasonValid) {
            setHasAttemptedSubmit(true);
            showModalToast('Please provide a reason with at least 5 characters.', 'error');
            return;
        }

        if (shouldPromptWallet) {
            if (cleanedNumber.length !== 11 || !cleanedNumber.startsWith('09')) {
                setHasAttemptedSubmit(true);
                showModalToast('Please enter a valid 11-digit mobile number starting with 09.', 'error');
                return;
            }
            if (accountName.trim().length < 2) {
                setHasAttemptedSubmit(true);
                showModalToast('Please enter the registered account holder full name.', 'error');
                return;
            }
        }

        isSubmittingRef.current = true;
        try {
            const userWallet: IUserWalletDetails<Date> | undefined = shouldPromptWallet
                ? {
                    walletType,
                    accountNumber: cleanedNumber,
                    accountName: accountName.trim(),
                    submittedAt: new Date(),
                }
                : undefined;

            await onConfirm(reason.trim(), userWallet);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to submit request. Please try again.';
            showModalToast(msg, 'error');
            setHasAttemptedSubmit(true);
        } finally {
            isSubmittingRef.current = false;
        }
    };

    if (!renderModal) return null;

    // Toast offset calculation: guarantee clean 12px floating headroom above action buttons
    const footerHeight = 52 + 16;
    const baseBottomPadding = isWideScreen ? 24 : Math.max(insets.bottom + 16, 24);
    const toastBottomOffset = (keyboardHeight > 0 ? keyboardHeight + 16 : baseBottomPadding) + footerHeight + 12;

    return (
        <Modal
            transparent={true}
            visible={renderModal}
            animationType="none"
            onRequestClose={handleClose}
            statusBarTranslucent={true}
        >
            <KeyboardAvoidingView
                behavior={undefined}
                style={styles.modalContainer}
            >
                <Animated.View style={[styles.backdrop, { opacity: animValue }]}>
                    <TouchableOpacity
                        style={styles.backdropTouch}
                        activeOpacity={1}
                        onPress={handleClose}
                    />
                </Animated.View>

                <Animated.View
                    style={[
                        styles.modalContent,
                        isWideScreen ? styles.modalContentDesktop : styles.modalContentMobile,
                        {
                            paddingBottom: keyboardHeight > 0
                                ? keyboardHeight + 16
                                : isWideScreen
                                ? 24
                                : Math.max(insets.bottom + 16, 24),
                            maxHeight: isWideScreen
                                ? '85%'
                                : keyboardHeight > 0
                                ? Math.round((SCREEN_HEIGHT - keyboardHeight - insets.top) * 0.88) + keyboardHeight + 16
                                : '90%',
                        },
                        {
                            transform: [
                                {
                                    translateY: animValue.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: isWideScreen ? [40, 0] : [SCREEN_HEIGHT, 0],
                                    }),
                                },
                            ],
                            opacity: isWideScreen ? animValue : 1,
                        },
                    ]}
                >
                    {!isWideScreen && <View style={styles.sheetHandle} />}

                    <View style={styles.header}>
                        <View style={styles.headerSide} />
                        <CustomText variant="h3" style={styles.headerTitle}>
                            {title}
                        </CustomText>
                        <View style={[styles.headerSide, styles.headerSideRight]}>
                            <TouchableOpacity
                                onPress={handleClose}
                                activeOpacity={0.7}
                                style={styles.closeBtn}
                                accessibilityLabel="Close modal"
                                disabled={isSubmitting}
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
                        ref={scrollViewRef}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[styles.scrollBody, { paddingBottom: keyboardHeight > 0 ? 90 : 16 }]}
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

                        {shouldPromptWallet && (
                            <View style={styles.walletSection}>
                                <View style={styles.walletHeader}>
                                    <CustomIcon library="Feather" name="credit-card" size={16} color={Colors.PRIMARY} />
                                    <CustomText style={styles.walletHeaderTitle}>Refund E-Wallet Details</CustomText>
                                </View>
                                <CustomText variant="caption" style={styles.walletHeaderSubtitle}>
                                    Enter your GCash or Maya details where approved refunds will be sent.
                                </CustomText>

                                <View style={styles.walletTypeRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.walletTypeBtn,
                                            walletType === 'GCash' && styles.walletTypeBtnActive,
                                        ]}
                                        onPress={() => setWalletType('GCash')}
                                        activeOpacity={0.8}
                                    >
                                        <CustomIcon
                                            library="Feather"
                                            name="smartphone"
                                            size={16}
                                            color={walletType === 'GCash' ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                                        />
                                        <CustomText
                                            style={[
                                                styles.walletTypeText,
                                                walletType === 'GCash' && styles.walletTypeTextActive,
                                            ]}
                                        >
                                            GCash
                                        </CustomText>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.walletTypeBtn,
                                            walletType === 'Maya' && styles.walletTypeBtnActive,
                                        ]}
                                        onPress={() => setWalletType('Maya')}
                                        activeOpacity={0.8}
                                    >
                                        <CustomIcon
                                            library="Feather"
                                            name="activity"
                                            size={16}
                                            color={walletType === 'Maya' ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                                        />
                                        <CustomText
                                            style={[
                                                styles.walletTypeText,
                                                walletType === 'Maya' && styles.walletTypeTextActive,
                                            ]}
                                        >
                                            Maya
                                        </CustomText>
                                    </TouchableOpacity>
                                </View>

                                <CustomTextInput
                                    label="Mobile Number (11-Digits) *"
                                    placeholder="0917 123 4567"
                                    keyboardType="phone-pad"
                                    maxLength={11}
                                    value={accountNumber}
                                    onChangeText={(t: string) => setAccountNumber(t.replace(/\D/g, '').slice(0, 11))}
                                    onFocus={() => {
                                        setTimeout(() => {
                                            scrollViewRef.current?.scrollToEnd({ animated: true });
                                        }, Platform.OS === 'android' ? 200 : 100);
                                    }}
                                    icon="phone"
                                    iconLibrary="Feather"
                                    containerStyle={{ marginBottom: 12 }}
                                />

                                <CustomTextInput
                                    label="Account Full Name *"
                                    placeholder="e.g. Juan Dela Cruz"
                                    value={accountName}
                                    onChangeText={setAccountName}
                                    onFocus={() => {
                                        setTimeout(() => {
                                            scrollViewRef.current?.scrollToEnd({ animated: true });
                                        }, Platform.OS === 'android' ? 200 : 100);
                                    }}
                                    icon="user"
                                    iconLibrary="Feather"
                                    containerStyle={{ marginBottom: 4 }}
                                />
                            </View>
                        )}
                    </ScrollView>

                    <View style={styles.footer}>
                        <CustomButton
                            title={isUpdate ? 'Cancel' : 'Keep Booking'}
                            onPress={handleClose}
                            variant="outline"
                            disabled={isSubmitting}
                            style={styles.cancelBtn}
                        />

                        <CustomButton
                            title={confirmLabel}
                            onPress={handleConfirm}
                            variant={isUpdate ? 'primary' : 'destructive'}
                            isLoading={isSubmitting}
                            disabled={isSubmitting}
                            validationState={
                                isOverallValid
                                    ? 'valid'
                                    : (hasAttemptedSubmit ? 'error' : 'idle')
                            }
                            isIdleDisabled={false}
                            style={styles.confirmBtn}
                        />
                    </View>

                    <CustomToast
                        visible={!!toastConfig.message}
                        message={toastConfig.message || ''}
                        onHide={() => {
                            setToastConfig({ message: null, type: 'error' });
                            setHasAttemptedSubmit(false);
                        }}
                        type={toastConfig.type}
                        mode="simple"
                        position="floating"
                        bottomOffset={toastBottomOffset}
                    />
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
        ...GlobalStyles.dropShadow(5, 0.15, Colors.SHADOW, { radius: 16 }),
    },
    modalContentMobile: {
        width: '100%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    modalContentDesktop: {
        alignSelf: 'center',
        marginBottom: 'auto',
        marginTop: 'auto',
        width: '92%',
        maxWidth: 540,
        borderRadius: 24,
    },
    sheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: Colors.GRAY_LIGHT,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 16,
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
    walletSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_LIGHT,
    },
    walletHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    walletHeaderTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    walletHeaderSubtitle: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        marginBottom: 12,
        lineHeight: 16,
    },
    walletTypeRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 14,
    },
    walletTypeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        backgroundColor: Colors.WHITE,
    },
    walletTypeBtnActive: {
        borderColor: Colors.PRIMARY,
        backgroundColor: Colors.PRIMARY_LIGHT,
    },
    walletTypeText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
    },
    walletTypeTextActive: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    cancelBtn: {
        flex: 1,
        borderRadius: 14,
    },
    confirmBtn: {
        flex: 1.25,
        borderRadius: 14,
    },
});

export default CancelBookingModal;
