import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

const TrailReviewsTab = () => {
    return (
        <View style={styles.tabContent}>
            <View style={[styles.placeholderBox, { height: 100 }]}>
                <CustomIcon 
                    library="Feather" 
                    name="message-square" 
                    size={32} 
                    color={Colors.GRAY_MEDIUM} 
                />
                <CustomText style={styles.placeholderText}>
                    User Reviews List
                </CustomText>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    tabContent: {
        gap: 20,
    },
    placeholderBox: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8,
    },
    placeholderText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: 'bold',
    },
});

export default TrailReviewsTab;