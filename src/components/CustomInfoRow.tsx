/**
 * @file CustomInfoRow.tsx
 * @description Standardized key-value information row component.
 * Eliminates awkward right-align text wrapping by providing clean responsive behavior,
 * optional one-tap copy-to-clipboard functionality with toast feedback, and consistent typography.
 */

import React, { useState } from 'react';
import {
    StyleProp,
    StyleSheet,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { useToast } from '@/src/components/Toast/Toast';
import { Colors } from '@/src/constants/colors';

export interface CustomInfoRowProps {
    label: string;
    value?: React.ReactNode | string | number | null;
    copyable?: boolean;
    enableCopy?: boolean;
    copyValue?: string;
    onCopyFeedback?: string;
    stacked?: boolean;
    stackedOnMobile?: boolean;
    noBorder?: boolean;
    isLast?: boolean;
    compact?: boolean;
    labelColor?: string;
    valueColor?: string;
    style?: StyleProp<ViewStyle>;
    containerStyle?: StyleProp<ViewStyle>;
    labelStyle?: StyleProp<TextStyle>;
    valueStyle?: StyleProp<TextStyle>;
    numberOfLines?: number;
    rightElement?: React.ReactNode;
}

const CustomInfoRow: React.FC<CustomInfoRowProps> = ({
    label,
    value,
    copyable = false,
    enableCopy,
    copyValue,
    onCopyFeedback = 'Copied to clipboard',
    stacked = false,
    stackedOnMobile = false,
    noBorder = false,
    isLast,
    compact = false,
    labelColor = Colors.TEXT_SECONDARY,
    valueColor = Colors.TEXT_PRIMARY,
    style,
    containerStyle,
    labelStyle,
    valueStyle,
    numberOfLines = 2,
    rightElement,
}) => {
    const { showToast } = useToast();
    const [copied, setCopied] = useState(false);

    const isCopyable = copyable || Boolean(enableCopy);
    const isStacked = stacked || stackedOnMobile;
    const hideBorder = noBorder || Boolean(isLast);

    const stringValue = typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : null;

    const displayValue = value !== undefined && value !== null && value !== ''
        ? value
        : 'N/A';

    const handleCopy = async () => {
        const textToCopy = copyValue ?? stringValue;
        if (!textToCopy) return;

        await Clipboard.setStringAsync(textToCopy);
        setCopied(true);
        showToast.success(onCopyFeedback);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <View
            style={[
                styles.rowContainer,
                compact && styles.compactContainer,
                isStacked && styles.stackedContainer,
                hideBorder && styles.noBorder,
                style,
                containerStyle,
            ]}
        >
            <CustomText
                variant="caption"
                style={[
                    styles.label,
                    { color: labelColor },
                    labelStyle,
                ]}
                numberOfLines={1}
            >
                {label}
            </CustomText>

            <View style={styles.valueGroup}>
                {stringValue !== null ? (
                    <CustomText
                        variant="body"
                        style={[
                            styles.value,
                            { color: valueColor },
                            valueStyle,
                        ]}
                        numberOfLines={numberOfLines}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.85}
                    >
                        {displayValue}
                    </CustomText>
                ) : (
                    displayValue
                )}

                {isCopyable && stringValue && (
                    <TouchableOpacity
                        onPress={handleCopy}
                        style={styles.copyBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        activeOpacity={0.7}
                    >
                        <CustomIcon
                            library="Feather"
                            name={copied ? 'check' : 'copy'}
                            size={14}
                            color={copied ? Colors.SUCCESS : Colors.PRIMARY}
                        />
                    </TouchableOpacity>
                )}

                {rightElement}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
        gap: 12,
        width: '100%',
    },
    compactContainer: {
        paddingVertical: 6,
    },
    stackedContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 4,
    },
    noBorder: {
        borderBottomWidth: 0,
    },
    label: {
        fontSize: 12,
        fontWeight: '500',
        flexShrink: 0,
    },
    valueGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 6,
        flex: 1,
    },
    value: {
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'right',
        flexShrink: 1,
    },
    copyBtn: {
        padding: 4,
        borderRadius: 4,
        backgroundColor: Colors.BUTTON_OUTLINE_BG,
    },
});

export default CustomInfoRow;
