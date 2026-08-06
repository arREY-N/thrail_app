import React from 'react';
import {
    GestureResponderEvent,
    StyleProp,
    StyleSheet,
    TouchableOpacity,
    ViewStyle
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { IconLibrary } from '@/src/types/ui.types';

/**
 * A floating action button (FAB) component placed at the bottom right.
 */
interface CustomFABProps {
    onPress?: (event: GestureResponderEvent) => void;
    iconLibrary?: IconLibrary;
    iconName?: string;
    iconSize?: number;
    iconColor?: string;
    backgroundColor?: string;
    style?: StyleProp<ViewStyle>;
}

const CustomFAB: React.FC<CustomFABProps> = ({ 
    onPress, 
    iconLibrary = "Ionicons", 
    iconName = "chatbubbles", 
    iconSize = 28, 
    iconColor = Colors.WHITE,
    backgroundColor = Colors.PRIMARY,
    style
}) => {
    return (
        <TouchableOpacity 
            style={[
                styles.fab, 
                { backgroundColor: backgroundColor },
                style
            ]} 
            onPress={onPress}
            activeOpacity={0.9}
        >
            <CustomIcon 
                library={iconLibrary} 
                name={iconName} 
                size={iconSize} 
                color={iconColor} 
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 16,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        ...GlobalStyles.dropShadow(6, 0.3, Colors.SHADOW, {
            offset: { width: 0, height: 4 },
            radius: 6
        }),
        zIndex: 1000,
    }
});

export default CustomFAB;