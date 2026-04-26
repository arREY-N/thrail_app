import React from 'react';
import {
    Platform,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';

const getTabConfig = (routeName, isFocused) => {
    const iconColor = isFocused ? Colors.TEXT_INVERSE : Colors.TEXT_PRIMARY;
    const iconSize = 24;

    switch (routeName) {
        case 'index':
            return {
                icon: 
                    <CustomIcon
                        library="Feather"
                        name="home"
                        size={iconSize}
                        color={iconColor}
                    />,
                label: 'Home',
            };
        case 'explore':
            return {
                icon: 
                    <CustomIcon
                        library="Feather"
                        name="search"
                        size={iconSize}
                        color={iconColor}
                    />,
                label: 'Explore',
            };
        case 'hike':
            return {
                icon: 
                    <CustomIcon
                        library="FontAwesome5"
                        name="compass"
                        size={iconSize}
                        color={iconColor}
                    />,
                label: 'Hike',
            };
        case 'community':
            return {
                icon: 
                    <CustomIcon
                        library="Feather"
                        name="users"
                        size={iconSize}
                        color={iconColor}
                    />,
                label: 'Community',
            };
        case 'profile':
            return {
                icon: 
                    <CustomIcon
                        library="FontAwesome5"
                        name="user-circle"
                        size={iconSize}
                        color={iconColor}
                    />,
                label: 'Profile',
            };
        default:
            return {
                icon: 
                    <CustomIcon
                        library="Feather"
                        name="square"
                        size={iconSize}
                        color={iconColor}
                    />,
                label: 'Tab',
            };
    }
};

const CustomNavBar = ({ 
    state, 
    descriptors, 
    navigation
}) => {
    const insets = useSafeAreaInsets();
    
    const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 16);
    const exactHeight = 70 + bottomPadding;

    return (
        <View 
            style={[
                styles.barContainer, 
                { 
                    paddingBottom: bottomPadding,
                    height: exactHeight
                } 
            ]}
        >
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const isFocused = state.index === index;
                
                const config = getTabConfig(route.name, isFocused);

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                return (
                    <TouchableOpacity
                        key={route.key}
                        accessibilityRole='button'
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        testID={options.tabBarTestID}
                        onPress={onPress}
                        style={styles.tabItem}
                        activeOpacity={0.7}
                    >
                        <View style={[
                            styles.iconPill, 
                            { backgroundColor: isFocused ? Colors.PRIMARY : 'transparent' }
                        ]}>
                            {config.icon}
                        </View>

                        <CustomText
                            variant='caption'
                            numberOfLines={1}
                            style={[
                                styles.label,
                                {
                                    color: isFocused ? Colors.PRIMARY : Colors.TEXT_PRIMARY,
                                    fontWeight: isFocused ? '700' : '500',
                                }
                            ]}
                        >
                            {config.label}
                        </CustomText>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    barContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.BACKGROUND,
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 8, 
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_LIGHT,

        ...Platform.select({
            ios: {
                shadowColor: Colors.SHADOW, 
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
            },
            android: {
                elevation: 12,
            },
            web: {
                boxShadow: "0px -4px 10px rgba(0, 0, 0, 0.05)",
            },
        }),
    },

    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: '100%',
        gap: 4,
    },

    iconPill: {
        width: 64,               
        height: 40,              
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },

    label: {
        fontSize: 11,            
        lineHeight: 14,
        textAlign: 'center',
        includeFontPadding: false, 
        // marginBottom: 4,
    },
});

export default CustomNavBar;