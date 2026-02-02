import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomHeader from '../../../components/CustomHeader';
import CustomText from '../../../components/CustomText';
import { Colors } from '../../../constants/colors';

const CommunityScreen = () => {
    return (
        <View style={styles.container}>
            <CustomHeader 
                title="Community"
                showDefaultIcons={true} 
            />

            <View style={styles.contentContainer}>
                <CustomText variant="body">
                    Community Screen
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

export default CommunityScreen;