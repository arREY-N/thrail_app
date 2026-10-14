import React from 'react';
import {
    StyleProp,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';

/**
 * Props for the SelectionOption component.
 */
export interface SelectionOptionProps {
    /** The text label to display if no children are provided */
    label?: string;
    /** Whether this option is currently selected */
    selected?: boolean;
    /** Callback fired when the option is pressed */
    onPress?: () => void;
    /** Custom style for the outermost container */
    style?: StyleProp<ViewStyle>;
    /** Optional React nodes to render inside the option (replaces label) */
    children?: React.ReactNode;
}

/**
 * A selectable item component primarily used in lists or grids
 * (e.g., choosing a location or category).
 */
const SelectionOption = ({ 
    label, 
    selected, 
    onPress,
    style,
    children
}: SelectionOptionProps) => {

    return (
        <TouchableOpacity 
            style={[
                styles.container, 
                selected && styles.selectedContainer,
                style
            ]} 
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.contentContainer}>
                {children ? (
                    children
                ) : (
                    <CustomText variant="body" style={[styles.label, selected && styles.selectedLabel]}>
                        {label}
                    </CustomText>
                )}
            </View>
            
            <View style={[
                styles.iconContainer, 
                selected && styles.selectedIcon
            ]}>
                {selected && (
                    <CustomIcon
                        library="Feather"
                        name="check"
                        size={16}
                        color={Colors.WHITE}
                    />
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
        backgroundColor: Colors.BACKGROUND,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT, 
    },

    selectedContainer: {
        borderColor: Colors.PRIMARY, 
        backgroundColor: Colors.WHITE,
    },

    contentContainer: {
        flex: 1,
        marginRight: 8,
    },

    label: {
        fontWeight: '500',
        flex: 1,
        marginRight: 10,
    },
    selectedLabel: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    iconContainer: {
        width: 24,
        height: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_MEDIUM,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.WHITE,
        paddingTop: 1,
    },
    selectedIcon: {
        backgroundColor: Colors.PRIMARY, 
        borderColor: Colors.PRIMARY,
    },
});

export default SelectionOption;
