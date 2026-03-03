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
    style,
    children
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
                        color={Colors.PRIMARY} 
                        style={{scale: 1.2}}
                    />
                </TouchableOpacity>

                <View style={styles.centerTitleContainer}>
                    {children ? children : (
                        title ? (
                            <CustomText variant="title" style={styles.centerTitle}>
                                {title}
                            </CustomText>
                        ) : null
                    )}
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
                {children ? children : (
                    <CustomText variant='title' style={styles.headline}>
                        {title}
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
                                color={Colors.PRIMARY} 
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionIcon}
                            onPress={onBookingPress}
                        >
                            <CustomIcon 
                                library="Ionicons" 
                                name="calendar-clear"
                                size={24}
                                color={Colors.PRIMARY}
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
        // height: 80, 
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16, 
        paddingTop: 16,
        paddingBottom: 8,
        backgroundColor: Colors.BACKGROUND, 
        borderBottomWidth: 1,
        borderBottomColor: Colors.BACKGROUND,
        // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0, 
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
        color: Colors.TEXT_PRIMARY, 
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
        textAlign: 'left',
        marginBottom: 0,
    },

    rightActionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    actionIcon: {
        padding: 4,
    },
});

export default CustomHeader;