import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import { Colors } from '@/src/constants/colors';
import { useAppNavigation } from '@/src/core/hook/useAppNavigation';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

const CustomHeader = ({ 
    title, 
    onBackPress, 
    rightActions, 
    showDefaultIcons = false,
    style 
}) => {

    const { onNotificationPress, onBookingPress } = useAppNavigation();

    if (onBackPress) {
        return (
            <View style={[styles.container, style]}>
                <TouchableOpacity 
                    onPress={onBackPress} 
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <CustomIcon 
                        library="Feather" 
                        name="chevron-left"
                        size={24}
                        color={Colors.TEXT_INVERSE} 
                    />
                </TouchableOpacity>

                <View style={styles.centerTitleContainer}>
                     {title ? (
                        <CustomText variant="title" style={styles.stackTitle}>
                            {title}
                        </CustomText>
                    ) : null}
                </View>

                {rightActions ? (
                    <View style={styles.rightActionsContainer}>
                        {rightActions}
                    </View>
                ) : (
                    <View style={styles.spacer} /> 
                )}
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
            <View style={styles.leftTitleContainer}>
                <CustomText variant="title" style={styles.tabTitle}>
                    {title}
                </CustomText>
            </View>

            <View style={styles.rightActionsContainer}>
                {showDefaultIcons && (
                    <>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={onNotificationPress}
                        >
                            <CustomIcon 
                                library="Feather" 
                                name="bell"
                                size={20}
                                color={Colors.TEXT_INVERSE} 
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={onBookingPress}
                        >
                            <CustomIcon 
                                library="Feather" 
                                name="book-open"
                                size={20}
                                color={Colors.TEXT_INVERSE} 
                            />
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
        color: Colors.TEXT_INVERSE, 
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
        color: Colors.TEXT_PRIMARY,
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