import React from 'react';
import {
    Platform,
    StatusBar,
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
    subtitle,
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
                        <CustomText variant="title" style={styles.centerTitle}>
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
            <View style={styles.leftContent}>
                <CustomText style={styles.headline}>
                    {title}
                </CustomText>
                
                {subtitle && (
                    <CustomText style={styles.subtitle}>
                        {subtitle}
                    </CustomText>
                )}
            </View>

            <View style={styles.rightActionsContainer}>
                {showDefaultIcons && (
                    <>
                        <TouchableOpacity
                            style={styles.actionIcon}
                            onPress={onNotificationPress}
                        >
                            <CustomIcon 
                                library="Ionicons" 
                                name="notifications"
                                size={24}
                                color={Colors.TEXT_INVERSE} 
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionIcon}
                            onPress={onBookingPress}
                        >
                            <CustomIcon 
                                library="Ionicons" 
                                name="calendar"
                                size={24}
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
        height: 64, 
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16, 
        backgroundColor: Colors.PRIMARY, 
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT || '#F0F0F0',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0, 
    },

    backButton: {
        padding: 8,
        marginLeft: -8, 
        zIndex: 10,
    },
    centerTitleContainer: {
        position: 'absolute',
        left: 0, 
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: -1,
        height: '100%',
    },
    centerTitle: {
        color: Colors.TEXT_INVERSE, 
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 0,
    },
    spacer: {
        width: 40,
    },
    
    leftContent: {
        flex: 1,
        justifyContent: 'center',
        flexDirection: 'column',
    },
    headline: {
        color: Colors.TEXT_INVERSE,
        textAlign: 'left',
        fontSize: 32,
        fontWeight: '700',
        lineHeight: 28,
    },
    subtitle: {
        color: Colors.TEXT_SECONDARY,
        textAlign: 'left',
        fontSize: 16,
        lineHeight: 20,
    },

    rightActionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    actionIcon: {
        padding: 8,
    },
});

export default CustomHeader;