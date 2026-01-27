import Feather from '@expo/vector-icons/Feather';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';

const getTabConfig = (routeName, isFocused) => {
    const color = isFocused ? Colors.TEXT_INVERSE : Colors.TEXT_PRIMARY;
    const diamondColor = isFocused ? Colors.TEXT_INVERSE : Colors.TEXT_PRIMARY;

    switch (routeName) {
        case 'index':
            return {
                icon: <Feather name='home' size={22} color={color} />,
                label: 'Home',
            };
        case 'explore':
            return {
                icon: <FontAwesome6 name='mountain' size={20} color={diamondColor} />,
                label: 'Explore',
            };
        case 'hike':
            return {
                icon: <FontAwesome5 name='compass' size={24} color={color} />,
                label: 'Hike',
                isSpecial: true,
            };
        case 'community':
            return {
                icon: <Feather name='users' size={22} color={color} />,
                label: 'Community',
            };
        case 'profile':
            return {
                icon: <FontAwesome5 name='user-circle' size={22} color={color} />,
                label: 'Profile',
            };
        default:
            return {
                icon: <Feather name='square' size={22} color={color} />,
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

                if (config.isSpecial) {
                    return (
                        <View key={route.key} style={styles.diamondWrapper}>
                            <TouchableOpacity
                                onPress={onPress}
                                activeOpacity={0.9}
                                style={styles.diamondTouchArea}
                            >
                                <View style={styles.diamondShape}>
                                    <View style={styles.diamondIconFix}>
                                        {config.icon}
                                    </View>
                                </View>
                            </TouchableOpacity>

                            <CustomText
                                variant='caption'
                                style={[
                                    styles.label,
                                    {
                                        color: isFocused ? Colors.TEXT_INVERSE : Colors.TEXT_PRIMARY,
                                        fontWeight: isFocused ? '700' : '400',
                                    },
                                ]}
                            >
                                {config.label}
                            </CustomText>
                        </View>
                    );
                }

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
                        <View
                            style={[
                                styles.iconWrapper,
                                isFocused && { transform: [{ scale: 1.1 }] },
                            ]}
                        >
                            {config.icon}
                        </View>

                        <CustomText
                            variant='caption'
                            style={[
                                styles.label,
                                {
                                    color: isFocused ? Colors.TEXT_INVERSE : Colors.TEXT_PRIMARY,
                                    fontWeight: isFocused ? '700' : '400',
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
        backgroundColor: Colors.PRIMARY,
        height: 'auto',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.TEXT_INVERSE,
    },

    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingHorizontal: 8,
    },
    iconWrapper: {
        marginBottom: 8,
    },
    label: {
        fontSize: 12,
        lineHeight: 16,
        textAlign: 'center',
    },

    diamondWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: 50,
        zIndex: 10,
    },
    diamondTouchArea: {
        position: 'absolute',
        top: -34,
        justifyContent: 'center',
        alignItems: 'center',
    },
    diamondShape: {
        width: 50,
        height: 50,
        backgroundColor: Colors.SECONDARY,
        borderRadius: 14,
        transform: [{ rotate: '45deg' }],
        justifyContent: 'center',
        alignItems: 'center',
    },
    diamondIconFix: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ rotate: '-45deg' }],
    },
});

export default CustomNavBar;