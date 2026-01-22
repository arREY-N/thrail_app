import React from 'react';
import { Text, View } from 'react-native';

import CustomHeader from '../../../components/CustomHeader';

const NavigationScreen = () => {
    return (
        <View>
            <CustomHeader 
                title="Hike"
                showDefaultIcons={true} 
            />

            <Text>Navigation Screen</Text>
        </View>
    )
}

export default NavigationScreen