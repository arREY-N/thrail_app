/**
 * @file BookingNoticeBanner.tsx
 * @description Standardized contextual notice banner used across booking details and workflow screens.
 * Supports error, warning, info, and success variants with uniform padding, rounded corners,
 * tokenized backgrounds, and nested feedback quote boxes.
 */

import React from 'react';
import {
    StyleProp,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { IconLibrary } from '@/src/types/ui.types';

export type NoticeBannerVariant = 'error' | 'warning' | 'info' | 'success';

export interface BookingNoticeBannerProps {
    /** Visual theme variant */
    variant: NoticeBannerVariant;
    /** Main bold title */
    title: string;
    /** Informative description or message */
    message?: string;
    /** Optional detailed quote or organizer feedback */
    details?: string | null;
    /** Label above details quote, defaults to "ORGANIZER FEEDBACK:" */
    detailsLabel?: string;
    /** Actionable hint or next-step instruction */
    hint?: string;
    /** Optional custom icon name */
    icon?: string;
    /** Optional custom icon library */
    iconLibrary?: IconLibrary;
    /** Optional dismiss callback */
    onDismiss?: () => void;
    /** Optional action buttons or custom children */
    actions?: React.ReactNode;
    /** Optional style overrides */
    style?: StyleProp<ViewStyle>;
}

export const BookingNoticeBanner: React.FC<BookingNoticeBannerProps> = ({
    variant,
    title,
    message,
    details,
    detailsLabel = 'ORGANIZER FEEDBACK:',
    hint,
    icon,
    iconLibrary = 'Feather',
    onDismiss,
    actions,
    style,
}) => {
    const getVariantConfig = () => {
        switch (variant) {
            case 'error':
                return {
                    backgroundColor: Colors.ERROR_BG,
                    borderColor: Colors.ERROR_BORDER,
                    iconName: icon || 'alert-triangle',
                    iconColor: Colors.ERROR,
                    titleColor: Colors.ERROR,
                    labelColor: Colors.ERROR,
                };
            case 'warning':
                return {
                    backgroundColor: Colors.STATUS_WARNING_BG,
                    borderColor: Colors.STATUS_WARNING_BORDER,
                    iconName: icon || 'clock',
                    iconColor: Colors.STATUS_WARNING_TEXT,
                    titleColor: Colors.STATUS_WARNING_TEXT,
                    labelColor: Colors.STATUS_WARNING_TEXT,
                };
            case 'success':
                return {
                    backgroundColor: Colors.STATUS_APPROVED_BG,
                    borderColor: Colors.STATUS_APPROVED_BORDER,
                    iconName: icon || 'check-circle',
                    iconColor: Colors.PRIMARY,
                    titleColor: Colors.STATUS_APPROVED_TEXT,
                    labelColor: Colors.PRIMARY,
                };
            case 'info':
            default:
                return {
                    backgroundColor: Colors.STATUS_PENDING_BG,
                    borderColor: Colors.STATUS_PENDING_BORDER,
                    iconName: icon || 'info',
                    iconColor: Colors.STATUS_PENDING_TEXT,
                    titleColor: Colors.STATUS_PENDING_TEXT,
                    labelColor: Colors.STATUS_PENDING_TEXT,
                };
        }
    };

    const { isMobile } = useBreakpoints();
    const config = getVariantConfig();
    const hasInlineActionLayout = Boolean(actions) && !details;

    if (hasInlineActionLayout) {
        return (
            <View
                style={[
                    styles.container,
                    {
                        backgroundColor: config.backgroundColor,
                        borderColor: config.borderColor,
                    },
                    style,
                ]}
            >
                <View style={isMobile ? styles.contentColumn : styles.contentRow}>
                    <View style={styles.textContainer}>
                        <View style={styles.titleRow}>
                            <CustomIcon
                                library={iconLibrary}
                                name={config.iconName}
                                size={18}
                                color={config.iconColor}
                            />
                            <CustomText style={[styles.title, { color: config.titleColor }]}>
                                {title}
                            </CustomText>
                        </View>
                        {Boolean(message) && (
                            <CustomText style={styles.message}>
                                {message}
                            </CustomText>
                        )}
                    </View>

                    <View style={[styles.actionWrapper, isMobile && styles.actionWrapperMobile]}>
                        {actions}
                    </View>
                </View>

                {Boolean(hint) && (
                    <CustomText style={styles.hint}>
                        {hint}
                    </CustomText>
                )}
            </View>
        );
    }

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: config.backgroundColor,
                    borderColor: config.borderColor,
                },
                style,
            ]}
        >
            <View style={styles.headerRow}>
                <View style={styles.iconWrapper}>
                    <CustomIcon
                        library={iconLibrary}
                        name={config.iconName}
                        size={18}
                        color={config.iconColor}
                    />
                </View>
                <View style={styles.headerTextContainer}>
                    <CustomText style={[styles.title, { color: config.titleColor }]}>
                        {title}
                    </CustomText>
                    {Boolean(message) && (
                        <CustomText style={styles.message}>
                            {message}
                        </CustomText>
                    )}
                </View>
                {Boolean(onDismiss) && (
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={onDismiss}
                        style={styles.dismissBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <CustomIcon library="Feather" name="x" size={16} color={Colors.TEXT_SECONDARY} />
                    </TouchableOpacity>
                )}
            </View>

            {Boolean(details) && (
                <View style={styles.detailsBox}>
                    {Boolean(detailsLabel) && (
                        <CustomText style={[styles.detailsLabel, { color: config.labelColor }]}>
                            {detailsLabel}
                        </CustomText>
                    )}
                    <CustomText style={styles.detailsText}>
                        &quot;{details}&quot;
                    </CustomText>
                </View>
            )}

            {Boolean(hint) && (
                <CustomText style={styles.hint}>
                    {hint}
                </CustomText>
            )}

            {Boolean(actions) && (
                <View style={styles.actionsContainer}>
                    {actions}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 14,
        gap: 10,
        marginVertical: 4,
        ...GlobalStyles.dropShadow(2),
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    iconWrapper: {
        marginTop: 1,
    },
    headerTextContainer: {
        flex: 1,
        gap: 3,
    },
    title: {
        fontSize: 13.5,
        fontWeight: '700',
        lineHeight: 18,
    },
    message: {
        fontSize: 12.5,
        color: Colors.TEXT_PRIMARY,
        lineHeight: 17,
    },
    dismissBtn: {
        padding: 2,
    },
    detailsBox: {
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        padding: 10,
        gap: 4,
    },
    detailsLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    detailsText: {
        fontSize: 12,
        fontStyle: 'italic',
        color: Colors.TEXT_PRIMARY,
        lineHeight: 16,
    },
    hint: {
        fontSize: 11.5,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 16,
    },
    actionsContainer: {
        marginTop: 2,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
    },
    contentColumn: {
        flexDirection: 'column',
        gap: 12,
    },
    textContainer: {
        flex: 1,
        gap: 6,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionWrapper: {
        flexShrink: 0,
    },
    actionWrapperMobile: {
        alignSelf: 'stretch',
    },
});

export default BookingNoticeBanner;
