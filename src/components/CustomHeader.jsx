import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Colors } from '../constants/colors';
import CustomText from './CustomText';

const CustomHeader = ({ 
    title, 
    onBackPress, 
    rightActions, 
    showDefaultIcons = false,
    style 
}) => {
    const router = useRouter();

    const handleNotification = () => router.push('/(home)/notification');
    const handleBooking = () => router.push('/(book)/userBooking');

    if (onBackPress) {
        return (
            <View style={[styles.container, style]}>
                <TouchableOpacity 
                    onPress={onBackPress} 
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <Feather name="chevron-left" size={28} color={Colors.WHITE} />
                </TouchableOpacity>

                <View style={styles.centerTitleContainer}>
                     {title ? (
                        <CustomText style={styles.stackTitle}>
                            {title}
                        </CustomText>
                    ) : null}
                </View>

                <View style={styles.spacer} /> 
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
            <View style={styles.leftTitleContainer}>
                <CustomText style={styles.tabTitle}>
                    {title}
                </CustomText>
            </View>

            <View style={styles.rightActionsContainer}>
                {showDefaultIcons && (
                    <>
                        <TouchableOpacity style={styles.iconButton} onPress={handleNotification}>
                            <Feather name="bell" size={20} color={Colors.WHITE} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButton} onPress={handleBooking}>
                            <Feather name="book-open" size={20} color={Colors.WHITE} />
                        </TouchableOpacity>
                    </>
                )}
                
                {rightActions}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        minHeight: 66, 
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16, 
        paddingVertical: 14, 
        backgroundColor: Colors.PRIMARY,
    },

    backButton: {
        padding: 4,
        marginLeft: -4, 
        zIndex: 10,
    },
    centerTitleContainer: {
        position: 'absolute',
        left: 0, 
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: -1,
    },
    stackTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.WHITE, 
        textAlign: 'center',
    },
    spacer: {
        width: 28,
    },
    
    leftTitleContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    tabTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.WHITE,
        textAlign: 'left',
    },
    rightActionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, 
    },
    iconButton: {
        backgroundColor: Colors.SECONDARY,
        padding: 8,
        borderRadius: 50,
    },
});

export default CustomHeader;