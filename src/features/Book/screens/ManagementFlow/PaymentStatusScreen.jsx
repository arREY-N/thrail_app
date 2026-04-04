import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';

const PaymentStatusScreen = ({
    bookingData,
    onBackPress,
    onProceedToPayment,
}) => {
    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader
                title="Payment Status"
                onBackPress={onBackPress}
            />

            <View style={styles.container}>
                <CustomText variant="h2">
                    Payment Review
                </CustomText>
                <CustomText
                    variant="body"
                    color={Colors.TEXT_SECONDARY}
                >
                    Payment validation status will go here.
                </CustomText>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
});

export default PaymentStatusScreen;