import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomSearchBar from '@/src/components/CustomSearchBar';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';

const CustomHeader = ({ 
    title, 
    onBackPress, 
    rightActions, 
    showDefaultIcons = false,
    centerTitle = false,
    hasSearch = false,
    searchProps = {},
    style,
    children
}) => {

    const { onNotificationPress, onBookingPress } = useAppNavigation();

    return (
        <View style={[
            styles.masterContainer, 
            hasSearch ? styles.withSearchShadowAndRadius : styles.flatHeader, 
            style
        ]}>
            <View style={styles.titleRow}>
                
                <View style={centerTitle ? styles.leftBoxCentered : styles.leftBoxStandard}>
                    {onBackPress ? (
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
                    ) : (
                        !centerTitle && (
                            children ? children : (
                                <CustomText variant='title' style={styles.headline}>
                                    {title}
                                </CustomText>
                            )
                        )
                    )}
                </View>

                {centerTitle && (
                    <View style={styles.centerBox}>
                        {children ? children : (
                            <CustomText variant="h2" style={styles.centerTitle} numberOfLines={1}>
                                {title}
                            </CustomText>
                        )}
                    </View>
                )}


                <View style={centerTitle ? styles.rightBoxCentered : styles.rightBoxStandard}>
                    <View style={styles.rightActionsInner}>
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

            </View>

            {hasSearch && (
                <CustomSearchBar {...searchProps} />
            )}
            
        </View>
    );
};

const styles = StyleSheet.create({
    masterContainer: {
        width: '100%',
        backgroundColor: Colors.BACKGROUND,
        zIndex: 100,
    },

    flatHeader: {
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
    },

    withSearchShadowAndRadius: {
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 4,
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_LIGHT,
    },
    titleRow: {
        minHeight: 60,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16, 
        paddingTop: 16,
        paddingBottom: 8,
    },
    
    leftBoxCentered: {
        flex: 1,
        alignItems: 'flex-start',
    },
    leftBoxStandard: {
        flex: 1,
        alignItems: 'flex-start',
    },
    centerBox: {
        flex: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rightBoxCentered: {
        flex: 1,
        alignItems: 'flex-end',
    },
    rightBoxStandard: {
        alignItems: 'flex-end',
    },
    rightActionsInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },

    backButton: {
        padding: 8,
        marginLeft: -8, 
    },
    headline: {
        textAlign: 'left',
        marginBottom: 0,
    },
    centerTitle: {
        color: Colors.TEXT_PRIMARY, 
        marginBottom: 0,
        textAlign: 'center',
    },
    actionIcon: {
        padding: 4,
    },
});

export default CustomHeader;