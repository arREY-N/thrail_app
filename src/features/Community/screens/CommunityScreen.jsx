import React from 'react';
import { Text, View } from 'react-native';

import CustomHeader from '../../../components/CustomHeader';

const CommunityScreen = () => {
    return (
        <View>
            <CustomHeader 
                title="Community"
                showDefaultIcons={true} 
            />

            <Text>Community Screen</Text>
        </View>
    )
}

export default CommunityScreen