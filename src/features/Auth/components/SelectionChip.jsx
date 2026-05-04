import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

const SelectionChip = ({ 
    label, 
    selected, 
    onPress 
}) => {
    return (
        <TouchableOpacity 
            style={[
                styles.chip, 
                selected && styles.chipActive
            ]} 
            onPress={onPress}
            activeOpacity={0.7}
        >
            <CustomText 
                variant="caption" 
                style={[
                    styles.chipText, 
                    selected && styles.chipTextActive
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
    chipText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },
    chipTextActive: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
});

export default SelectionChip;