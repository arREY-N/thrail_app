/**
 * @file CustomStatusBadge.tsx
 * @description Standardized, responsive status badge component for the Thrail application.
 * Automatically resolves status configurations, icons, and colors from statusConfig.ts,
 * while supporting custom overrides and size variants. Enforces text containment to prevent
 * squashing and overflow on mobile viewports.
 */

import React from 'react';
import {
    StyleProp,
    StyleSheet,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { AppStatus, getStatusConfig, UserRole } from '@/src/constants/statusConfig';
import { IconLibrary } from '@/src/types/ui.types';

export interface CustomStatusBadgeProps {
    statusKey?: AppStatus | string | null;
    status?: AppStatus | string | null;
    role?: UserRole;
    label?: string;
    icon?: string;
    iconLibrary?: IconLibrary;
    bgColor?: string;
    textColor?: string;
    borderColor?: string;
    size?: 'sm' | 'md';
    variant?: 'pill' | 'rounded';
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    showIcon?: boolean;
    isApproved?: boolean;
    isRejected?: boolean;
    isCancelled?: boolean;
}

const CustomStatusBadge: React.FC<CustomStatusBadgeProps> = ({
    statusKey,
    status,
    role = 'user',
    label,
    icon,
    iconLibrary = 'Feather',
    bgColor,
    textColor,
    borderColor,
    size = 'md',
    variant = 'pill',
    style,
    textStyle,
    showIcon = true,
    isApproved,
    isRejected,
    isCancelled,
}) => {
    const effectiveStatus = statusKey ?? status;
    const resolvedConfig = effectiveStatus ? getStatusConfig(effectiveStatus, role) : null;

    const resolvedLabel = label ?? (resolvedConfig?.label || 'UNKNOWN');
    const resolvedBgColor = bgColor ?? (resolvedConfig?.bgColor || Colors.STATUS_PENDING_BG);
    const resolvedTextColor = textColor ?? (resolvedConfig?.textColor || Colors.STATUS_PENDING_TEXT);
    const resolvedIcon = icon ?? resolvedConfig?.icon;

    const iconSize = size === 'sm' ? 10 : 12;

    return (
        <View
            style={[
                styles.badgeBase,
                styles[`size_${size}`],
                styles[`variant_${variant}`],
                { backgroundColor: resolvedBgColor },
                borderColor ? { borderWidth: 1, borderColor } : null,
                style,
            ]}
        >
            {showIcon && resolvedIcon ? (
                <CustomIcon
                    library={iconLibrary}
                    name={resolvedIcon}
                    size={iconSize}
                    color={resolvedTextColor}
                    style={styles.icon}
                />
            ) : null}
            <CustomText
                variant="caption"
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.8}
                style={[
                    styles.textBase,
                    styles[`text_${size}`],
                    { color: resolvedTextColor },
                    textStyle,
                ]}
            >
                {resolvedLabel}
            </CustomText>
        </View>
    );
};

const styles = StyleSheet.create({
    badgeBase: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 1,
    },
    size_sm: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        gap: 3,
    },
    size_md: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        gap: 4,
    },
    variant_pill: {
        borderRadius: 20,
    },
    variant_rounded: {
        borderRadius: 8,
    },
    icon: {
        flexShrink: 0,
    },
    textBase: {
        fontWeight: 'bold',
        textTransform: 'uppercase',
        flexShrink: 1,
    },
    text_sm: {
        fontSize: 10,
        lineHeight: 12,
    },
    text_md: {
        fontSize: 11,
        lineHeight: 14,
    },
});

export default CustomStatusBadge;
