import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

export interface SelectionChipProps {
    label: string;
    selected?: boolean;
    onPress: () => void;
    variant?: 'primary' | 'danger' | 'warning';
    style?: StyleProp<ViewStyle>;
}

const SelectionChip = ({ 
    label, 
    selected, 
    onPress,
    variant = 'primary',
    style,
}: SelectionChipProps) => {
    const getActiveChipStyle = () => {
        if (!selected) return null;
        if (variant === 'danger') return styles.chipActiveDanger;
        if (variant === 'warning') return styles.chipActiveWarning;
        return styles.chipActive;
    };

    const getActiveTextStyle = () => {
        if (!selected) return null;
        if (variant === 'danger') return styles.chipTextActiveDanger;
        if (variant === 'warning') return styles.chipTextActiveWarning;
        return styles.chipTextActive;
    };

    return (
        <TouchableOpacity 
            style={[
                styles.chip, 
                getActiveChipStyle(),
                style,
            ]} 
            onPress={onPress}
            activeOpacity={0.7}
        >
            <CustomText 
                variant="caption" 
                style={[
                    styles.chipText, 
                    getActiveTextStyle(),
                ]}
            >
                {label}
            </CustomText>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    chip: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: Colors.BACKGROUND,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    chipActive: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderColor: Colors.PRIMARY,
    },
    chipActiveDanger: {
        backgroundColor: Colors.ERROR_BG,
        borderColor: Colors.ERROR,
    },
    chipActiveWarning: {
        backgroundColor: Colors.STATUS_WARNING_BG,
        borderColor: Colors.STATUS_WARNING_TEXT,
    },
    chipText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },
    chipTextActive: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    chipTextActiveDanger: {
        color: Colors.ERROR,
        fontWeight: 'bold',
    },
    chipTextActiveWarning: {
        color: Colors.STATUS_WARNING_TEXT,
        fontWeight: 'bold',
    },
});

export default SelectionChip;
