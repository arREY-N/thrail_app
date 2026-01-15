import { Feather, FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Colors } from '../constants/colors';
import CustomText from './CustomText';

const CustomNavBar = ({ state, descriptors, navigation }) => {
    
    const getTabConfig = (routeName, isFocused) => {
        const color = isFocused ? Colors.BLACK : Colors.WHITE;
        const diamondColor = isFocused ? Colors.BLACK : Colors.WHITE;

        switch (routeName) {
            case 'home':
                return {
                    icon: <Feather name="home" size={22} color={color} />,
                    label: "Home"
                };
            case 'community':
                return {
                    icon: <Feather name="users" size={22} color={color} />,
                    label: "Community"
                };
            case 'explore':
                return {
                    icon: <FontAwesome6 name="mountain" size={20} color={diamondColor} />,
                    label: "Explore",
                    isSpecial: true 
                };
            case 'hike':              
                return {
                    icon: <FontAwesome5 name="compass" size={20} color={color} />,
                    label: "Hike"
                };
            case 'profile':
                return {
                    icon: <FontAwesome5 name="user-circle" size={22} color={color} />,
                    label: "Profile"
                };
            default:
                return {
                    icon: <Feather name="square" size={22} color={color} />,
                    label: "Tab"
                };
        }
    };

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
                                variant="caption" 
                                style={[
                                    styles.label, 
                                    { 
                                        color: isFocused ? Colors.BLACK : Colors.WHITE,
                                        fontWeight: isFocused ? '700' : '400' 
                                    }
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
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        testID={options.tabBarTestID}
                        onPress={onPress}
                        style={styles.tabItem}
                        activeOpacity={0.7}
                    >
                        <View style={[
                            styles.iconWrapper, 
                            isFocused && { transform: [{ scale: 1.1 }] }
                        ]}>
                            {config.icon}
                        </View>

                        <CustomText 
                            variant="caption" 
                            style={[
                                styles.label,
                                { 
                                    color: isFocused ? Colors.BLACK : Colors.WHITE,
                                    fontWeight: isFocused ? '700' : '400'
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
        backgroundColor: Colors.PRIMARY,
        height: 80, 
        alignItems: 'flex-end', 
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingBottom: 16, 
        borderTopWidth: 1,
        borderTopColor: Colors.WHITE,
    },
    
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end', 
        height: 50, 
    },
    iconWrapper: {
        marginBottom: 4, 
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
        top: -40, 
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