/**
 * @file BookingActionMenuModal.tsx
 * @description Responsive modal menu presenting contextual booking actions (reschedule, cancel draft, cancel booking, refund).
 * Behaviors match CustomFilterModal: slides up as a bottom sheet on mobile, centers cleanly as an elevation-shadowed dialog on web/desktop.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BookingActionMenuModalProps {
    /** Whether the modal is visible */
    visible: boolean;
    /** Callback to close the modal */
    onClose: () => void;
    /** Whether booking is eligible for rescheduling */
    canReschedule: boolean;
    /** Whether booking is an unapproved draft that can be cancelled directly */
    canCancelDraft: boolean;
    /** Whether booking requires formal cancellation request */
    canCancelBooking: boolean;
    /** Whether booking is confirmed and eligible for cancellation + refund request */
    canRefund: boolean;
    /** Callback when user selects Reschedule */
    onReschedulePress: () => void;
    /** Callback when user selects Cancel Reservation (draft) */
    onCancelDraftPress: () => void;
    /** Callback when user selects Cancel Booking */
    onCancelBookingPress: () => void;
    /** Callback when user selects Cancel & Request Refund */
    onRefundPress: () => void;
}

interface ActionItemConfig {
    id: string;
    label: string;
    icon: string;
    isError?: boolean;
    onPress: () => void;
}

/**
 * Universal Responsive Modal for booking action options.
 *
 * @param props - Component properties
 * @returns Rendered JSX element or null
 */
const BookingActionMenuModal = ({
    visible,
    onClose,
    canReschedule,
    canCancelDraft,
    canCancelBooking,
    canRefund,
    onReschedulePress,
    onCancelDraftPress,
    onCancelBookingPress,
    onRefundPress,
}: BookingActionMenuModalProps): React.JSX.Element | null => {
    const insets = useSafeAreaInsets();
    const { isDesktop, isTablet } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;

    const [renderModal, setRenderModal] = useState<boolean>(visible);
    if (visible && !renderModal) {
        setRenderModal(true);
    }
    const [animValue] = useState(() => new Animated.Value(0));

    const [prevVisible, setPrevVisible] = useState(visible);
    if (visible !== prevVisible) {
        setPrevVisible(visible);
        if (visible) {
            setRenderModal(true);
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

    const actions = useMemo<ActionItemConfig[]>(() => {
        const list: ActionItemConfig[] = [];

        if (canReschedule) {
            list.push({
                id: 'reschedule',
                label: 'Reschedule Booking',
                icon: 'calendar',
                isError: false,
                onPress: onReschedulePress,
            });
        }

        if (canCancelDraft) {
            list.push({
                id: 'cancel-draft',
                label: 'Cancel Reservation',
                icon: 'x-circle',
                isError: true,
                onPress: onCancelDraftPress,
            });
        }

        if (canCancelBooking) {
            list.push({
                id: 'cancel-booking',
                label: 'Cancel Booking',
                icon: 'x-circle',
                isError: true,
                onPress: onCancelBookingPress,
            });
        }

        if (canRefund) {
            list.push({
                id: 'refund',
                label: 'Cancel & Request Refund',
                icon: 'refresh-ccw',
                isError: true,
                onPress: onRefundPress,
            });
        }

        return list;
    }, [
        canReschedule,
        canCancelDraft,
        canCancelBooking,
        canRefund,
        onReschedulePress,
        onCancelDraftPress,
        onCancelBookingPress,
        onRefundPress,
    ]);

    if (!renderModal) {
        return null;
    }

    return (
        <Modal
            transparent={true}
            visible={renderModal}
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View style={styles.modalContainer}>
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
                        { paddingBottom: isWideScreen ? 24 : Math.max(insets.bottom + 16, 28) },
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
                    {!isWideScreen && <View style={styles.actionSheetHandle} />}

                    <View style={styles.headerRow}>
                        <CustomText variant="h3" style={styles.headerTitle}>
                            Booking Options
                        </CustomText>
                        <TouchableOpacity
                            onPress={onClose}
                            activeOpacity={0.7}
                            style={styles.closeBtn}
                            accessibilityLabel="Close action menu"
                        >
                            <CustomIcon
                                library="Feather"
                                name="x"
                                size={20}
                                color={Colors.TEXT_PRIMARY}
                            />
                        </TouchableOpacity>
                    </View>

                    {actions.map((action, index) => {
                        const isLast = index === actions.length - 1;
                        return (
                            <React.Fragment key={action.id}>
                                <TouchableOpacity
                                    style={styles.actionItem}
                                    onPress={() => {
                                        onClose();
                                        setTimeout(action.onPress, 300);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View
                                        style={
                                            action.isError
                                                ? styles.actionIconBgError
                                                : styles.actionIconBgPrimary
                                        }
                                    >
                                        <CustomIcon
                                            library="Feather"
                                            name={action.icon}
                                            size={18}
                                            color={action.isError ? Colors.ERROR : Colors.PRIMARY}
                                        />
                                    </View>
                                    <CustomText
                                        style={[
                                            styles.actionItemText,
                                            action.isError && styles.actionItemTextError,
                                        ]}
                                    >
                                        {action.label}
                                    </CustomText>
                                </TouchableOpacity>

                                {!isLast && <View style={styles.itemDivider} />}
                            </React.Fragment>
                        );
                    })}
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
        backgroundColor: Colors.MODAL_OVERLAY,
    },
    backdropTouch: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: Colors.WHITE,
        width: '100%',
        ...GlobalStyles.dropShadow(4, 0.15, Colors.SHADOW, { radius: 16 }),
    },
    modalContentMobile: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    modalContentDesktop: {
        alignSelf: 'center',
        marginTop: 'auto',
        marginBottom: 'auto',
        width: 440,
        maxWidth: '90%',
        borderRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    actionSheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: Colors.GRAY_LIGHT,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 18,
        color: Colors.TEXT_PRIMARY,
        marginBottom: 0,
    },
    closeBtn: {
        padding: 6,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 16,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 16,
    },
    itemDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        width: '100%',
    },
    actionIconBgPrimary: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionIconBgError: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.ERROR_BG,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionItemText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    actionItemTextError: {
        color: Colors.ERROR,
    },
});

export default BookingActionMenuModal;
