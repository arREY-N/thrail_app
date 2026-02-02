import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import CustomHeader from '../../../components/CustomHeader';

const NavigationScreen = () => {
    return (
        <View style={styles.container}>
            <CustomHeader 
                title="Hike"
                showDefaultIcons={true} 
            />

            <View style={styles.contentContainer}>
                <CustomText variant="body">
                    Navigation Screen
                </CustomText>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default NavigationScreen