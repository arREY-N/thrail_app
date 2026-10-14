import React, { ReactNode } from 'react';
import {
    StyleProp,
    StyleSheet,
    Text,
    TextProps,
    TextStyle
} from 'react-native';

import { Colors } from '@/src/constants/colors';

/**
 * A customizable text component that standardizes typography.
 */
interface CustomTextProps extends TextProps {
    children?: ReactNode;
    variant?: 'title' | 'h1' | 'h2' | 'subtitle' | 'h3' | 'body' | 'label' | 'caption';
    color?: string;
    style?: StyleProp<TextStyle>;
}

const CustomText: React.FC<CustomTextProps> = ({ 
    children, 
    variant = 'body', 
    color = undefined, 
    style = {}, 
    ...props 
}) => {
    
    let variantStyle: StyleProp<TextStyle>;

    switch (variant) {
        case 'title':
        case 'h1':
            variantStyle = styles.h1;
            break;

        case 'subtitle':
        case 'h2':
            variantStyle = styles.h2;
            break;

        case 'h3':
            variantStyle = styles.h3;
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
                styles.base,
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
    base: {
        color: Colors.TEXT_PRIMARY,
    },
    
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
    h3: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 8,
    },
    body: {
        fontSize: 16,
        fontWeight: 'normal',
        color: Colors.TEXT_PRIMARY,
        lineHeight: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.TEXT_PRIMARY,
    },   
    caption: {
        fontSize: 14,
        color: Colors.TEXT_SECONDARY,
        fontWeight: 'normal',
    },
});

export default CustomText;