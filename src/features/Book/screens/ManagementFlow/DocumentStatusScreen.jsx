import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';

const DocumentStatusScreen = ({ bookingData, onBackPress }) => {
    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader title="Document Status" onBackPress={onBackPress} />
            
            <View style={styles.container}>
                <CustomText variant="h2">Document Review</CustomText>
                <CustomText variant="body" color={Colors.TEXT_SECONDARY}>
                    Tour guide approval status will go here (Approved, Not Approved, Expired).
                </CustomText>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    }
});

export default DocumentStatusScreen;