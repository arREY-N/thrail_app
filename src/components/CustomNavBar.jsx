import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

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

const CustomNavBar = ({ state, descriptors, navigation }) => {
    return (
        <View style={styles.barContainer}>
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
                            isFocused && styles.iconPillActive
                        ]}>
                            {config.icon}
                        </View>

                        <CustomText
                            variant='caption'
                            style={[
                                styles.label,
                                {
                                    color: isFocused ? Colors.PRIMARY : Colors.TEXT_PRIMARY,
                                    fontWeight: isFocused ? '700' : '500',
                                },
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
        height: 80,
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 8,
        paddingBottom: 0,
        elevation: 8, 
        shadowColor: "#000", 
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_LIGHT,
    },

    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 4,
    },

    iconPill: {
        width: 64,
        // height: 32,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        marginBottom: 0,
    },
    iconPillActive: {
        backgroundColor: Colors.PRIMARY,
    },

    label: {
        fontSize: 12,
        lineHeight: 16,
        textAlign: 'center',
    },
});

export default CustomNavBar;