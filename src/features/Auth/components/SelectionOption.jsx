import Feather from '@expo/vector-icons/Feather';

import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';

const SelectionOption = ({ label, selected, onPress }) => {

    return (
        <TouchableOpacity 
            style={[
                styles.container, 
                selected && styles.selectedContainer 
            ]} 
            onPress={onPress}
            activeOpacity={0.7}
        >
            <CustomText variant="body" style={styles.label}>
                {label}
            </CustomText>
            
            <View style={[
                styles.iconContainer, 
                selected && styles.selectedIcon
            ]}>
                {selected && (
                    <Feather name="check" size={14} color={Colors.TEXT_INVERSE} />
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.WHITE, 
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT, 
    },

    selectedContainer: {
        borderColor: Colors.PRIMARY, 
        backgroundColor: Colors.BACKGROUND,
    },
    label: {
        fontWeight: '500',
        flex: 1,
        marginRight: 10,
    },
    iconContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_MEDIUM,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.WHITE,
    },
    selectedIcon: {
        backgroundColor: Colors.PRIMARY, 
        borderColor: Colors.PRIMARY,
    },
});

export default SelectionOption;