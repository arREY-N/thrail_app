import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Colors } from '../../src/constants/colors';

const CustomText = ({ 
    children, 
    variant = 'body', 
    color, 
    style, 
    ...props 
}) => {
    
    let variantStyle;
    switch (variant) {
        case 'h1':
            variantStyle = styles.h1;
            break;
        case 'h2':
            variantStyle = styles.h2;
            break;
        case 'caption':
            variantStyle = styles.caption;
            break;
        default:
            variantStyle = styles.body;
    }

    return (
        <Text 
            style={[
                variantStyle, 
                color && { color: color },
                style
            ]} 
            {...props} 
        >
            {children}
        </Text>
    );
};

const styles = StyleSheet.create({
    h1: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginBottom: 8,
    },
    h2: {
        fontSize: 24,
        fontWeight: '600',
        color: Colors.BLACK,
        marginBottom: 12,
    },
    body: {
        fontSize: 16,
        color: Colors.BLACK,
        lineHeight: 24, 
    },
    caption: {
        fontSize: 14,
        color: Colors.GRAY_MEDIUM,
    },
});

export default CustomText;