import React from 'react';
import { StyleProp, TextStyle } from 'react-native';

import {
    AntDesign,
    Feather,
    FontAwesome5,
    FontAwesome6,
    Ionicons,
    MaterialCommunityIcons
} from '@expo/vector-icons';

import { Colors } from '@/src/constants/colors';
import { IconLibrary } from '@/src/types/ui.types';

/**
 * Custom icon wrapper supporting multiple vector icon libraries.
 * Defaults to 'Feather' if no library is specified.
 */
interface CustomIconProps {
    library?: IconLibrary;
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle>;
}

const CustomIcon: React.FC<CustomIconProps> = ({ 
    library = 'Feather',
    name, 
    size = 24, 
    color = Colors.PRIMARY, 
    style = {}
}) => {

    const commonProps = {
        name: name as any,
        size,
        color,
        style,
    };

    switch (library) {
        case 'AntDesign':
            return <AntDesign {...commonProps} />;
        case 'Ionicons':
            return <Ionicons {...commonProps} />;
        case 'MaterialCommunityIcons':
            return <MaterialCommunityIcons {...commonProps} />;
        case 'FontAwesome5':
            return <FontAwesome5 {...commonProps} />;
        case 'FontAwesome6':
            return <FontAwesome6 {...commonProps} />;
        case 'Feather':
        default:
            return <Feather {...commonProps} />;
    }
};

export default CustomIcon;