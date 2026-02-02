import React from 'react';

import {
    Feather,
    FontAwesome5,
    FontAwesome6,
    Ionicons,
    MaterialCommunityIcons
} from '@expo/vector-icons';

import { Colors } from '../constants/colors';

const CustomIcon = ({ 
    library = 'Feather',
    name, 
    size = 24, 
    color = Colors.TEXT_PRIMARY, 
    style 
}) => {

    const commonProps = {
        name,
        size,
        color,
        style,
    };

    switch (library) {
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