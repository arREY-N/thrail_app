import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Colors } from '../constants/colors';
import CustomText from './CustomText';

const Header = ({ 
    title, 
    onBackPress, 
    style 
}) => {
    
    return (
        <View style={[styles.container, style]}>
            <TouchableOpacity 
                onPress={onBackPress} 
                style={styles.backButton}
                activeOpacity={0.7}
            >
                <Feather name="chevron-left" size={28} color={Colors.BLACK} />
            </TouchableOpacity>

            {title ? (
                <CustomText style={styles.title}>
                    {title}
                </CustomText>
            ) : (
                <View /> 
            )}

            <View style={{ width: 28 }} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 66, 
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16, 
        paddingVertical: 14, 
        backgroundColor: Colors.GRAY_LIGHT,
    },
    backButton: {
        padding: 4,
        marginLeft: -4, 
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.BLACK,
        textAlign: 'center',
    },
});

export default Header;