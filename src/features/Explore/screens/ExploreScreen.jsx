import React from 'react';
import { Pressable, Text, View } from 'react-native';

import CustomHeader from '../../../components/CustomHeader';

const ExploreScreen = ({ 
    trails, 
    onViewMountain 
}) => {

    return (
        <View>
            <CustomHeader 
                title="Explore"
                showDefaultIcons={true} 
            />

            <Text>Explore screen</Text>
            
            {trails?.map((t) => {
                return (
                    <Pressable onPress={() => onViewMountain(t.id)} key={t.id}>
                        <Text>{t.name}</Text>
                    </Pressable>
                )
            })}
        </View>
    )
}

export default ExploreScreen