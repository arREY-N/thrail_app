import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import { Colors } from '@/src/constants/colors';

const CustomFAB = ({ 
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
                { backgroundColor },
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
        
        elevation: 6,
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        zIndex: 1000,
    }
});

export default CustomFAB;