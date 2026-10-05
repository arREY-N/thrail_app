/**
 * @file AdminCancelBookingModal.tsx
 * @description Dedicated modal for organizer-initiated booking cancellations,
 * featuring organizer suggestion chips (weather, trail closures, safety) and custom reason input.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
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

import CustomFeedbackInput from '@/src/components/CustomFeedbackInput';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { ORGANIZER_CANCEL_REASONS } from '@/src/features/Admin/utils/reviewMessages';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

export interface AdminCancelBookingModalProps {
    /** Whether the modal is visible */
    visible: boolean;
    /** Callback to close the modal */
    onClose: () => void;
    /** Callback when admin confirms cancellation with reason */
    onConfirm: (reason: string) => Promise<void> | void;
    /** Whether the cancellation action is in progress */
    isSubmitting?: boolean;
    /** Error message to display, if any */
    errorMessage?: string | null;
}

/**
 * Universal Responsive Modal for organizer-initiated booking cancellations.
 * Centers on tablet/desktop screens and slides up as an interactive bottom sheet on mobile screens.
 */
const AdminCancelBookingModal: React.FC<AdminCancelBookingModalProps> = ({
    visible,
    onClose,
    onConfirm,
    isSubmitting = false,
    errorMessage = null,
}) => {
    const insets = useSafeAreaInsets();
    const { isDesktop, isTablet } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;

    const scrollViewRef = useRef<ScrollView>(null);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [renderModal, setRenderModal] = useState<boolean>(visible);
    if (visible && !renderModal) {
        setRenderModal(true);
    }

    const [reason, setReason] = useState<string>('');
    const [animValue] = useState(() => new Animated.Value(0));

    const [prevVisible, setPrevVisible] = useState(visible);
    if (visible !== prevVisible) {
        setPrevVisible(visible);
        if (visible) {
            setRenderModal(true);
            setReason('');
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

    const isConfirmDisabled = !reason.trim() || isSubmitting;

    const handleConfirm = async () => {
        if (isConfirmDisabled) return;
        await onConfirm(reason.trim());
    };

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, () => {
            setIsKeyboardVisible(true);
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setIsKeyboardVisible(false);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    if (!renderModal) return null;

    return (
        <Modal
            transparent={true}
            visible={renderModal}
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={[
                    styles.modalContainer,
                    {
                        justifyContent: isKeyboardVisible ? 'flex-start' : 'center',
                        paddingTop: isKeyboardVisible ? Math.max(insets.top + 16, 24) : 16,
                        paddingBottom: isKeyboardVisible ? 16 : Math.max(insets.bottom + 16, 16),
                    },
                ]}
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
                        {
                            maxWidth: isWideScreen ? 540 : 420,
                            maxHeight: isKeyboardVisible ? '62%' : '88%',
                            opacity: animValue,
                            transform: [
                                {
                                    scale: animValue.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.95, 1],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    <View style={styles.header}>
                        <View style={styles.headerSide} />
                        <CustomText variant="h3" style={styles.headerTitle}>
                            Cancel Booking
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
                        ref={scrollViewRef}
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
                                Cancelling this booking will notify the hiker and update the reservation status. Please select a reason or provide a clear explanation for the cancellation.
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

                        <CustomFeedbackInput
                            label="Reason for Cancellation"
                            placeholder="Select a suggestion above or enter specific details..."
                            helperText="Tap a suggestion above or type your own detailed reason."
                            value={reason}
                            onChangeText={setReason}
                            suggestions={[...ORGANIZER_CANCEL_REASONS]}
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
                                Keep Booking
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
                                    Confirm Cancellation
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
        alignItems: 'center',
        paddingHorizontal: 16,
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
        borderRadius: 24,
        paddingBottom: 20,
        ...GlobalStyles.dropShadow(5, 0.1, Colors.SHADOW, { radius: 12 }),
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

export default AdminCancelBookingModal;
