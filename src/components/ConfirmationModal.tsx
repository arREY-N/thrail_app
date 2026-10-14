/**
 * @file ConfirmationModal.tsx
 * @description Standardized, responsive confirmation dialog component for Thrail.
 * Supports Red (danger/warning) and Green (primary/affirmative) semantic themes with
 * a unified white surface, dynamic button stacking for small screens with long labels,
 * and dynamic asymmetric button weighting in horizontal row mode.
 */

import React, { ReactNode } from 'react';
import {
    Modal,
    Platform,
    StyleSheet,
    TextStyle,
    View,
    ViewStyle
} from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { IconLibrary } from '@/src/types/ui.types';

/**
 * Ratio mode for horizontal buttons.
 * - 'auto': Dynamically applies 1 : 1.35 ratio when primary label is longer.
 * - 'guided': Forces asymmetric 1 : 1.35 ratio to guide user focus toward primary CTA.
 * - 'equal': Forces symmetrical 1 : 1 ratio.
 */
export type ConfirmationModalButtonRatio = 'auto' | 'guided' | 'equal';

/**
 * Props for the ConfirmationModal component.
 *
 * @param visible - Controls the visibility of the modal dialog.
 * @param onClose - Callback triggered to dismiss or cancel the modal.
 * @param onConfirm - Callback triggered when the primary confirmation action is pressed.
 * @param title - Modal title string.
 * @param message - Descriptive message explaining the confirmation consequences.
 * @param cancelText - Label for the secondary cancel action.
 * @param confirmText - Label for the primary confirmation action.
 * @param isDestructive - Applies Red danger/warning theme if true; applies Green affirmative theme if false.
 * @param stackedButtons - Explicit override to force vertical stacked button layout on small screens.
 * @param buttonRatio - Ratio configuration for row mode ('auto', 'guided', 'equal').
 * @param isLoading - Indicates if the confirmation action is currently processing.
 * @param iconName - Name of the icon to display inside the circular header badge.
 * @param iconLibrary - Icon library for the header badge (defaults to Feather).
 * @param iconColor - Custom color override for the badge icon.
 * @param children - Optional custom body elements to render below the title.
 * @param testID - Optional accessibility/test identifier.
 */
export interface ConfirmationModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    cancelText?: string;
    confirmText?: string;
    isDestructive?: boolean;
    stackedButtons?: boolean;
    buttonRatio?: ConfirmationModalButtonRatio;
    isLoading?: boolean;
    iconName?: string;
    iconLibrary?: IconLibrary;
    iconColor?: string;
    children?: ReactNode;
    testID?: string;
}

/**
 * Computes dynamic horizontal flex ratios for the action buttons in row mode.
 *
 * @param confirmLen - Length of the primary confirm button label.
 * @param cancelLen - Length of the secondary cancel button label.
 * @param mode - Button ratio configuration mode.
 * @returns Object with cancelFlex and confirmFlex numbers.
 */
const getButtonFlexRatios = (
    confirmLen: number,
    cancelLen: number,
    mode: ConfirmationModalButtonRatio = 'auto'
): { cancelFlex: number; confirmFlex: number } => {
    if (mode === 'guided' || (mode === 'auto' && confirmLen >= cancelLen + 4)) {
        return { cancelFlex: 1, confirmFlex: 1.35 };
    }
    if (mode === 'auto' && cancelLen >= confirmLen + 4) {
        return { cancelFlex: 1.35, confirmFlex: 1 };
    }
    return { cancelFlex: 1, confirmFlex: 1 };
};

/**
 * ConfirmationModal — High-stakes action confirmation dialog.
 */
const ConfirmationModal = ({
    visible,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    cancelText = 'Cancel',
    confirmText = 'Confirm',
    isDestructive = false,
    stackedButtons,
    buttonRatio = 'auto',
    isLoading = false,
    iconName,
    iconLibrary = 'Feather',
    iconColor,
    children,
    testID,
}: ConfirmationModalProps): React.JSX.Element => {
    const { isMobile, width } = useBreakpoints();

    // Semantic accents (always rendered against clean white card surface)
    const badgeBgColor = isDestructive ? Colors.ERROR_BG : Colors.STATUS_APPROVED_BG;
    const resolvedIconColor = iconColor || (isDestructive ? Colors.ERROR : Colors.PRIMARY);
    const primaryButtonVariant: 'destructive' | 'primary' = isDestructive ? 'destructive' : 'primary';

    // Dynamic stacking evaluation for small screen widths
    const isSmallScreen = isMobile || width < 600;
    const confirmLength = confirmText?.length ?? 0;
    const cancelLength = cancelText?.length ?? 0;
    const isLongLabel = confirmLength > 12 || cancelLength > 12;
    const isCombinedTooLong = (confirmLength + cancelLength) > 22;
    const shouldStack = isSmallScreen && (stackedButtons ?? (isLongLabel || isCombinedTooLong));

    // Dynamic flex ratios for side-by-side row mode on mobile
    const { cancelFlex, confirmFlex } = getButtonFlexRatios(confirmLength, cancelLength, buttonRatio);

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={isLoading ? undefined : onClose}
            testID={testID}
        >
            <View style={styles.overlay}>
                <View
                    style={[
                        styles.container,
                        !isMobile && styles.containerDesktop
                    ]}
                >
                    <View style={[styles.header, !isMobile && styles.headerDesktop]}>
                        {iconName ? (
                            <View
                                style={[
                                    styles.iconBadge,
                                    !isMobile && styles.iconBadgeDesktop,
                                    { backgroundColor: badgeBgColor }
                                ]}
                            >
                                <CustomIcon
                                    library={iconLibrary}
                                    name={iconName}
                                    size={20}
                                    color={resolvedIconColor}
                                />
                            </View>
                        ) : null}

                        <CustomText
                            variant="subtitle"
                            style={[
                                styles.title,
                                !isMobile && styles.titleDesktop
                            ]}
                        >
                            {title}
                        </CustomText>
                    </View>

                    {children ? (
                        children
                    ) : (
                        <CustomText
                            variant="caption"
                            style={[
                                styles.message,
                                !isMobile && styles.messageDesktop
                            ]}
                        >
                            {message}
                        </CustomText>
                    )}

                    {shouldStack ? (
                        <View style={styles.buttonStack}>
                            <CustomButton
                                title={confirmText}
                                onPress={onConfirm}
                                disabled={isLoading}
                                isLoading={isLoading}
                                variant={primaryButtonVariant}
                                style={styles.fullWidthButton}
                            />
                            <CustomButton
                                title={cancelText}
                                onPress={onClose}
                                disabled={isLoading}
                                variant="secondary"
                                style={[styles.cancelButton, styles.fullWidthButton]}
                            />
                        </View>
                    ) : (
                        <View style={[styles.buttonRow, !isMobile && styles.buttonRowDesktop]}>
                            <CustomButton
                                title={cancelText}
                                onPress={onClose}
                                disabled={isLoading}
                                variant="secondary"
                                style={[
                                    styles.cancelButton,
                                    isMobile ? { flex: cancelFlex } : styles.desktopButton
                                ]}
                                textStyle={!isMobile ? styles.desktopButtonText : undefined}
                            />
                            <CustomButton
                                title={confirmText}
                                onPress={onConfirm}
                                disabled={isLoading}
                                isLoading={isLoading}
                                variant={primaryButtonVariant}
                                style={isMobile ? { flex: confirmFlex } : styles.desktopButton}
                                textStyle={!isMobile ? styles.desktopButtonText : undefined}
                            />
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: Colors.MODAL_OVERLAY,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    container: {
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        paddingVertical: 24,
        paddingHorizontal: 20,
        width: '90%',
        maxWidth: 360,
        ...GlobalStyles.dropShadow(5, 0.1, Colors.SHADOW, { radius: 12 }),
    },
    containerDesktop: {
        width: '92%',
        maxWidth: 480,
        paddingVertical: 28,
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 8,
    },
    headerDesktop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
        width: '100%',
    },
    iconBadge: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 12,
    },
    iconBadgeDesktop: {
        alignSelf: 'auto',
        marginBottom: 0,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
        textAlign: 'center',
        marginBottom: 8,
    },
    titleDesktop: {
        textAlign: 'left',
        marginBottom: 0,
        flex: 1,
    },
    message: {
        fontSize: 14,
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    messageDesktop: {
        textAlign: 'left',
        marginBottom: 24,
        width: '100%',
    },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    buttonRowDesktop: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 12,
        width: '100%',
    },
    desktopButton: {
        minWidth: 100,
        paddingVertical: 10,
        paddingHorizontal: 22,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            web: { width: 'max-content' } as unknown as ViewStyle,
            default: { width: 'auto' },
        }),
    },
    desktopButtonText: {
        fontSize: 14,
        fontWeight: '600',
        ...Platform.select({
            web: { whiteSpace: 'nowrap' } as unknown as TextStyle,
        }),
    },
    buttonStack: {
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 10,
    },
    fullWidthButton: {
        width: '100%',
    },
    cancelButton: {
        borderColor: Colors.GRAY_LIGHT,
        borderWidth: 1.5,
    },
});

export default ConfirmationModal;