import React from 'react';
import {
    StyleSheet,
    Text
} from 'react-native';

import { Colors } from '@/src/constants/colors';

const CustomText = ({ 
    children, 
    variant = 'body', 
    color, 
    style, 
    ...props 
}) => {
    
    let variantStyle;

    switch (variant) {
        case 'title':
        case 'h1':
            variantStyle = styles.h1;
            break;

        case 'subtitle':
        case 'h2':
            variantStyle = styles.h2;
            break;

        case 'label':
            variantStyle = styles.label;
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
        color: Colors.TEXT_PRIMARY,
        marginBottom: 8,
    },
    h2: {
        fontSize: 24,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 12,
    },
    body: {
        fontSize: 16,
        color: Colors.TEXT_PRIMARY,
        lineHeight: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },   
    caption: {
        fontSize: 14,
        color: Colors.TEXT_SECONDARY,
    },
});

export default CustomText;