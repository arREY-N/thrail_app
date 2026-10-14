import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

export interface SelectionChipProps {
    label: string;
    selected?: boolean;
    onPress: () => void;
    variant?: 'primary' | 'danger';
    style?: StyleProp<ViewStyle>;
}

const SelectionChip = ({ 
    label, 
    selected, 
    onPress,
    variant = 'primary',
    style,
}: SelectionChipProps) => {
    const isDanger = variant === 'danger';

    return (
        <TouchableOpacity 
            style={[
                styles.chip, 
                selected && (isDanger ? styles.chipActiveDanger : styles.chipActive),
                style,
            ]} 
            onPress={onPress}
            activeOpacity={0.7}
        >
            <CustomText 
                variant="caption" 
                style={[
                    styles.chipText, 
                    selected && (isDanger ? styles.chipTextActiveDanger : styles.chipTextActive),
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
});

export default SelectionChip;
